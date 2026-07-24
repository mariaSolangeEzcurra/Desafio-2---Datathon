from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
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


# ==========================================
# ACTUALIZAR ESTADO DE ALERTA
# ==========================================

@router.put("/{alerta_id}/estado")
def actualizar_estado_alerta(
    alerta_id: str,
    estado: str,
    comentario: str | None = None,
    db: Session = Depends(get_db)
):
    alerta = (
        db.query(model.Alerta)
        .filter(
            model.Alerta.alerta_id == alerta_id
        )
        .first()
    )

    if not alerta:
        raise HTTPException(
            status_code=404,
            detail="Alerta no encontrada"
        )

    estados_validos = [
        "Pendiente",
        "Revisada",
        "Solucionada"
    ]

    if estado not in estados_validos:
        raise HTTPException(
            status_code=400,
            detail="Estado no válido"
        )

    alerta.estado_alerta = estado
    alerta.comentario_resolucion = comentario
    alerta.fecha_actualizacion = datetime.now()

    db.commit()
    db.refresh(alerta)

    return {
        "mensaje": "Estado actualizado correctamente",
        "alerta_id": alerta.alerta_id,
        "nuevo_estado": alerta.estado_alerta,
        "comentario": alerta.comentario_resolucion
    }