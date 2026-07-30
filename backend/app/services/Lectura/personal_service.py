from typing import Dict, List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc,and_, func, cast, Date, nullslast
from datetime import date, timedelta
from app.model import (Actividad,Alerta,Conexion,EvaluacionDesempeno,ResumenDiarioLector,Trabajador,)

class PersonalService:

    @staticmethod
    def _calcular_fechas_por_periodo(periodo: str, fecha: date = None):
        if fecha:
            return fecha, fecha        
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
    
    @classmethod
    def listar_trabajadores(
        cls, 
        db: Session, 
        skip: int = 0, 
        limit: int = 50, 
        fecha: Optional[date] = None,
        periodo: Optional[str] = None
    ) -> List[Trabajador]:        
        query = db.query(Trabajador)
        
        f_inicio, f_fin = cls._calcular_fechas_por_periodo(periodo, fecha)
        
        if f_inicio and f_fin:
            if f_inicio == f_fin:
                # Si es una sola fecha exacta (o "hoy")
                query = query.join(
                    ResumenDiarioLector, Trabajador.ccodprs == ResumenDiarioLector.ccodprs
                ).filter(ResumenDiarioLector.fecha == f_inicio)
            else:
                # Si es un rango (semana, mes, 3meses)
                query = query.join(
                    ResumenDiarioLector, Trabajador.ccodprs == ResumenDiarioLector.ccodprs
                ).filter(ResumenDiarioLector.fecha.between(f_inicio, f_fin)).distinct()
             
        return query.offset(skip).limit(limit).all()

    @classmethod
    def calcular_y_actualizar_desempeno(
        cls, 
        db: Session, 
        ccodprs: Optional[str] = None, 
        fecha_eval: Optional[date] = None,
        periodo: Optional[str] = None
    ) -> Dict:
        try:
            f_inicio, _ = cls._calcular_fechas_por_periodo(periodo, fecha_eval)
            if f_inicio:
                fecha_eval = f_inicio

            if not fecha_eval:
                fecha_eval = db.query(func.max(ResumenDiarioLector.fecha)).scalar()
                if not fecha_eval:
                    raise HTTPException(
                        status_code=400, 
                        detail="No hay registros diarios de lectura para evaluar."
                    )
            query_resumenes = db.query(ResumenDiarioLector).filter(ResumenDiarioLector.fecha == fecha_eval)
            if ccodprs:
                query_resumenes = query_resumenes.filter(ResumenDiarioLector.ccodprs == ccodprs)            
            resumenes = query_resumenes.all()
            if not resumenes:
                raise HTTPException(
                    status_code=404, 
                    detail=f"No se encontraron resúmenes diarios para la fecha {fecha_eval}."
                )
            codigos_lectores = [r.ccodprs for r in resumenes]
            trabajadores_map = {
                t.ccodprs: t for t in db.query(Trabajador).filter(Trabajador.ccodprs.in_(codigos_lectores)).all()
            }
            evals_existentes_map = {
                e.ccodprs: e for e in db.query(EvaluacionDesempeno).filter(
                    EvaluacionDesempeno.fecha == fecha_eval,
                    EvaluacionDesempeno.ccodprs.in_(codigos_lectores)
                ).all()
            }
            actualizados = 0
            nuevas_evaluaciones = []
            for r in resumenes:
                eficiencia_val = float(r.eficiencia or 0.0)
                puntaje = round(eficiencia_val * 100, 2)
                if puntaje >= 95:
                    clasificacion = "Excelente"
                elif puntaje >= 85:
                    clasificacion = "Bueno"
                elif puntaje >= 70:
                    clasificacion = "Regular"
                else:
                    clasificacion = "Crítico"
                if r.ccodprs in evals_existentes_map:
                    eval_existente = evals_existentes_map[r.ccodprs]
                    eval_existente.puntaje = puntaje
                    eval_existente.clasificacion = clasificacion
                    eval_existente.eficiencia = eficiencia_val
                else:
                    nuevas_evaluaciones.append(EvaluacionDesempeno(
                        ccodprs=r.ccodprs,
                        fecha=fecha_eval,
                        puntaje=puntaje,
                        clasificacion=clasificacion,
                        eficiencia=eficiencia_val,
                        tendencia="Estable"
                    ))
                trabajador = trabajadores_map.get(r.ccodprs)
                if trabajador:
                    trabajador.ultimo_puntaje = puntaje
                    trabajador.ultima_clasificacion = clasificacion
                    trabajador.fecha_ultima_evaluacion = fecha_eval
                actualizados += 1
            if nuevas_evaluaciones:
                db.bulk_save_objects(nuevas_evaluaciones)
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
    def obtener_ficha_trabajador(db: Session, ccodprs: str) -> Optional[Dict]:
        trabajador = db.query(Trabajador).filter(Trabajador.ccodprs == ccodprs).first()
        if not trabajador:
            return None
        resumenes = (
            db.query(ResumenDiarioLector)
            .filter(ResumenDiarioLector.ccodprs == ccodprs)
            .order_by(desc(ResumenDiarioLector.fecha))
            .limit(30)
            .all()
        )
        if not resumenes:
            fechas_resumen = []
        else:
            fechas_resumen = [r.fecha for r in resumenes]
        mapa_rutas_metfac = {}
        if fechas_resumen:
            actividades_agrupadas = (
                db.query(
                    cast(Actividad.fecha, Date).label("fecha_corta"),
                    func.max(Actividad.cmetfac).label("cmetfac"),
                    func.max(Conexion.ruta_id).label("ruta_id")
                )
                .outerjoin(Conexion, Actividad.ccodcnx == Conexion.ccodcnx)
                .filter(
                    Actividad.ccodprs == ccodprs,
                    cast(Actividad.fecha, Date).in_(fechas_resumen)
                )
                .group_by(cast(Actividad.fecha, Date))
                .all()
            )
            for act in actividades_agrupadas:
                llave_fecha = str(act.fecha_corta)
                mapa_rutas_metfac[llave_fecha] = {
                    "cmetfac": act.cmetfac,
                    "ruta_id": act.ruta_id
                }
        historial_enriquecido = []
        for r in resumenes:
            fecha_str = str(r.fecha)
            info_extra = mapa_rutas_metfac.get(fecha_str, {})            
            cmet_val = info_extra.get("cmetfac")
            ruta_val = info_extra.get("ruta_id")
            historial_enriquecido.append({
                "fecha": r.fecha,  
                "ruta_id": ruta_val if ruta_val else "Sin ruta",
                "cmetfac": cmet_val if cmet_val else "Sin metfac",
                "cantidad_lecturas": r.cantidad_lecturas or 0,
                "lecturas_realizadas": r.lecturas_realizadas or 0,
                "lecturas_pendientes": getattr(r, 'lecturas_pendientes', 0),
                "cantidad_impedimentos": r.cantidad_impedimentos or 0,
                "cantidad_observaciones": r.cantidad_observaciones or 0,
                "cantidad_fotos": getattr(r, 'cantidad_fotos', 0),
                "duracion_total_min": float(r.duracion_total_min or 0.0),
                "promedio_min": float(r.promedio_min or 0.0),
                "eficiencia": float(r.eficiencia or 0.0)
            })
        ultima_actividad = (
            db.query(Conexion.ruta_id, Actividad.cmetfac)
            .select_from(Actividad)
            .outerjoin(Conexion, Actividad.ccodcnx == Conexion.ccodcnx)
            .filter(
                Actividad.ccodprs == ccodprs,
                Actividad.cmetfac.isnot(None),
                Actividad.cmetfac != ""
            )
            .order_by(desc(Actividad.fecha))
            .first()
        )

        ruta_actual = ultima_actividad.ruta_id if (ultima_actividad and ultima_actividad.ruta_id) else "No asignada"
        metfac_actual = ultima_actividad.cmetfac if (ultima_actividad and ultima_actividad.cmetfac) else "No asignada"
        alertas_pendientes_count = (
            db.query(Alerta)
            .filter(Alerta.ccodprs == ccodprs, Alerta.estado_alerta == "Pendiente")
            .count()
        )

        return {
            "ccodprs": trabajador.ccodprs,
            "nombre": trabajador.nombre,
            "telefono": trabajador.telefono,
            "ruta_actual": ruta_actual,
            "metfac_actual": metfac_actual,
            "ultimo_puntaje": trabajador.ultimo_puntaje,
            "ultima_clasificacion": trabajador.ultima_clasificacion,
            "fecha_ultima_evaluacion": trabajador.fecha_ultima_evaluacion,
            "total_alertas_pendientes": alertas_pendientes_count,
            "historial_asistencia": historial_enriquecido
        }