import os
from datetime import date
from typing import Optional
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.model import OrdenCorte

EXPORTS_DIR = "static/exports"
os.makedirs(EXPORTS_DIR, exist_ok=True)

def _fmt_fecha(val) -> str:
    if not val:
        return ""
    if isinstance(val, date):
        return val.strftime("%Y-%m-%d")
    return str(val)

def generar_reporte_financiero_excel(
    db: Session, 
    fecha_inicio: Optional[date] = None, 
    fecha_fin: Optional[date] = None
) -> dict:
    q = db.query(
        OrdenCorte.distrito.label("distrito"),
        getattr(OrdenCorte, 'cmetfac', OrdenCorte.distrito).label("zona"),
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
    resumen = q.group_by(OrdenCorte.distrito, getattr(OrdenCorte, 'cmetfac', OrdenCorte.distrito)).all()
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

    rango_str = f"_{fecha_inicio.strftime('%Y%m%d')}_a_{fecha_fin.strftime('%Y%m%d')}" if (fecha_inicio and fecha_fin) else ""
    nombre_archivo = f"reporte_financiero_cortes{rango_str}_{date.today().strftime('%Y%m%d')}.xlsx"
    ruta_completa = os.path.join(EXPORTS_DIR, nombre_archivo)

    df = pd.DataFrame(data)
    if df.empty:
        df = pd.DataFrame(columns=[
            "Distrito", "Zona / CMETFAC", "Total Órdenes", "Órdenes Ejecutadas",
            "Órdenes Pendientes", "Deuda Total (S/)", "Dinero Recuperado (S/)", "Deuda en Riesgo (S/)"
        ])

    df.to_excel(ruta_completa, index=False, engine="openpyxl")

    return {
        "status": "success",
        "message": f"Reporte financiero generado con {len(resumen)} distritos.",
        "tipo_reporte": "financiero",
        "nombre_archivo": nombre_archivo,
        "url_descarga": f"/static/exports/{nombre_archivo}",
        "total_registros": len(resumen)
    }

def generar_reporte_ineficiencia_excel(
    db: Session, 
    fecha_inicio: Optional[date] = None, 
    fecha_fin: Optional[date] = None
) -> dict:
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
            "Fecha Programada (DGENPRG)": _fmt_fecha(getattr(o, 'dgenprg', None))
        }
        for o in ordenes
    ]
    rango_str = f"_{fecha_inicio.strftime('%Y%m%d')}_a_{fecha_fin.strftime('%Y%m%d')}" if (fecha_inicio and fecha_fin) else ""
    nombre_archivo = f"reporte_ineficiencia_impedimentos{rango_str}_{date.today().strftime('%Y%m%d')}.xlsx"
    ruta_completa = os.path.join(EXPORTS_DIR, nombre_archivo)
    df = pd.DataFrame(data)
    if df.empty:
        df = pd.DataFrame(columns=[
            "Código Conexión (CCODCNX)", "Código Programa (CCODPRG)", "Distrito", "Dirección",
            "Categoría", "Deuda en Riesgo (S/)", "Meses Deuda", "Situación Registro (CSITREG)",
            "Código Impedimento / Acceso (CCODACC)", "Descripción Impedimento (CDESACC)", "Fecha Programada (DGENPRG)"
        ])
    df.to_excel(ruta_completa, index=False, engine="openpyxl")
    return {
        "status": "success",
        "message": f"Reporte de ineficiencia generado con {len(ordenes)} impedimentos.",
        "tipo_reporte": "ineficiencia",
        "nombre_archivo": nombre_archivo,
        "url_descarga": f"/static/exports/{nombre_archivo}",
        "total_registros": len(ordenes)
    }