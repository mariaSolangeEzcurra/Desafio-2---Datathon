from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import model
from app.schemas.actividad import ActividadResponse

router = APIRouter(
    prefix="/api/actividades",
    tags=["Actividades"]
)

# listar actividades
@router.get("/", response_model=list[ActividadResponse])
def listar_actividades(db: Session = Depends(get_db)):
    return db.query(model.Actividad).all()
