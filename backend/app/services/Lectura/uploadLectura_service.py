import io
import pandas as pd
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.model import Zona, Ruta, Trabajador, Conexion, Actividad, ActividadLectura, RegistroCarga
from app.services.geo_utils import limpiar_coordenada, limpiar_fecha, distancia_metros, RADIO_TOLERANCIA_METROS

COLUMNAS_REQUERIDAS = {"CCODCNX", "CCODPRS", "CMETFAC", "DISTRITO", "CIMPLEC", "COBSMDR"}

def _valor_o_none(row, columna):
    """Devuelve None si la celda no existe o es NaN/Null."""
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

def _to_float(valor):
    if valor is None or (isinstance(valor, float) and pd.isna(valor)):
        return None
    try:
        return float(valor)
    except (ValueError, TypeError):
        return None

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
    # Caches en memoria para no repetir consultas en BD
    zonas_cache = {}
    rutas_cache = {}
    trabajadores_cache = {}
    conexiones_cache = {}   
    registros_procesados = 0
    errores_filas = []    
    # Convertimos el dataframe a lista de diccionarios (mucho más rápido que df.iterrows())
    filas = df.to_dict("records")
    # 1. Precarga masiva de actividades existentes para evitar db.query() dentro del bucle
    actividades_ids_excel = []
    for row in filas:
        ccodcnx_raw = str(_valor_o_none(row, "CCODCNX") or "").split(".")[0].strip()
        dlectur_raw = limpiar_fecha(_valor_o_none(row, "DLECTUR"))
        if ccodcnx_raw and dlectur_raw:
            actividades_ids_excel.append(f"ACT-{ccodcnx_raw}-{dlectur_raw.strftime('%Y%m%d%H%M')}")        
    # Traemos de la BD únicamente los IDs de actividad que ya existen en este lote
    actividades_existentes = set()
    if actividades_ids_excel:
        # Consultamos en bloques de 1000 para no saturar el operador IN
        for i in range(0, len(actividades_ids_excel), 1000):
            chunk = actividades_ids_excel[i:i + 1000]
            existentes_chunk = db.query(Actividad.actividad_id).filter(Actividad.actividad_id.in_(chunk)).all()
            actividades_existentes.update(r[0] for r in existentes_chunk)
    try:
        for idx, row in enumerate(filas):
            fila_excel = idx + 2  # Fila 1 suele ser cabecera
            try:
                ccodcnx = str(_valor_o_none(row, "CCODCNX") or "").split(".")[0].strip()
                ccodprs = str(_valor_o_none(row, "CCODPRS") or "").split(".")[0].strip()
                cmetfac = str(_valor_o_none(row, "CMETFAC") or "").split(".")[0].strip()
                distrito = str(_valor_o_none(row, "DISTRITO") or "").strip().upper()
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
                cnomprs = str(_valor_o_none(row, "CNOMPRS") or f"Operario {ccodprs}").strip()
                if trabajador is None:
                    trabajador = Trabajador(ccodprs=ccodprs, nombre=cnomprs)
                    db.add(trabajador)
                else:
                    if cnomprs and cnomprs != f"Operario {ccodprs}":
                        trabajador.nombre = cnomprs
                trabajadores_cache[ccodprs] = trabajador                
                # 4. Conexión
                conexion = conexiones_cache.get(ccodcnx)
                if conexion is None:
                    conexion = db.query(Conexion).filter_by(ccodcnx=ccodcnx).first()            
                direccion = str(_valor_o_none(row, "DIRECCION") or "").strip()
                categoria = str(_valor_o_none(row, "CATEGORIA") or "").strip()
                condicion = str(_valor_o_none(row, "CONDICION") or "").strip()
                utm_x = _to_float(_valor_o_none(row, "CUTMX"))
                utm_y = _to_float(_valor_o_none(row, "CUTMY"))
                cnromdr = str(_valor_o_none(row, "CNROMDR") or "").strip()
                if conexion is None:
                    conexion = Conexion(
                        ccodcnx=ccodcnx,
                        cnromdr=cnromdr if cnromdr else None,
                        zona=zona,
                        ruta=ruta,
                        direccion=direccion if direccion else None,
                        categoria=categoria if categoria else None,
                        condicion=condicion if condicion else None,
                        utm_x=utm_x,
                        utm_y=utm_y
                    )
                    db.add(conexion)
                else:
                    if direccion and not conexion.direccion:
                        conexion.direccion = direccion
                    if categoria and not conexion.categoria:
                        conexion.categoria = categoria
                    if condicion and not conexion.condicion:
                        conexion.condicion = condicion
                    if utm_x and not conexion.utm_x:
                        conexion.utm_x = utm_x
                    if utm_y and not conexion.utm_y:
                        conexion.utm_y = utm_y
                    if cnromdr and not conexion.cnromdr:
                        conexion.cnromdr = cnromdr                        
                conexiones_cache[ccodcnx] = conexion                
                # 5. Actividad + Detalle
                dlectur = limpiar_fecha(_valor_o_none(row, "DLECTUR"))
                if dlectur is None:
                    raise ValueError("DLECTUR vacío o con formato inválido")                    
                act_id = f"ACT-{ccodcnx}-{dlectur.strftime('%Y%m%d%H%M')}"                
                # Validación optimizada con el set en memoria
                if act_id in actividades_existentes:
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
                    cmetfac=cmetfac,
                )                
                cperfac = str(_valor_o_none(row, "CPERFAC") or "").strip()
                raw_cimplec = _valor_o_none(row, "CIMPLEC")
                raw_cobsmdr = _valor_o_none(row, "COBSMDR")
                cimplec_val = str(int(float(raw_cimplec))) if raw_cimplec is not None and not pd.isna(raw_cimplec) else None
                cobsmdr_val = str(int(float(raw_cobsmdr))) if raw_cobsmdr is not None and not pd.isna(raw_cobsmdr) else None
                detalle = ActividadLectura(
                    actividad_id=act_id,
                    dlectur=dlectur,
                    nlecact=_to_int(_valor_o_none(row, "NLECACT"), default=0),
                    cimplec=cimplec_val,
                    cobsmdr=cobsmdr_val,
                    cperfac=cperfac if cperfac else None,
                    cgpslat=lat,
                    cgpslon=lon,
                    cutmx=_to_float(_valor_o_none(row, "CUTMX")),
                    cutmy=_to_float(_valor_o_none(row, "CUTMY")),
                )
                
                db.add_all([actividad, detalle])
                actividades_existentes.add(act_id)
                registros_procesados += 1

                # Liberar memoria intermedia cada 1,000 registros
                if registros_procesados % 1000 == 0:
                    db.flush()
                
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
        "total_filas_excel": len(filas),
    }