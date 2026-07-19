from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.personal import PersonalDesempenoResponse
from app.services.personal_service import obtener_desempeno_personal

router = APIRouter(
    prefix="/api/personal",
    tags=["Personal"]
)


@router.get(
    "/desempeno",
    response_model=list[PersonalDesempenoResponse]
)
def listar_desempeno(
    db: Session = Depends(get_db)
):
    return obtener_desempeno_personal(db)