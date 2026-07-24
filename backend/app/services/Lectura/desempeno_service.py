from datetime import date, timedelta
from sqlalchemy.orm import Session
import json

from app.model import (
    Actividad,
    ActividadLectura,
    Trabajador,
    EvaluacionDesempeno
)


def obtener_clasificacion(puntaje):
    """
    Clasificación según puntaje obtenido
    """

    if puntaje >= 90:
        return "Excelente"
    elif puntaje >= 75:
        return "Bueno"
    elif puntaje >= 60:
        return "Regular"
    else:
        return "Crítico"



def calcular_tendencia(
    db: Session,
    ccodprs: str,
    puntaje_actual: float
):
    """
    Compara con última evaluación del trabajador
    """

    anterior = (
        db.query(EvaluacionDesempeno)
        .filter(
            EvaluacionDesempeno.ccodprs == ccodprs
        )
        .order_by(
            EvaluacionDesempeno.fecha.desc()
        )
        .first()
    )

    if not anterior:
        return "Nueva"

    diferencia = puntaje_actual - anterior.puntaje

    if diferencia > 5:
        return "Mejora"

    elif diferencia < -5:
        return "Disminuye"

    else:
        return "Estable"



def evaluar_desempeno_trabajador(
    db: Session,
    ccodprs: str,
    fecha_inicio: date,
    fecha_fin: date
):

    resultados = (
    db.query(Actividad, ActividadLectura)
    .join(
        ActividadLectura,
        Actividad.actividad_id == ActividadLectura.actividad_id,
        isouter=True
    )
    .filter(
        Actividad.ccodprs == ccodprs,
        Actividad.fecha >= fecha_inicio,
        Actividad.fecha <= fecha_fin
    )
    .all()
)


    if not resultados:
        return None


    # ===============================
    # VARIABLES ACUMULADORAS
    # ===============================

    lecturas_programadas = 0
    lecturas_realizadas = 0
    lecturas_pendientes = 0

    total_minutos = 0

    impedimentos = 0
    observaciones = 0

    gps_validos = 0

    eficiencias = []


    for actividad, detalle in resultados:


        # Lecturas
        if actividad.lecturas_programadas:
            lecturas_programadas += actividad.lecturas_programadas

        if actividad.lecturas_realizadas:
            lecturas_realizadas += actividad.lecturas_realizadas

        if actividad.lecturas_pendientes:
            lecturas_pendientes += actividad.lecturas_pendientes



        # Tiempo trabajado

        if actividad.duracion_min:
            total_minutos += actividad.duracion_min



        # Impedimentos

        if detalle.cimplec:

            if detalle.cimplec.strip() not in ["0", "00", ""]:
                impedimentos += 1



        # Observaciones

        if detalle.cobsmdr:

            if detalle.cobsmdr.strip() not in ["0", "00", ""]:
                observaciones += 1



        # GPS

        if (
            detalle.cgpslat is not None
            and detalle.cgpslon is not None
        ):
            gps_validos += 1



        # eficiencia del reporte

        if actividad.eficiencia:
            eficiencias.append(
                actividad.eficiencia
            )

    # ===============================
    # CALCULO DE KPIs
    # ===============================
    cumplimiento = (
        lecturas_realizadas /
        lecturas_programadas * 100
        if lecturas_programadas > 0
        else 0
    )

    horas_trabajadas = total_minutos / 60

    productividad = (
        lecturas_realizadas /
        horas_trabajadas
        if horas_trabajadas > 0
        else 0
    )

    tiempo_promedio = (
        total_minutos /
        lecturas_realizadas
        if lecturas_realizadas > 0
        else 0
    )

    indice_impedimentos = (
        impedimentos /
        lecturas_realizadas * 100
        if lecturas_realizadas > 0
        else 0
    )

    indice_observaciones = (
        observaciones /
        lecturas_realizadas * 100
        if lecturas_realizadas > 0
        else 0
    )

    cobertura = (
        gps_validos /
        lecturas_realizadas * 100
        if lecturas_realizadas > 0
        else 0
    )

    eficiencia_promedio = (
        sum(eficiencias) /
        len(eficiencias)
        if eficiencias
        else 0
    )

    # ===============================
    # PUNTAJE FINAL
    # ===============================
    puntaje = (
        cumplimiento * 0.30 +
        min(productividad / 10, 100) * 0.25 +
        eficiencia_promedio * 100 * 0.15 +
        max(100 - indice_impedimentos - indice_observaciones, 0)
        * 0.15 +
        cobertura * 0.15

    )

    puntaje = round(
        min(puntaje,100),
        2
    )

    clasificacion = obtener_clasificacion(
        puntaje
    )

    problemas = []


    if cumplimiento < 80:
        problemas.append(
            f"Cumplimiento bajo: {round(cumplimiento,2)}%"
        )


    if productividad < 10:
        problemas.append(
            f"Productividad baja: {round(productividad,2)} lecturas/hora"
        )


    if eficiencia_promedio < 0.80:
        problemas.append(
            f"Eficiencia baja: {round(eficiencia_promedio*100,2)}%"
        )


    if indice_impedimentos > 20:
        problemas.append(
            f"Muchos impedimentos: {round(indice_impedimentos,2)}%"
        )


    if indice_observaciones > 4:
        problemas.append(
            f"Muchas observaciones: {round(indice_observaciones,2)}%"
        )


    if cobertura < 80:
        problemas.append(
            f"Baja cobertura GPS: {round(cobertura,2)}%"
        )


    if not problemas:
        problemas.append(
            "Desempeño dentro de los parámetros esperados"
        )


    tendencia = calcular_tendencia(
        db,
        ccodprs,
        puntaje
    )

    return {
        "ccodprs": ccodprs,
        "fecha": fecha_fin,
        "cumplimiento": round(cumplimiento,2),
        "productividad": round(productividad,2),
        "tiempo_promedio": round(tiempo_promedio,2),
        "impedimentos": round(indice_impedimentos,2),
        "observaciones": round(indice_observaciones,2),
        "cobertura": round(cobertura,2),
        "eficiencia": round(
            eficiencia_promedio*100,
            2
        ),
        "puntaje": puntaje,
        "clasificacion": clasificacion,
        "tendencia": tendencia,
        "problemas": problemas
    }

def guardar_evaluacion_desempeno(
    db: Session,
    evaluacion: dict
):

    registro = EvaluacionDesempeno(
        ccodprs=evaluacion["ccodprs"],
        fecha=evaluacion["fecha"],
        puntaje=evaluacion["puntaje"],
        clasificacion=evaluacion["clasificacion"],
        tendencia=evaluacion["tendencia"],
        eficiencia=evaluacion["eficiencia"],
        cumplimiento=evaluacion["cumplimiento"],
        productividad=evaluacion["productividad"],
        impedimentos=evaluacion["impedimentos"],
        observaciones=evaluacion["observaciones"],
        cobertura=evaluacion["cobertura"],

        motivos=json.dumps(
        evaluacion["problemas"]
    )
    )
    db.add(registro)



    # Actualizar resumen actual del trabajador
    trabajador = (
        db.query(Trabajador)
        .filter(
            Trabajador.ccodprs == evaluacion["ccodprs"]
        )
        .first()
    )

    if trabajador:
        trabajador.ultimo_puntaje = evaluacion["puntaje"]
        trabajador.ultima_clasificacion = evaluacion["clasificacion"]
        trabajador.fecha_ultima_evaluacion = evaluacion["fecha"]

    db.commit()
    db.refresh(registro)

    return registro