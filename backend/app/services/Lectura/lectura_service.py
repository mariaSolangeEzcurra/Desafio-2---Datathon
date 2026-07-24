from datetime import date, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import distinct

from app.model import Actividad, ActividadLectura, CatalogoGrupoFacturacion


def obtener_grupos_facturacion(db: Session):
    try:
        grupos = db.query(CatalogoGrupoFacturacion).all()
        return [g.cmetfac for g in grupos]

    except Exception:
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
            {"nombre": "Actividades fuera de punto", "valor": 0, "unidad": "%", "nivel_alerta": "Normal"},
            {"nombre": "Eficiencia", "valor": 0, "unidad": "%", "nivel_alerta": "Normal"}
        ],
        "resumen": {
            "lecturas_programadas": 0,
            "lecturas_realizadas": 0,
            "lecturas_pendientes": 0,
            "impedimentos": 0,
            "observaciones": 0
        }
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

    query = (
        db.query(Actividad, ActividadLectura)
        .join(
            ActividadLectura,
            Actividad.actividad_id == ActividadLectura.actividad_id
        )
        .filter(
            Actividad.tipo_actividad == "Lectura"
        )
    )

    # Filtros de fecha
    if fecha_seleccionada:
        query = query.filter(
            Actividad.fecha == ref_fecha
        )
    else:
        if periodo == "dia":
            query = query.filter(
                Actividad.fecha == hoy
            )
        elif periodo == "semana":
            query = query.filter(
                Actividad.fecha >= hoy - timedelta(days=7)
            )
        elif periodo == "mes":
            query = query.filter(
                Actividad.fecha >= hoy - timedelta(days=30)
            )

    # Filtros adicionales
    if grupo_facturacion:
        query = query.filter(
            Actividad.cmetfac == grupo_facturacion
        )
    if trabajador:
        query = query.filter(
            Actividad.ccodprs == trabajador
        )
    resultados = query.all()
    total_actividades = len(resultados)

    if total_actividades == 0:
        return _retornar_cero()
    
    # ==============================
    # ACUMULADORES
    # ==============================
    total_minutos = 0
    total_programadas = 0
    total_realizadas = 0
    cant_impedimentos = 0
    cant_observaciones = 0
    cobertura_gps = 0
    fuera_punto = 0
    total_eficiencia = 0
    cantidad_eficiencia = 0
    total_promedio = 0
    cant_promedio = 0

    for act, det in resultados:
        # Tiempo
        if act.duracion_min:
            total_minutos += act.duracion_min

        # Tiempo promedio por lectura (campo PROMEDIO del Excel)
        if act.promedio_lectura is not None:
            total_promedio += act.promedio_lectura
            cant_promedio += 1

        # Lecturas del reporte diario
        if act.lecturas_programadas:
            total_programadas += act.lecturas_programadas

        if act.lecturas_realizadas:
            total_realizadas += act.lecturas_realizadas

        # Eficiencia
        if act.eficiencia is not None:
            total_eficiencia += act.eficiencia
            cantidad_eficiencia += 1

        # Impedimentos
        if (
            det.cimplec
            and det.cimplec.strip()
            and det.cimplec.strip() not in ["00", "0"]
        ):
            cant_impedimentos += 1

        # Observaciones
        if (
            det.cobsmdr
            and det.cobsmdr.strip()
            and det.cobsmdr.strip() not in ["00", "0"]
        ):
            cant_observaciones += 1

        # GPS
        if (
            (det.cgpslat is not None and det.cgpslon is not None)
            or
            (det.cutmx is not None and det.cutmy is not None)
        ):
            cobertura_gps += 1

        # Fuera de radio
        if act.resultado == "Fuera de Radio":
            fuera_punto += 1

    # ==============================
    # CÁLCULO KPIs
    # ==============================
    cumplimiento = (
        (total_realizadas / total_programadas) * 100
        if total_programadas > 0
        else 0
    )

    productividad = (
        total_realizadas / (total_minutos / 60)
        if total_minutos > 0
        else 0
    )

    promedio_segundos = (
        total_promedio / cant_promedio
        if cant_promedio > 0
        else 0
    )

    tiempo_promedio = str(
        timedelta(seconds=round(promedio_segundos))
    )

    ind_impedimentos = (
        (cant_impedimentos / total_realizadas) * 100
        if total_realizadas > 0
        else 0
    )

    ind_observaciones = (
        (cant_observaciones / total_realizadas) * 100
        if total_realizadas > 0
        else 0
    )

    cobertura_geo = (
        (cobertura_gps / total_realizadas) * 100
        if total_realizadas > 0
        else 0
    )

    act_fuera_punto = (
        (fuera_punto / total_realizadas) * 100
        if total_realizadas > 0
        else 0
    )

    eficiencia = (
        (total_eficiencia / cantidad_eficiencia) * 100
        if cantidad_eficiencia > 0
        else 0
    )

    # ==============================
    # ALERTAS
    # ==============================
    def evaluar_alerta(nombre, valor):
        if nombre == "Cumplimiento de lectura":
            return "Crítico" if valor < 80 else (
                "Alto" if valor < 90 else "Normal"
            )

        elif nombre == "Índice de impedimentos":
            return "Crítico" if valor > 20 else (
                "Alto" if valor >= 10 else "Normal"
            )

        elif nombre == "Índice de observaciones":
            return "Crítico" if valor > 4 else (
                "Alto" if valor >= 2 else "Normal"
            )

        elif nombre == "Actividades fuera de punto":
            return "Crítico" if valor > 10 else (
                "Alto" if valor >= 5 else "Normal"
            )

        elif nombre == "Cobertura geográfica":
            return "Crítico" if valor < 80 else (
                "Alto" if valor < 90 else "Normal"
            )

        elif nombre == "Eficiencia":
            return "Crítico" if valor < 80 else (
                "Alto" if valor < 90 else "Normal"
            )

        return "Normal"

    return {
        "indicadores": [
            {
                "nombre": "Cumplimiento de lectura",
                "valor": round(cumplimiento,2),
                "unidad": "%",
                "nivel_alerta": evaluar_alerta(
                    "Cumplimiento de lectura",
                    cumplimiento
                )
            },
            {
                "nombre": "Productividad",
                "valor": round(productividad,2),
                "unidad": "lec/h",
                "nivel_alerta": "Normal"
            },
            {
                "nombre": "Tiempo promedio",
                "valor": tiempo_promedio,
                "unidad": "min",
                "nivel_alerta": "Normal"
            },
            {
                "nombre": "Índice de impedimentos",
                "valor": round(ind_impedimentos,2),
                "unidad": "%",
                "nivel_alerta": evaluar_alerta(
                    "Índice de impedimentos",
                    ind_impedimentos
                )
            },
            {
                "nombre": "Índice de observaciones",
                "valor": round(ind_observaciones,2),
                "unidad": "%",
                "nivel_alerta": evaluar_alerta(
                    "Índice de observaciones",
                    ind_observaciones
                )
            },
            {
                "nombre": "Cobertura geográfica",
                "valor": round(cobertura_geo,2),
                "unidad": "%",
                "nivel_alerta": evaluar_alerta(
                    "Cobertura geográfica",
                    cobertura_geo
                )
            },
            {
                "nombre": "Actividades fuera de punto",
                "valor": round(act_fuera_punto,2),
                "unidad": "%",
                "nivel_alerta": evaluar_alerta(
                    "Actividades fuera de punto",
                    act_fuera_punto
                )
            },
            {
                "nombre": "Eficiencia",
                "valor": round(eficiencia,2),
                "unidad": "%",
                "nivel_alerta": evaluar_alerta(
                    "Eficiencia",
                    eficiencia
                )
            }
        ],

        "resumen": {
            "lecturas_programadas": total_programadas,
            "lecturas_realizadas": total_realizadas,
            "lecturas_pendientes": max(
                total_programadas - total_realizadas,
                0
            ),
            "impedimentos": cant_impedimentos,
            "observaciones": cant_observaciones
        }
    }