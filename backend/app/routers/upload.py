from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.upload import UploadResultResponse
from app.services.upload_service import procesar_archivo_excel
from app.model import RegistroCarga
from app.schemas.upload import HistorialCargaResponse

router = APIRouter(prefix="/api", tags=["Carga de Archivos"])

@router.post("/upload-excel", response_model=UploadResultResponse)
async def upload_excel(
    file: UploadFile = File(...),
    proceso: str = Form(...),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    return procesar_archivo_excel(contents, file.filename, proceso, db)

@router.get(
    "/historial",
    response_model=list[HistorialCargaResponse]
)
async def get_historial(db: Session = Depends(get_db)):
    return (
        db.query(RegistroCarga)
        .order_by(RegistroCarga.fecha_carga.desc())
        .all()
    )