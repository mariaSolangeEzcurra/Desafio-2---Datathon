import io
import pandas as pd
from typing import Tuple, Optional, Dict
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from openpyxl.utils import get_column_letter
from app.model import OrdenCorte

class CortesReportesService:

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
        fecha_fin: Optional[date] = None
    ) -> Tuple[io.BytesIO, str, str]:
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

        if fecha_inicio:
            q = q.filter(OrdenCorte.dgenprg >= fecha_inicio)
        if fecha_fin:
            q = q.filter(OrdenCorte.dgenprg <= fecha_fin)

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

        df = pd.DataFrame(data)
        if df.empty:
            df = pd.DataFrame(columns=[
                "Distrito", "Zona / CMETFAC", "Total Órdenes", "Órdenes Ejecutadas",
                "Órdenes Pendientes", "Deuda Total (S/)", "Dinero Recuperado (S/)", "Deuda en Riesgo (S/)"
            ])

        rango_str = f"_{CortesReportesService._fmt_fecha(fecha_inicio)}_a_{CortesReportesService._fmt_fecha(fecha_fin)}" if (fecha_inicio and fecha_fin) else ""
        nombre_base = f"reporte_financiero_cortes{rango_str}_{date.today().strftime('%Y%m%d')}"

        hojas = {"Resumen Financiero": df}
        return CortesReportesService._empaquetar_excel(hojas, nombre_base)

    @staticmethod
    def exportar_reporte_ineficiencia_excel(
        db: Session, 
        fecha_inicio: Optional[date] = None, 
        fecha_fin: Optional[date] = None
    ) -> Tuple[io.BytesIO, str, str]:
        query = db.query(OrdenCorte).filter(
            (OrdenCorte.cimpcrp != None) | 
            (OrdenCorte.csitreg == 'S') | 
            (OrdenCorte.ccodacc != None)
        )
        if fecha_inicio:
            query = query.filter(OrdenCorte.dgenprg >= fecha_inicio)
        if fecha_fin:
            query = query.filter(OrdenCorte.dgenprg <= fecha_fin)

        ordenes = query.all()
        data = [
            {
                "Código Conexión (CCODCNX)": getattr(o, 'ccodcnx', ''),
                "Código Programa (CCODPRG)": getattr(o, 'ccodprg', getattr(o, 'ctipprg', '')),
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
        if df.empty:
            df = pd.DataFrame(columns=[
                "Código Conexión (CCODCNX)", "Código Programa (CCODPRG)", "Distrito", "Dirección",
                "Categoría", "Deuda en Riesgo (S/)", "Meses Deuda", "Situación Registro (CSITREG)",
                "Código Impedimento / Acceso (CCODACC)", "Descripción Impedimento (CDESACC)", "Fecha Programada (DGENPRG)"
            ])

        rango_str = f"_{CortesReportesService._fmt_fecha(fecha_inicio)}_a_{CortesReportesService._fmt_fecha(fecha_fin)}" if (fecha_inicio and fecha_fin) else ""
        nombre_base = f"reporte_ineficiencia_impedimentos{rango_str}_{date.today().strftime('%Y%m%d')}"

        hojas = {"Detalle Ineficiencias": df}
        return CortesReportesService._empaquetar_excel(hojas, nombre_base)