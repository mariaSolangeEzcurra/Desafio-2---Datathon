from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import model
from app.schemas.trabajador import TrabajadorResponse

router = APIRouter(
    prefix="/api/trabajadores",
    tags=["Trabajadores"]
)

# listar trabajadores
@router.get("/", response_model=list[TrabajadorResponse])
def listar_trabajadores(db: Session = Depends(get_db)):
    return db.query(model.Trabajador).all()
