from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Optional, Dict, Any, List
from datetime import date, timedelta
from app.model import OrdenCorte, Trabajador

def _calcular_fechas_por_periodo(
    periodo: Optional[str] = None, 
    fecha_inicio: Optional[date] = None, 
    fecha_fin: Optional[date] = None
):
    if fecha_inicio and fecha_fin:
        return fecha_inicio, fecha_fin
        
    hoy = date.today()
    if periodo == "hoy":
        return hoy, hoy
    elif periodo == "semana":
        return hoy - timedelta(days=7), hoy
    elif periodo == "mes":
        return hoy - timedelta(days=30), hoy
    elif periodo == "3meses":
        return hoy - timedelta(days=90), hoy
        
    return fecha_inicio, fecha_fin

def obtener_rendimiento_personal(
    db: Session,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    periodo: Optional[str] = None,
    distrito: Optional[str] = None
) -> List[Dict[str, Any]]:    
    f_inicio, f_fin = _calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)

    es_ejecutada = OrdenCorte.dejecuc.isnot(None)
    es_pendiente = OrdenCorte.dejecuc.is_(None)

    query = db.query(
        func.coalesce(Trabajador.ccodprs, OrdenCorte.ccodprs, "SIN_CODIGO").label("ccodprs"),
        func.coalesce(Trabajador.nombre, "SIN ASIGNAR").label("nombre"),
        func.count(OrdenCorte.id_orden).label("total_asignadas"),
        func.coalesce(func.sum(case((es_ejecutada, 1), else_=0)), 0).label("ejecutadas"),
        func.coalesce(func.sum(case((es_pendiente, 1), else_=0)), 0).label("pendientes"),
        func.coalesce(func.sum(OrdenCorte.ntotdeu), 0.0).label("deuda_asignada"),
        func.coalesce(func.sum(case((es_ejecutada, OrdenCorte.ntotdeu), else_=0.0)), 0.0).label("deuda_recuperada")
    ).outerjoin(Trabajador, OrdenCorte.ccodprs == Trabajador.ccodprs)

    if f_inicio:
        query = query.filter(OrdenCorte.dgenprg >= f_inicio)
    if f_fin:
        query = query.filter(OrdenCorte.dgenprg <= f_fin)
    if distrito:
        query = query.filter(OrdenCorte.distrito == distrito.strip().upper())

    resumen = query.group_by(
        func.coalesce(Trabajador.ccodprs, OrdenCorte.ccodprs, "SIN_CODIGO"),
        func.coalesce(Trabajador.nombre, "SIN ASIGNAR")
    ).all()

    resultado = []
    for r in resumen:
        total = r.total_asignadas
        ejecutadas = r.ejecutadas
        
        resultado.append({
            "ccodprs": r.ccodprs,
            "nombre_trabajador": r.nombre,
            "total_ordenes": total,
            "ejecutadas": ejecutadas,
            "pendientes": r.pendientes,
            "tasa_efectividad": round((ejecutadas / total * 100), 2) if total > 0 else 0.0,
            "deuda_asignada": round(float(r.deuda_asignada), 2),
            "deuda_recuperada": round(float(r.deuda_recuperada), 2)
        })

    return sorted(resultado, key=lambda x: x["ejecutadas"], reverse=True)

def obtener_detalle_por_trabajador(
    db: Session, 
    ccodprs: str,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    periodo: Optional[str] = None,
    pagina: int = 1,
    limite: int = 50
) -> Dict[str, Any]:   
    f_inicio, f_fin = _calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)

    trabajador = db.query(Trabajador).filter(Trabajador.ccodprs == ccodprs).first()
    nombre_trabajador = trabajador.nombre if trabajador else "DESCONOCIDO O SIN ASIGNAR"

    query = db.query(OrdenCorte).filter(OrdenCorte.ccodprs == ccodprs)

    if f_inicio:
        query = query.filter(OrdenCorte.dgenprg >= f_inicio)
    if f_fin:
        query = query.filter(OrdenCorte.dgenprg <= f_fin)

    total_registros = query.count()
    
    offset = (pagina - 1) * limite
    ordenes = query.order_by(OrdenCorte.dgenprg.desc()).offset(offset).limit(limite).all()

    ordenes_format = [
        {
            "id_orden": o.id_orden,
            "ccodprg": o.ccodprg,
            "ccodcnx": o.ccodcnx,
            "dgenprg": o.dgenprg,
            "dejecuc": o.dejecuc,
            "ntotdeu": float(o.ntotdeu or 0.0),
            "distrito": o.distrito,
            "direccion": o.direccion,
            "csitreg": o.csitreg,
            "cdesacc": o.cdesacc
        }
        for o in ordenes
    ]

    return {
        "ccodprs": ccodprs,
        "nombre_trabajador": nombre_trabajador,
        "total_registros": total_registros,
        "pagina": pagina,
        "limite": limite,
        "ordenes": ordenes_format
    }