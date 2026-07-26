from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.model import Trabajador, ResumenDiarioLector, Alerta, EvaluacionDesempeno

class PersonalService:

    @staticmethod
    def listar_trabajadores(db: Session, skip: int = 0, limit: int = 50) -> list:
        """Devuelve el directorio general del personal de campo con su último estado."""
        return db.query(Trabajador).offset(skip).limit(limit).all()

    @staticmethod
    def obtener_ficha_trabajador(db: Session, ccodprs: str) -> dict:
        """Obtiene la ficha individual detallada de un lector (asistencia, rutas, puntajes y alertas)."""
        trabajador = db.query(Trabajador).filter(Trabajador.ccodprs == ccodprs).first()
        if not trabajador:
            return None

        # Historial de asistencia / reportes diarios ordenados por fecha descendente
        resumenes = db.query(ResumenDiarioLector)\
            .filter(ResumenDiarioLector.ccodprs == ccodprs)\
            .order_by(desc(ResumenDiarioLector.fecha))\
            .limit(30)\
            .all()

        # Conteo de alertas pendientes asociadas al trabajador
        alertas_pendientes_count = db.query(Alerta)\
            .filter(Alerta.ccodprs == ccodprs, Alerta.estado_alerta == "Pendiente")\
            .count()

        return {
            "ccodprs": trabajador.ccodprs,
            "nombre": trabajador.nombre,
            "telefono": trabajador.telefono,
            "ultimo_puntaje": trabajador.ultimo_puntaje,
            "ultima_clasificacion": trabajador.ultima_clasificacion,
            "fecha_ultima_evaluacion": trabajador.fecha_ultima_evaluacion,
            "total_alertas_pendientes": alertas_pendientes_count,
            "historial_asistencia": resumenes
        }