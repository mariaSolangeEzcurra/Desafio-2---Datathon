from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services.Corte.uploadCorte_service import procesar_archivo_cortes
from app.model import RegistroCarga, OrdenCorte
from app.schemas.Corte.uploadCorte import UploadCorteResultResponse, HistorialCorteCargaResponse

router = APIRouter(prefix="/api/cortes", tags=["Carga de Cortes"])

@router.post("/upload-excel", response_model=UploadCorteResultResponse)
def upload_excel_cortes(
    file: UploadFile = File(...),
    proceso: str = Form("Corte"),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, 
            detail="El archivo debe ser una hoja de cálculo Excel (.xlsx o .xls)"
        )
    contents = file.file.read()
    return procesar_archivo_cortes(contents, file.filename, proceso, db)

@router.get("/historial", response_model=List[HistorialCorteCargaResponse])
def get_historial_cortes(db: Session = Depends(get_db)):
    return db.query(RegistroCarga).filter_by(tipo_archivo="CORTE").order_by(RegistroCarga.fecha_carga.desc()).all()

@router.delete("/historial/{id_carga}", response_model=dict)
def revertir_carga_cortes(id_carga: int, db: Session = Depends(get_db)):
    carga = db.query(RegistroCarga).filter_by(id_carga=id_carga).first()
    if not carga:
        raise HTTPException(status_code=404, detail="El registro de carga especificado no existe.")
    if carga.tipo_archivo != "CORTE":
        raise HTTPException(
            status_code=400, 
            detail=f"Este endpoint es para cargas de tipo 'CORTE'. Esta carga es de tipo '{carga.tipo_archivo}'."
        )
    try:
        # Eliminar las órdenes de corte asociadas a esta carga
        db.query(OrdenCorte).filter(OrdenCorte.id_carga == id_carga).delete(synchronize_session=False)
        db.delete(carga)    
        db.commit()
        return {
            "status": "success",
            "message": f"La carga de cortes #{id_carga} ('{carga.nombre_archivo}') y sus órdenes asociadas fueron revertidas correctamente."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al revertir la carga de cortes: {str(e)}")