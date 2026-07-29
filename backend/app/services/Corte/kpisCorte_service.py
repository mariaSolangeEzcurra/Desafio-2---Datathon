from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.model import OrdenCorte

def calcular_dashboard_kpis(db: Session) -> dict:
    # Agregaciones globales eficientes en SQL
    stats = db.query(
        func.count(OrdenCorte.id_orden).label("total"),
        func.sum(case((OrdenCorte.dejecuc != None, 1), else_=0)).label("ejecutadas"),
        func.sum(case((OrdenCorte.dejecuc == None, 1), else_=0)).label("pendientes"),
        func.sum(OrdenCorte.ntotdeu).label("deuda_total"),
        func.sum(case((OrdenCorte.dejecuc != None, OrdenCorte.ntotdeu), else_=0)).label("deuda_recuperada"),
        func.sum(case((OrdenCorte.dejecuc == None, OrdenCorte.ntotdeu), else_=0)).label("deuda_riesgo")
    ).first()

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

def calcular_resumen_cortes(db: Session) -> dict:
    # Desglose por Distrito
    resumen_distrito_query = db.query(
        OrdenCorte.distrito,
        func.count(OrdenCorte.id_orden).label("total"),
        func.sum(case((OrdenCorte.dejecuc != None, 1), else_=0)).label("ejecutadas"),
        func.sum(case((OrdenCorte.dejecuc == None, 1), else_=0)).label("pendientes"),
        func.sum(OrdenCorte.ntotdeu).label("deuda")
    ).group_by(OrdenCorte.distrito).all()

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

    # Desglose por Tipo de Programa (ctipprg)
    resumen_tipo_query = db.query(
        OrdenCorte.ctipprg,
        func.count(OrdenCorte.id_orden).label("total"),
        func.sum(case((OrdenCorte.dejecuc != None, 1), else_=0)).label("ejecutadas"),
        func.sum(case((OrdenCorte.dejecuc == None, 1), else_=0)).label("pendientes"),
        func.sum(OrdenCorte.ntotdeu).label("deuda")
    ).group_by(OrdenCorte.ctipprg).all()

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