from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services.Lectura.uploadLectura_service import procesar_archivo_excel
from app.model import RegistroCarga, Actividad, ActividadLectura
from app.schemas.Lectura.uploadLectura import UploadResultResponse, HistorialCargaResponse

router = APIRouter(prefix="/api/lecturas", tags=["Carga de Lecturas (TI)"])

@router.post("/upload-excel", response_model=UploadResultResponse)
def upload_excel(
    file: UploadFile = File(...),
    proceso: str = Form("Lectura"),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, 
            detail="El archivo debe ser una hoja de cálculo Excel (.xlsx o .xls)"
        )
    contents = file.file.read()
    return procesar_archivo_excel(contents, file.filename, proceso, db)

@router.get("/historial", response_model=List[HistorialCargaResponse])
def get_historial(db: Session = Depends(get_db)):
    return db.query(RegistroCarga).order_by(RegistroCarga.fecha_carga.desc()).all()

@router.delete("/historial/{id_carga}", response_model=dict)
def revertir_carga_lecturas(id_carga: int, db: Session = Depends(get_db)):
    carga = db.query(RegistroCarga).filter_by(id_carga=id_carga).first()
    if not carga:
        raise HTTPException(status_code=404, detail="El registro de carga especificado no existe.")
    if carga.tipo_archivo != "TI":
        raise HTTPException(
            status_code=400, 
            detail=f"Este endpoint es para cargas 'TI'. Esta carga es de tipo '{carga.tipo_archivo}'."
        )
    try:
        actividades = db.query(Actividad).filter(Actividad.id_carga == id_carga).all()        
        actividades_ids = [act.actividad_id for act in actividades]
        if actividades_ids:
            db.query(ActividadLectura).filter(ActividadLectura.actividad_id.in_(actividades_ids)).delete(synchronize_session=False)        
            db.query(Actividad).filter(Actividad.id_carga == id_carga).delete(synchronize_session=False)
        db.delete(carga)    
        db.commit()
        return {
            "status": "success",
            "message": f"La carga #{id_carga} ('{carga.nombre_archivo}') y sus registros asociados fueron revertidos correctamente."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al revertir la carga: {str(e)}")