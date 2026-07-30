from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import date
from app.model import (
    Actividad, ActividadLectura, Conexion, 
    CatalogoImpedimento, CatalogoObservacion, Impedimento, Observacion
)

class MapasService:

    @staticmethod
    def _sanitizar_coordenada(lat, lng) -> tuple[float | None, float | None]:
        """
        Valida que latitud y longitud existan, sean convertibles a float y
        estén dentro de los límites geográficos reales de la Tierra.
        Descarta valores centinela como 9999999999 o 0.0.
        """
        if lat is None or lng is None:
            return None, None
        try:
            val_lat = float(lat)
            val_lng = float(lng)
            
            # Filtro de coordenadas no válidas / fuera del rango terrestre
            if not (-90.0 <= val_lat <= 90.0) or not (-180.0 <= val_lng <= 180.0):
                return None, None
            
            # Filtro opcional: si (0,0) es una coordenada inválida en tu contexto
            if val_lat == 0.0 and val_lng == 0.0:
                return None, None

            return val_lat, val_lng
        except (ValueError, TypeError):
            return None, None

    @staticmethod
    def obtener_discrepancias_espaciales(
        db: Session, 
        fecha_inicio: date = None, 
        fecha_fin: date = None, 
        zona_id: str = None,
        cmetfac: str = None
    ) -> dict:
        query = db.query(Actividad, ActividadLectura, Conexion)\
            .join(ActividadLectura, Actividad.actividad_id == ActividadLectura.actividad_id)\
            .join(Conexion, Actividad.ccodcnx == Conexion.ccodcnx)\
            .filter(Actividad.distancia_metros > 50.0)

        if fecha_inicio and fecha_fin:
            query = query.filter(Actividad.fecha.between(fecha_inicio, fecha_fin))        
        if zona_id:
            query = query.filter(Conexion.zona_id == zona_id)
        if cmetfac:
            query = query.filter(Actividad.cmetfac == cmetfac)

        resultados = query.limit(500).all()
        marcadores_desfase = []

        for act, det, cnx in resultados:
            if not det:
                continue

            # Validar coordenada REAL (GPS capturado)
            lat_real, lng_real = MapasService._sanitizar_coordenada(det.cgpslat, det.cgpslon)
            if lat_real is None or lng_real is None:
                continue  # Descartar si el GPS es invalido (ej: 9999999999)

            # Validar coordenada TEÓRICA (Base de conexiones)
            raw_lat_teo = getattr(cnx, 'latitud_real', getattr(cnx, 'CUTMY', None))
            raw_lng_teo = getattr(cnx, 'longitud_real', getattr(cnx, 'CUTMX', None))
            lat_teo, lng_teo = MapasService._sanitizar_coordenada(raw_lat_teo, raw_lng_teo)

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

    @staticmethod
    def obtener_heatmap_impedimentos(
        db: Session, 
        fecha_inicio: date = None, 
        fecha_fin: date = None, 
        zona_id: str = None,
        cmetfac: str = None
    ) -> dict:
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

        if fecha_inicio and fecha_fin:
            query = query.filter(Actividad.fecha.between(fecha_inicio, fecha_fin))
        if zona_id:
            query = query.filter(Conexion.zona_id == zona_id)
        if cmetfac:
            query = query.filter(Actividad.cmetfac == cmetfac)

        resultados = query.limit(1000).all()
        puntos_calor = []

        for det, act, cnx, desc_imp, desc_obs in resultados:
            # Intentar obtener la coordenada real del GPS primero
            lat, lng = MapasService._sanitizar_coordenada(det.cgpslat, det.cgpslon)

            # Si el GPS del detalle no es válido, usar la coordenada teórica como respaldo
            if lat is None or lng is None:
                raw_lat_teo = getattr(cnx, 'latitud_real', getattr(cnx, 'CUTMY', None))
                raw_lng_teo = getattr(cnx, 'longitud_real', getattr(cnx, 'CUTMX', None))
                lat, lng = MapasService._sanitizar_coordenada(raw_lat_teo, raw_lng_teo)

            # Si ni el GPS ni la teórica son válidas, omitimos este punto de calor
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