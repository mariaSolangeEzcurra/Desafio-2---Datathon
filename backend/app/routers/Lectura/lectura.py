from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional

from app.database import get_db
from app.services.Lectura.lectura_service import obtener_kpis_lectura, obtener_grupos_facturacion
from app.schemas.Lectura.lectura import KPIListaResponse
router = APIRouter(
    prefix="/lectura",
    tags=["Lectura"]
)

@router.get("/kpis", response_model=KPIListaResponse)
def listar_kpis_lectura(
    periodo: str = Query("dia", description="Filtro predefinido: dia, semana, mes"),
    fecha_seleccionada: Optional[date] = Query(None, description="Fecha exacta del calendario (YYYY-MM-DD)"),
    grupo_facturacion: Optional[str] = Query(None, description="Filtrar por grupo CMETFAC"),
    trabajador: Optional[str] = Query(None, description="Filtrar por código de trabajador CCODPRS"),
    db: Session = Depends(get_db)
):
    """
    Obtiene los 7 KPIs de lectura calculados en tiempo real según filtros de fecha o periodo.
    """
    return obtener_kpis_lectura(
        db=db,
        periodo=periodo,
        fecha_seleccionada=fecha_seleccionada,
        grupo_facturacion=grupo_facturacion,
        trabajador=trabajador
    )

@router.get("/grupos-facturacion", response_model=List[str])
def listar_grupos_facturacion(
    db: Session = Depends(get_db)
):
    """
    Obtiene la lista estática/única de grupos de facturación (CMETFAC) disponibles en las cargas.
    """
    return obtener_grupos_facturacion(db)