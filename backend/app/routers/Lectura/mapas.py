from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.services.Lectura.mapas_service import MapasService
from app.schemas.Lectura.mapas import (
    RecorridoLectorResponse, 
    DiscrepanciasResponse, 
    HeatmapImpedimentosResponse
)

router = APIRouter(prefix="/api/maps", tags=["Mapas y Geoespacial"])

@router.get("/recorrido/{ccodprs}", response_model=RecorridoLectorResponse)
def obtener_recorrido(
    ccodprs: str, 
    fecha: date = Query(..., description="Fecha de la jornada (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Capa de Trazo y Recorrido (Breadcrumbs): Conecta cronológicamente los puntos GPS del lector."""
    return MapasService.obtener_recorrido_lector(db, ccodprs, fecha)

@router.get("/discrepancias", response_model=DiscrepanciasResponse)
def obtener_discrepancias(
    fecha_inicio: date = Query(None),
    fecha_fin: date = Query(None),
    zona_id: str = Query(None),
    db: Session = Depends(get_db)
):
    """Capa de Discrepancia Espacial: Retorna lecturas con desfase mayor a 50m (teórica vs real)."""
    return MapasService.obtener_discrepancias_espaciales(db, fecha_inicio, fecha_fin, zona_id)

@router.get("/heatmap-impedimentos", response_model=HeatmapImpedimentosResponse)
def obtener_heatmap(
    fecha_inicio: date = Query(None),
    fecha_fin: date = Query(None),
    zona_id: str = Query(None),
    db: Session = Depends(get_db)
):
    """Mapa de Calor de Impedimentos: Agrupación de zonas con alto índice de anomalías."""
    return MapasService.obtener_heatmap_impedimentos(db, fecha_inicio, fecha_fin, zona_id)