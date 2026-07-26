from sqlalchemy.orm import Session
from sqlalchemy import asc, or_, func
from datetime import date, datetime
from fastapi import HTTPException
from app.model import Actividad, ActividadLectura, Conexion

class MapasService:

    @staticmethod
    def _parsear_timestamp_desde_id(actividad_id: str, fecha_fallback: date) -> str:
        """Extrae la hora del ID si tiene el formato estándar (ej. ACT-603-20260630061628)"""
        try:
            partes = actividad_id.split("-")
            if len(partes) >= 3:
                s_val = partes[-1]
                if len(s_val) >= 14: # YYYYMMDDHHMMSS
                    dt = datetime.strptime(s_val[:14], "%Y%m%d%H%M%S")
                    return dt.isoformat()
        except Exception:
            pass
        return f"{fecha_fallback}T00:00:00"

    @staticmethod
    def obtener_recorrido_lector(db: Session, ccodprs: str, fecha: date) -> dict:
        actividades = db.query(Actividad, ActividadLectura, Conexion)\
            .join(Conexion, Actividad.ccodcnx == Conexion.ccodcnx)\
            .join(ActividadLectura, Actividad.actividad_id == ActividadLectura.actividad_id, isouter=True)\
            .filter(Actividad.ccodprs == ccodprs, Actividad.fecha == fecha)\
            .order_by(asc(Actividad.actividad_id))\
            .all()

        if not actividades:
            raise HTTPException(status_code=404, detail="No hay registros de ruta para este lector en la fecha indicada.")

        puntos = []
        for act, det, cnx in actividades:
            # Prioriza el GPS real del detalle, si no existe usa la ubicación de la conexión
            lat = (det.cgpslat if (det and hasattr(det, 'cgpslat')) else None) or cnx.latitud_real
            lng = (det.cgpslon if (det and hasattr(det, 'cgpslon')) else None) or cnx.longitud_real

            # Timestamp inteligente
            if act.hora_inicio:
                ts = act.hora_inicio.isoformat()
            else:
                ts = MapasService._parsear_timestamp_desde_id(act.actividad_id, fecha)

            if lat and lng:
                puntos.append({
                    "lat": lat,
                    "lng": lng,
                    "timestamp": ts,
                    "ccodcnx": act.ccodcnx,
                    "resultado": act.resultado
                })

        return {
            "ccodprs": ccodprs,
            "fecha": str(fecha),
            "total_puntos": len(puntos),
            "coordenadas": puntos
        }

    @staticmethod
    def obtener_discrepancias_espaciales(db: Session, fecha_inicio: date = None, fecha_fin: date = None, zona_id: str = None) -> dict:
        query = db.query(Actividad, ActividadLectura, Conexion)\
            .join(ActividadLectura, Actividad.actividad_id == ActividadLectura.actividad_id)\
            .join(Conexion, Actividad.ccodcnx == Conexion.ccodcnx)\
            .filter(Actividad.distancia_metros > 50.0)

        if fecha_inicio and fecha_fin:
            query = query.filter(Actividad.fecha.between(fecha_inicio, fecha_fin))
        
        if zona_id:
            query = query.filter(Conexion.zona_id == zona_id)

        resultados = query.limit(500).all()

        marcadores_desfase = []
        for act, det, cnx in resultados:
            if det and det.cgpslat and det.cgpslon:
                # Verificamos si la conexión tiene latitud/longitud o si debemos buscar alternativas
                lat_teorica = getattr(cnx, 'latitud_real', None)
                lng_teorica = getattr(cnx, 'longitud_real', None)

                marcadores_desfase.append({
                    "ccodcnx": cnx.ccodcnx,
                    "distancia_metros": round(act.distancia_metros, 2) if act.distancia_metros else 0.0,
                    "teorica": {
                        "lat": lat_teorica,
                        "lng": lng_teorica
                    },
                    "real": {
                        "lat": det.cgpslat,
                        "lng": det.cgpslon
                    },
                    "trabajador_id": act.ccodprs,
                    "resultado": act.resultado
                })

        return {
            "total_discrepancias": len(marcadores_desfase),
            "elementos": marcadores_desfase
        }

    @staticmethod
    def obtener_heatmap_impedimentos(db: Session, fecha_inicio: date = None, fecha_fin: date = None, zona_id: str = None) -> dict:
        query = db.query(Actividad, ActividadLectura, Conexion)\
            .join(ActividadLectura, Actividad.actividad_id == ActividadLectura.actividad_id, isouter=True)\
            .join(Conexion, Actividad.ccodcnx == Conexion.ccodcnx)\
            .filter(
                or_(
                    func.lower(Actividad.resultado).contains("impedimento"),
                    func.lower(Actividad.resultado).contains("cerrado"),
                    func.lower(Actividad.resultado).contains("inaccesible"),
                    func.lower(Actividad.resultado).contains("fuera de punto")
                )
            )

        if fecha_inicio and fecha_fin:
            query = query.filter(Actividad.fecha.between(fecha_inicio, fecha_fin))
        
        if zona_id:
            query = query.filter(Conexion.zona_id == zona_id)

        resultados = query.limit(1000).all()

        puntos_calor = []
        for act, det, cnx in resultados:
            lat = (det.cgpslat if (det and hasattr(det, 'cgpslat')) else None) or cnx.latitud_real
            lng = (det.cgpslon if (det and hasattr(det, 'cgpslon')) else None) or cnx.longitud_real
            
            if lat and lng:
                puntos_calor.append({
                    "lat": lat,
                    "lng": lng,
                    "peso": 1.0,
                    "motivo": act.resultado
                })

        return {
            "total_puntos_calor": len(puntos_calor),
            "puntos": puntos_calor
        }