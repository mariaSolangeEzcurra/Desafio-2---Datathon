import io
import pandas as pd
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.model import Trabajador, Actividad, ActividadLectura
from app.services.Lectura.desempeno_service import (
    evaluar_desempeno_trabajador,
    guardar_evaluacion_desempeno
)


# --- FUNCIONES AUXILIARES DE LIMPIEZA ---

def _convertir_hora(valor):
    if pd.isna(valor) or valor is None:
        return None
    if isinstance(valor, datetime):
        return valor
    try:
        return pd.to_datetime(valor).to_pydatetime()
    except Exception:
        return None


def _limpiar_nombre(nombre):
    if pd.isna(nombre) or not nombre:
        return "Trabajador Temporal"
    return str(nombre).replace(",", "").strip()


def _parsear_timedelta_a_segundos(valor) -> float:
    if pd.isna(valor) or valor is None:
        return 0.0
    try:
        td = pd.to_timedelta(valor)
        return float(td.total_seconds())
    except Exception:
        try:
            partes = str(valor).split(":")
            if len(partes) == 3:
                h, m, s = map(float, partes)
                return h * 3600 + m * 60 + s
            elif len(partes) == 2:
                m, s = map(float, partes)
                return m * 60 + s
        except Exception:
            pass
        return 0.0


def _to_int(val, default=0):
    if val is None or pd.isna(val):
        return default
    try:
        return int(float(val))
    except Exception:
        return default


def _to_float(val, default=0.0):
    if val is None or pd.isna(val):
        return default
    try:
        return float(val)
    except Exception:
        return default


# --- SERVICIOS PRINCIPALES ---

def procesar_reporte_eficiencia(db: Session, archivo, fecha_reporte: date):
    if hasattr(archivo, "file"):
        contenido = archivo.file.read()
    elif hasattr(archivo, "read"):
        contenido = archivo.read()
    else:
        contenido = archivo

    try:
        df = pd.read_excel(io.BytesIO(contenido))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al leer el archivo Excel: {e}")

    if df.empty:
        raise HTTPException(status_code=400, detail="El archivo Excel está vacío.")

    df.columns = [str(col).upper().strip() for col in df.columns]

    filas = df.to_dict("records")
    registros_insertados = 0
    trabajadores_procesados = set()
    trabajadores_cache = {}

    try:
        for index, fila in enumerate(filas):
            raw_lector = fila.get("LECTOR")
            if raw_lector is None or pd.isna(raw_lector):
                continue
                
            ccodprs = str(raw_lector).split(".")[0].strip()
            nombre = _limpiar_nombre(fila.get("NOMBRES"))

            # Buscar o crear trabajador
            trabajador = trabajadores_cache.get(ccodprs)
            if not trabajador:
                trabajador = db.query(Trabajador).filter(Trabajador.ccodprs == ccodprs).first()
                if not trabajador:
                    trabajador = Trabajador(ccodprs=ccodprs, nombre=nombre)
                    db.add(trabajador)
                    db.flush()
                trabajadores_cache[ccodprs] = trabajador

            actividad_id = f"REP-{ccodprs}-{fecha_reporte.strftime('%Y%m%d')}-{index}"

            # Limpieza previa a re-insertar
            detalle_existente = db.query(ActividadLectura).filter_by(actividad_id=actividad_id).first()
            if detalle_existente:
                db.delete(detalle_existente)
            
            act_existente = db.query(Actividad).filter_by(actividad_id=actividad_id).first()
            if act_existente:
                db.delete(act_existente)
            
            db.flush()

            duracion_seg = _parsear_timedelta_a_segundos(fila.get("DURACION"))
            promedio_lectura = _parsear_timedelta_a_segundos(fila.get("PROMEDIO"))

            actividad = Actividad(
                actividad_id=actividad_id,
                ccodprs=ccodprs,
                tipo_actividad="Lectura",
                fecha=fecha_reporte,
                hora_inicio=_convertir_hora(fila.get("HORA INICIO")),
                hora_fin=_convertir_hora(fila.get("HORA FIN")),
                duracion_min=duracion_seg / 60.0,
                promedio_lectura=promedio_lectura if promedio_lectura > 0 else None,
                lecturas_programadas=_to_int(fila.get("CANTIDAD LECTURAS")),
                lecturas_realizadas=_to_int(fila.get("LECTURAS REALIZADAS")),
                lecturas_pendientes=_to_int(fila.get("LECTURAS PENDIENTES")),
                eficiencia=_to_float(fila.get("EFICIENCIA"))
            )
            db.add(actividad)

            detalle = ActividadLectura(
                actividad_id=actividad_id,
                cimplec=str(_to_int(fila.get("CANTIDAD IMPEDIMENTOS"))),
                cobsmdr=str(_to_int(fila.get("CANTIDAD OBSERVACIONES")))
            )
            db.add(detalle)

            trabajadores_procesados.add(ccodprs)
            registros_insertados += 1

        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al procesar el reporte: {e}")

    # Evaluación de desempeño
    evaluaciones = []
    for codigo in trabajadores_procesados:
        try:
            resultado = evaluar_desempeno_trabajador(db, codigo, fecha_reporte, fecha_reporte)
            if resultado:
                guardar_evaluacion_desempeno(db, resultado)
                evaluaciones.append(resultado)
        except Exception as e_desempeno:
            print(f"Error evaluando desempeño para operario {codigo}: {e_desempeno}")

    return {
        "mensaje": "Reporte procesado correctamente",
        "registros_insertados": registros_insertados,
        "trabajadores_procesados": len(trabajadores_procesados),
        "evaluaciones_generadas": len(evaluaciones),
        "evaluaciones": evaluaciones
    }


def obtener_historial_reportes_service(db: Session):
    """
    Agrupa las actividades cargadas por fecha para armar la lista del historial.
    """
    reportes = (
        db.query(
            Actividad.fecha.label("fecha"),
            func.count(Actividad.actividad_id).label("registros"),
            func.count(func.distinct(Actividad.ccodprs)).label("trabajadores")
        )
        .filter(Actividad.tipo_actividad == "Lectura")
        .group_by(Actividad.fecha)
        .order_by(Actividad.fecha.desc())
        .all()
    )

    historial = []
    for r in reportes:
        historial.append({
            "id": str(r.fecha),
            "fecha": r.fecha.strftime("%Y-%m-%d"),
            "registros": r.registros,
            "trabajadores": r.trabajadores,
            "evaluaciones": r.trabajadores,
            "estado": "Procesado"
        })

    return historial