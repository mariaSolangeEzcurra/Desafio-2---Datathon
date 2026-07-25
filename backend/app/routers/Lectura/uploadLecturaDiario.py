from datetime import date
from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.Lectura.uploadLecturaDiaria import (
    ReporteDiarioResponse,
    HistorialReporteItem
)
from app.services.Lectura.uploadLecturaDiario import (
    procesar_reporte_eficiencia,
    obtener_historial_reportes_service
)

router = APIRouter(
    prefix="/api/desempeno",
    tags=["Desempeño"]
)


@router.post("/upload", response_model=ReporteDiarioResponse)
def importar_reporte_eficiencia(
    fecha_reporte: date = Form(...),
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not archivo.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="El archivo debe ser Excel (.xlsx o .xls)"
        )

    return procesar_reporte_eficiencia(db, archivo, fecha_reporte)


@router.get("/historial", response_model=List[HistorialReporteItem])
def obtener_historial_reportes(db: Session = Depends(get_db)):
    return obtener_historial_reportes_service(db)