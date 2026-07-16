from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import model
from app.schemas.zona import ZonaResponse

router = APIRouter(
    prefix="/api/zonas",
    tags=["Zonas"]
)

# listar zonas
@router.get("/", response_model=list[ZonaResponse])
def listar_zonas(db: Session = Depends(get_db)):
    return db.query(model.Zona).all()
