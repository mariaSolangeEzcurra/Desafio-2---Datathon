from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Optional, List, Dict, Any
from datetime import date, timedelta
from app.model import OrdenCorte

def _calcular_fechas_por_periodo(
    periodo: Optional[str] = None, 
    fecha_inicio: Optional[date] = None, 
    fecha_fin: Optional[date] = None
):
    """Calcula automáticamente el rango de fechas si se proporciona un período predefinido."""
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
    periodo: Optional[str] = None,
    distrito: Optional[str] = None,
    ccodprs: Optional[str] = None
) -> Dict[str, Any]:
    """
    Calcula los indicadores principales (KPIs) de las órdenes de corte.
    """
    f_inicio, f_fin = _calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)
    es_ejecutada = OrdenCorte.dejecuc.isnot(None)
    es_pendiente = OrdenCorte.dejecuc.is_(None)

    query = db.query(
        func.count(OrdenCorte.id_orden).label("total"),
        func.coalesce(func.sum(case((es_ejecutada, 1), else_=0)), 0).label("ejecutadas"),
        func.coalesce(func.sum(case((es_pendiente, 1), else_=0)), 0).label("pendientes"),
        func.coalesce(func.sum(OrdenCorte.ntotdeu), 0.0).label("deuda_total"),
        func.coalesce(func.sum(case((es_ejecutada, OrdenCorte.ntotdeu), else_=0.0)), 0.0).label("deuda_recuperada"),
        func.coalesce(func.sum(case((es_pendiente, OrdenCorte.ntotdeu), else_=0.0)), 0.0).label("deuda_riesgo")
    )

    if f_inicio:
        query = query.filter(OrdenCorte.dgenprg >= f_inicio)
    if f_fin:
        query = query.filter(OrdenCorte.dgenprg <= f_fin)
    if distrito:
        query = query.filter(OrdenCorte.distrito == distrito.strip().upper())
    if ccodprs:
        query = query.filter(OrdenCorte.ccodprs == ccodprs)
        
    stats = query.first()
    
    total = stats.total
    ejecutadas = stats.ejecutadas
    pendientes = stats.pendientes
    deuda_total = float(stats.deuda_total)
    deuda_recuperada = float(stats.deuda_recuperada)
    deuda_riesgo = float(stats.deuda_riesgo)
    
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
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Agrupa los resúmenes por Distrito y por Tipo de Programa (CTIPPRG).
    """
    f_inicio, f_fin = _calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)

    es_ejecutada = OrdenCorte.dejecuc.isnot(None)
    es_pendiente = OrdenCorte.dejecuc.is_(None)

    q_distrito = db.query(
        OrdenCorte.distrito,
        func.count(OrdenCorte.id_orden).label("total"),
        func.coalesce(func.sum(case((es_ejecutada, 1), else_=0)), 0).label("ejecutadas"),
        func.coalesce(func.sum(case((es_pendiente, 1), else_=0)), 0).label("pendientes"),
        func.coalesce(func.sum(OrdenCorte.ntotdeu), 0.0).label("deuda")
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
            "ejecutadas": row.ejecutadas,
            "pendientes": row.pendientes,
            "deuda_total": round(float(row.deuda), 2)
        }
        for row in resumen_distrito_query
    ]
    
    q_tipo = db.query(
        OrdenCorte.ctipprg,
        func.count(OrdenCorte.id_orden).label("total"),
        func.coalesce(func.sum(case((es_ejecutada, 1), else_=0)), 0).label("ejecutadas"),
        func.coalesce(func.sum(case((es_pendiente, 1), else_=0)), 0).label("pendientes"),
        func.coalesce(func.sum(OrdenCorte.ntotdeu), 0.0).label("deuda")
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
            "ejecutadas": row.ejecutadas,
            "pendientes": row.pendientes,
            "deuda_total": round(float(row.deuda), 2)
        }
        for row in resumen_tipo_query
    ]
    
    return {
        "por_distrito": por_distrito,
        "por_tipo_programa": por_tipo_programa
    }