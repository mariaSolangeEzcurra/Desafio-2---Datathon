from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import model
from app.schemas.alerta import AlertaResponse

router = APIRouter(
    prefix="/api/alertas",
    tags=["Alertas"]
)

# listar alertas
@router.get("/", response_model=list[AlertaResponse])
def listar_alertas(db: Session = Depends(get_db)):
    return db.query(model.Alerta).all()
