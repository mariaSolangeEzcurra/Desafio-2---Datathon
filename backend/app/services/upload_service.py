import io
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from datetime import date, datetime

from app.model import (
    Zona, Ruta, Conexion, Trabajador, Actividad, ActividadLectura,
    Impedimento, Observacion, CatalogoImpedimento, CatalogoObservacion, RegistroCarga
)
from app.services.geo_utils import (
    limpiar_coordenada, distancia_metros, limpiar_fecha, 
    CODIGOS_VACIOS, GAP_MAXIMO_VALIDO_MIN, RADIO_TOLERANCIA_METROS
)

def procesar_archivo_excel(contents: bytes, filename: str, proceso: str, db: Session) -> dict:
    df = pd.read_excel(io.BytesIO(contents))
    df.columns = [col.upper().strip() for col in df.columns]

    columnas_requeridas = ['CCODCNX', 'CCODPRS', 'DISTRITO', 'CMETFAC', 'NLECACT', 'DLECTUR']
    for col in columnas_requeridas:
        if col not in df.columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Falta la columna mandatoria en el archivo Excel: {col}"
            )

    total_filas_excel = len(df)
    registros_procesados = 0
    cache_ultima_lectura: dict[tuple[str, date], datetime] = {}

    for index, row in df.iterrows():
        ccodcnx_str = str(row['CCODCNX']).split('.')[0].strip()
        ccodprs_str = str(row['CCODPRS']).split('.')[0].strip()
        cmetfac_str = str(row['CMETFAC']).split('.')[0].strip()
        distrito_txt = str(row['DISTRITO']).strip().upper()

        lat = limpiar_coordenada(row.get('CGPSLAT'), 'lat')
        lon = limpiar_coordenada(row.get('CGPSLON'), 'lon')
        alt_raw = row.get('CGPSALT')
        alt = float(alt_raw) if pd.notna(alt_raw) and str(alt_raw).strip() not in ("", "9999", "0") else None

        # 1. ZONA
        zona_id_gen = f"Z-{distrito_txt[:3]}-{cmetfac_str}"
        zona = db.query(Zona).filter_by(zona_id=zona_id_gen).first()
        if not zona:
            zona = Zona(zona_id=zona_id_gen, distrito=distrito_txt, cmetfac=cmetfac_str, zona_operativa="Metropolitana")
            db.add(zona)
            db.flush()

        # 2. RUTA
        cderule_val = str(row.get('CDERULE')).strip() if pd.notna(row.get('CDERULE')) else "SIN_RUTA"
        ruta = db.query(Ruta).filter_by(ruta_id=cderule_val).first()
        if not ruta:
            ruta = Ruta(ruta_id=cderule_val)
            db.add(ruta)
            db.flush()

        # 3. TRABAJADOR
        trabajador = db.query(Trabajador).filter_by(ccodprs=ccodprs_str).first()
        if not trabajador:
            trabajador = Trabajador(ccodprs=ccodprs_str, nombre=f"Operario {ccodprs_str}", proceso_actual=proceso)
            db.add(trabajador)
        else:
            trabajador.proceso_actual = proceso
        db.flush()

        # 4. CONEXIÓN
        conexion = db.query(Conexion).filter_by(ccodcnx=ccodcnx_str).first()
        if not conexion:
            conexion = Conexion(ccodcnx=ccodcnx_str, zona_id=zona_id_gen, ruta_id=cderule_val, estado_servicio="Activo")
            db.add(conexion)
            db.flush()

        # 5. ACTIVIDAD
        fecha_hora_lectura = limpiar_fecha(row.get('DLECTUR'))
        actividad_id_gen = f"ACT-{ccodcnx_str}-{fecha_hora_lectura.strftime('%Y%m%d%H%M')}"
        actividad_existente = db.query(Actividad).filter_by(actividad_id=actividad_id_gen).first()

        if not actividad_existente:
            cimplec_val = str(row.get('CIMPLEC')).split('.')[0].strip() if pd.notna(row.get('CIMPLEC')) else "00"
            if cimplec_val in CODIGOS_VACIOS: cimplec_val = "00"
            
            estado_act = "Inconcluso" if cimplec_val != "00" else "Completado"
            
            dist = distancia_metros(lat, lon, conexion.latitud_real or 0, conexion.longitud_real or 0)
            res_act = "Fuera de Radio" if dist > RADIO_TOLERANCIA_METROS else "OK"

            nueva_actividad = Actividad(
                actividad_id=actividad_id_gen, ccodcnx=ccodcnx_str, ccodprs=ccodprs_str,
                tipo_actividad=f"{'Lectura' if 'lectura' in proceso.lower() else 'Corte'} Comercial",
                fecha=fecha_hora_lectura.date(), hora_inicio=fecha_hora_lectura, hora_fin=fecha_hora_lectura,
                estado=estado_act, resultado=res_act
            )
            db.add(nueva_actividad)

            # 6. DETALLE, IMPEDIMENTOS Y OBSERVACIONES
            if "lectura" in proceso.lower():
                detalle = ActividadLectura(actividad_id=actividad_id_gen, dlectur=fecha_hora_lectura, 
                                           nlecact=int(float(row['NLECACT'])) if pd.notna(row.get('NLECACT')) else 0,
                                           cimplec=cimplec_val, cobsmdr=str(row.get('COBSMDR')).split('.')[0].strip() if pd.notna(row.get('COBSMDR')) else "00",
                                           cgpsalt=alt, cgpslat=lat, cgpslon=lon)
                db.add(detalle)
            
            registros_procesados += 1

    # REGISTRO DE AUDITORÍA
    nueva_carga = RegistroCarga(
        nombre_archivo=filename,
        proceso=proceso,
        registros_insertados=registros_procesados
    )
    db.add(nueva_carga)
    db.commit()

    return {
        "status": "success",
        "message": f"Procesado correctamente. {registros_procesados} nuevos registros.",
        "registros_insertados": registros_procesados,
        "total_filas_excel": total_filas_excel
    }