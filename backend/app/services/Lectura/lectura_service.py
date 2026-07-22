from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import distinct

from app.model import Actividad, ActividadLectura, Conexion, CatalogoGrupoFacturacion


def obtener_grupos_facturacion(db: Session):
    try:
        grupos = db.query(CatalogoGrupoFacturacion).all()
        return [g.cmetfac for g in grupos]
    except Exception as e:
        grupos = (
            db.query(distinct(Actividad.cmetfac))
            .filter(Actividad.cmetfac.isnot(None))
            .order_by(Actividad.cmetfac)
            .all()
        )
        return [g[0] for g in grupos]


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
    fecha_seleccionada: date | None = None,
    grupo_facturacion: str | None = None,
    trabajador: str | None = None
):
    hoy = date.today()
    ref_fecha = fecha_seleccionada if fecha_seleccionada else hoy

    # Query base para Actividades de Lectura unidas a su detalle
    query = (
        db.query(Actividad, ActividadLectura)
        .join(ActividadLectura, Actividad.actividad_id == ActividadLectura.actividad_id)
        .filter(Actividad.tipo_actividad == "Lectura")
    )

    # Filtrado por periodo o fecha de calendario
    if fecha_seleccionada:
        query = query.filter(Actividad.fecha == ref_fecha)
    else:
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

    resultados = query.all()
    total_ejecutadas = len(resultados)

    if total_ejecutadas == 0:
        return _retornar_cero()

    # Total programadas en el catastro para ese grupo o filtro
    q_prog = db.query(Conexion)
    if grupo_facturacion:
        q_prog = q_prog.join(Actividad, Conexion.ccodcnx == Actividad.ccodcnx).filter(Actividad.cmetfac == grupo_facturacion)
    total_programadas = q_prog.count()
    if total_programadas == 0:
        total_programadas = total_ejecutadas  # Evitar división por cero

    # Acumuladores para métricas
    total_minutos = 0
    cant_impedimentos = 0
    cant_observaciones = 0
    cobertura_gps = 0
    fuera_punto = 0

    for act, det in resultados:
        if act.duracion_min:
            total_minutos += act.duracion_min

        # Impedimentos: cimplec existe, no vacío y diferente de '00' o '0'
        if det.cimplec and det.cimplec.strip() and det.cimplec.strip() not in ["00", "0"]:
            cant_impedimentos += 1

        # Observaciones: cobsmdr existe, no vacío y diferente de '00' o '0'
        if det.cobsmdr and det.cobsmdr.strip() and det.cobsmdr.strip() not in ["00", "0"]:
            cant_observaciones += 1

        # Cobertura geográfica (GPS válido o UTM válidos)
        if (det.cgpslat is not None and det.cgpslon is not None) or (det.cutmx is not None and det.cutmy is not None):
            cobertura_gps += 1

        # Fuera de punto
        if act.resultado == "Fuera de Radio":
            fuera_punto += 1

    # Cálculos matemáticos ajustados a las fórmulas exactas de los KPIs
    cumplimiento = (total_ejecutadas / total_programadas) * 100
    productividad = total_ejecutadas / (total_minutos / 60) if total_minutos > 0 else 0
    tiempo_promedio = total_minutos / total_ejecutadas if total_ejecutadas > 0 else 0
    
    ind_impedimentos = (cant_impedimentos / total_programadas) * 100
    ind_observaciones = (cant_observaciones / total_ejecutadas) * 100  # Corregido sobre ejecutadas
    cobertura_geo = (cobertura_gps / total_programadas) * 100
    act_fuera_punto = (fuera_punto / total_ejecutadas) * 100

    # Función auxiliar para asignar niveles de alerta según umbrales
    def evaluar_alerta(nombre, valor):
        if nombre == "Cumplimiento de lectura":
            return "Crítico" if valor < 80 else ("Alto" if valor < 90 else "Normal")
        elif nombre == "Índice de impedimentos":
            return "Crítico" if valor > 20 else ("Alto" if valor >= 10 else "Normal")
        elif nombre == "Índice de observaciones":
            return "Crítico" if valor > 4 else ("Alto" if valor >= 2 else "Normal")
        elif nombre == "Actividades fuera de punto":
            return "Crítico" if valor > 10 else ("Alto" if valor >= 5 else "Normal")
        elif nombre == "Cobertura geográfica":
            return "Crítico" if valor < 80 else ("Alto" if valor < 90 else "Normal")
        return "Normal"

    return {
        "indicadores": [
            {
                "nombre": "Cumplimiento de lectura",
                "valor": round(cumplimiento, 2),
                "unidad": "%",
                "nivel_alerta": evaluar_alerta("Cumplimiento de lectura", cumplimiento)
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
                "valor": round(ind_impedimentos, 2),
                "unidad": "%",
                "nivel_alerta": evaluar_alerta("Índice de impedimentos", ind_impedimentos)
            },
            {
                "nombre": "Índice de observaciones",
                "valor": round(ind_observaciones, 2),
                "unidad": "%",
                "nivel_alerta": evaluar_alerta("Índice de observaciones", ind_observaciones)
            },
            {
                "nombre": "Cobertura geográfica",
                "valor": round(cobertura_geo, 2),
                "unidad": "%",
                "nivel_alerta": evaluar_alerta("Cobertura geográfica", cobertura_geo)
            },
            {
                "nombre": "Actividades fuera de punto",
                "valor": round(act_fuera_punto, 2),
                "unidad": "%",
                "nivel_alerta": evaluar_alerta("Actividades fuera de punto", act_fuera_punto)
            }
        ]
    }