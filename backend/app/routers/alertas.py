from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import model
from app.schemas.alerta import AlertaResponse

router = APIRouter(
    prefix="/api/alertas",
    tags=["Alertas"]
)

@router.get("/", response_model=list[AlertaResponse])
def listar_alertas(db: Session = Depends(get_db)):
    """
    Retorna la lista completa de alertas almacenadas físicamente en la tabla 'alertas'
    sin reprocesar datos al vuelo.
    """
    try:
        alertas = db.query(model.Alerta).all()
        return alertas
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al recuperar las alertas de la base de datos: {str(e)}"
        )