from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from sqlalchemy import func
from app.model import ResumenDiarioLector, Actividad, Alerta

from app.services.Lectura.personal_service import PersonalService
from app.services.Lectura.dashboard_kpis_service import KpiLecturaService
from app.services.Lectura.alertas_service import AlertasService
from app.services.Corte.kpisCorte_service import (calcular_dashboard_kpis as calcular_kpis_cortes,calcular_resumen_cortes)
from app.services.Corte.mapa_service import (obtener_datos_impedimentos,obtener_datos_heatmap)

def obtener_resumen_grupo_facturacion(
    db: Session, 
    fecha_inicio: date, 
    fecha_fin: Optional[date] = None, 
    cmetfac: Optional[str] = None
):
    if not fecha_fin:
        fecha_fin = fecha_inicio
    resumen_kpi = KpiLecturaService.obtener_kpis_generales(
        db=db, 
        fecha_inicio=fecha_inicio, 
        fecha_fin=fecha_fin, 
        zona_id=cmetfac
    )

    data = resumen_kpi if isinstance(resumen_kpi, dict) else (
        resumen_kpi.model_dump() if hasattr(resumen_kpi, 'model_dump') else resumen_kpi.__dict__
    )
    query_base = db.query(
        func.count(ResumenDiarioLector.id).label("registros"),
        func.count(func.distinct(ResumenDiarioLector.ccodprs)).label("lectores")
    ).filter(ResumenDiarioLector.fecha.between(fecha_inicio, fecha_fin))

    if cmetfac:
        lectores_en_zona = db.query(Actividad.ccodprs)\
            .filter(Actividad.cmetfac == cmetfac)\
            .distinct().subquery()
        query_base = query_base.filter(ResumenDiarioLector.ccodprs.in_(lectores_en_zona))

    conteo = query_base.first()
    total_registros = conteo.registros if conteo else 0
    total_lectores = conteo.lectores if conteo else 0
    eficiencia = data.get("cumplimiento_lectura", 0.0) 
    total_realizadas = data.get("total_lecturas_realizadas", 0)

    return {
        "periodo": {"fecha_inicio": fecha_inicio, "fecha_fin": fecha_fin},
        "cmetfac_filtrado": cmetfac or "Todos",
        "total_lecturas_realizadas": total_realizadas,
        "eficiencia_promedio": round(float(eficiencia), 2),
        "total_registros_analizados": total_registros,
        "total_lectores_evaluados": total_lectores
    }

def obtener_ranking_personal_service(
    db: Session, 
    fecha_inicio: date, 
    fecha_fin: Optional[date] = None, 
    cmetfac: Optional[str] = None, 
    limit: int = 10
):
    if not fecha_fin:
        fecha_fin = fecha_inicio
    ranking_raw = KpiLecturaService.obtener_ranking_lectores(
        db=db, 
        fecha_inicio=fecha_inicio, 
        fecha_fin=fecha_fin, 
        limit=limit
    )
    resultado = []
    for item in ranking_raw:
        item_dict = item if isinstance(item, dict) else (item.model_dump() if hasattr(item, 'model_dump') else item.__dict__)        
        ccodprs = item_dict.get("ccodprs")
        if not ccodprs:
            continue
        ficha = PersonalService.obtener_ficha_trabajador(db=db, ccodprs=ccodprs)
        nombre = item_dict.get("nombre", "Desconocido")
        eficiencia_val = item_dict.get("eficiencia", 0.0)
        lecturas_val = item_dict.get("lecturas_realizadas", item_dict.get("total_lecturas", 0))
        duracion_val = item_dict.get("duracion_total_min", item_dict.get("tiempo_min", 0.0))
        ruta_val = "Sin ruta"
        cmet_val = "Sin metfac"
        if ficha:
            f_dict = ficha if isinstance(ficha, dict) else (ficha.model_dump() if hasattr(ficha, 'model_dump') else ficha.__dict__)
            nombre = f_dict.get("nombre", nombre)            
            historial = f_dict.get("historial_asistencia", [])
            if historial and len(historial) > 0:
                h_primero = historial[0]
                h_dict = h_primero if isinstance(h_primero, dict) else (h_primero.model_dump() if hasattr(h_primero, 'model_dump') else h_primero.__dict__)
                
                ruta_val = h_dict.get("ruta_id", "Sin ruta")
                cmet_val = h_dict.get("cmetfac", "Sin metfac")
                if not eficiencia_val and "eficiencia" in h_dict:
                    eficiencia_val = h_dict.get("eficiencia", 0.0)
                if not duracion_val and "duracion_total_min" in h_dict:
                    duracion_val = h_dict.get("duracion_total_min", 0.0)
                if not lecturas_val and "lecturas_realizadas" in h_dict:
                    lecturas_val = h_dict.get("lecturas_realizadas", 0)
        if cmetfac and cmet_val != cmetfac.strip():
            continue
        resultado.append({
            "ccodprs": ccodprs,
            "nombre_trabajador": nombre,
            "eficiencia": round(float(eficiencia_val or 0.0), 2),
            "lecturas_realizadas": int(lecturas_val or 0),
            "duracion_total_min": round(float(duracion_val or 0.0), 2),
            "cmetfac": cmet_val,
            "ruta_id": ruta_val
        })
    return {
        "periodo": {"fecha_inicio": fecha_inicio, "fecha_fin": fecha_fin},
        "cmetfac_filtrado": cmetfac or "Todos",
        "ranking": resultado[:limit]
    }
def obtener_riesgo_operativo_service(
    db: Session, 
    fecha_inicio: date, 
    fecha_fin: Optional[date] = None
):
    if not fecha_fin:
        fecha_fin = fecha_inicio

    # Intentamos primero listar desde AlertasService enviando ambas fechas si el método lo soporta,
    # o consultamos directamente la tabla de Alertas por el rango solicitado:
    try:
        alertas_raw = AlertasService.listar_alertas(
            db=db, 
            fecha_inicio=fecha_inicio, 
            fecha_fin=fecha_fin
        )
    except TypeError:
        # Fallback si listar_alertas solo acepta el parámetro 'fecha' o 'fecha_inicio'
        query = db.query(Alerta).filter(Alerta.fecha.between(fecha_inicio, fecha_fin))
        alertas_raw = query.all()

    criticas = 0
    medias = 0
    bajas = 0
    detalle = []

    for a in alertas_raw:
        a_dict = a if isinstance(a, dict) else (
            a.model_dump() if hasattr(a, 'model_dump') else a.__dict__
        )
        
        # Normalizamos a minúsculas y sin tildes para evitar descalces de texto
        nivel_raw = str(a_dict.get("nivel", "bajo")).strip().lower()
        
        if nivel_raw in ["critico", "crítico", "alto"]:
            criticas += 1
            nivel_formateado = "Crítico"
        elif nivel_raw in ["medio", "media"]:
            medias += 1
            nivel_formateado = "Medio"
        else:
            bajas += 1
            nivel_formateado = "Bajo"

        detalle.append({
            "alerta_id": a_dict.get("alerta_id", a_dict.get("id", "")),
            "fecha": a_dict.get("fecha", fecha_inicio),
            "nivel": nivel_formateado,
            "kpi": a_dict.get("kpi", ""),
            "motivo": a_dict.get("motivo", a_dict.get("descripcion", "")),
            "estado": a_dict.get("estado_alerta", a_dict.get("estado", "Pendiente")),
            "ccodprs": a_dict.get("ccodprs", None)
        })

    return {
        "periodo": {"fecha_inicio": fecha_inicio, "fecha_fin": fecha_fin},
        "total_alertas": len(detalle),
        "resumen_niveles": {
            "criticas_y_altas": criticas,
            "medias": medias,
            "bajas": bajas
        },
        "detalle_alertas": detalle
    }

def obtener_kpis_cortes_gerencia(
    db: Session,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None
):
    if not fecha_fin:
        fecha_fin = fecha_inicio
    kpis_globales = calcular_kpis_cortes(
        db=db, 
        fecha_inicio=fecha_inicio, 
        fecha_fin=fecha_fin
    )
    return {
        "periodo": {"fecha_inicio": fecha_inicio, "fecha_fin": fecha_fin},
        "kpis_globales": kpis_globales
    }

def obtener_desglose_cortes_gerencia(
    db: Session,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None
):
    if not fecha_fin:
        fecha_fin = fecha_inicio
    resumen_desglose = calcular_resumen_cortes(
        db=db, 
        fecha_inicio=fecha_inicio, 
        fecha_fin=fecha_fin
    )
    return {
        "periodo": {"fecha_inicio": fecha_inicio, "fecha_fin": fecha_fin},
        "desglose": resumen_desglose
    }

def obtener_impedimentos_cortes_gerencia(
    db: Session,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None
):
    if not fecha_fin:
        fecha_fin = fecha_inicio

    impedimentos_data = obtener_datos_impedimentos(
        db=db, 
        fecha_inicio=fecha_inicio, 
        fecha_fin=fecha_fin
    )

    return {
        "periodo": {"fecha_inicio": fecha_inicio, "fecha_fin": fecha_fin},
        "total_impedimentos": impedimentos_data.get("total_impedimentos", 0),
        "detalle_impedimentos": impedimentos_data.get("impedimentos", [])
    }