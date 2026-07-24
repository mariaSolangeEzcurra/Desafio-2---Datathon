from datetime import date

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends,
    HTTPException,
    Form
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.services.Lectura.uploadLecturaDiario import (
    procesar_reporte_eficiencia
)



router = APIRouter(
    prefix="/api/desempeno",
    tags=["Desempeño"]
)



# ==========================================
# IMPORTAR REPORTE DE EFICIENCIA EXCEL
# ==========================================

@router.post("/upload")
def importar_reporte_eficiencia(

    fecha_reporte: date = Form(...),

    archivo: UploadFile = File(...),

    db: Session = Depends(get_db)

):


    # ======================================
    # VALIDAR EXTENSIÓN
    # ======================================


    if not archivo.filename.endswith(
        (".xlsx", ".xls")
    ):


        raise HTTPException(

            status_code=400,

            detail="El archivo debe ser Excel (.xlsx o .xls)"

        )



    # ======================================
    # PROCESAR EXCEL
    # ======================================


    resultado = procesar_reporte_eficiencia(

        db,

        archivo.file,

        fecha_reporte

    )



    return resultado