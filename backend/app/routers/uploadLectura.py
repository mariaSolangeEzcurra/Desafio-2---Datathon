from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services.uploadLectura_service import procesar_archivo_excel
from app.model import RegistroCarga
from app.schemas.uploadLectura import UploadResultResponse, HistorialCargaResponse

router = APIRouter(prefix="/api", tags=["Carga de Archivos"])

# Subir archivos
@router.post("/upload-excel", response_model=UploadResultResponse)
def upload_excel( 
    file: UploadFile = File(...),
    proceso: str = Form(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx o .xls)")

    contents = file.file.read()
    return procesar_archivo_excel(contents, file.filename, proceso, db)

# Obtener historial
@router.get("/historial", response_model=List[HistorialCargaResponse])
async def get_historial(db: Session = Depends(get_db)):
    """
    Obtiene el listado de todas las cargas realizadas, 
    ordenado de la más reciente a la más antigua.
    """
    historial = (
        db.query(RegistroCarga)
        .order_by(RegistroCarga.fecha_carga.desc())
        .all()
    )
    return historial