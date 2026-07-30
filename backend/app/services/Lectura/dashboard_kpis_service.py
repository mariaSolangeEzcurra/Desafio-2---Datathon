from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.model import ResumenDiarioLector, Actividad, Trabajador

class KpiLecturaService:

    @staticmethod
    def _calcular_fechas_por_periodo(periodo: str, fecha_inicio: date = None, fecha_fin: date = None):
        if fecha_inicio and fecha_fin:
            return fecha_inicio, fecha_fin        
        hoy = date.today()    
        if periodo == "hoy":
            return hoy, hoy
        elif periodo == "semana":
            inicio = hoy - timedelta(days=7)
            return inicio, hoy
        elif periodo == "mes":
            inicio = hoy - timedelta(days=30)
            return inicio, hoy
        elif periodo == "3meses":
            inicio = hoy - timedelta(days=90)
            return inicio, hoy            
        return fecha_inicio, fecha_fin

    @classmethod
    def obtener_kpis_generales(cls, db: Session, fecha_inicio: date = None, fecha_fin: date = None, zona_id: str = None, periodo: str = None) -> dict:
        # Resolver fechas si se usa un periodo rápido
        f_inicio, f_fin = cls._calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)

        query_resumen = db.query(
            func.sum(ResumenDiarioLector.cantidad_lecturas).label("prog"),
            func.sum(ResumenDiarioLector.lecturas_realizadas).label("real"),
            func.avg(ResumenDiarioLector.eficiencia).label("eficiencia_prom"),
            func.sum(ResumenDiarioLector.cantidad_impedimentos).label("impedimentos"),
            func.sum(ResumenDiarioLector.cantidad_observaciones).label("observaciones"),
            func.sum(ResumenDiarioLector.duracion_total_min).label("duracion_total_minutos")
        )
        
        if f_inicio and f_fin:
            query_resumen = query_resumen.filter(ResumenDiarioLector.fecha.between(f_inicio, f_fin))    
            
        if zona_id:
            lectores_en_zona = db.query(Actividad.ccodprs)\
                .filter(Actividad.cmetfac == zona_id)\
                .distinct().subquery()
            query_resumen = query_resumen.filter(ResumenDiarioLector.ccodprs.in_(lectores_en_zona))
            
        res_resumen = query_resumen.first()
        prog = res_resumen.prog or 0
        real = res_resumen.real or 0
        impedimentos = res_resumen.impedimentos or 0
        observaciones = res_resumen.observaciones or 0
        duracion_total_min = res_resumen.duracion_total_minutos or 0.0
        
        # kpis lectura
        cumplimiento_lectura = round((real / prog * 100), 2) if prog > 0 else 0.0
        horas_campo = duracion_total_min / 60.0
        productividad_lectura = round(real / horas_campo, 2) if horas_campo > 0 else 0.0
        tiempo_promedio_lectura = round(duracion_total_min / real, 2) if real > 0 else 0.0
        impedimentos_lectura = round((impedimentos / prog * 100), 2) if prog > 0 else 0.0
        observaciones_lectura = round((observaciones / real * 100), 2) if real > 0 else 0.0
        
        # metricas espaciales
        condicion_fuera = case(
            (func.lower(func.coalesce(Actividad.resultado, '')).like("%fuera%"), 1),
            else_=0
        )
        condicion_valido = case(
            (func.lower(func.coalesce(Actividad.resultado, '')).in_(["en punto", "conforme", "valido", "ok"]), 1),
            else_=0
        )
        query_act = db.query(
            func.count(Actividad.actividad_id).label("total_act"),
            func.sum(condicion_fuera).label("fuera_punto"),
            func.sum(condicion_valido).label("en_punto_valido")
        )
        
        if f_inicio and f_fin:
            query_act = query_act.filter(Actividad.fecha.between(f_inicio, f_fin))    
        if zona_id:
            query_act = query_act.filter(Actividad.cmetfac == zona_id)
            
        res_act = query_act.first()
        total_act = (res_act.total_act if res_act else 0) or 0
        fuera_punto = (res_act.fuera_punto if res_act else 0) or 0
        en_punto_valido = (res_act.en_punto_valido if res_act else 0) or 0
        
        cobertura_georreferenciada = round((en_punto_valido / prog * 100), 2) if prog > 0 else 0.0
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

    @classmethod
    def obtener_ranking_lectores(cls, db: Session, fecha_inicio: date = None, fecha_fin: date = None, limit: int = 10, periodo: str = None) -> list:
        f_inicio, f_fin = cls._calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)

        query = db.query(
            Trabajador.ccodprs,
            Trabajador.nombre,
            func.sum(ResumenDiarioLector.lecturas_realizadas).label("total_lecturas"),
            func.avg(ResumenDiarioLector.eficiencia).label("eficiencia_prom"),
            func.avg(ResumenDiarioLector.promedio_min).label("tiempo_prom")
        ).join(ResumenDiarioLector, Trabajador.ccodprs == ResumenDiarioLector.ccodprs)
        
        if f_inicio and f_fin:
            query = query.filter(ResumenDiarioLector.fecha.between(f_inicio, f_fin))
            
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