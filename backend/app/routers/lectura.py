from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.lectura_service import obtener_kpis_lectura, obtener_grupos_facturacion

router = APIRouter(
    prefix="/lectura",
    tags=["Lectura"]
)

@router.get("/kpis")
def listar_kpis_lectura(
    periodo: str = "dia",
    grupo_facturacion: str | None = None,
    trabajador: str | None = None,
    db: Session = Depends(get_db)
):
    return obtener_kpis_lectura(
        db=db,
        periodo=periodo,
        grupo_facturacion=grupo_facturacion,
        trabajador=trabajador
    )

@router.get("/grupos-facturacion")
def listar_grupos_facturacion(
    db: Session = Depends(get_db)
):
    return obtener_grupos_facturacion(db)