import io
import pandas as pd
from datetime import datetime, date
from sqlalchemy.orm import Session

from app.model import Trabajador, Actividad, ActividadLectura
from app.services.Lectura.desempeno_service import (
    evaluar_desempeno_trabajador,
    guardar_evaluacion_desempeno
)

def convertir_hora(valor):
    if pd.isna(valor):
        return None
    if isinstance(valor, datetime):
        return valor
    return pd.to_datetime(valor)

def limpiar_nombre(nombre):
    if pd.isna(nombre):
        return "Trabajador Temporal"
    return str(nombre).replace(",", "").strip()

def procesar_reporte_eficiencia(db: Session, archivo, fecha_reporte: date):
    # 🟢 Manejo seguro de bytes para evitar 'SpooledTemporaryFile object has no attribute seekable'
    if hasattr(archivo, "file"):
        contenido = archivo.file.read()
    elif hasattr(archivo, "read"):
        contenido = archivo.read()
    else:
        contenido = archivo

    df = pd.read_excel(io.BytesIO(contenido))
    registros_insertados = 0
    trabajadores_procesados = set()

    # =====================================
    # RECORRER EXCEL
    # =====================================
    for index, fila in df.iterrows():
        ccodprs = str(fila["LECTOR"]).strip()
        nombre = limpiar_nombre(fila["NOMBRES"])

        # Buscar o crear trabajador
        trabajador = db.query(Trabajador).filter(Trabajador.ccodprs == ccodprs).first()
        if not trabajador:
            trabajador = Trabajador(ccodprs=ccodprs, nombre=nombre)
            db.add(trabajador)
            db.flush()

        # Crear actividad
        actividad_id = f"{ccodprs}_{fecha_reporte}_{index}"
        
        # Conversiones seguras para duraciones
        duracion_min = 0.0
        if not pd.isna(fila["DURACION"]):
            try:
                duracion_min = pd.to_timedelta(fila["DURACION"]).total_seconds() / 60.0
            except Exception:
                duracion_min = 0.0

        promedio_lectura = None
        if not pd.isna(fila["PROMEDIO"]):
            try:
                promedio_lectura = pd.to_timedelta(fila["PROMEDIO"]).total_seconds()
            except Exception:
                promedio_lectura = None

        actividad = Actividad(
            actividad_id=actividad_id,
            ccodprs=ccodprs,
            tipo_actividad="Lectura",
            fecha=fecha_reporte,
            hora_inicio=convertir_hora(fila["HORA INICIO"]),
            hora_fin=convertir_hora(fila["HORA FIN"]),
            duracion_min=duracion_min,
            promedio_lectura=promedio_lectura,
            lecturas_programadas=int(fila["CANTIDAD LECTURAS"]) if not pd.isna(fila["CANTIDAD LECTURAS"]) else 0,
            lecturas_realizadas=int(fila["LECTURAS REALIZADAS"]) if not pd.isna(fila["LECTURAS REALIZADAS"]) else 0,
            lecturas_pendientes=int(fila["LECTURAS PENDIENTES"]) if not pd.isna(fila["LECTURAS PENDIENTES"]) else 0,
            eficiencia=float(fila["EFICIENCIA"]) if not pd.isna(fila["EFICIENCIA"]) else 0.0
        )
        db.add(actividad)
        db.flush()

        # Detalle de lectura
        detalle = ActividadLectura(
            actividad_id=actividad_id,
            cimplec=str(fila["CANTIDAD IMPEDIMENTOS"]) if not pd.isna(fila["CANTIDAD IMPEDIMENTOS"]) else "0",
            cobsmdr=str(fila["CANTIDAD OBSERVACIONES"]) if not pd.isna(fila["CANTIDAD OBSERVACIONES"]) else "0"
        )
        db.add(detalle)

        trabajadores_procesados.add(ccodprs)
        registros_insertados += 1

    db.flush()
    db.commit()

    # =====================================
    # EVALUAR DESEMPEÑO AUTOMÁTICO
    # =====================================
    evaluaciones = []
    for codigo in trabajadores_procesados:
        resultado = evaluar_desempeno_trabajador(db, codigo, fecha_reporte, fecha_reporte)
        if resultado:
            guardar_evaluacion_desempeno(db, resultado)
            evaluaciones.append(resultado)

    return {
        "mensaje": "Reporte procesado correctamente",
        "registros_insertados": registros_insertados,
        "trabajadores_procesados": len(trabajadores_procesados),
        "evaluaciones_generadas": len(evaluaciones),
        "evaluaciones": evaluaciones
    }