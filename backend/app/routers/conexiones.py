from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import model
from app.schemas.conexion import ConexionResponse

router = APIRouter(
    prefix="/api/conexiones",
    tags=["Conexiones"]
)

# listar conexiones
@router.get("/", response_model=list[ConexionResponse])
def listar_conexiones(db: Session = Depends(get_db)):
    return db.query(model.Conexion).all()
