from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.schemas.Lectura.uploadReporteDiario import CargaReporteDiarioResponse, ResumenDiarioLectorResponse
from app.services.Lectura.uploadReporteDiario_service import procesar_archivo_reporte_diario
from app.model import ResumenDiarioLector

router = APIRouter(prefix="/api/reporte-diario", tags=["Upload - Reporte Diario"])

@router.post("/upload", response_model=CargaReporteDiarioResponse)
async def upload_reporte_diario(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Sube y procesa el Excel de Reportes Diarios por Lector."""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400, 
            detail="El archivo debe ser un formato Excel (.xlsx o .xls)"
        )
    
    contents = await file.read()
    return procesar_archivo_reporte_diario(
        contents=contents,
        filename=file.filename,
        db=db
    )

@router.get("/", response_model=List[ResumenDiarioLectorResponse])
def listar_resumenes_diarios(
    fecha: Optional[date] = Query(None, description="Filtrar por fecha específica (YYYY-MM-DD)"),
    ccodprs: Optional[str] = Query(None, description="Filtrar por código de lector"),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Consulta los resúmenes diarios guardados en la BD."""
    query = db.query(ResumenDiarioLector)
    
    if fecha:
        query = query.filter(ResumenDiarioLector.fecha == fecha)
    if ccodprs:
        query = query.filter(ResumenDiarioLector.ccodprs == ccodprs)
        
    return query.limit(limit).all()