import io
import math
from datetime import datetime, time
import pandas as pd
import utm
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.model import (
    Zona, Ruta, Trabajador, Conexion, 
    Actividad, ActividadLectura, RegistroCarga
)
from app.services.geo_utils import limpiar_fecha

COLUMNAS_OBLIGATORIAS = {"CCODCNX", "CMETFAC", "DISTRITO", "DLECTUR"}


def _valor_o_none(row: dict, columna: str):
    valor = row.get(columna)
    if valor is None or pd.isna(valor):
        return None
    return valor


def _to_int(valor, default=0):
    if valor is None or pd.isna(valor):
        return default
    try:
        return int(float(valor))
    except (ValueError, TypeError):
        return default


def _to_float(valor):
    if valor is None or pd.isna(valor):
        return None
    try:
        val = float(valor)
        if math.isnan(val) or math.isinf(val):
            return None
        return val
    except (ValueError, TypeError):
        return None


def convertir_utm_a_latlon(utm_x: float, utm_y: float, zona_num: int = 19, northern: bool = False):
    if not utm_x or not utm_y:
        return None, None
    try:
        lat, lon = utm.to_latlon(utm_x, utm_y, zona_num, northern=northern)
        return float(lat), float(lon)  # Convierte numpy.float64 a float nativo
    except Exception:
        return None, None


def construir_datetime_completo(raw_fecha, raw_h, raw_m, raw_s) -> datetime:
    fecha_base = limpiar_fecha(raw_fecha)
    if not fecha_base:
        return None
    h = _to_int(raw_h, default=0)
    m = _to_int(raw_m, default=0)
    s = _to_int(raw_s, default=0)
    h = min(max(h, 0), 23)
    m = min(max(m, 0), 59)
    s = min(max(s, 0), 59)
    return datetime.combine(fecha_base.date(), time(hour=h, minute=m, second=s))

def calcular_distancia_utm(x1: float, y1: float, x2: float, y2: float) -> float:
    if None in (x1, y1, x2, y2):
        return None
    return float(round(math.sqrt((x1 - x2)**2 + (y1 - y2)**2), 2))


def normalizar_nombre(nombre_raw: str) -> str:
    if not nombre_raw:
        return ""    
    texto_sin_comas = str(nombre_raw).replace(",", " ")
    return " ".join(texto_sin_comas.strip().split())


def procesar_archivo_excel(
    contents: bytes, 
    filename: str, 
    proceso: str, 
    db: Session
) -> dict: 
    try:
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error leyendo el archivo Excel: {e}")        
    df.columns = [str(col).upper().strip() for col in df.columns]    
    faltantes = COLUMNAS_OBLIGATORIAS - set(df.columns)
    if faltantes:
        raise HTTPException(
            status_code=400,
            detail=f"Faltan columnas obligatorias en el archivo: {sorted(list(faltantes))}"
        )        
    if df.empty:
        raise HTTPException(status_code=400, detail="El archivo Excel no contiene registros.")    
    log_carga = RegistroCarga(
        nombre_archivo=filename,
        tipo_archivo="TI",
        proceso=proceso,
        estado="En proceso",
        registros_insertados=0,
        registros_error=0,
        usuario_id=None 
    )
    db.add(log_carga)
    db.flush() 
    id_carga_actual = log_carga.id_carga
    filas = df.to_dict("records")
    zonas_keys = set()
    rutas_ids = set()
    trabajadores_ids = set()
    conexiones_ids = set()
    actividades_ids_excel = []
    for row in filas:
        ccodcnx = str(_valor_o_none(row, "CCODCNX") or "").split(".")[0].strip()
        ccodprs = str(_valor_o_none(row, "CCODPRS") or "").split(".")[0].strip().zfill(8)
        cmetfac = str(_valor_o_none(row, "CMETFAC") or "").split(".")[0].strip()
        distrito = str(_valor_o_none(row, "DISTRITO") or "VARIOS").strip().upper()
        cderule = str(_valor_o_none(row, "CDERULE") or "SIN_RUTA").strip()
        if distrito and cmetfac:
            zonas_keys.add(f"Z-{distrito[:3]}-{cmetfac}")
        if cderule:
            rutas_ids.add(cderule)
        if ccodprs and ccodprs != "00000000":
            trabajadores_ids.add(ccodprs)
        if ccodcnx:
            conexiones_ids.add(ccodcnx)
        dt_completo = construir_datetime_completo(
            _valor_o_none(row, "DLECTUR"),
            _valor_o_none(row, "HORA"),
            _valor_o_none(row, "MIN"),
            _valor_o_none(row, "SEGUNDO")
        )
        if ccodcnx and dt_completo:
            actividades_ids_excel.append(f"ACT-{ccodcnx}-{dt_completo.strftime('%Y%m%d%H%M%S')}")

    zonas_cache = {z.zona_id: z for z in db.query(Zona).filter(Zona.zona_id.in_(zonas_keys)).all()} if zonas_keys else {}
    rutas_cache = {r.ruta_id: r for r in db.query(Ruta).filter(Ruta.ruta_id.in_(rutas_ids)).all()} if rutas_ids else {}
    trabajadores_cache = {t.ccodprs: t for t in db.query(Trabajador).filter(Trabajador.ccodprs.in_(trabajadores_ids)).all()} if trabajadores_ids else {}
    conexiones_cache = {c.ccodcnx: c for c in db.query(Conexion).filter(Conexion.ccodcnx.in_(conexiones_ids)).all()} if conexiones_ids else {}
    actividades_existentes = set()
    if actividades_ids_excel:
        for i in range(0, len(actividades_ids_excel), 1000):
            chunk = actividades_ids_excel[i:i + 1000]
            existentes_chunk = db.query(Actividad.actividad_id).filter(Actividad.actividad_id.in_(chunk)).all()
            actividades_existentes.update(r[0] for r in existentes_chunk)
    registros_insertados = 0
    errores_filas = []    
    actividades_a_crear = []
    detalles_a_crear = []
    try:
        for idx, row in enumerate(filas):
            fila_excel = idx + 2
            try:
                ccodcnx = str(_valor_o_none(row, "CCODCNX") or "").split(".")[0].strip()
                ccodprs = str(_valor_o_none(row, "CCODPRS") or "").split(".")[0].strip().zfill(8)
                cmetfac = str(_valor_o_none(row, "CMETFAC") or "").split(".")[0].strip()
                distrito = str(_valor_o_none(row, "DISTRITO") or "VARIOS").strip().upper()
                cderule = str(_valor_o_none(row, "CDERULE") or "SIN_RUTA").strip()
                
                if not ccodcnx or ccodcnx.lower() == "nan":
                    raise ValueError("CCODCNX es obligatorio")
                if not ccodprs or ccodprs.lower() == "nan":
                    raise ValueError("CCODPRS es obligatorio")                                     
                zona_id = f"Z-{distrito[:3]}-{cmetfac}"
                zona = zonas_cache.get(zona_id)
                if not zona:
                    zona = Zona(zona_id=zona_id, distrito=distrito, cmetfac=cmetfac)
                    db.add(zona)
                    zonas_cache[zona_id] = zona                                
                ruta = rutas_cache.get(cderule)
                if not ruta:
                    ruta = Ruta(ruta_id=cderule)
                    db.add(ruta)
                    rutas_cache[cderule] = ruta                                
                trabajador = trabajadores_cache.get(ccodprs)
                raw_nombre = _valor_o_none(row, "CNOMPRS")
                cnomprs = normalizar_nombre(str(raw_nombre)) if raw_nombre else f"Trabajador {ccodprs}"
                if not trabajador:
                    trabajador = Trabajador(ccodprs=ccodprs, nombre=cnomprs)
                    db.add(trabajador)
                    trabajadores_cache[ccodprs] = trabajador
                else:
                    if cnomprs and cnomprs != f"Trabajador {ccodprs}":
                        trabajador.nombre = cnomprs
                conexion = conexiones_cache.get(ccodcnx)
                direccion = str(_valor_o_none(row, "DIRECCION") or "").strip() or None
                categoria = str(_valor_o_none(row, "CATEGORIA") or "").strip() or None
                condicion = str(_valor_o_none(row, "CONDICION") or "").strip() or None
                cnromdr = str(_valor_o_none(row, "CNROMDR") or "").strip() or None                
                utm_x_ref = _to_float(_valor_o_none(row, "UTM_X")) or _to_float(_valor_o_none(row, "CUTMX_REF"))
                utm_y_ref = _to_float(_valor_o_none(row, "UTM_Y")) or _to_float(_valor_o_none(row, "CUTMY_REF"))                                
                if not conexion:
                    conexion = Conexion(
                        ccodcnx=ccodcnx,
                        cnromdr=cnromdr,
                        zona_id=zona.zona_id,
                        ruta_id=ruta.ruta_id,
                        direccion=direccion,
                        categoria=categoria,
                        condicion=condicion,
                        utm_x=utm_x_ref,
                        utm_y=utm_y_ref
                    )
                    db.add(conexion)
                    conexiones_cache[ccodcnx] = conexion
                else:
                    if direccion: conexion.direccion = direccion
                    if categoria: conexion.categoria = categoria
                    if condicion: conexion.condicion = condicion
                    if cnromdr: conexion.cnromdr = cnromdr
                    if utm_x_ref and not conexion.utm_x: conexion.utm_x = utm_x_ref
                    if utm_y_ref and not conexion.utm_y: conexion.utm_y = utm_y_ref
                dlectur = construir_datetime_completo(
                    _valor_o_none(row, "DLECTUR"),
                    _valor_o_none(row, "HORA"),
                    _valor_o_none(row, "MIN"),
                    _valor_o_none(row, "SEGUNDO")
                )
                if not dlectur:
                    raise ValueError("Fecha u Hora inválida o vacía")                                    
                act_id = f"ACT-{ccodcnx}-{dlectur.strftime('%Y%m%d%H%M%S')}"
                if act_id in actividades_existentes:
                    errores_filas.append(f"Fila {fila_excel}: La actividad {act_id} ya existe.")
                    continue         
                cutmx_real = _to_float(_valor_o_none(row, "CUTMX"))
                cutmy_real = _to_float(_valor_o_none(row, "CUTMY"))                
                cgpslat = _to_float(_valor_o_none(row, "CGPSLAT"))
                cgpslon = _to_float(_valor_o_none(row, "CGPSLON"))                
                if (cgpslat is None or cgpslon is None) and (cutmx_real and cutmy_real):
                    cgpslat, cgpslon = convertir_utm_a_latlon(cutmx_real, cutmy_real, zona_num=19, northern=False)                
                distancia_m = None
                if cutmx_real and cutmy_real and conexion.utm_x and conexion.utm_y:
                    distancia_m = calcular_distancia_utm(
                        cutmx_real, cutmy_real, conexion.utm_x, conexion.utm_y
                    )            
                actividad = Actividad(
                    actividad_id=act_id,
                    id_carga=id_carga_actual, 
                    ccodcnx=ccodcnx,
                    ccodprs=ccodprs,
                    tipo_actividad=proceso,
                    fecha=dlectur.date(),
                    estado="Completado",
                    resultado="Fuera de Punto" if (distancia_m and distancia_m > 50) else "OK",
                    cmetfac=cmetfac,
                    distancia_metros=distancia_m
                )                
                cimplec = _to_int(_valor_o_none(row, "CIMPLEC"), default=None)
                cobsmdr = _to_int(_valor_o_none(row, "COBSMDR"), default=None)
                cperfac = str(_valor_o_none(row, "CPERFAC") or "").strip() or None                
                detalle = ActividadLectura(
                    actividad_id=act_id,
                    dlectur=dlectur,
                    nlecact=_to_int(_valor_o_none(row, "NLECACT"), default=None),
                    cimplec=str(cimplec) if cimplec is not None else None,
                    cobsmdr=str(cobsmdr) if cobsmdr is not None else None,
                    cperfac=cperfac,
                    cgpslat=cgpslat,
                    cgpslon=cgpslon,
                    cutmx=cutmx_real,
                    cutmy=cutmy_real
                )                
                actividades_a_crear.append(actividad)
                detalles_a_crear.append(detalle)
                actividades_existentes.add(act_id)
                registros_insertados += 1
                if len(actividades_a_crear) >= 2000:
                    db.add_all(actividades_a_crear)
                    db.add_all(detalles_a_crear)
                    db.flush()
                    actividades_a_crear.clear()
                    detalles_a_crear.clear()

            except Exception as e_fila:
                errores_filas.append(f"Fila {fila_excel}: {e_fila}")
                continue
        if actividades_a_crear:
            db.add_all(actividades_a_crear)
            db.add_all(detalles_a_crear)
            db.flush()
        registros_error = len(errores_filas)
        if registros_insertados == 0 and registros_error > 0:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"No se insertó ningún registro. Muestra de errores: {errores_filas[:5]}"
            )
        estado_carga = "Exitoso" if registros_error == 0 else "Con errores"
        log_carga.estado = estado_carga
        log_carga.registros_insertados = registros_insertados
        log_carga.registros_error = registros_error
        log_carga.detalle_errores = "\n".join(errores_filas[:50]) if errores_filas else None
        db.commit()
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error inesperado al procesar el archivo: {e}")

    return {
        "status": "success",
        "id_carga": id_carga_actual,
        "message": "Archivo procesado correctamente." if registros_error == 0 else f"Procesado con {registros_error} errores de fila.",
        "registros_insertados": registros_insertados,
        "registros_error": registros_error,
        "total_filas_excel": len(filas)
    }