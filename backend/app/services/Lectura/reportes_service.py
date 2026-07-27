from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import date
from typing import Optional, List
from app.model import Alerta, ResumenDiarioLector, Trabajador, Actividad, Intervencion

class ReportesService:

    @staticmethod
    def obtener_resumen_kpis(db: Session, fecha_inicio: Optional[date] = None, fecha_fin: Optional[date] = None, zona_id: Optional[str] = None) -> dict:
        """
        Genera un consolidado global de las alertas generadas por los 7 KPIs y el cumplimiento promedio.
        """
        query_alertas = db.query(Alerta)
        query_resumen = db.query(ResumenDiarioLector)

        # Aplicar filtros de fecha y zona si existen
        if fecha_inicio:
            query_alertas = query_alertas.filter(Alerta.fecha >= fecha_inicio)
            query_resumen = query_resumen.filter(ResumenDiarioLector.fecha >= fecha_inicio)
        if fecha_fin:
            query_alertas = query_alertas.filter(Alerta.fecha <= fecha_fin)
            query_resumen = query_resumen.filter(ResumenDiarioLector.fecha <= fecha_fin)
        if zona_id:
            query_alertas = query_alertas.filter(Alerta.zona_id == zona_id)
            query_resumen = query_resumen.filter(ResumenDiarioLector.cmetfac == zona_id)

        total_alertas = query_alertas.count()

        # Agrupar alertas por nivel (Alto, Medio, Bajo)
        por_nivel_raw = db.query(Alerta.nivel, func.count(Alerta.alerta_id))\
            .group_by(Alerta.nivel).all()
        alertas_por_nivel = {nivel: count for nivel, count in por_nivel_raw}

        # Agrupar alertas por tipo de KPI
        por_kpi_raw = db.query(Alerta.kpi, func.count(Alerta.alerta_id))\
            .group_by(Alerta.kpi).all()
        alertas_por_kpi = {kpi: count for kpi, count in por_kpi_raw}

        # Calcular cumplimiento promedio general de las lecturas en el periodo
        resumenes = query_resumen.all()
        cumplimientos = []
        for r in resumenes:
            prog = r.cantidad_lecturas or 0
            real = r.lecturas_realizadas or 0
            if prog > 0:
                cumplimientos.append((real / prog) * 100)
        
        promedio_general = round(sum(cumplimientos) / len(cumplimientos), 2) if cumplimientos else 0.0

        return {
            "total_alertas": total_alertas,
            "alertas_por_nivel": alertas_por_nivel,
            "alertas_por_kpi": alertas_por_kpi,
            "cumplimiento_promedio_general": promedio_general
        }

    @staticmethod
    def obtener_estado_alertas(db: Session, fecha_inicio: Optional[date] = None, fecha_fin: Optional[date] = None) -> list:
        """
        Devuelve el conteo de alertas agrupadas por su estado operativo (Pendiente, En Revisión, Escalada, Resuelto).
        """
        query = db.query(Alerta.estado_alerta, func.count(Alerta.alerta_id))
        if fecha_inicio:
            query = query.filter(Alerta.fecha >= fecha_inicio)
        if fecha_fin:
            query = query.filter(Alerta.fecha <= fecha_fin)
            
        resultado = query.group_by(Alerta.estado_alerta).all()
        return [{"estado": estado, "cantidad": count} for estado, count in resultado]

    @staticmethod
    def obtener_ranking_trabajadores(db: Session, fecha: Optional[date] = None) -> list:
        """
        Genera un reporte del desempeño de los trabajadores, cruzando sus alertas y nivel de cumplimiento.
        """
        target_fecha = fecha or date.today()
        
        resumenes = db.query(ResumenDiarioLector, Trabajador)\
            .join(Trabajador, ResumenDiarioLector.ccodprs == Trabajador.ccodprs)\
            .filter(ResumenDiarioLector.fecha == target_fecha)\
            .all()

        reporte = []
        for resumen, trabajador in resumenes:
            prog = resumen.cantidad_lecturas or 0
            real = resumen.lecturas_realizadas or 0
            cumplimiento = round((real / prog * 100), 2) if prog > 0 else 0.0

            # Contar alertas del trabajador en la fecha
            total_alt = db.query(Alerta).filter(
                Alerta.ccodprs == trabajador.ccodprs,
                Alerta.fecha == target_fecha
            ).count()

            estado_gen = "Crítico" if total_alt >= 2 or cumplimiento < 70 else ("Regular" if total_alt == 1 else "Óptimo")

            reporte.append({
                "ccodprs": trabajador.ccodprs,
                "nombre_trabajador": f"{getattr(trabajador, 'nombre', '')} {getattr(trabajador, 'apellido', '')}".strip() or f"Lector {trabajador.ccodprs}",
                "zona_asignada": resumen.cmetfac,
                "total_alertas_acumuladas": total_alt,
                "promedio_cumplimiento": cumplimiento,
                "estado_general": estado_gen
            })

        return reporte