from sqlalchemy.orm import Session
from app.model import Actividad

def obtener_datos_mapa_service(db: Session, tipo_vista: str, filtros: dict):
    # 1. Filtro base: Solo traer registros que tengan coordenadas válidas
    query = db.query(Actividad).filter(
        Actividad.latitud.isnot(None), 
        Actividad.longitud.isnot(None)
    )

    # 2. Aplicar filtros dinámicos (Common Filters)
    if filtros.get("grupo_facturacion"):
        query = query.filter(Actividad.grupo_facturacion == filtros["grupo_facturacion"])
    
    # 3. Filtros específicos por tipo_vista
    if tipo_vista == "rutas":
        if filtros.get("trabajador"):
            query = query.filter(Actividad.trabajador == filtros["trabajador"])
        if filtros.get("fecha"):
            query = query.filter(Actividad.fecha == filtros["fecha"])
        if filtros.get("ruta"):
            query = query.filter(Actividad.ruta == filtros["ruta"])

    elif tipo_vista == "gps":
        if filtros.get("trabajador"):
            query = query.filter(Actividad.trabajador == filtros["trabajador"])
        if filtros.get("fecha"):
            query = query.filter(Actividad.fecha == filtros["fecha"])

    elif tipo_vista == "impedimentos":
        if filtros.get("distrito"):
            query = query.filter(Actividad.distrito == filtros["distrito"])
        if filtros.get("tipo_impedimento"):
            query = query.filter(Actividad.tipo_impedimento == filtros["tipo_impedimento"])

    # 4. Ejecución
    resultados = query.all()

    # 5. Transformación segura (Mapeo)
    datos_mapeados = []
    for item in resultados:
        try:
            datos_mapeados.append({
                "id": item.id,
                # Convertimos a float explícitamente para cumplir con Pydantic
                "latitud": float(item.latitud),
                "longitud": float(item.longitud),
                "descripcion": f"ID: {item.id} - {tipo_vista.upper()}",
                "tipo": tipo_vista,
                "metadata": {
                    "trabajador": getattr(item, 'trabajador', 'N/A'),
                    "motivo": getattr(item, 'motivo', 'Sin motivo'),
                    "grupo": getattr(item, 'grupo_facturacion', 'N/A')
                }
            })
        except (ValueError, TypeError):
            # Si hay un error de conversión (ej. latitud no es un número), saltamos el registro
            continue

    return datos_mapeados