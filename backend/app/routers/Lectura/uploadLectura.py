from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services.Lectura.uploadLectura_service import procesar_archivo_excel
from app.model import RegistroCarga
from app.schemas.Lectura.uploadLectura import UploadResultResponse, HistorialCargaResponse

router = APIRouter(prefix="/api/lecturas", tags=["Carga de Lecturas (TI)"])

@router.post("/upload-excel", response_model=UploadResultResponse)
def upload_excel(
    file: UploadFile = File(...),
    proceso: str = Form("Lectura"),
    usuario_id: str = Form(None),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="El archivo debe ser una hoja de cálculo Excel (.xlsx o .xls)")

    contents = file.file.read()
    return procesar_archivo_excel(contents, file.filename, proceso, db, usuario_id)

@router.get("/historial", response_model=List[HistorialCargaResponse])
def get_historial(db: Session = Depends(get_db)):
    """Obtiene el historial de archivos cargados en el sistema."""
    return db.query(RegistroCarga).order_by(RegistroCarga.fecha_carga.desc()).all()