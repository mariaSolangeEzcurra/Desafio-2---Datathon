from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import date, timedelta
from typing import Optional
from app.model import (
    Actividad, ActividadLectura, Conexion, 
    CatalogoImpedimento, CatalogoObservacion, Impedimento, Observacion
)

class MapasService:

    @staticmethod
    def _calcular_fechas_por_periodo(periodo: Optional[str], fecha_inicio: Optional[date] = None, fecha_fin: Optional[date] = None):
        if fecha_inicio and fecha_fin:
            return fecha_inicio, fecha_fin
            
        hoy = date.today()
        if periodo == "hoy":
            return hoy, hoy
        elif periodo == "semana":
            return hoy - timedelta(days=7), hoy
        elif periodo == "mes":
            return hoy - timedelta(days=30), hoy
        elif periodo == "3meses":
            return hoy - timedelta(days=90), hoy
            
        return None, None

    @staticmethod
    def _sanitizar_coordenada(lat, lng) -> tuple[float | None, float | None]:      
        if lat is None or lng is None:
            return None, None
        try:
            val_lat = float(lat)
            val_lng = float(lng)
            
            if not (-90.0 <= val_lat <= 90.0) or not (-180.0 <= val_lng <= 180.0):
                return None, None
            
            if val_lat == 0.0 and val_lng == 0.0:
                return None, None

            return val_lat, val_lng
        except (ValueError, TypeError):
            return None, None

    @classmethod
    def obtener_discrepancias_espaciales(
        cls, 
        db: Session, 
        fecha_inicio: Optional[date] = None, 
        fecha_fin: Optional[date] = None, 
        zona_id: Optional[str] = None,
        cmetfac: Optional[str] = None,
        periodo: Optional[str] = None
    ) -> dict:
        f_inicio, f_fin = cls._calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)

        query = db.query(Actividad, ActividadLectura, Conexion)\
            .join(ActividadLectura, Actividad.actividad_id == ActividadLectura.actividad_id)\
            .join(Conexion, Actividad.ccodcnx == Conexion.ccodcnx)\
            .filter(Actividad.distancia_metros > 50.0)

        if f_inicio and f_fin:
            query = query.filter(Actividad.fecha.between(f_inicio, f_fin))        
        if zona_id:
            query = query.filter(Conexion.zona_id == zona_id)
        if cmetfac:
            query = query.filter(Actividad.cmetfac == cmetfac)

        resultados = query.limit(500).all()
        marcadores_desfase = []

        for act, det, cnx in resultados:
            if not det:
                continue
            lat_real, lng_real = cls._sanitizar_coordenada(det.cgpslat, det.cgpslon)
            if lat_real is None or lng_real is None:
                continue 
            raw_lat_teo = getattr(cnx, 'latitud_real', getattr(cnx, 'CUTMY', None))
            raw_lng_teo = getattr(cnx, 'longitud_real', getattr(cnx, 'CUTMX', None))
            lat_teo, lng_teo = cls._sanitizar_coordenada(raw_lat_teo, raw_lng_teo)

            marcadores_desfase.append({
                "ccodcnx": cnx.ccodcnx,
                "distancia_metros": round(float(act.distancia_metros), 2) if act.distancia_metros else 0.0,
                "teorica": {
                    "lat": lat_teo,
                    "lng": lng_teo
                },
                "real": {
                    "lat": lat_real,
                    "lng": lng_real
                },
                "trabajador_id": act.ccodprs,
                "resultado": act.resultado,
                "cmetfac": act.cmetfac,
                "cseccli": getattr(act, 'cseccli', None)
            })

        return {
            "total_discrepancias": len(marcadores_desfase),
            "elementos": marcadores_desfase
        }

    @classmethod
    def obtener_heatmap_impedimentos(
        cls, 
        db: Session, 
        fecha_inicio: Optional[date] = None, 
        fecha_fin: Optional[date] = None, 
        zona_id: Optional[str] = None,
        cmetfac: Optional[str] = None,
        periodo: Optional[str] = None
    ) -> dict:
        f_inicio, f_fin = cls._calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)

        codigos_invalidos = ["0", "00", "000", ""]
        condicion_impedimento = and_(
            ActividadLectura.cimplec.isnot(None),
            ActividadLectura.cimplec.notin_(codigos_invalidos)
        )    
        condicion_observacion = and_(
            ActividadLectura.cobsmdr.isnot(None),
            ActividadLectura.cobsmdr.notin_(codigos_invalidos)
        )
        query = db.query(
            ActividadLectura, 
            Actividad, 
            Conexion,
            CatalogoImpedimento.descripcion.label("desc_impedimento"),
            CatalogoObservacion.descripcion.label("desc_observacion")
        )\
        .join(Actividad, ActividadLectura.actividad_id == Actividad.actividad_id)\
        .join(Conexion, Actividad.ccodcnx == Conexion.ccodcnx)\
        .outerjoin(CatalogoImpedimento, ActividadLectura.cimplec == CatalogoImpedimento.codigo)\
        .outerjoin(CatalogoObservacion, ActividadLectura.cobsmdr == CatalogoObservacion.codigo)\
        .filter(or_(condicion_impedimento, condicion_observacion))

        if f_inicio and f_fin:
            query = query.filter(Actividad.fecha.between(f_inicio, f_fin))
        if zona_id:
            query = query.filter(Conexion.zona_id == zona_id)
        if cmetfac:
            query = query.filter(Actividad.cmetfac == cmetfac)

        resultados = query.limit(1000).all()
        puntos_calor = []

        for det, act, cnx, desc_imp, desc_obs in resultados:
            lat, lng = cls._sanitizar_coordenada(det.cgpslat, det.cgpslon)
            if lat is None or lng is None:
                raw_lat_teo = getattr(cnx, 'latitud_real', getattr(cnx, 'CUTMY', None))
                raw_lng_teo = getattr(cnx, 'longitud_real', getattr(cnx, 'CUTMX', None))
                lat, lng = cls._sanitizar_coordenada(raw_lat_teo, raw_lng_teo)

            if lat is None or lng is None:
                continue

            motivos = []            
            if det.cimplec and str(det.cimplec).strip() not in codigos_invalidos:
                desc = desc_imp if desc_imp else "Sin descripción en catálogo"
                motivos.append(f"Impedimento {det.cimplec}: {desc}")
            if det.cobsmdr and str(det.cobsmdr).strip() not in codigos_invalidos:
                desc = desc_obs if desc_obs else "Sin descripción en catálogo"
                motivos.append(f"Observación {det.cobsmdr}: {desc}")

            if motivos:
                puntos_calor.append({
                    "lat": lat,
                    "lng": lng,
                    "peso": 1.0,
                    "motivo": " | ".join(motivos),
                    "codigo_impedimento": det.cimplec if (det.cimplec and str(det.cimplec).strip() not in codigos_invalidos) else None,
                    "codigo_observacion": det.cobsmdr if (det.cobsmdr and str(det.cobsmdr).strip() not in codigos_invalidos) else None,
                    "ccodcnx": act.ccodcnx,
                    "trabajador_id": act.ccodprs,
                    "cmetfac": act.cmetfac,
                    "cseccli": getattr(act, 'cseccli', None)
                })

        return {
            "total_puntos_calor": len(puntos_calor),
            "puntos": puntos_calor
        }