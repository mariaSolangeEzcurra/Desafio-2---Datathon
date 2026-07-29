import io
import pandas as pd
from typing import Tuple, Optional, List, Dict, Any
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.model import (
    Alerta, 
    ResumenDiarioLector, 
    Trabajador, 
    Actividad, 
    Intervencion, 
    EvaluacionDesempeno,
    Zona
)


class ReportesService:

    # ==========================================
    # 1. SERVICIOS DE CONSULTA (JSON)
    # ==========================================

    @staticmethod
    def obtener_resumen_kpis(
        db: Session, 
        fecha_inicio: Optional[date] = None, 
        fecha_fin: Optional[date] = None, 
        zona_id: Optional[str] = None
    ) -> dict:        
        query_alertas = db.query(Alerta)
        query_resumen = db.query(ResumenDiarioLector)

        # Filtros de fecha y zona
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

        # Agrupamientos usando la query filtrada
        por_nivel_raw = query_alertas.with_entities(Alerta.nivel, func.count(Alerta.alerta_id))\
            .group_by(Alerta.nivel).all()
        alertas_por_nivel = {nivel or "Sin Nivel": count for nivel, count in por_nivel_raw}

        por_kpi_raw = query_alertas.with_entities(Alerta.kpi, func.count(Alerta.alerta_id))\
            .group_by(Alerta.kpi).all()
        alertas_por_kpi = {kpi or "Sin KPI": count for kpi, count in por_kpi_raw}

        # Cumplimiento promedio general
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
    def obtener_estado_alertas(
        db: Session, 
        fecha_inicio: Optional[date] = None, 
        fecha_fin: Optional[date] = None
    ) -> list:
        query = db.query(Alerta.estado_alerta, func.count(Alerta.alerta_id))
        if fecha_inicio:
            query = query.filter(Alerta.fecha >= fecha_inicio)
        if fecha_fin:
            query = query.filter(Alerta.fecha <= fecha_fin)
            
        resultado = query.group_by(Alerta.estado_alerta).all()
        return [{"estado": estado or "Pendiente", "cantidad": count} for estado, count in resultado]

    @staticmethod
    def obtener_ranking_trabajadores(db: Session, fecha: Optional[date] = None) -> list:    
        target_fecha = fecha or date.today()
        
        resumenes = db.query(ResumenDiarioLector, Trabajador)\
            .join(Trabajador, ResumenDiarioLector.ccodprs == Trabajador.ccodprs)\
            .filter(ResumenDiarioLector.fecha == target_fecha)\
            .all()

        # Conteo optimizado de alertas por fecha (evita N+1 queries)
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
                "ruta_asignada": resumen.ruta_id or "Sin Ruta",  # <--- CAMBIADO: Usamos ruta_id
                "grupo_facturacion": resumen.cmetfac or "N/A",  # opcional
                "total_alertas_acumuladas": total_alt,
                "promedio_cumplimiento": cumplimiento,
                "estado_general": estado_gen
            })

        return reporte


    # ==========================================
    # 2. GENERADOR EXCEL MULTI-HOJA
    # ==========================================

    @staticmethod
    def _generar_excel(hojas: Dict[str, pd.DataFrame]) -> io.BytesIO:
        """
        Toma un diccionario {"NombreHoja": DataFrame} y genera un Excel con formato básico.
        """
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            for nombre_hoja, df in hojas.items():
                df_clean = df.fillna("-")
                df_final = df_clean if not df_clean.empty else pd.DataFrame({"Información": ["Sin datos para los filtros seleccionados"]})
                
                # Truncar nombre de hoja si supera límite de 31 caracteres de Excel
                sheet_title = nombre_hoja[:30]
                df_final.to_excel(writer, sheet_name=sheet_title, index=False)
                
                # Ajustar ancho automático de columnas
                worksheet = writer.sheets[sheet_title]
                for col_idx, col in enumerate(df_final.columns, 1):
                    max_len = max(
                        df_final[col].astype(str).map(len).max() if not df_final.empty else 10,
                        len(str(col))
                    ) + 3
                    col_letter = pd.io.formats.excel.get_column_letter(col_idx)
                    worksheet.column_dimensions[col_letter].width = min(max_len, 50)  # máx 50 px
                    
        buffer.seek(0)
        return buffer

    @staticmethod
    def _empaquetar_excel(hojas: dict, nombre_base: str) -> Tuple[io.BytesIO, str, str]:
        buffer = ReportesService._generar_excel(hojas)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = f"{nombre_base}.xlsx"
        return buffer, media_type, filename


    # ==========================================
    # 3. EXPORTACIONES EXCEL
    # ==========================================

    @staticmethod
    def exportar_resumen_kpis(
        db: Session, 
        fecha_inicio: Optional[date] = None, 
        fecha_fin: Optional[date] = None,
        zona_id: Optional[str] = None
    ) -> Tuple[io.BytesIO, str, str]:
        
        data = ReportesService.obtener_resumen_kpis(db, fecha_inicio, fecha_fin, zona_id)

        df_resumen = pd.DataFrame([{
            "Total Alertas Registradas": data["total_alertas"],
            "Cumplimiento Promedio Lecturas (%)": data["cumplimiento_promedio_general"],
        }])
        
        df_por_nivel = pd.DataFrame(
            list(data["alertas_por_nivel"].items()), 
            columns=["Nivel de Alerta", "Cantidad"]
        )
        
        df_por_kpi = pd.DataFrame(
            list(data["alertas_por_kpi"].items()), 
            columns=["Tipo de KPI / Incidencia", "Cantidad"]
        )

        hojas = {
            "Resumen General": df_resumen,
            "Alertas por Nivel": df_por_nivel,
            "Alertas por KPI": df_por_kpi,
        }
        return ReportesService._empaquetar_excel(hojas, "reporte_kpis_resumen")

    @staticmethod
    def exportar_estado_alertas(
        db: Session, 
        fecha_inicio: Optional[date] = None, 
        fecha_fin: Optional[date] = None
    ) -> Tuple[io.BytesIO, str, str]:
        
        # 1. Pestaña 1: Resumen de conteo por Estado
        resumen_data = ReportesService.obtener_estado_alertas(db, fecha_inicio, fecha_fin)
        df_resumen = pd.DataFrame(resumen_data)
        if not df_resumen.empty:
            df_resumen.columns = ["Estado de Alerta", "Total Alertas"]

        # 2. Pestaña 2: Detalle Completo de las Alertas (para ver qué paso en cada una)
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

        if fecha_inicio:
            query_detalle = query_detalle.filter(Alerta.fecha >= fecha_inicio)
        if fecha_fin:
            query_detalle = query_detalle.filter(Alerta.fecha <= fecha_fin)

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
        
        # Consulta enriquecida con ResumenDiarioLector y EvaluacionDesempeno (si existe para la fecha)
        query = db.query(
            ResumenDiarioLector,
            Trabajador
        ).join(
            Trabajador, ResumenDiarioLector.ccodprs == Trabajador.ccodprs
        ).filter(
            ResumenDiarioLector.fecha == target_fecha
        )

        resumenes = query.all()

        # Cargar alertas en bloque
        alertas_raw = db.query(Alerta.ccodprs, func.count(Alerta.alerta_id))\
            .filter(Alerta.fecha == target_fecha)\
            .group_by(Alerta.ccodprs).all()
        mapa_alertas = {ccodprs: count for ccodprs, count in alertas_raw}

        # Cargar evaluaciones en bloque (si existen)
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
                "Ruta Asignada": resumen.ruta_id or "Sin Ruta",  # <--- Usando Ruta en lugar de Zona
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