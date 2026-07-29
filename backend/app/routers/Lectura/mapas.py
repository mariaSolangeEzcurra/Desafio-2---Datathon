from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.services.Lectura.mapas_service import MapasService
from app.schemas.Lectura.mapas import (
    DiscrepanciasResponse, 
    HeatmapImpedimentosResponse
)

router = APIRouter(prefix="/api/maps", tags=["Mapas y Geoespacial"])

@router.get("/discrepancias", response_model=DiscrepanciasResponse)
def obtener_discrepancias(
    fecha_inicio: date = Query(None, description="Fecha de inicio (YYYY-MM-DD)"),
    fecha_fin: date = Query(None, description="Fecha de fin (YYYY-MM-DD)"),
    zona_id: str = Query(None, description="Filtrar por Zona ID"),
    cmetfac: str = Query(None, description="Filtrar por Sector de Facturación"),
    db: Session = Depends(get_db)
):
    return MapasService.obtener_discrepancias_espaciales(
        db=db, 
        fecha_inicio=fecha_inicio, 
        fecha_fin=fecha_fin, 
        zona_id=zona_id, 
        cmetfac=cmetfac
    )

@router.get("/heatmap-impedimentos", response_model=HeatmapImpedimentosResponse)
def obtener_heatmap(
    fecha_inicio: date = Query(None, description="Fecha de inicio (YYYY-MM-DD)"),
    fecha_fin: date = Query(None, description="Fecha de fin (YYYY-MM-DD)"),
    zona_id: str = Query(None, description="Filtrar por Zona ID"),
    cmetfac: str = Query(None, description="Filtrar por Sector de Facturación"),
    db: Session = Depends(get_db)
):
    return MapasService.obtener_heatmap_impedimentos(
        db=db, 
        fecha_inicio=fecha_inicio, 
        fecha_fin=fecha_fin, 
        zona_id=zona_id, 
        cmetfac=cmetfac
    )