from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import date
from app.model import (
    Actividad, 
    ActividadLectura, 
    Conexion, 
    CatalogoImpedimento, 
    CatalogoObservacion,
    Impedimento,
    Observacion
)

class MapasService:

    @staticmethod
    def obtener_discrepancias_espaciales(
        db: Session, 
        fecha_inicio: date = None, 
        fecha_fin: date = None, 
        zona_id: str = None,
        cmetfac: str = None
    ) -> dict:
        """
        Retorna las actividades con desfase espacial (>50m) para dibujar vectores/puntos
        de comparativa: Ubicación Teórica (Predio) vs Ubicación Real (Lector en campo).
        """
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
            if det and det.cgpslat and det.cgpslon:
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
                    "resultado": act.resultado,
                    "cmetfac": act.cmetfac,
                    "cseccli": None
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

        # Validaciones individuales robustas para SQL (evita problemas con NULL)
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
            lat = det.cgpslat or getattr(cnx, 'latitud_real', None)
            lng = det.cgpslon or getattr(cnx, 'longitud_real', None)
            
            if lat and lng:
                motivos = []
                
                # Formatear el texto únicamente para los códigos presentes y válidos
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
                        "cseccli": None
                    })

        return {
            "total_puntos_calor": len(puntos_calor),
            "puntos": puntos_calor
        }