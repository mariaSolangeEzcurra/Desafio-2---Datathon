from fastapi import APIRouter

from app.schemas.user import LoginRequest
from app.services.auth_service import autenticar_usuario

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)


@router.post("/login")
def login(data: LoginRequest):

    return autenticar_usuario(
        data.usuario,
        data.password
    )