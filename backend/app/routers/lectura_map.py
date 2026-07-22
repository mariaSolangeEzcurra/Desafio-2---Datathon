from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.database import get_db
from app.schemas import RespuestaMapa
from app.services.Mapas.lectura_map_service import obtener_datos_mapa_service

router = APIRouter(prefix="/api/mapas", tags=["Mapas GIS"])

# Lista de vistas permitidas para mayor seguridad
VISTAS_VALIDAS = ["rutas", "gps", "impedimentos"]

@router.get("/{tipo_vista}", response_model=RespuestaMapa)
def get_mapa_data(
    tipo_vista: str,
    trabajador: Optional[str] = None,
    fecha: Optional[date] = None,
    ruta: Optional[str] = None,
    distrito: Optional[str] = None,
    tipo_impedimento: Optional[str] = None,
    grupo_facturacion: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Validación de seguridad
    if tipo_vista not in VISTAS_VALIDAS:
        raise HTTPException(
            status_code=400, 
            detail=f"Tipo de vista inválido. Use uno de: {', '.join(VISTAS_VALIDAS)}"
        )

    # Empaquetamos los filtros
    filtros = {
        "trabajador": trabajador,
        "fecha": fecha,
        "ruta": ruta,
        "distrito": distrito,
        "tipo_impedimento": tipo_impedimento,
        "grupo_facturacion": grupo_facturacion
    }
    
    # Llamamos al servicio
    data = obtener_datos_mapa_service(db, tipo_vista, filtros)
    
    return {
        "total": len(data),
        "data": data
    }