from sqlalchemy.orm import Session
from sqlalchemy import desc, func, case
from datetime import date
from fastapi import HTTPException
from typing import Optional, List
from app.model import Alerta, Intervencion, ResumenDiarioLector, Trabajador, Actividad, Usuario

class AlertasService:

    @staticmethod
    def listar_alertas(db: Session, estado: str = None, zona_id: str = None, ccodprs: str = None, fecha: date = None) -> list:
        query = db.query(Alerta)

        if estado:
            query = query.filter(Alerta.estado_alerta == estado)
        if zona_id:
            query = query.filter(Alerta.zona_id == zona_id)
        if ccodprs:
            query = query.filter(Alerta.ccodprs == ccodprs)
        if fecha:
            query = query.filter(Alerta.fecha == fecha)

        return query.order_by(desc(Alerta.fecha_generacion)).all()

    @staticmethod
    def actualizar_estado_alerta(db: Session, alerta_id: str, nuevo_estado: str, comentario: str, supervisor_id: str) -> Alerta:
        alerta = db.query(Alerta).filter(Alerta.alerta_id == alerta_id).first()
        if not alerta:
            raise HTTPException(status_code=404, detail="Alerta no encontrada.")

        alerta.estado_alerta = nuevo_estado
        alerta.comentario_resolucion = comentario
        alerta.supervisor_id = supervisor_id

        intervencion = Intervencion(
            alerta_id=alerta_id,
            supervisor_id=supervisor_id,
            accion_tomada=f"Cambio de estado a '{nuevo_estado}': {comentario}"
        )
        db.add(intervencion)
        db.commit()
        db.refresh(alerta)
        return alerta

    @staticmethod
    def cambiar_estado_operativo(db: Session, alerta_id: str, nuevo_estado: str, comentario: str, supervisor_id: Optional[str] = None) -> Alerta:
        """
        Gestiona el ciclo de vida operativo de la alerta: 
        'Pendiente', 'En Revisión', 'Escalada', 'Resuelto', registrando la intervención.
        """
        alerta = db.query(Alerta).filter(Alerta.alerta_id == alerta_id).first()
        if not alerta:
            raise HTTPException(status_code=404, detail="Alerta no encontrada.")

        # Validar estados permitidos para mantener consistencia de negocio
        estados_validos = ["Pendiente", "En Revisión", "Escalada", "Resuelto"]
        if nuevo_estado not in estados_validos:
            raise HTTPException(
                status_code=400, 
                detail=f"Estado inválido. Los estados permitidos son: {', '.join(estados_validos)}"
            )

        # Limpiar supervisor_id si viene vacío, nulo o con el texto por defecto de Swagger ("string")
        limpio_supervisor_id = None if supervisor_id in [None, "", "string"] else supervisor_id

        # Opcional: validar si el supervisor existe si se proporciona uno real
        if limpio_supervisor_id:
            supervisor_existe = db.query(Usuario).filter(Usuario.id_usuario == limpio_supervisor_id).first()
            if not supervisor_existe:
                raise HTTPException(
                    status_code=400, 
                    detail=f"El supervisor con ID '{limpio_supervisor_id}' no existe en la base de datos."
                )

        # Actualizar la alerta
        alerta.estado_alerta = nuevo_estado
        alerta.comentario_resolucion = comentario
        alerta.supervisor_id = limpio_supervisor_id

        # Registrar obligatoriamente en el historial de intervenciones
        intervencion = Intervencion(
            alerta_id=alerta_id,
            supervisor_id=limpio_supervisor_id,
            accion_tomada=f"Cambio de estado a [{nuevo_estado}]: {comentario}"
        )
        db.add(intervencion)
        db.commit()
        db.refresh(alerta)
        return alerta

    @staticmethod
    def evaluar_y_generar_alertas(db: Session, fecha_evaluacion: date = None) -> int:
        """Evalúa los 7 KPIs operativos y espaciales por trabajador y genera alertas automáticas ante desviaciones."""
        target_fecha = fecha_evaluacion or date.today()
        alertas_creadas = 0

        # Obtener los resúmenes diarios por trabajador
        resumenes = db.query(ResumenDiarioLector, Trabajador)\
            .join(Trabajador, ResumenDiarioLector.ccodprs == Trabajador.ccodprs)\
            .filter(ResumenDiarioLector.fecha == target_fecha)\
            .all()

        for resumen, trabajador in resumenes:
            prog = resumen.cantidad_lecturas or 0
            real = resumen.lecturas_realizadas or 0
            impedimentos = resumen.cantidad_impedimentos or 0
            observaciones = resumen.cantidad_observaciones or 0
            duracion_total_min = resumen.duracion_total_min or 0.0
            ccodprs = trabajador.ccodprs
            zona = resumen.cmetfac

            # Cálculos base por trabajador
            horas_campo = duracion_total_min / 60.0
            cumplimiento = (real / prog * 100) if prog > 0 else 0.0
            productividad = (real / horas_campo) if horas_campo > 0 else 0.0
            tiempo_prom = (duracion_total_min / real) if real > 0 else 0.0
            pct_imp = (impedimentos / prog * 100) if prog > 0 else 0.0
            pct_obs = (observaciones / real * 100) if real > 0 else 0.0

            # Helper para registrar alerta evitando duplicados diarios por KPI
            def registrar_alerta(kpi_nombre, valor, umbral, motivo, nivel_prioridad):
                nonlocal alertas_creadas
                sufijo_kpi = kpi_nombre[:3].upper().replace(" ", "")
                alerta_id = f"ALT-{ccodprs}-{target_fecha.strftime('%Y%m%d')}-{sufijo_kpi}"
                
                existente = db.query(Alerta).filter(Alerta.alerta_id == alerta_id).first()
                if not existente:
                    nueva = Alerta(
                        alerta_id=alerta_id,
                        nivel=nivel_prioridad,
                        kpi=kpi_nombre,
                        motivo=motivo,
                        fecha=target_fecha,
                        estado_alerta="Pendiente",
                        ccodprs=ccodprs,
                        zona_id=zona,
                        valor_actual=round(float(valor), 2),
                        valor_umbral=float(umbral),
                        prioridad=nivel_prioridad
                    )
                    db.add(nueva)
                    alertas_creadas += 1

            # --- EVALUACIÓN DE LOS KPIS 1 AL 5 (Datos de Resumen Diario) ---

            # KPI 1: Cumplimiento de lectura (Umbral: <80%)
            if prog > 0 and cumplimiento < 80:
                nivel = "Alto" if cumplimiento < 70 else "Medio"
                registrar_alerta("Cumplimiento de lectura", cumplimiento, 80.0, 
                               f"Cumplimiento bajo: {round(cumplimiento, 2)}% (Mínimo esperado: 80%).", nivel)

            # KPI 2: Productividad de lectura
            if horas_campo > 0 and productividad < 15.0:
                registrar_alerta("Productividad de lectura", productividad, 15.0, 
                               f"Productividad baja: {round(productividad, 2)} lect./hora.", "Medio")

            # KPI 3: Tiempo promedio de lectura
            if real > 0 and tiempo_prom > 2.0:
                registrar_alerta("Tiempo promedio de lectura", tiempo_prom, 2.0, 
                               f"Tiempo promedio elevado: {round(tiempo_prom, 2)} min/lectura.", "Medio")

            # KPI 4: Impedimentos de lectura
            if prog > 0 and pct_imp > 20:
                registrar_alerta("Impedimentos de lectura", pct_imp, 20.0, 
                               f"Alto índice de impedimentos: {round(pct_imp, 2)}% (Umbral máximo: 20%).", "Alto")

            # KPI 5: Observaciones de lectura
            if real > 0 and pct_obs > 4:
                registrar_alerta("Observaciones de lectura", pct_obs, 4.0, 
                               f"Exceso de observaciones: {round(pct_obs, 2)}% (Umbral máximo: 4%).", "Alto")

        # --- EVALUACIÓN DE LOS KPIS 6 Y 7 (Datos Espaciales / Actividades) ---
        actividades_por_trabajador = db.query(
            Actividad.ccodprs,
            func.count(Actividad.actividad_id).label("total"),
            func.sum(case((func.lower(Actividad.resultado).contains("fuera"), 1), else_=0)).label("fuera"),
            func.sum(case((func.lower(Actividad.resultado).in_([".en punto", "conforme", "valido", "ok"]), 1), else_=0)).label("valido")
        ).filter(Actividad.fecha == target_fecha)\
         .group_by(Actividad.ccodprs)\
         .all()

        for ccodprs, total, fuera, valido in actividades_por_trabajador:
            total_act = total or 0
            fuera_punto = fuera or 0
            gps_valido = valido or 0

            def registrar_alerta_espacial(kpi_nombre, valor, umbral, motivo, nivel_prioridad):
                nonlocal alertas_creadas
                sufijo_kpi = kpi_nombre[:3].upper().replace(" ", "")
                alerta_id = f"ALT-{ccodprs}-{target_fecha.strftime('%Y%m%d')}-{sufijo_kpi}"
                
                existente = db.query(Alerta).filter(Alerta.alerta_id == alerta_id).first()
                if not existente:
                    nueva = Alerta(
                        alerta_id=alerta_id,
                        nivel=nivel_prioridad,
                        kpi=kpi_nombre,
                        motivo=motivo,
                        fecha=target_fecha,
                        estado_alerta="Pendiente",
                        ccodprs=ccodprs,
                        valor_actual=round(float(valor), 2),
                        valor_umbral=float(umbral),
                        prioridad=nivel_prioridad
                    )
                    db.add(nueva)
                    alertas_creadas += 1

            if total_act > 0:
                # KPI 6: Cobertura georreferenciada de lectura
                cobertura_gps = (gps_valido / total_act) * 100
                if cobertura_gps < 80:
                    registrar_alerta_espacial("Cobertura georreferenciada", cobertura_gps, 80.0,
                                              f"Cobertura GPS baja: {round(cobertura_gps, 2)}% (Mínimo esperado: 80%).", "Medio")

                # KPI 7: Actividades fuera de punto
                pct_fuera = (fuera_punto / total_act) * 100
                if pct_fuera > 10:
                    registrar_alerta_espacial("Actividades fuera de punto", pct_fuera, 10.0,
                                              f"Exceso de lecturas fuera del radio permitido: {round(pct_fuera, 2)}% (Umbral máximo: 10%).", "Alto")

        db.commit()
        return alertas_creadas