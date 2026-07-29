from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

# Imports ajustados exactamente a la estructura real de tu proyecto:
from app.services.Lectura.personal_service import PersonalService
from app.services.Lectura.dashboard_kpis_service import KpiLecturaService
from app.services.Lectura.alertas_service import AlertasService


# ==========================================
# 1. RESUMEN GRUPO FACTURACIÓN (CMETFAC / ZONA)
# ==========================================
def obtener_resumen_grupo_facturacion(
    db: Session, 
    fecha_inicio: date, 
    fecha_fin: Optional[date] = None, 
    cmetfac: Optional[str] = None
):
    if not fecha_fin:
        fecha_fin = fecha_inicio

    # Consumimos KpiLecturaService mapeando cmetfac al parámetro zona_id
    resumen_kpi = KpiLecturaService.obtener_kpis_generales(
        db=db, 
        fecha_inicio=fecha_inicio, 
        fecha_fin=fecha_fin, 
        zona_id=cmetfac
    )

    # Convertimos dict / objeto Pydantic a diccionario seguro
    data = resumen_kpi if isinstance(resumen_kpi, dict) else (resumen_kpi.model_dump() if hasattr(resumen_kpi, 'model_dump') else resumen_kpi.__dict__)

    return {
        "periodo": {"fecha_inicio": fecha_inicio, "fecha_fin": fecha_fin},
        "cmetfac_filtrado": cmetfac or "Todos",
        "total_lecturas_realizadas": data.get("total_lecturas_realizadas", data.get("lecturas_realizadas", 0)),
        "eficiencia_promedio": round(float(data.get("eficiencia_promedio", data.get("eficiencia", 0.0))), 2),
        "total_registros_analizados": data.get("total_registros_analizados", data.get("total_lectores", 0)),
        "total_lectores_evaluados": data.get("total_lectores_evaluados", data.get("lectores_activos", 0))
    }


# ==========================================
# 2. RANKING DE PERSONAL (CON FICHA INTEGRADA)
# ==========================================
def obtener_ranking_personal_service(
    db: Session, 
    fecha_inicio: date, 
    fecha_fin: Optional[date] = None, 
    cmetfac: Optional[str] = None, 
    limit: int = 10
):
    if not fecha_fin:
        fecha_fin = fecha_inicio

    # 1. Obtenemos el ranking básico desde el servicio de KPIs
    ranking_raw = KpiLecturaService.obtener_ranking_lectores(
        db=db, 
        fecha_inicio=fecha_inicio, 
        fecha_fin=fecha_fin, 
        limit=limit
    )

    resultado = []

    for item in ranking_raw:
        # Convertimos a diccionario según el tipo de objeto retornado
        item_dict = item if isinstance(item, dict) else (item.model_dump() if hasattr(item, 'model_dump') else item.__dict__)
        
        ccodprs = item_dict.get("ccodprs")
        if not ccodprs:
            continue

        # 2. Consultamos la ficha real del empleado
        ficha = PersonalService.obtener_ficha_trabajador(db=db, ccodprs=ccodprs)

        # Valores por defecto
        nombre = item_dict.get("nombre", "Desconocido")
        eficiencia_val = item_dict.get("eficiencia", 0.0)
        lecturas_val = item_dict.get("lecturas_realizadas", item_dict.get("total_lecturas", 0))
        duracion_val = item_dict.get("duracion_total_min", item_dict.get("tiempo_min", 0.0))
        ruta_val = "Sin ruta"
        cmet_val = "Sin metfac"

        if ficha:
            f_dict = ficha if isinstance(ficha, dict) else (ficha.model_dump() if hasattr(ficha, 'model_dump') else ficha.__dict__)
            nombre = f_dict.get("nombre", nombre)
            
            # Extraemos la información real desde 'historial_asistencia'
            historial = f_dict.get("historial_asistencia", [])
            if historial and len(historial) > 0:
                h_primero = historial[0]
                h_dict = h_primero if isinstance(h_primero, dict) else (h_primero.model_dump() if hasattr(h_primero, 'model_dump') else h_primero.__dict__)
                
                # Rescatamos los valores reales que vienen en la ficha
                ruta_val = h_dict.get("ruta_id", "Sin ruta")
                cmet_val = h_dict.get("cmetfac", "Sin metfac")
                
                # Si en el ranking venían en 0, los rescatamos del historial
                if not eficiencia_val and "eficiencia" in h_dict:
                    eficiencia_val = h_dict.get("eficiencia", 0.0)
                if not duracion_val and "duracion_total_min" in h_dict:
                    duracion_val = h_dict.get("duracion_total_min", 0.0)
                if not lecturas_val and "lecturas_realizadas" in h_dict:
                    lecturas_val = h_dict.get("lecturas_realizadas", 0)

        # Aplicamos el filtro por cmetfac si fue enviado en los parámetros de URL
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

# ==========================================
# 3. RIESGO OPERATIVO Y ALERTAS (RANGO)
# ==========================================
def obtener_riesgo_operativo_service(
    db: Session, 
    fecha_inicio: date, 
    fecha_fin: Optional[date] = None
):
    if not fecha_fin:
        fecha_fin = fecha_inicio

    # Usamos AlertasService.listar_alertas pasándole la fecha de inicio
    alertas_raw = AlertasService.listar_alertas(
        db=db, 
        fecha=fecha_inicio
    )

    criticas = 0
    medias = 0
    bajas = 0
    detalle = []

    for a in alertas_raw:
        a_dict = a if isinstance(a, dict) else (a.model_dump() if hasattr(a, 'model_dump') else a.__dict__)
        
        nivel = a_dict.get("nivel", "Bajo")
        if nivel in ["Crítico", "Alto"]:
            criticas += 1
        elif nivel == "Medio":
            medias += 1
        else:
            bajas += 1

        detalle.append({
            "alerta_id": a_dict.get("alerta_id", ""),
            "fecha": a_dict.get("fecha", fecha_inicio),
            "nivel": nivel,
            "kpi": a_dict.get("kpi", ""),
            "motivo": a_dict.get("motivo", ""),
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