from sqlalchemy.orm import Session
from sqlalchemy import func, case, or_
from datetime import date
from app.model import ResumenDiarioLector, Actividad, Trabajador, Conexion, Zona

class KpiLecturaService:

    @staticmethod
    def obtener_kpis_generales(db: Session, fecha_inicio: date = None, fecha_fin: date = None, zona_id: str = None) -> dict:
        # 1. Métricas base desde ResumenDiarioLector
        query_resumen = db.query(
            func.sum(ResumenDiarioLector.cantidad_lecturas).label("prog"),
            func.sum(ResumenDiarioLector.lecturas_realizadas).label("real"),
            func.avg(ResumenDiarioLector.eficiencia).label("eficiencia_prom"),
            func.sum(ResumenDiarioLector.cantidad_impedimentos).label("impedimentos"),
            func.sum(ResumenDiarioLector.cantidad_observaciones).label("observaciones"),
            func.sum(ResumenDiarioLector.duracion_total_min).label("duracion_total_minutos")
        )

        if fecha_inicio and fecha_fin:
            query_resumen = query_resumen.filter(ResumenDiarioLector.fecha.between(fecha_inicio, fecha_fin))
        
        if zona_id:
            query_resumen = query_resumen.filter(ResumenDiarioLector.cmetfac == zona_id)

        res_resumen = query_resumen.first()

        prog = res_resumen.prog or 0
        real = res_resumen.real or 0
        impedimentos = res_resumen.impedimentos or 0
        observaciones = res_resumen.observaciones or 0
        duracion_total_min = res_resumen.duracion_total_minutos or 0.0

        # --- LOS 7 KPIS OPERATIVOS EXACTOS ---
        
        # KPI 1: Cumplimiento de lectura: (Ejecutadas / Programadas) * 100
        cumplimiento_lectura = round((real / prog * 100), 2) if prog > 0 else 0.0

        # KPI 2: Productividad de lectura: Lecturas / horas campo
        horas_campo = duracion_total_min / 60.0
        productividad_lectura = round(real / horas_campo, 2) if horas_campo > 0 else 0.0

        # KPI 3: Tiempo promedio de lectura: Tiempo total / lecturas (en minutos)
        tiempo_promedio_lectura = round(duracion_total_min / real, 2) if real > 0 else 0.0

        # KPI 4: Impedimentos de lectura: Con impedimento / programadas × 100
        impedimentos_lectura = round((impedimentos / prog * 100), 2) if prog > 0 else 0.0

        # KPI 5: Observaciones de lectura: Con observación / ejecutadas × 100
        observaciones_lectura = round((observaciones / real * 100), 2) if real > 0 else 0.0

        # 2. Métricas espaciales desde Actividades (TI / GPS) para los KPIs 6 y 7
        query_act = db.query(
            func.count(Actividad.actividad_id).label("total_act"),
            # Validamos variantes comunes por si el texto difiere en mayúsculas/minúsculas
            func.sum(case((func.lower(Actividad.resultado).contains("fuera"), 1), else_=0)).label("fuera_punto"),
            func.sum(case((func.lower(Actividad.resultado).in_(["en punto", "conforme", "valido", "ok"]), 1), else_=0)).label("en_punto_valido")
        ).join(Conexion, Actividad.ccodcnx == Conexion.ccodcnx)

        if fecha_inicio and fecha_fin:
            query_act = query_act.filter(Actividad.fecha.between(fecha_inicio, fecha_fin))
        
        if zona_id:
            query_act = query_act.join(Zona, Conexion.zona_id == Zona.zona_id).filter(Zona.zona_id == zona_id)

        res_act = query_act.first()
        total_act = res_act.total_act or 0
        fuera_punto = res_act.fuera_punto or 0
        en_punto_valido = res_act.en_punto_valido or 0

        # KPI 6: Cober. georreferenciada de lectura (Lecturas con GPS válido / programadas × 100)
        # Usamos el total de actividades válidas o realizadas en punto frente a lo programado
        cobertura_georreferenciada = round((en_punto_valido / prog * 100), 2) if prog > 0 else 0.0

        # KPI 7: Actividades fuera de punto (Lecturas fuera zona / total × 100)
        actividades_fuera_de_punto = round((fuera_punto / total_act * 100), 2) if total_act > 0 else 0.0

        return {
            "total_lecturas_programadas": int(prog),
            "total_lecturas_realizadas": int(real),
            "cumplimiento_lectura": cumplimiento_lectura,
            "productividad_lectura": productividad_lectura,
            "tiempo_promedio_lectura": tiempo_promedio_lectura,
            "impedimentos_lectura": impedimentos_lectura,
            "observaciones_lectura": observaciones_lectura,
            "cobertura_georreferenciada": cobertura_georreferenciada,
            "actividades_fuera_de_punto": actividades_fuera_de_punto,
            "total_impedimentos": int(impedimentos),
            "total_observaciones": int(observaciones)
        }

    @staticmethod
    def obtener_ranking_lectores(db: Session, fecha_inicio: date = None, fecha_fin: date = None, limit: int = 10) -> list:
        query = db.query(
            Trabajador.ccodprs,
            Trabajador.nombre,
            func.sum(ResumenDiarioLector.lecturas_realizadas).label("total_lecturas"),
            func.avg(ResumenDiarioLector.eficiencia).label("eficiencia_prom"),
            func.avg(ResumenDiarioLector.promedio_min).label("tiempo_prom")
        ).join(ResumenDiarioLector, Trabajador.ccodprs == ResumenDiarioLector.ccodprs)

        if fecha_inicio and fecha_fin:
            query = query.filter(ResumenDiarioLector.fecha.between(fecha_inicio, fecha_fin))

        query = query.group_by(Trabajador.ccodprs, Trabajador.nombre)\
                     .order_by(func.avg(ResumenDiarioLector.eficiencia).desc())\
                     .limit(limit)

        resultados = query.all()
        ranking = []
        for r in resultados:
            ranking.append({
                "ccodprs": r.ccodprs,
                "nombre": r.nombre,
                "total_lecturas": int(r.total_lecturas or 0),
                "eficiencia_promedio": round(r.eficiencia_prom or 0.0, 2),
                "promedio_min_por_lectura": round(r.tiempo_prom or 0.0, 2)
            })
        return ranking