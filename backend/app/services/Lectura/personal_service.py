from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.model import Trabajador, ResumenDiarioLector, Alerta, EvaluacionDesempeno, Actividad
from datetime import date
from fastapi import HTTPException

class PersonalService:

    @staticmethod
    def listar_trabajadores(db: Session, skip: int = 0, limit: int = 50) -> list:
        return db.query(Trabajador).offset(skip).limit(limit).all()

    @staticmethod
    def calcular_y_actualizar_desempeno(db: Session, ccodprs: str = None, fecha_eval: date = None):
        """
        Calcula y registra la evaluación de desempeño POR DÍA basada en los resúmenes diarios 
        del lector, alimentando la tabla historica 'evaluaciones_desempeno'.
        """
        try:
            # Si no se especifica una fecha, tomamos la fecha más reciente disponible en los resúmenes
            if not fecha_eval:
                ultima_fecha_reg = db.query(func.max(ResumenDiarioLector.fecha)).scalar()
                if not ultima_fecha_reg:
                    raise HTTPException(status_code=400, detail="No hay registros diarios de lectura para evaluar.")
                fecha_eval = ultima_fecha_reg

            # Consultar los resúmenes diarios para esa fecha
            query_resumenes = db.query(ResumenDiarioLector).filter(ResumenDiarioLector.fecha == fecha_eval)
            if ccodprs:
                query_resumenes = query_resumenes.filter(ResumenDiarioLector.ccodprs == ccodprs)
            
            resumenes = query_resumenes.all()
            if not resumenes:
                raise HTTPException(
                    status_code=404, 
                    detail=f"No se encontraron resúmenes diarios para la fecha {fecha_eval}."
                )

            actualizados = 0

            for r in resumenes:
                eficiencia_val = r.eficiencia or 0.0
                # Puntaje basado en la eficiencia del día (escala de 0 a 100)
                puntaje = round(float(eficiencia_val) * 100, 2)

                # Clasificación según los rangos del esquema
                if puntaje >= 95:
                    clasificacion = "Excelente"
                elif puntaje >= 85:
                    clasificacion = "Bueno"
                elif puntaje >= 70:
                    clasificacion = "Regular"
                else:
                    clasificacion = "Crítico"

                # 1. Buscar si ya existe una evaluación para este trabajador en esta fecha exacta
                eval_existente = db.query(EvaluacionDesempeno).filter_by(
                    ccodprs=r.ccodprs,
                    fecha=fecha_eval
                ).first()

                if eval_existente:
                    eval_existente.puntaje = puntaje
                    eval_existente.clasificacion = clasificacion
                    eval_existente.eficiencia = eficiencia_val
                else:
                    nueva_eval = EvaluacionDesempeno(
                        ccodprs=r.ccodprs,
                        fecha=fecha_eval,
                        puntaje=puntaje,
                        clasificacion=clasificacion,
                        eficiencia=eficiencia_val,
                        tendencia="Estable"
                    )
                    db.add(nueva_eval)

                # 2. Actualizar el snapshot del último puntaje en la tabla principal Trabajador
                trabajador = db.query(Trabajador).filter_by(ccodprs=r.ccodprs).first()
                if trabajador:
                    trabajador.ultimo_puntaje = puntaje
                    trabajador.ultima_clasificacion = clasificacion
                    trabajador.fecha_ultima_evaluacion = fecha_eval

                actualizados += 1

            db.commit()
            return {
                "status": "success",
                "fecha_evaluacion": str(fecha_eval),
                "registros_evaluados": actualizados,
                "mensaje": f"Se procesó el desempeño diario para {actualizados} trabajadores correctamente."
            }

        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Error interno al calcular desempeño: {str(e)}")

    @staticmethod
    def obtener_ficha_trabajador(db: Session, ccodprs: str) -> dict:
        trabajador = db.query(Trabajador).filter(Trabajador.ccodprs == ccodprs).first()
        if not trabajador:
            return None

        # 1. Historial de asistencia de los últimos 30 días
        resumenes = db.query(ResumenDiarioLector)\
            .filter(ResumenDiarioLector.ccodprs == ccodprs)\
            .order_by(desc(ResumenDiarioLector.fecha))\
            .limit(30)\
            .all()

        # 2. Buscar la última Ruta y Metfac asociada a sus actividades del Upload 1
        from app.model import Actividad, Conexion
        
        ultima_actividad_info = db.query(Conexion.ruta_id, Actividad.cmetfac)\
            .join(Conexion, Actividad.ccodcnx == Conexion.ccodcnx)\
            .filter(Actividad.ccodprs == ccodprs)\
            .order_by(desc(Actividad.fecha))\
            .first()

        ruta_actual = ultima_actividad_info.ruta_id if ultima_actividad_info else "No asignada"
        metfac_actual = ultima_actividad_info.cmetfac if ultima_actividad_info else "No asignada"

        # 3. Alertas pendientes asociadas
        alertas_pendientes_count = db.query(Alerta)\
            .filter(Alerta.ccodprs == ccodprs, Alerta.estado_alerta == "Pendiente")\
            .count()

        return {
            "ccodprs": trabajador.ccodprs,
            "nombre": trabajador.nombre,
            "telefono": trabajador.telefono,
            "ruta_actual": ruta_actual,      # Viene de Conexion.ruta_id
            "metfac_actual": metfac_actual,  # Viene de Actividad.cmetfac
            "ultimo_puntaje": trabajador.ultimo_puntaje,
            "ultima_clasificacion": trabajador.ultima_clasificacion,
            "fecha_ultima_evaluacion": str(trabajador.fecha_ultima_evaluacion) if trabajador.fecha_ultima_evaluacion else None,
            "total_alertas_pendientes": alertas_pendientes_count,
            "historial_asistencia": resumenes
        }