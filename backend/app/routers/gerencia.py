from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.database import get_db
from app.schemas.gerencia import (
    ResumenGrupoFacturacionResponse,
    RankingPersonalResponse,
    RiesgoOperativoResponse
)
from app.services.gerencia_service import (
    obtener_resumen_grupo_facturacion,
    obtener_ranking_personal_service,
    obtener_riesgo_operativo_service
)

router = APIRouter(prefix="/api/gerencia", tags=["Gerencia - Analítica Ejecutiva"])

@router.get("/grupos-facturacion/resumen", response_model=ResumenGrupoFacturacionResponse)
def get_resumen_grupo_facturacion(
    fecha_inicio: date = Query(..., description="Fecha inicial del análisis (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha final opcional (Si no se envía, analiza solo fecha_inicio)"),
    cmetfac: Optional[str] = Query(None, description="Filtrar por grupo de facturación específico"),
    db: Session = Depends(get_db)
):
    return obtener_resumen_grupo_facturacion(
        db=db, 
        fecha_inicio=fecha_inicio, 
        fecha_fin=fecha_fin, 
        cmetfac=cmetfac
    )

@router.get("/rankings/personal", response_model=RankingPersonalResponse)
def get_ranking_personal(
    fecha_inicio: date = Query(..., description="Fecha inicial de evaluación (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha final opcional"),
    cmetfac: Optional[str] = Query(None, description="Filtrar por grupo de facturación"),
    limit: int = Query(10, ge=1, le=100, description="Cantidad de registros para el top"),
    db: Session = Depends(get_db)
):
    return obtener_ranking_personal_service(
        db=db, 
        fecha_inicio=fecha_inicio, 
        fecha_fin=fecha_fin, 
        cmetfac=cmetfac, 
        limit=limit
    )

@router.get("/alertas/riesgo-operativo", response_model=RiesgoOperativoResponse)
def get_riesgo_operativo(
    fecha_inicio: date = Query(..., description="Fecha inicial de control (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha final opcional"),
    db: Session = Depends(get_db)
):
    return obtener_riesgo_operativo_service(
        db=db, 
        fecha_inicio=fecha_inicio, 
        fecha_fin=fecha_fin
    )