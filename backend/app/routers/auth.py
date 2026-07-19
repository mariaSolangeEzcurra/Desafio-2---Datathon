from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError
from app.database import get_db
from app import model
from app.schemas.auth import LoginRequest, LoginResponse
from app.services import auth_service

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Login con google
@router.post("/login", response_model=LoginResponse)
def login(
    datos: LoginRequest,
    db: Session = Depends(get_db)
):
    return auth_service.autenticar_con_google(datos, db)

# usuario autenticado
def obtener_usuario_actual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales.",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = auth_service.decodificar_token(token)
        correo = payload.get("sub")
        if correo is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    usuario = (
        db.query(model.Usuario)
        .filter(model.Usuario.correo == correo)
        .first()
    )
    if usuario is None:
        raise credentials_exception
    return usuario