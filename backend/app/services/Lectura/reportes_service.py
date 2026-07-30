import io
import pandas as pd
from typing import Tuple, Optional, List, Dict, Any
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from openpyxl.utils import get_column_letter
from app.model import (Alerta, ResumenDiarioLector, Trabajador, Actividad, Intervencion, EvaluacionDesempeno, Zona)

class ReportesService:

    @staticmethod
    def _calcular_fechas_por_periodo(periodo: Optional[str], fecha_inicio: Optional[date] = None, fecha_fin: Optional[date] = None):
        """Calcula automáticamente las fechas si se pasa un período predefinido"""
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
            
        return fecha_inicio, fecha_fin

    @staticmethod
    def obtener_resumen_kpis(
        db: Session, 
        fecha_inicio: Optional[date] = None, 
        fecha_fin: Optional[date] = None, 
        zona_id: Optional[str] = None,
        periodo: Optional[str] = None
    ) -> dict:        
        f_inicio, f_fin = ReportesService._calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)

        query_alertas = db.query(Alerta)
        query_resumen = db.query(ResumenDiarioLector)

        if f_inicio:
            query_alertas = query_alertas.filter(Alerta.fecha >= f_inicio)
            query_resumen = query_resumen.filter(ResumenDiarioLector.fecha >= f_inicio)
        if f_fin:
            query_alertas = query_alertas.filter(Alerta.fecha <= f_fin)
            query_resumen = query_resumen.filter(ResumenDiarioLector.fecha <= f_fin)
        if zona_id:
            query_alertas = query_alertas.filter(Alerta.zona_id == zona_id)
            query_resumen = query_resumen.filter(ResumenDiarioLector.cmetfac == zona_id)

        total_alertas = query_alertas.count()

        por_nivel_raw = query_alertas.with_entities(Alerta.nivel, func.count(Alerta.alerta_id))\
            .group_by(Alerta.nivel).all()
        alertas_por_nivel = {nivel or "Sin Nivel": count for nivel, count in por_nivel_raw}

        por_kpi_raw = query_alertas.with_entities(Alerta.kpi, func.count(Alerta.alerta_id))\
            .group_by(Alerta.kpi).all()
        alertas_por_kpi = {kpi or "Sin KPI": count for kpi, count in por_kpi_raw}
        
        resumenes = query_resumen.all()
        total_programadas = sum(r.cantidad_lecturas or 0 for r in resumenes)
        total_realizadas = sum(r.lecturas_realizadas or 0 for r in resumenes)
        total_impedimentos = sum(r.cantidad_impedimentos or 0 for r in resumenes)
        total_observaciones = sum(r.cantidad_observaciones or 0 for r in resumenes)

        cumplimientos = []
        for r in resumenes:
            prog = r.cantidad_lecturas or 0
            real = r.lecturas_realizadas or 0
            if prog > 0:
                cumplimientos.append((real / prog) * 100)
        
        promedio_general = round(sum(cumplimientos) / len(cumplimientos), 2) if cumplimientos else 0.0
        
        metricas_por_zona = db.query(
            ResumenDiarioLector.cmetfac.label("zona_grupo"),
            func.sum(ResumenDiarioLector.cantidad_lecturas).label("programadas"),
            func.sum(ResumenDiarioLector.lecturas_realizadas).label("realizadas"),
            func.sum(ResumenDiarioLector.cantidad_impedimentos).label("impedimentos"),
            func.sum(ResumenDiarioLector.cantidad_observaciones).label("observaciones")
        )
        if f_inicio:
            metricas_por_zona = metricas_por_zona.filter(ResumenDiarioLector.fecha >= f_inicio)
        if f_fin:
            metricas_por_zona = metricas_por_zona.filter(ResumenDiarioLector.fecha <= f_fin)
        if zona_id:
            metricas_por_zona = metricas_por_zona.filter(ResumenDiarioLector.cmetfac == zona_id)
            
        resumen_zonas_raw = metricas_por_zona.group_by(ResumenDiarioLector.cmetfac).all()
        desglose_zonas = []
        for z in resumen_zonas_raw:
            prog = z.programadas or 0
            real = z.realizadas or 0
            cumpl = round((real / prog * 100), 2) if prog > 0 else 0.0
            desglose_zonas.append({
                "Grupo Facturación / Zona": z.zona_grupo or "Sin Especificar",
                "Lecturas Programadas": prog,
                "Lecturas Realizadas": real,
                "Impedimentos": z.impedimentos or 0,
                "Observaciones": z.observaciones or 0,
                "% Cumplimiento": cumpl
            })
            
        return {
            "total_alertas": total_alertas,
            "total_programadas": total_programadas,
            "total_realizadas": total_realizadas,
            "total_impedimentos": total_impedimentos,
            "total_observaciones": total_observaciones,
            "alertas_por_nivel": alertas_por_nivel,
            "alertas_por_kpi": alertas_por_kpi,
            "cumplimiento_promedio_general": promedio_general,
            "desglose_zonas": desglose_zonas
        }

    @staticmethod
    def obtener_estado_alertas(
        db: Session, 
        fecha_inicio: Optional[date] = None, 
        fecha_fin: Optional[date] = None,
        periodo: Optional[str] = None
    ) -> list:
        f_inicio, f_fin = ReportesService._calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)

        query = db.query(Alerta.estado_alerta, func.count(Alerta.alerta_id))
        if f_inicio:
            query = query.filter(Alerta.fecha >= f_inicio)
        if f_fin:
            query = query.filter(Alerta.fecha <= f_fin)
            
        resultado = query.group_by(Alerta.estado_alerta).all()
        return [{"estado": estado or "Pendiente", "cantidad": count} for estado, count in resultado]

    @staticmethod
    def obtener_ranking_trabajadores(db: Session, fecha: Optional[date] = None) -> list:    
        target_fecha = fecha or date.today()
        
        resumenes = db.query(ResumenDiarioLector, Trabajador)\
            .join(Trabajador, ResumenDiarioLector.ccodprs == Trabajador.ccodprs)\
            .filter(ResumenDiarioLector.fecha == target_fecha)\
            .all()
        alertas_count_raw = db.query(Alerta.ccodprs, func.count(Alerta.alerta_id))\
            .filter(Alerta.fecha == target_fecha)\
            .group_by(Alerta.ccodprs).all()
        mapa_alertas = {ccodprs: count for ccodprs, count in alertas_count_raw}

        reporte = []
        for resumen, trabajador in resumenes:
            prog = resumen.cantidad_lecturas or 0
            real = resumen.lecturas_realizadas or 0
            cumplimiento = round((real / prog * 100), 2) if prog > 0 else 0.0

            total_alt = mapa_alertas.get(trabajador.ccodprs, 0)
            estado_gen = "Crítico" if total_alt >= 2 or cumplimiento < 70 else ("Regular" if total_alt == 1 else "Óptimo")

            nombre_completo = getattr(trabajador, 'nombre', '').strip() or f"Lector {trabajador.ccodprs}"

            reporte.append({
                "ccodprs": trabajador.ccodprs,
                "nombre_trabajador": nombre_completo,
                "ruta_asignada": resumen.ruta_id or "Sin Ruta", 
                "grupo_facturacion": resumen.cmetfac or "N/A",  
                "total_alertas_acumuladas": total_alt,
                "promedio_cumplimiento": cumplimiento,
                "estado_general": estado_gen
            })
        return reporte

    @staticmethod
    def _generar_excel(hojas: Dict[str, pd.DataFrame]) -> io.BytesIO:
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            for nombre_hoja, df in hojas.items():
                df_clean = df.fillna("-")
                df_final = df_clean if not df_clean.empty else pd.DataFrame({"Información": ["Sin datos para los filtros seleccionados"]})                
                sheet_title = nombre_hoja[:30]
                df_final.to_excel(writer, sheet_name=sheet_title, index=False)                
                worksheet = writer.sheets[sheet_title]
                for col_idx, col in enumerate(df_final.columns, 1):
                    max_len = max(
                        df_final[col].astype(str).map(len).max() if not df_final.empty else 10,
                        len(str(col))
                    ) + 3
                    col_letter = get_column_letter(col_idx)
                    worksheet.column_dimensions[col_letter].width = min(max_len, 50)  
                    
        buffer.seek(0)
        return buffer

    @staticmethod
    def _empaquetar_excel(hojas: dict, nombre_base: str) -> Tuple[io.BytesIO, str, str]:
        buffer = ReportesService._generar_excel(hojas)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = f"{nombre_base}.xlsx"
        return buffer, media_type, filename

    @staticmethod
    def exportar_resumen_kpis(
        db: Session, 
        fecha_inicio: Optional[date] = None, 
        fecha_fin: Optional[date] = None,
        zona_id: Optional[str] = None,
        periodo: Optional[str] = None
    ) -> Tuple[io.BytesIO, str, str]:        
        data = ReportesService.obtener_resumen_kpis(db, fecha_inicio, fecha_fin, zona_id, periodo)

        df_resumen = pd.DataFrame([{
            "Total Alertas Registradas": data["total_alertas"],
            "Lecturas Programadas": data["total_programadas"],
            "Lecturas Realizadas": data["total_realizadas"],
            "% Cumplimiento General": data["cumplimiento_promedio_general"],
            "Total Impedimentos Registrados": data["total_impedimentos"],
            "Total Observaciones Registradas": data["total_observaciones"]
        }])
        df_por_nivel = pd.DataFrame(
            list(data["alertas_por_nivel"].items()), 
            columns=["Nivel de Alerta", "Cantidad de Alertas"]
        )
        df_por_kpi = pd.DataFrame(
            list(data["alertas_por_kpi"].items()), 
            columns=["Tipo de KPI / Incidencia Alerta", "Cantidad de Alertas Generadas"]
        )
        df_desglose_zonas = pd.DataFrame(data["desglose_zonas"])

        hojas = {
            "Resumen General de KPIs": df_resumen,
            "KPIs por Zona-Grupo": df_desglose_zonas,
            "Alertas por Nivel": df_por_nivel,
            "Alertas por KPI": df_por_kpi,
        }
        return ReportesService._empaquetar_excel(hojas, "reporte_kpis_resumen")

    @staticmethod
    def exportar_estado_alertas(
        db: Session, 
        fecha_inicio: Optional[date] = None, 
        fecha_fin: Optional[date] = None,
        periodo: Optional[str] = None
    ) -> Tuple[io.BytesIO, str, str]:
        f_inicio, f_fin = ReportesService._calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)
        
        resumen_data = ReportesService.obtener_estado_alertas(db, fecha_inicio, fecha_fin, periodo)
        df_resumen = pd.DataFrame(resumen_data)
        if not df_resumen.empty:
            df_resumen.columns = ["Estado de Alerta", "Total Alertas"]
            
        query_detalle = db.query(
            Alerta.alerta_id,
            Alerta.fecha,
            Alerta.nivel,
            Alerta.kpi,
            Alerta.motivo,
            Alerta.estado_alerta,
            Alerta.prioridad,
            Alerta.ccodprs,
            Trabajador.nombre.label("nombre_trabajador"),
            Alerta.valor_actual,
            Alerta.valor_umbral
        ).outerjoin(Trabajador, Alerta.ccodprs == Trabajador.ccodprs)

        if f_inicio:
            query_detalle = query_detalle.filter(Alerta.fecha >= f_inicio)
        if f_fin:
            query_detalle = query_detalle.filter(Alerta.fecha <= f_fin)

        alertas_lista = query_detalle.order_by(Alerta.fecha.desc()).all()

        detalle_rows = []
        for a in alertas_lista:
            detalle_rows.append({
                "ID Alerta": a.alerta_id,
                "Fecha": a.fecha,
                "Estado": a.estado_alerta or "Pendiente",
                "Nivel": a.nivel,
                "KPI": a.kpi,
                "Prioridad": a.prioridad or "Media",
                "Cód. Trabajador": a.ccodprs or "-",
                "Nombre Trabajador": a.nombre_trabajador or f"Lector {a.ccodprs}",
                "Motivo / Detalle": a.motivo,
                "Valor Medido": a.valor_actual,
                "Umbral Esperado": a.valor_umbral
            })

        df_detalle = pd.DataFrame(detalle_rows)

        hojas = {
            "Conteo por Estado": df_resumen,
            "Detalle de Alertas": df_detalle
        }
        return ReportesService._empaquetar_excel(hojas, "reporte_alertas_estado_detalle")

    @staticmethod
    def exportar_ranking_trabajadores(
        db: Session, 
        fecha: Optional[date] = None
    ) -> Tuple[io.BytesIO, str, str]:
        target_fecha = fecha or date.today()        
        query = db.query(
            ResumenDiarioLector,
            Trabajador
        ).join(
            Trabajador, ResumenDiarioLector.ccodprs == Trabajador.ccodprs
        ).filter(
            ResumenDiarioLector.fecha == target_fecha
        )

        resumenes = query.all()
        alertas_raw = db.query(Alerta.ccodprs, func.count(Alerta.alerta_id))\
            .filter(Alerta.fecha == target_fecha)\
            .group_by(Alerta.ccodprs).all()
        mapa_alertas = {ccodprs: count for ccodprs, count in alertas_raw}
        evals_raw = db.query(EvaluacionDesempeno)\
            .filter(EvaluacionDesempeno.fecha == target_fecha).all()
        mapa_evals = {e.ccodprs: e for e in evals_raw}

        rows = []
        for resumen, trabajador in resumenes:
            prog = resumen.cantidad_lecturas or 0
            real = resumen.lecturas_realizadas or 0
            cumplimiento = round((real / prog * 100), 2) if prog > 0 else 0.0

            total_alt = mapa_alertas.get(trabajador.ccodprs, 0)
            estado_gen = "Crítico" if total_alt >= 2 or cumplimiento < 70 else ("Regular" if total_alt == 1 else "Óptimo")
            
            evaluacion = mapa_evals.get(trabajador.ccodprs)

            rows.append({
                "Código Lector": trabajador.ccodprs,
                "Nombre": trabajador.nombre or f"Lector {trabajador.ccodprs}",
                "Ruta Asignada": resumen.ruta_id or "Sin Ruta",  
                "Grupo Facturación (cMetFac)": resumen.cmetfac or "N/A",
                "Lecturas Programadas": prog,
                "Lecturas Realizadas": real,
                "Impedimentos": resumen.cantidad_impedimentos or 0,
                "Observaciones": resumen.cantidad_observaciones or 0,
                "% Cumplimiento": cumplimiento,
                "Alertas Generadas": total_alt,
                "Estado Operativo": estado_gen,
                "Puntaje Evaluación": evaluacion.puntaje if evaluacion else (trabajador.ultimo_puntaje or "-"),
                "Clasificación": evaluacion.clasificacion if evaluacion else (trabajador.ultima_clasificacion or "-")
            })

        df = pd.DataFrame(rows)
        hojas = {"Desempeño Trabajadores": df}
        return ReportesService._empaquetar_excel(hojas, f"reporte_desempeno_trabajadores_{target_fecha}")