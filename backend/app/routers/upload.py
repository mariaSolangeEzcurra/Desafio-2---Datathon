from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from math import radians, sin, cos, sqrt, atan2
import pandas as pd
import io

from app.database import get_db
from app.model import (
    Zona, Ruta, Conexion, Trabajador, Actividad, ActividadLectura,
    Impedimento, Observacion, CatalogoImpedimento, CatalogoObservacion
)

router = APIRouter(
    prefix="/api",
    tags=["Carga de Archivos"]
)

# Configuración base para validación en Arequipa
RADIO_TOLERANCIA_METROS = 100.0
GAP_MAXIMO_VALIDO_MIN = 60
LAT_MIN, LAT_MAX = -18.0, -15.0
LON_MIN, LON_MAX = -73.0, -70.0
CODIGOS_VACIOS = ("0", "00", "0.0", "00.0", "")

def limpiar_coordenada(valor, tipo: str) -> float | None:
    if pd.isna(valor):
        return None
    val_str = str(valor).strip().replace(" ", "").replace(".", "")
    if "9999" in val_str or val_str == "" or val_str == "0":
        return None
    negativo = val_str.startswith("-")
    solo_digitos = "".join(c for c in val_str if c.isdigit())
    if not solo_digitos:
        return None
    try:
        entero = solo_digitos[:2]
        decimal = solo_digitos[2:]
        if not decimal:
            return None
        coordenada = float(f"{entero}.{decimal}")
        if negativo:
            coordenada = -coordenada
        if tipo == "lat" and not (LAT_MIN <= coordenada <= LAT_MAX):
            return None
        if tipo == "lon" and not (LON_MIN <= coordenada <= LON_MAX):
            return None
        return coordenada
    except ValueError:
        return None

def distancia_metros(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lon2 - lon1)
    a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2) ** 2
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))

def limpiar_fecha(valor) -> datetime:
    if pd.isna(valor):
        return datetime.now()
    val_str = str(valor).strip()
    try:
        return datetime.strptime(val_str, "%m/%d/%Y, %H:%M:%S")
    except ValueError:
        try:
            return datetime.fromisoformat(val_str)
        except ValueError:
            try:
                return pd.to_datetime(valor).to_pydatetime()
            except Exception:
                return datetime.now()

@router.post("/upload-excel", status_code=status.HTTP_201_CREATED)
async def upload_excel(
    file: UploadFile = File(...),
    proceso: str = Form(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de archivo no soportado. Debe ser .xlsx o .xls"
        )

    try:
        contents = await file.read()
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
            zona_id_generado = f"Z-{distrito_txt[:3]}-{cmetfac_str}"
            zona = db.query(Zona).filter_by(zona_id=zona_id_generado).first()
            if not zona:
                zona = Zona(zona_id=zona_id_generado, Distrito=distrito_txt, cMetFac=cmetfac_str, zona_operativa="Zona Metropolitana", cuadrante="Por Definir")
                db.add(zona)

            # 2. RUTA
            cderule_val = str(row.get('CDERULE')).strip() if pd.notna(row.get('CDERULE')) else "SIN_RUTA"
            ruta = db.query(Ruta).filter_by(ruta_id=cderule_val).first()
            if not ruta:
                ruta = Ruta(ruta_id=cderule_val)
                db.add(ruta)

            # 3. TRABAJADOR
            trabajador = db.query(Trabajador).filter_by(cCodPrs=ccodprs_str).first()
            if not trabajador:
                trabajador = Trabajador(cCodPrs=ccodprs_str, nombre=f"Operario {ccodprs_str}", distrito_base=distrito_txt, supervisor="Supervisor SEDAPAR", proceso_actual=proceso)
                db.add(trabajador)
            else:
                trabajador.proceso_actual = proceso

            # 4. CONEXIÓN
            conexion = db.query(Conexion).filter_by(cCodCnx=ccodcnx_str).first()
            cnromdr_val = str(row.get('CNROMDR')).split('.')[0].strip() if pd.notna(row.get('CNROMDR')) else None
            if not conexion:
                conexion = Conexion(cCodCnx=ccodcnx_str, cNroMdr=cnromdr_val, zona_id=zona_id_generado, ruta_id=cderule_val, direccion_ref="Creado por Carga Masiva", tipo_conexion="Medido", estado_servicio="Activo")
                db.add(conexion)

            # 5. ACTIVIDAD
            fecha_hora_lectura = limpiar_fecha(row.get('DLECTUR'))
            fecha_actividad = fecha_hora_lectura.date()
            actividad_id_generado = f"ACT-{ccodcnx_str}-{fecha_hora_lectura.strftime('%Y%m%d%H%M')}"
            actividad_existente = db.query(Actividad).filter_by(actividad_id=actividad_id_generado).first()

            if not actividad_existente:
                cimplec_val = str(row.get('CIMPLEC')).split('.')[0].strip() if pd.notna(row.get('CIMPLEC')) else "00"
                if cimplec_val in CODIGOS_VACIOS:
                    cimplec_val = "00"
                
                es_inconcluso = cimplec_val != "00"
                estado_actividad = "Inconcluso" if es_inconcluso else "Completado"

                # Tiempos
                key = (ccodprs_str, fecha_actividad)
                ultima_lectura = cache_ultima_lectura.get(key) or db.query(func.max(Actividad.hora_fin)).filter(Actividad.cCodPrs == ccodprs_str, Actividad.fecha == fecha_actividad).scalar()
                duracion_min = None
                hora_inicio = fecha_hora_lectura
                if ultima_lectura and ultima_lectura < fecha_hora_lectura:
                    gap_min = (fecha_hora_lectura - ultima_lectura).total_seconds() / 60
                    if 0 < gap_min <= GAP_MAXIMO_VALIDO_MIN:
                        duracion_min = round(gap_min, 2)
                        hora_inicio = ultima_lectura
                cache_ultima_lectura[key] = fecha_hora_lectura

                if lat is None or lon is None:
                    resultado_actividad = "Sin GPS"
                elif conexion.latitud_real is None or conexion.longitud_real is None:
                    resultado_actividad = "OK" 
                else:
                    dist = distancia_metros(lat, lon, conexion.latitud_real, conexion.longitud_real)
                    resultado_actividad = "Fuera de Radio" if dist > RADIO_TOLERANCIA_METROS else "OK"

                nueva_actividad = Actividad(
                    actividad_id=actividad_id_generado, cCodCnx=ccodcnx_str, cCodPrs=ccodprs_str,
                    tipo_actividad=f"{proceso} Comercial", fecha=fecha_actividad, hora_inicio=hora_inicio,
                    hora_fin=fecha_hora_lectura, duracion_min=duracion_min, estado=estado_actividad, resultado=resultado_actividad
                )
                db.add(nueva_actividad)

                # 6. DETALLE DE LECTURA
                if proceso == "Lectura":
                    nlecact_val = int(float(row['NLECACT'])) if pd.notna(row.get('NLECACT')) else 0
                    cobsmdr_val = str(row.get('COBSMDR')).split('.')[0].strip() if pd.notna(row.get('COBSMDR')) else "00"
                    if cobsmdr_val in CODIGOS_VACIOS:
                        cobsmdr_val = "00"

                    detalle_lectura = ActividadLectura(
                        actividad_id=actividad_id_generado, dLectur=fecha_hora_lectura, nLecAct=nlecact_val,
                        cImpLec=cimplec_val, cObsMdr=cobsmdr_val, cGPSAlt=alt, cGPSLat=lat, cGPSLon=lon
                    )
                    db.add(detalle_lectura)

                    # 7. IMPEDIMENTOS
                    if es_inconcluso:
                        catalogo_imp = db.query(CatalogoImpedimento).filter_by(codigo=cimplec_val).first()
                        descripcion_imp = catalogo_imp.descripcion if catalogo_imp else f"Impedimento Código {cimplec_val}"
                        categoria_imp = catalogo_imp.categoria if catalogo_imp else "Operativo"

                        nuevo_impedimento = Impedimento(
                            impedimento_id=f"IMP-{actividad_id_generado}", actividad_id=actividad_id_generado,
                            cImpLec=cimplec_val, categoria=categoria_imp, descripcion=descripcion_imp, latitud=lat, longitud=lon
                        )
                        db.add(nuevo_impedimento)

                    # 8. OBSERVACIONES
                    if cobsmdr_val != "00":
                        catalogo_obs = db.query(CatalogoObservacion).filter_by(codigo=cobsmdr_val).first()
                        descripcion_obs = catalogo_obs.descripcion if catalogo_obs else f"Observación Código {cobsmdr_val}"
                        
                        nueva_observacion = Observacion(
                            observacion_id=f"OBS-{actividad_id_generado}", actividad_id=actividad_id_generado,
                            codigo=cobsmdr_val, descripcion=descripcion_obs
                        )
                        db.add(nueva_observacion)

                registros_procesados += 1

        db.commit()
        return {
            "status": "success",
            "message": f"Archivo de {proceso} cargado con éxito. Datos base almacenados.",
            "registros_insertados": registros_procesados,
            "total_filas_excel": total_filas_excel
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error crítico: {str(e)}")