import io
import pandas as pd
import numpy as np
from datetime import datetime, time, date
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.model import Zona, Conexion, RegistroCarga, OrdenCorte

COLUMNAS_OBLIGATORIAS_CORTE = {
    "CCODPRG", "DGENPRG", "CMETFAC", "CTIPPRG", "CCODCNX", 
    "NTOTDEU", "NMESDEU", "DEJECUC", "CSITREG", "DISTRITO"
}

def _valor_o_none(row: dict, columna: str):
    valor = row.get(columna)
    # Detectar NaT, NaN, None, o cadenas "nan"/"nat"
    if valor is None or pd.isna(valor) or str(valor).strip().lower() in ("nan", "nat", "none", "null", ""):
        return None
    return valor

def _to_int(valor, default=0):
    val = _valor_o_none({"v": valor}, "v")
    if val is None:
        return default
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default

def _to_float(valor):
    val = _valor_o_none({"v": valor}, "v")
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None

def _limpiar_fecha(raw_fecha):
    val = _valor_o_none({"v": raw_fecha}, "v")
    if val is None:
        return None

    # Si ya es date/datetime nativo de Python
    if isinstance(val, (datetime, date)) and not isinstance(val, pd.Timestamp):
        return val if isinstance(val, datetime) else datetime.combine(val, time.min)

    try:
        # Intentar formatear textos explícitos
        str_val = str(val).strip()
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y %H:%M:%S"):
            try:
                return datetime.strptime(str_val, fmt)
            except ValueError:
                continue

        # Forzar parseo con Pandas
        parsed = pd.to_datetime(val, errors="coerce")
        if pd.notna(parsed) and parsed is not pd.NaT:
            return parsed.to_pydatetime()
    except Exception:
        pass

    return None

def procesar_archivo_cortes(
    contents: bytes, 
    filename: str, 
    proceso: str, 
    db: Session
) -> dict:
    try:
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error leyendo el archivo Excel de cortes: {e}")
        
    df.columns = [str(col).upper().strip() for col in df.columns]
    
    faltantes = COLUMNAS_OBLIGATORIAS_CORTE - set(df.columns)
    if faltantes:
        raise HTTPException(
            status_code=400,
            detail=f"Faltan columnas obligatorias para el archivo de cortes: {sorted(list(faltantes))}"
        )
        
    if df.empty:
        raise HTTPException(status_code=400, detail="El archivo Excel de cortes no contiene registros.")

    # CLAVE: Sanitizar reemplazando NaT/NaN explícitamente en todo el DataFrame antes de convertir a dict
    df = df.replace({pd.NaT: None, np.nan: None})
    df = df.where(pd.notnull(df), None)

    # Crear registro de auditoría de carga
    log_carga = RegistroCarga(
        nombre_archivo=filename,
        tipo_archivo="CORTE",
        proceso=proceso,
        estado="En proceso",
        registros_insertados=0,
        registros_error=0,
        usuario_id=None
    )
    db.add(log_carga)
    db.flush()

    zonas_cache = {}
    conexiones_cache = {}
    
    registros_insertados = 0
    errores_filas = []
    
    filas = df.to_dict("records")

    try:
        for idx, row in enumerate(filas):
            fila_excel = idx + 2
            try:
                ccodcnx_val = _valor_o_none(row, "CCODCNX")
                ccodprg_val = _valor_o_none(row, "CCODPRG")
                
                if not ccodcnx_val:
                    raise ValueError("CCODCNX es obligatorio")
                if not ccodprg_val:
                    raise ValueError("CCODPRG es obligatorio")

                ccodcnx = str(ccodcnx_val).split(".")[0].strip()
                ccodprg = str(ccodprg_val).split(".")[0].strip()
                
                cmetfac_val = _valor_o_none(row, "CMETFAC")
                cmetfac = str(cmetfac_val).split(".")[0].strip() if cmetfac_val else ""
                
                distrito_val = _valor_o_none(row, "DISTRITO")
                distrito = str(distrito_val or "VARIOS").strip().upper()

                # 1. Zona
                zona_id = f"Z-{distrito[:3]}-{cmetfac}"
                zona = zonas_cache.get(zona_id)
                if not zona:
                    zona = db.query(Zona).filter_by(zona_id=zona_id).first()
                if not zona:
                    zona = Zona(zona_id=zona_id, distrito=distrito, cmetfac=cmetfac)
                    db.add(zona)
                zonas_cache[zona_id] = zona

                # 2. Conexión
                conexion = conexiones_cache.get(ccodcnx)
                if not conexion:
                    conexion = db.query(Conexion).filter_by(ccodcnx=ccodcnx).first()

                direccion = _valor_o_none(row, "DIRECCION")
                categoria = _valor_o_none(row, "CATEGORIA")
                cnromdr = _valor_o_none(row, "CNROMDR")
                
                direccion = str(direccion).strip() if direccion else None
                categoria = str(categoria).strip() if categoria else None
                cnromdr = str(cnromdr).strip() if cnromdr else None

                utm_x = _to_float(row.get("CUTMX"))
                utm_y = _to_float(row.get("CUTMY"))

                if not conexion:
                    conexion = Conexion(
                        ccodcnx=ccodcnx,
                        cnromdr=cnromdr,
                        zona=zona,
                        direccion=direccion,
                        categoria=categoria,
                        utm_x=utm_x,
                        utm_y=utm_y
                    )
                    db.add(conexion)
                else:
                    if direccion and not conexion.direccion: conexion.direccion = direccion
                    if categoria and not conexion.categoria: conexion.categoria = categoria
                    if cnromdr and not conexion.cnromdr: conexion.cnromdr = cnromdr
                    if utm_x and not conexion.utm_x: conexion.utm_x = utm_x
                    if utm_y and not conexion.utm_y: conexion.utm_y = utm_y

                conexiones_cache[ccodcnx] = conexion

                # 3. Fechas
                dgenprg_dt = _limpiar_fecha(row.get("DGENPRG"))
                dejecuc_dt = _limpiar_fecha(row.get("DEJECUC"))

                # Extraer objeto date puro (o None)
                dgenprg_date = dgenprg_dt.date() if dgenprg_dt else None
                dejecuc_date = dejecuc_dt.date() if dejecuc_dt else None

                # 4. Crear Orden de Corte
                orden = OrdenCorte(
                    id_carga=log_carga.id_carga,
                    ccodprg=ccodprg,
                    dgenprg=dgenprg_date,
                    cmetfac=cmetfac,
                    ctipprg=_to_int(row.get("CTIPPRG"), default=1),
                    ccodcnx=ccodcnx,
                    cnromdr=cnromdr,
                    ntotdeu=_to_float(row.get("NTOTDEU")),
                    nmesdeu=_to_int(row.get("NMESDEU"), default=0),
                    dejecuc=dejecuc_date,
                    nleccor=_to_int(row.get("NLECCOR"), default=0),
                    cimpcrp=_valor_o_none(row, "CIMPCRP"),
                    cobscrp=_valor_o_none(row, "COBSMDR"),
                    csitreg=str(_valor_o_none(row, "CSITREG") or "S").strip().upper(),
                    ccodacc=_valor_o_none(row, "CCODACC"),
                    cdesacc=_valor_o_none(row, "CDESACC"),
                    hora=_to_int(row.get("HORA"), default=0),
                    minuto=_to_int(row.get("MINUTO"), default=0),
                    segundo=_to_int(row.get("SEGUNDO"), default=0),
                    cutmx=utm_x,
                    cutmy=utm_y,
                    direccion=direccion,
                    categoria=categoria,
                    distrito=distrito
                )

                db.add(orden)
                registros_insertados += 1

                if registros_insertados % 1000 == 0:
                    db.flush()

            except Exception as e_fila:
                errores_filas.append(f"Fila {fila_excel}: {e_fila}")
                continue

        registros_error = len(errores_filas)
        estado_carga = "Exitoso" if registros_error == 0 else ("Con errores" if registros_insertados > 0 else "Fallido")

        log_carga.estado = estado_carga
        log_carga.registros_insertados = registros_insertados
        log_carga.registros_error = registros_error
        log_carga.detalle_errores = "\n".join(errores_filas[:50]) if errores_filas else None

        if registros_insertados == 0 and registros_error > 0:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"No se insertó ningún registro de cortes. Muestra de errores: {errores_filas[:5]}"
            )

        db.commit()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo de cortes: {e}")

    return {
        "status": "success",
        "id_carga": log_carga.id_carga,
        "message": "Archivo de cortes procesado correctamente." if registros_error == 0 else f"Procesado con {registros_error} errores de fila.",
        "registros_insertados": registros_insertados,
        "registros_error": registros_error,
        "total_filas_excel": len(filas)
    }