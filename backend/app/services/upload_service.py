import io
import pandas as pd
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.model import Zona, Ruta, Trabajador, Conexion, Actividad, ActividadLectura, RegistroCarga
from app.services.geo_utils import limpiar_coordenada, limpiar_fecha, distancia_metros, RADIO_TOLERANCIA_METROS

COLUMNAS_REQUERIDAS = {"CCODCNX", "CCODPRS", "CMETFAC", "DISTRITO"}
def _valor_o_none(row, columna):
    """Devuelve None si la celda no existe o es NaN, en vez de NaN 'crudo'."""
    valor = row.get(columna)
    if valor is None or (isinstance(valor, float) and pd.isna(valor)):
        return None
    return valor

def _to_int(valor, default=0):
    if valor is None or (isinstance(valor, float) and pd.isna(valor)):
        return default
    try:
        return int(float(valor))
    except (ValueError, TypeError):
        return default

def procesar_archivo_excel(contents: bytes, filename: str, proceso: str, db: Session) -> dict:
    try:
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo leer el Excel: {e}")
    df.columns = [str(col).upper().strip() for col in df.columns]
    faltantes = COLUMNAS_REQUERIDAS - set(df.columns)
    if faltantes:
        raise HTTPException(
            status_code=400,
            detail=f"Faltan columnas obligatorias en el Excel: {sorted(faltantes)}"
        )
    if df.empty:
        raise HTTPException(status_code=400, detail="El archivo Excel no contiene filas.")
    zonas_cache = {}
    rutas_cache = {}
    trabajadores_cache = {}
    conexiones_cache = {}
    registros_procesados = 0
    errores_filas = []
    try:
        for idx, row in df.iterrows():
            fila_excel = idx + 2  # +2 porque idx empieza en 0 y la fila 1 es el header
            try:
                ccodcnx = str(row["CCODCNX"]).split(".")[0].strip()
                ccodprs = str(row["CCODPRS"]).split(".")[0].strip()
                cmetfac = str(row["CMETFAC"]).split(".")[0].strip()
                distrito = str(row["DISTRITO"]).strip().upper()
                cderule = str(_valor_o_none(row, "CDERULE") or "SIN_RUTA").strip()
                if not ccodcnx or ccodcnx.lower() == "nan":
                    raise ValueError("CCODCNX vacío o inválido")
                # 1. Zona
                zona_id = f"Z-{distrito[:3]}-{cmetfac}"
                zona = zonas_cache.get(zona_id)
                if zona is None:
                    zona = db.query(Zona).filter_by(zona_id=zona_id).first()
                if zona is None:
                    zona = Zona(zona_id=zona_id, distrito=distrito, cmetfac=cmetfac)
                    db.add(zona)
                zonas_cache[zona_id] = zona
                # 2. Ruta
                ruta = rutas_cache.get(cderule)
                if ruta is None:
                    ruta = db.query(Ruta).filter_by(ruta_id=cderule).first()
                if ruta is None:
                    ruta = Ruta(ruta_id=cderule)
                    db.add(ruta)
                rutas_cache[cderule] = ruta
                # 3. Trabajador
                trabajador = trabajadores_cache.get(ccodprs)
                if trabajador is None:
                    trabajador = db.query(Trabajador).filter_by(ccodprs=ccodprs).first()
                if trabajador is None:
                    trabajador = Trabajador(ccodprs=ccodprs, nombre=f"Operario {ccodprs}")
                    db.add(trabajador)
                trabajadores_cache[ccodprs] = trabajador
                # 4. Conexion
                conexion = conexiones_cache.get(ccodcnx)
                if conexion is None:
                    conexion = db.query(Conexion).filter_by(ccodcnx=ccodcnx).first()
                if conexion is None:
                    conexion = Conexion(ccodcnx=ccodcnx, zona=zona, ruta=ruta)
                    db.add(conexion)
                conexiones_cache[ccodcnx] = conexion
                # 5. Actividad + detalle de lectura
                dlectur = limpiar_fecha(_valor_o_none(row, "DLECTUR"))
                if dlectur is None:
                    raise ValueError("DLECTUR vacío o con formato inválido")
                act_id = f"ACT-{ccodcnx}-{dlectur.strftime('%Y%m%d%H%M')}"
                # Evitar reprocesar la misma actividad si el archivo se sube de nuevo
                if db.query(Actividad).filter_by(actividad_id=act_id).first():
                    errores_filas.append(f"Fila {fila_excel}: actividad {act_id} ya existe, se omitió")
                    continue
                lat = limpiar_coordenada(_valor_o_none(row, "CGPSLAT"), "lat")
                lon = limpiar_coordenada(_valor_o_none(row, "CGPSLON"), "lon")
                dist = distancia_metros(
                    lat or 0, lon or 0,
                    conexion.latitud_real or 0, conexion.longitud_real or 0
                )
                actividad = Actividad(
                    actividad_id=act_id,
                    ccodcnx=ccodcnx,
                    ccodprs=ccodprs,
                    tipo_actividad=proceso,
                    fecha=dlectur.date(),
                    estado="Completado",
                    resultado="Fuera de Radio" if dist > RADIO_TOLERANCIA_METROS else "OK",
                )
                detalle = ActividadLectura(
                    actividad_id=act_id,
                    dlectur=dlectur,
                    nlecact=_to_int(_valor_o_none(row, "NLECACT"), default=0),
                    cgpslat=lat,
                    cgpslon=lon,
                    cutmx=_valor_o_none(row, "CUTMX"),
                    cutmy=_valor_o_none(row, "CUTMY"),
                )
                db.add_all([actividad, detalle])
                registros_procesados += 1
            except Exception as e_fila:
                errores_filas.append(f"Fila {fila_excel}: {e_fila}")
                continue
        if registros_procesados == 0:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"No se insertó ningún registro. Errores: {errores_filas[:10]}"
            )
        db.add(RegistroCarga(
            nombre_archivo=filename,
            proceso=proceso,
            registros_insertados=registros_procesados,
        ))
        db.commit()
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error procesando el archivo: {e}")
    mensaje = "Procesado correctamente"
    if errores_filas:
        mensaje += f" (con {len(errores_filas)} fila(s) omitida(s), ver logs)"
    return {
        "status": "success",
        "message": mensaje,
        "registros_insertados": registros_procesados,
        "total_filas_excel": len(df),
    }