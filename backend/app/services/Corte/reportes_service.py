import io
import pandas as pd
from typing import Tuple, Optional, Dict, List
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from openpyxl.utils import get_column_letter
from app.model import OrdenCorte
from app.services.Corte.alerta_service import evaluar_alertas_cortes

class CortesReportesService:

    @staticmethod
    def _calcular_fechas_por_periodo(periodo: Optional[str], fecha_inicio: Optional[date] = None, fecha_fin: Optional[date] = None):
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
    def _fmt_fecha(val) -> str:
        if not val:
            return ""
        if isinstance(val, date):
            return val.strftime("%Y-%m-%d")
        return str(val)

    @staticmethod
    def _generar_excel(hojas: Dict[str, pd.DataFrame]) -> io.BytesIO:
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            for nombre_hoja, df in hojas.items():
                df_clean = df.fillna("-")
                df_final = df_clean if not df_clean.empty else pd.DataFrame(
                    {"Información": ["Sin datos para los filtros seleccionados"]}
                )
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
        buffer = CortesReportesService._generar_excel(hojas)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = f"{nombre_base}.xlsx"
        return buffer, media_type, filename

    @staticmethod
    def exportar_reporte_financiero_excel(
        db: Session, 
        fecha_inicio: Optional[date] = None, 
        fecha_fin: Optional[date] = None,
        periodo: Optional[str] = None
    ) -> Tuple[io.BytesIO, str, str]:
        f_inicio, f_fin = CortesReportesService._calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)
        col_zona = getattr(OrdenCorte, 'cmetfac', OrdenCorte.distrito)

        q = db.query(
            OrdenCorte.distrito.label("distrito"),
            col_zona.label("zona"),
            func.count(OrdenCorte.id_orden).label("total_ordenes"),
            func.sum(case((OrdenCorte.dejecuc != None, 1), else_=0)).label("ordenes_ejecutadas"),
            func.sum(case((OrdenCorte.dejecuc == None, 1), else_=0)).label("ordenes_pendientes"),
            func.sum(OrdenCorte.ntotdeu).label("deuda_total"),
            func.sum(case((OrdenCorte.dejecuc != None, OrdenCorte.ntotdeu), else_=0)).label("dinero_recuperado"),
            func.sum(case((OrdenCorte.dejecuc == None, OrdenCorte.ntotdeu), else_=0)).label("deuda_riesgo")
        )

        if f_inicio:
            q = q.filter(OrdenCorte.dgenprg >= f_inicio)
        if f_fin:
            q = q.filter(OrdenCorte.dgenprg <= f_fin)

        resumen = q.group_by(OrdenCorte.distrito, col_zona).all()

        data = [
            {
                "Distrito": r.distrito or "NO ESPECIFICADO",
                "Zona / CMETFAC": r.zona or "-",
                "Total Órdenes": r.total_ordenes or 0,
                "Órdenes Ejecutadas": r.ordenes_ejecutadas or 0,
                "Órdenes Pendientes": r.ordenes_pendientes or 0,
                "Deuda Total (S/)": round(float(r.deuda_total or 0.0), 2),
                "Dinero Recuperado (S/)": round(float(r.dinero_recuperado or 0.0), 2),
                "Deuda en Riesgo (S/)": round(float(r.deuda_riesgo or 0.0), 2)
            }
            for r in resumen
        ]

        df_finanzas = pd.DataFrame(data)
        alertas_res = evaluar_alertas_cortes(db, f_inicio, f_fin, periodo)
        df_alertas = pd.DataFrame(alertas_res["alertas"])

        rango_str = f"_{CortesReportesService._fmt_fecha(f_inicio)}_a_{CortesReportesService._fmt_fecha(f_fin)}" if (f_inicio and f_fin) else ""
        nombre_base = f"reporte_financiero_cortes{rango_str}_{date.today().strftime('%Y%m%d')}"

        hojas = {
            "Resumen Financiero": df_finanzas,
            "KPIs Operativos": df_alertas
        }
        return CortesReportesService._empaquetar_excel(hojas, nombre_base)

    @staticmethod
    def exportar_reporte_ineficiencia_excel(
        db: Session, 
        fecha_inicio: Optional[date] = None, 
        fecha_fin: Optional[date] = None,
        periodo: Optional[str] = None
    ) -> Tuple[io.BytesIO, str, str]:
        f_inicio, f_fin = CortesReportesService._calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)

        query = db.query(OrdenCorte).filter(
            (OrdenCorte.cimpcrp != None) | 
            (OrdenCorte.csitreg == 'S') | 
            (OrdenCorte.ccodacc != None)
        )
        if f_inicio:
            query = query.filter(OrdenCorte.dgenprg >= f_inicio)
        if f_fin:
            query = query.filter(OrdenCorte.dgenprg <= f_fin)

        ordenes = query.all()
        data = [
            {
                "Código Conexión (CCODCNX)": getattr(o, 'ccodcnx', ''),
                "Código Personal (CCODPRS)": getattr(o, 'ccodprs', ''),
                "Nombre Personal (CNOMPRS)": getattr(o, 'cnomprs', 'NO ASIGNADO'),
                "Distrito": getattr(o, 'distrito', ''),
                "Dirección": getattr(o, 'direccion', ''),
                "Categoría": getattr(o, 'categoria', getattr(o, 'cdescateg', 'DOMESTICO')),
                "Deuda en Riesgo (S/)": float(getattr(o, 'ntotdeu', 0.0) or 0.0),
                "Meses Deuda": getattr(o, 'nnumrec', getattr(o, 'meses_deuda', 0)),
                "Situación Registro (CSITREG)": getattr(o, 'csitreg', ''),
                "Código Impedimento / Acceso (CCODACC)": getattr(o, 'ccodacc', getattr(o, 'cimpcrp', '')),
                "Descripción Impedimento (CDESACC)": getattr(o, 'cdesacc', ''),
                "Fecha Programada (DGENPRG)": CortesReportesService._fmt_fecha(getattr(o, 'dgenprg', None))
            }
            for o in ordenes
        ]

        df = pd.DataFrame(data)
        rango_str = f"_{CortesReportesService._fmt_fecha(f_inicio)}_a_{CortesReportesService._fmt_fecha(f_fin)}" if (f_inicio and f_fin) else ""
        nombre_base = f"reporte_ineficiencia_impedimentos{rango_str}_{date.today().strftime('%Y%m%d')}"

        hojas = {"Detalle Ineficiencias": df}
        return CortesReportesService._empaquetar_excel(hojas, nombre_base)

    @staticmethod
    def exportar_reporte_personal_excel(
        db: Session, 
        fecha_inicio: Optional[date] = None, 
        fecha_fin: Optional[date] = None,
        periodo: Optional[str] = None
    ) -> Tuple[io.BytesIO, str, str]:
        f_inicio, f_fin = CortesReportesService._calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)
        col_nombre = getattr(OrdenCorte, 'cnomprs', getattr(OrdenCorte, 'CNOMPRS', OrdenCorte.ccodprs))

        q = db.query(
            OrdenCorte.ccodprs.label("codigo_personal"),
            col_nombre.label("nombre_personal"),
            func.count(OrdenCorte.id_orden).label("total_asignadas"),
            func.sum(case((OrdenCorte.dejecuc != None, 1), else_=0)).label("ejecutadas"),
            func.sum(case((OrdenCorte.csitreg == 'S', 1), else_=0)).label("impedimentos"),
            func.sum(case((OrdenCorte.dejecuc == None, 1), else_=0)).label("pendientes")
        )

        if f_inicio:
            q = q.filter(OrdenCorte.dgenprg >= f_inicio)
        if f_fin:
            q = q.filter(OrdenCorte.dgenprg <= f_fin)

        resumen_personal = q.group_by(OrdenCorte.ccodprs, col_nombre).all()

        data = []
        for r in resumen_personal:
            total = r.total_asignadas or 0
            ejec = r.ejecutadas or 0
            imp = r.impedimentos or 0
            pct_efectividad = round((ejec / total * 100), 2) if total > 0 else 0.0

            data.append({
                "Código Operario": r.codigo_personal or "N/A",
                "Nombre Operario": str(r.nombre_personal or "NO ASIGNADO"),
                "Órdenes Asignadas": total,
                "Cortes Ejecutados": ejec,
                "Impedimentos Registrados": imp,
                "Órdenes Pendientes": r.pendientes or 0,
                "% Efectividad Operativa": pct_efectividad
            })

        df_personal = pd.DataFrame(data)
        if df_personal.empty:
            df_personal = pd.DataFrame(columns=[
                "Código Operario", "Nombre Operario", "Órdenes Asignadas", 
                "Cortes Ejecutados", "Impedimentos Registrados", "Órdenes Pendientes", "% Efectividad Operativa"
            ])

        rango_str = f"_{CortesReportesService._fmt_fecha(f_inicio)}_a_{CortesReportesService._fmt_fecha(f_fin)}" if (f_inicio and f_fin) else ""
        nombre_base = f"reporte_rendimiento_personal{rango_str}_{date.today().strftime('%Y%m%d')}"

        hojas = {"Rendimiento por Operario": df_personal}
        return CortesReportesService._empaquetar_excel(hojas, nombre_base)