from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Optional, Dict, Any, List
from datetime import date, timedelta
from app.model import OrdenCorte

def _calcular_fechas_por_periodo(
    periodo: Optional[str] = None, 
    fecha_inicio: Optional[date] = None, 
    fecha_fin: Optional[date] = None
):
    if fecha_inicio and fecha_fin:
        return fecha_inicio, fecha_fin
        
    hoy = date.today()
    if periodo == "hoy": return hoy, hoy
    if periodo == "semana": return hoy - timedelta(days=7), hoy
    if periodo == "mes": return hoy - timedelta(days=30), hoy
    if periodo == "3meses": return hoy - timedelta(days=90), hoy
        
    return hoy, hoy

def evaluar_alertas_cortes(
    db: Session,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    periodo: Optional[str] = "hoy",
    distrito: Optional[str] = None
) -> Dict[str, Any]:
    f_inicio, f_fin = _calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)

    query = db.query(OrdenCorte)
    if f_inicio:
        query = query.filter(OrdenCorte.dgenprg >= f_inicio)
    if f_fin:
        query = query.filter(OrdenCorte.dgenprg <= f_fin)
    if distrito:
        query = query.filter(OrdenCorte.distrito == distrito.strip().upper())

    es_ejecutada = OrdenCorte.dejecuc.isnot(None)
    es_impedimento = OrdenCorte.csitreg == "S"
    tiene_gps = (
        (OrdenCorte.cutmx.isnot(None)) & 
        (OrdenCorte.cutmy.isnot(None)) & 
        (OrdenCorte.cutmx != 0) & 
        (OrdenCorte.cutmy != 0)
    )

    stats = query.with_entities(
        func.count(OrdenCorte.id_orden).label("total_programados"),
        func.coalesce(func.sum(case((es_ejecutada, 1), else_=0)), 0).label("ejecutados"),
        func.coalesce(func.sum(case((es_impedimento, 1), else_=0)), 0).label("impedimentos"),
        func.coalesce(func.sum(case((tiene_gps, 1), else_=0)), 0).label("con_gps")
    ).first()

    total_programados = stats.total_programados or 0
    ejecutados = stats.ejecutados or 0
    impedimentos = stats.impedimentos or 0
    con_gps = stats.con_gps or 0

    alertas: List[Dict[str, Any]] = []

    pct_cumplimiento = round((ejecutados / total_programados * 100), 2) if total_programados > 0 else 0.0
    if pct_cumplimiento >= 90.0:
        nivel_cumplimiento, msj_cumplimiento = "VERDE", "Cumplimiento meta alcanzado."
    elif 80.0 <= pct_cumplimiento < 90.0:
        nivel_cumplimiento, msj_cumplimiento = "AMARILLO", "Cumplimiento en riesgo moderado."
    else:
        nivel_cumplimiento, msj_cumplimiento = "ROJO", "Bajo nivel de ejecución de cortes."

    alertas.append({
        "kpi": "Cumplimiento de cortes",
        "descripcion": "Cortes ejecutados vs programados",
        "valor_actual": pct_cumplimiento,
        "unidad": "%",
        "nivel_alerta": nivel_cumplimiento,
        "mensaje": msj_cumplimiento,
        "meta_verde": ">= 90%",
        "meta_amarillo": "80% - 89%",
        "meta_rojo": "< 80%"
    })

    pct_impedimentos = round((impedimentos / total_programados * 100), 2) if total_programados > 0 else 0.0
    if pct_impedimentos < 10.0:
        nivel_imp, msj_imp = "VERDE", "Baja tasa de bloqueos operativos."
    elif 10.0 <= pct_impedimentos <= 20.0:
        nivel_imp, msj_imp = "AMARILLO", "Impedimentos en nivel de advertencia."
    else:
        nivel_imp, msj_imp = "ROJO", "Alto porcentaje de bloqueos o impedimentos en campo."

    alertas.append({
        "kpi": "Impedimentos de corte",
        "descripcion": "Bloqueos operativos registrados (CSITREG == 'S')",
        "valor_actual": pct_impedimentos,
        "unidad": "%",
        "nivel_alerta": nivel_imp,
        "mensaje": msj_imp,
        "meta_verde": "< 10%",
        "meta_amarillo": "10% - 20%",
        "meta_rojo": "> 20%"
    })

    subq_recortes = (
        query.filter(es_ejecutada)
        .with_entities(OrdenCorte.ccodcnx)
        .group_by(OrdenCorte.ccodcnx)
        .having(func.count(OrdenCorte.id_orden) > 1)
        .subquery()
    )
    total_recortes = db.query(func.count()).select_from(subq_recortes).scalar() or 0

    pct_retrabajo = round((total_recortes / ejecutados * 100), 2) if ejecutados > 0 else 0.0
    if pct_retrabajo < 5.0:
        nivel_ret, msj_ret = "VERDE", "Tasa de re-ejecución dentro de límites esperados."
    elif 5.0 <= pct_retrabajo <= 10.0:
        nivel_ret, msj_ret = "AMARILLO", "Retrabajo moderado detectado en conexiones."
    else:
        nivel_ret, msj_ret = "ROJO", "Excesivo porcentaje de re-cortes en conexiones."

    alertas.append({
        "kpi": "Retrabajo de corte",
        "descripcion": "Re-ejecución de cortes en la misma conexión",
        "valor_actual": pct_retrabajo,
        "unidad": "%",
        "nivel_alerta": nivel_ret,
        "mensaje": msj_ret,
        "meta_verde": "< 5%",
        "meta_amarillo": "5% - 10%",
        "meta_rojo": "> 10%"
    })

    pct_cobertura = round((con_gps / total_programados * 100), 2) if total_programados > 0 else 0.0
    if pct_cobertura >= 90.0:
        nivel_cob, msj_cob = "VERDE", "Excelente captura de coordenadas GPS."
    elif 80.0 <= pct_cobertura < 90.0:
        nivel_cob, msj_cob = "AMARILLO", "Geolocalización parcial de las órdenes."
    else:
        nivel_cob, msj_cob = "ROJO", "Deficiencia crítica de coordenadas GPS en campo."

    alertas.append({
        "kpi": "Cobertura geográfica de corte",
        "descripcion": "Cortes con coordenadas GPS válidas",
        "valor_actual": pct_cobertura,
        "unidad": "%",
        "nivel_alerta": nivel_cob,
        "mensaje": msj_cob,
        "meta_verde": ">= 90%",
        "meta_amarillo": "80% - 89%",
        "meta_rojo": "< 80%"
    })

    return {
        "fecha_consulta": date.today(),
        "periodo_evaluado": periodo or "personalizado",
        "total_alertas_rojas": sum(1 for a in alertas if a["nivel_alerta"] == "ROJO"),
        "total_alertas_amarillas": sum(1 for a in alertas if a["nivel_alerta"] == "AMARILLO"),
        "total_alertas_verdes": sum(1 for a in alertas if a["nivel_alerta"] == "VERDE"),
        "alertas": alertas
    }