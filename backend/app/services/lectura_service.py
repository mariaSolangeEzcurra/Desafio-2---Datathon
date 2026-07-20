from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct

from app.model import Actividad, ActividadLectura, Impedimento, Observacion


def obtener_grupos_facturacion(db: Session):
    grupos = (
        db.query(distinct(Actividad.cmetfac))
        .order_by(Actividad.cmetfac)
        .all()
    )
    return [g[0] for g in grupos if g[0] is not None]


def _retornar_cero():
    return {
        "indicadores": [
            {"nombre": "Cumplimiento de lectura", "valor": 0, "unidad": "%", "nivel_alerta": "Normal"},
            {"nombre": "Productividad", "valor": 0, "unidad": "lec/h", "nivel_alerta": "Normal"},
            {"nombre": "Tiempo promedio", "valor": 0, "unidad": "min", "nivel_alerta": "Normal"},
            {"nombre": "Índice de impedimentos", "valor": 0, "unidad": "%", "nivel_alerta": "Normal"},
            {"nombre": "Índice de observaciones", "valor": 0, "unidad": "%", "nivel_alerta": "Normal"},
            {"nombre": "Cobertura geográfica", "valor": 0, "unidad": "%", "nivel_alerta": "Normal"},
            {"nombre": "Actividades fuera de punto", "valor": 0, "unidad": "%", "nivel_alerta": "Normal"}
        ]
    }


def obtener_kpis_lectura(
    db: Session,
    periodo: str = "dia",
    grupo_facturacion: str | None = None,
    trabajador: str | None = None
):

    hoy = date.today()

    query = db.query(Actividad).filter(
        Actividad.tipo_actividad == "Lectura"
    )

    if periodo == "dia":
        query = query.filter(Actividad.fecha == hoy)
    elif periodo == "semana":
        query = query.filter(Actividad.fecha >= hoy - timedelta(days=7))
    elif periodo == "mes":
        query = query.filter(Actividad.fecha >= hoy - timedelta(days=30))
    if grupo_facturacion:
        query = query.filter(Actividad.cmetfac == grupo_facturacion)
    if trabajador:
        query = query.filter(Actividad.ccodprs == trabajador)
    total_ejecutadas = query.count()
    if total_ejecutadas == 0:
        return _retornar_cero()
    total_programadas = 100
    total_minutos = query.with_entities(
        func.sum(Actividad.duracion_min)
    ).scalar() or 0
    cumplimiento = (total_ejecutadas / total_programadas) * 100
    productividad = total_ejecutadas / (total_minutos / 60) if total_minutos > 0 else 0
    tiempo_promedio = total_minutos / total_ejecutadas
    q_imp = db.query(Impedimento).join(Actividad).filter(
        Actividad.tipo_actividad == "Lectura"
    )
    q_obs = db.query(Observacion).join(Actividad).filter(
        Actividad.tipo_actividad == "Lectura"
    )
    q_gps = db.query(ActividadLectura).join(Actividad).filter(
        Actividad.tipo_actividad == "Lectura"
    )
    q_fuera = db.query(Actividad).filter(
        Actividad.tipo_actividad == "Lectura",
        Actividad.resultado == "Fuera de Radio"
    )
    if periodo == "dia":
        fecha = hoy
        q_imp = q_imp.filter(Actividad.fecha == fecha)
        q_obs = q_obs.filter(Actividad.fecha == fecha)
        q_gps = q_gps.filter(Actividad.fecha == fecha)
        q_fuera = q_fuera.filter(Actividad.fecha == fecha)
    elif periodo == "semana":
        fecha = hoy - timedelta(days=7)
        q_imp = q_imp.filter(Actividad.fecha >= fecha)
        q_obs = q_obs.filter(Actividad.fecha >= fecha)
        q_gps = q_gps.filter(Actividad.fecha >= fecha)
        q_fuera = q_fuera.filter(Actividad.fecha >= fecha)
    elif periodo == "mes":
        fecha = hoy - timedelta(days=30)
        q_imp = q_imp.filter(Actividad.fecha >= fecha)
        q_obs = q_obs.filter(Actividad.fecha >= fecha)
        q_gps = q_gps.filter(Actividad.fecha >= fecha)
        q_fuera = q_fuera.filter(Actividad.fecha >= fecha)
    if grupo_facturacion:
        q_imp = q_imp.filter(Actividad.cmetfac == grupo_facturacion)
        q_obs = q_obs.filter(Actividad.cmetfac == grupo_facturacion)
        q_gps = q_gps.filter(Actividad.cmetfac == grupo_facturacion)
        q_fuera = q_fuera.filter(Actividad.cmetfac == grupo_facturacion)
    if trabajador:
        q_imp = q_imp.filter(Actividad.ccodprs == trabajador)
        q_obs = q_obs.filter(Actividad.ccodprs == trabajador)
        q_gps = q_gps.filter(Actividad.ccodprs == trabajador)
        q_fuera = q_fuera.filter(Actividad.ccodprs == trabajador)
    cant_impedimentos = q_imp.count()
    cant_observaciones = q_obs.count()
    cobertura = q_gps.filter(
        ActividadLectura.cgpslat.isnot(None),
        ActividadLectura.cgpslon.isnot(None)
    ).count()
    fuera_radio = q_fuera.count()
    return {
        "indicadores": [
            {
                "nombre": "Cumplimiento de lectura",
                "valor": round(cumplimiento, 2),
                "unidad": "%",
                "nivel_alerta": "Normal"
            },
            {
                "nombre": "Productividad",
                "valor": round(productividad, 2),
                "unidad": "lec/h",
                "nivel_alerta": "Normal"
            },
            {
                "nombre": "Tiempo promedio",
                "valor": round(tiempo_promedio, 2),
                "unidad": "min",
                "nivel_alerta": "Normal"
            },
            {
                "nombre": "Índice de impedimentos",
                "valor": round((cant_impedimentos / total_programadas) * 100, 2),
                "unidad": "%",
                "nivel_alerta": "Normal"
            },
            {
                "nombre": "Índice de observaciones",
                "valor": round((cant_observaciones / total_ejecutadas) * 100, 2),
                "unidad": "%",
                "nivel_alerta": "Normal"
            },
            {
                "nombre": "Cobertura geográfica",
                "valor": round((cobertura / total_programadas) * 100, 2),
                "unidad": "%",
                "nivel_alerta": "Normal"
            },
            {
                "nombre": "Actividades fuera de punto",
                "valor": round((fuera_radio / total_ejecutadas) * 100, 2),
                "unidad": "%",
                "nivel_alerta": "Normal"
            }
        ]
    }