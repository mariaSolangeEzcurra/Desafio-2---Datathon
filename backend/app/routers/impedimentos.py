from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import model
from app.schemas.impedimento import ImpedimentoResponse

router = APIRouter(
    prefix="/api/impedimentos",
    tags=["Impedimentos"]
)

# listar impedimentos
@router.get("/", response_model=list[ImpedimentoResponse])
def listar_impedimentos(db: Session = Depends(get_db)):
    return db.query(model.Impedimento).all()
