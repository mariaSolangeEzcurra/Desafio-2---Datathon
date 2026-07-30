from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Optional
from datetime import date, timedelta
from app.model import OrdenCorte

def _calcular_fechas_por_periodo(periodo: Optional[str], fecha_inicio: Optional[date] = None, fecha_fin: Optional[date] = None):
    """Calcula automáticamente las fechas si se pasa un período predefinido"""
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

def calcular_dashboard_kpis(
    db: Session,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    periodo: Optional[str] = None
) -> dict:
    f_inicio, f_fin = _calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)
    
    query = db.query(
        func.count(OrdenCorte.id_orden).label("total"),
        func.sum(case((OrdenCorte.dejecuc != None, 1), else_=0)).label("ejecutadas"),
        func.sum(case((OrdenCorte.dejecuc == None, 1), else_=0)).label("pendientes"),
        func.sum(OrdenCorte.ntotdeu).label("deuda_total"),
        func.sum(case((OrdenCorte.dejecuc != None, OrdenCorte.ntotdeu), else_=0)).label("deuda_recuperada"),
        func.sum(case((OrdenCorte.dejecuc == None, OrdenCorte.ntotdeu), else_=0)).label("deuda_riesgo")
    )
    if f_inicio:
        query = query.filter(OrdenCorte.dgenprg >= f_inicio)
    if f_fin:
        query = query.filter(OrdenCorte.dgenprg <= f_fin)
        
    stats = query.first()
    total = stats.total or 0
    ejecutadas = stats.ejecutadas or 0
    pendientes = stats.pendientes or 0
    deuda_total = float(stats.deuda_total or 0.0)
    deuda_recuperada = float(stats.deuda_recuperada or 0.0)
    deuda_riesgo = float(stats.deuda_riesgo or 0.0)
    tasa_efectividad = round((ejecutadas / total * 100), 2) if total > 0 else 0.0
    
    return {
        "total_ordenes": total,
        "ordenes_ejecutadas": ejecutadas,
        "ordenes_pendientes": pendientes,
        "tasa_efectividad_porcentaje": tasa_efectividad,
        "monto_total_deuda": round(deuda_total, 2),
        "monto_deuda_recuperada": round(deuda_recuperada, 2),
        "monto_deuda_en_riesgo": round(deuda_riesgo, 2)
    }

def calcular_resumen_cortes(
    db: Session,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    periodo: Optional[str] = None
) -> dict:
    f_inicio, f_fin = _calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)

    q_distrito = db.query(
        OrdenCorte.distrito,
        func.count(OrdenCorte.id_orden).label("total"),
        func.sum(case((OrdenCorte.dejecuc != None, 1), else_=0)).label("ejecutadas"),
        func.sum(case((OrdenCorte.dejecuc == None, 1), else_=0)).label("pendientes"),
        func.sum(OrdenCorte.ntotdeu).label("deuda")
    )
    if f_inicio:
        q_distrito = q_distrito.filter(OrdenCorte.dgenprg >= f_inicio)
    if f_fin:
        q_distrito = q_distrito.filter(OrdenCorte.dgenprg <= f_fin)
        
    resumen_distrito_query = q_distrito.group_by(OrdenCorte.distrito).all()
    por_distrito = [
        {
            "distrito": row.distrito or "NO ESPECIFICADO",
            "total_ordenes": row.total,
            "ejecutadas": row.ejecutadas or 0,
            "pendientes": row.pendientes or 0,
            "deuda_total": round(float(row.deuda or 0.0), 2)
        }
        for row in resumen_distrito_query
    ]
    
    q_tipo = db.query(
        OrdenCorte.ctipprg,
        func.count(OrdenCorte.id_orden).label("total"),
        func.sum(case((OrdenCorte.dejecuc != None, 1), else_=0)).label("ejecutadas"),
        func.sum(case((OrdenCorte.dejecuc == None, 1), else_=0)).label("pendientes"),
        func.sum(OrdenCorte.ntotdeu).label("deuda")
    )
    if f_inicio:
        q_tipo = q_tipo.filter(OrdenCorte.dgenprg >= f_inicio)
    if f_fin:
        q_tipo = q_tipo.filter(OrdenCorte.dgenprg <= f_fin)
        
    resumen_tipo_query = q_tipo.group_by(OrdenCorte.ctipprg).all()
    por_tipo_programa = [
        {
            "ctipprg": row.ctipprg if row.ctipprg is not None else 1,
            "total_ordenes": row.total,
            "ejecutadas": row.ejecutadas or 0,
            "pendientes": row.pendientes or 0,
            "deuda_total": round(float(row.deuda or 0.0), 2)
        }
        for row in resumen_tipo_query
    ]
    
    return {
        "por_distrito": por_distrito,
        "por_tipo_programa": por_tipo_programa
    }