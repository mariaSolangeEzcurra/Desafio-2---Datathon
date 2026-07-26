import io
import pandas as pd
from datetime import datetime, date, time, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.model import Trabajador, ResumenDiarioLector, RegistroCarga
from app.services.geo_utils import limpiar_fecha

COLUMNAS_OBLIGATORIAS_REPORTE = {
    "CODIGO SEDAPAR", "NOMBRES", "CANTIDAD LECTURAS", 
    "FECHA INICIO", "HORA INICIO", "FECHA FIN", "HORA FIN", 
    "DURACION", "PROMEDIO", "LECTURAS REALIZADAS", "EFICIENCIA"
}

def _valor_o_none(row: dict, columna: str):
    valor = row.get(columna)
    if valor is None or (isinstance(valor, float) and pd.isna(valor)):
        return None
    return valor

def _to_int(valor, default=0) -> int:
    if valor is None or (isinstance(valor, float) and pd.isna(valor)):
        return default
    try:
        return int(float(valor))
    except (ValueError, TypeError):
        return default

def _to_float(valor, default=0.0) -> float:
    if valor is None or (isinstance(valor, float) and pd.isna(valor)):
        return default
    try:
        return float(valor)
    except (ValueError, TypeError):
        return default

def parsear_hhmmss_a_minutos(val) -> float:
    """
    Convierte 'HH:MM:SS', timedelta o floats a minutos totales.
    Ejemplo: '10:26:49' -> 626.82 min
    """
    if val is None or pd.isna(val):
        return 0.0
    
    if isinstance(val, timedelta):
        return round(val.total_seconds() / 60.0, 2)
    
    val_str = str(val).strip()
    try:
        if ":" in val_str:
            partes = val_str.split(":")
            if len(partes) == 3: # HH:MM:SS
                h, m, s = map(float, partes)
                return round(h * 60.0 + m + s / 60.0, 2)
            elif len(partes) == 2: # MM:SS
                m, s = map(float, partes)
                return round(m + s / 60.0, 2)
        return round(float(val_str), 2)
    except Exception:
        return 0.0

def parsear_a_datetime(raw_fecha, raw_hora) -> datetime:
    """Combina fecha y hora asegurando compatibilidad con Column(DateTime)."""
    fecha_dt = limpiar_fecha(raw_fecha)
    if not fecha_dt:
        return None
    
    if raw_hora is None or pd.isna(raw_hora):
        return datetime.combine(fecha_dt.date(), time(0, 0, 0))

    if isinstance(raw_hora, time):
        return datetime.combine(fecha_dt.date(), raw_hora)
    
    if isinstance(raw_hora, datetime):
        return datetime.combine(fecha_dt.date(), raw_hora.time())

    h_str = str(raw_hora).strip()
    try:
        if ":" in h_str:
            partes = h_str.split(":")
            h = int(partes[0])
            m = int(partes[1])
            s = int(float(partes[2])) if len(partes) > 2 else 0
            return datetime.combine(fecha_dt.date(), time(hour=h, minute=m, second=s))
    except Exception:
        pass

    return datetime.combine(fecha_dt.date(), time(0, 0, 0))

def procesar_archivo_reporte_diario(
    contents: bytes, 
    filename: str, 
    db: Session, 
    usuario_id: str = None
) -> dict:
    try:
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error leyendo Excel: {e}")
        
    df.columns = [str(col).upper().strip() for col in df.columns]
    
    faltantes = COLUMNAS_OBLIGATORIAS_REPORTE - set(df.columns)
    if faltantes:
        raise HTTPException(
            status_code=400,
            detail=f"Faltan columnas en el reporte diario: {sorted(list(faltantes))}"
        )
        
    if df.empty:
        raise HTTPException(status_code=400, detail="El archivo Excel está vacío.")

    registros_insertados = 0
    registros_actualizados = 0
    errores_filas = []
    
    filas = df.to_dict("records")

    try:
        for idx, row in enumerate(filas):
            fila_excel = idx + 2
            try:
                # Normalización del código trabajador (ej: 42 -> '0042')
                raw_cod = str(_valor_o_none(row, "CODIGO SEDAPAR") or "").split(".")[0].strip()
                if not raw_cod or raw_cod.lower() == "nan":
                    raise ValueError("CODIGO SEDAPAR vacío")
                
                ccodprs = raw_cod.zfill(4)
                cnomprs = str(_valor_o_none(row, "NOMBRES") or f"Trabajador {ccodprs}").strip()

                # 1. Gestionar Trabajador
                trabajador = db.query(Trabajador).filter_by(ccodprs=ccodprs).first()
                if not trabajador:
                    trabajador = Trabajador(ccodprs=ccodprs, nombre=cnomprs)
                    db.add(trabajador)
                    db.flush() # Guardar temporalmente para asegurar disponibilidad
                elif cnomprs and cnomprs != f"Trabajador {ccodprs}":
                    trabajador.nombre = cnomprs

                # 2. Fechas y Horas
                dt_inicio = parsear_a_datetime(_valor_o_none(row, "FECHA INICIO"), _valor_o_none(row, "HORA INICIO"))
                if not dt_inicio:
                    raise ValueError("Fecha de inicio inválida")
                
                fecha_reg = dt_inicio.date()
                dt_fin = parsear_a_datetime(_valor_o_none(row, "FECHA FIN"), _valor_o_none(row, "HORA FIN"))

                # 3. Minutos
                duracion_min = parsear_hhmmss_a_minutos(_valor_o_none(row, "DURACION"))
                promedio_min = parsear_hhmmss_a_minutos(_valor_o_none(row, "PROMEDIO"))

                # 4. Lecturas y Eficiencia
                cant_lecturas = _to_int(_valor_o_none(row, "CANTIDAD LECTURAS"))
                lect_realizadas = _to_int(_valor_o_none(row, "LECTURAS REALIZADAS"))
                lect_pendientes = _to_int(_valor_o_none(row, "LECTURAS PENDIENTES"))
                cant_imped = _to_int(_valor_o_none(row, "CANTIDAD IMPEDIMENTOS"))
                cant_obs = _to_int(_valor_o_none(row, "CANTIDAD OBSERVACIONES"))
                cant_fotos = _to_int(_valor_o_none(row, "CANTIDAD FOTOS"))
                eficiencia = _to_float(_valor_o_none(row, "EFICIENCIA"))

                # 5. Insertar o Actualizar ResumenDiarioLector
                resumen = db.query(ResumenDiarioLector).filter_by(
                    ccodprs=ccodprs, 
                    fecha=fecha_reg
                ).first()

                if not resumen:
                    resumen = ResumenDiarioLector(
                        ccodprs=ccodprs,
                        fecha=fecha_reg,
                        cantidad_lecturas=cant_lecturas,
                        lecturas_realizadas=lect_realizadas,
                        lecturas_pendientes=lect_pendientes,
                        cantidad_impedimentos=cant_imped,
                        cantidad_observaciones=cant_obs,
                        cantidad_fotos=cant_fotos,
                        eficiencia=eficiencia,
                        fecha_inicio=dt_inicio.date(),
                        hora_inicio=dt_inicio,
                        fecha_fin=dt_fin.date() if dt_fin else dt_inicio.date(),
                        hora_fin=dt_fin or dt_inicio,
                        duracion_total_min=duracion_min,
                        promedio_min=promedio_min
                    )
                    db.add(resumen)
                    registros_insertados += 1
                else:
                    resumen.cantidad_lecturas = cant_lecturas
                    resumen.lecturas_realizadas = lect_realizadas
                    resumen.lecturas_pendientes = lect_pendientes
                    resumen.cantidad_impedimentos = cant_imped
                    resumen.cantidad_observaciones = cant_obs
                    resumen.cantidad_fotos = cant_fotos
                    resumen.eficiencia = eficiencia
                    resumen.fecha_inicio = dt_inicio.date()
                    resumen.hora_inicio = dt_inicio
                    resumen.fecha_fin = dt_fin.date() if dt_fin else resumen.fecha_fin
                    resumen.hora_fin = dt_fin or resumen.hora_fin
                    resumen.duracion_total_min = duracion_min
                    resumen.promedio_min = promedio_min
                    registros_actualizados += 1

                if (registros_insertados + registros_actualizados) % 200 == 0:
                    db.flush()

            except Exception as e_fila:
                errores_filas.append(f"Fila {fila_excel}: {e_fila}")
                continue

        total_procesados = registros_insertados + registros_actualizados
        registros_error = len(errores_filas)
        estado_carga = "Exitoso" if registros_error == 0 else ("Con errores" if total_procesados > 0 else "Fallido")

        log_carga = RegistroCarga(
            nombre_archivo=filename,
            tipo_archivo="Reporte Diario",
            proceso="Lectura",
            estado=estado_carga,
            registros_insertados=total_procesados,
            registros_error=registros_error,
            detalle_errores="\n".join(errores_filas[:50]) if errores_filas else None,
            usuario_id=usuario_id
        )
        db.add(log_carga)

        if total_procesados == 0 and registros_error > 0:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Error fatal en la plantilla. Ejemplos de falla: {errores_filas[:5]}"
            )

        db.commit()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error inesperado en BD: {e}")

    return {
        "status": "success",
        "message": "Reporte diario procesado exitosamente.",
        "registros_insertados": registros_insertados,
        "registros_actualizados": registros_actualizados,
        "registros_error": registros_error,
        "total_filas_excel": len(filas)
    }