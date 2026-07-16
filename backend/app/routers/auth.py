from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError

from app.database import get_db
from app import model
from app.schemas.auth import LoginRequest, LoginResponse, UsuarioResponse
from app.services import auth_utils

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ==========================================
# Clasificar el cargo de la BD
# ==========================================

def obtener_tipo_rol(rol: str) -> str:

    rol = rol.lower()

    if "supervisor" in rol:
        return "Supervisor"

    if "coordinador" in rol:
        return "Coordinador"

    if "gerencia" in rol:
        return "Gerencia"

    return "Usuario"


# ==========================================
# LOGIN
# ==========================================

@router.post(
    "/login",
    response_model=LoginResponse
)
def login(
    datos: LoginRequest,
    db: Session = Depends(get_db)
):

    usuario = (
        db.query(model.Usuario)
        .filter(model.Usuario.correo == datos.correo)
        .first()
    )

    if usuario is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos."
        )

    if not auth_utils.verificar_password(
        datos.password,
        usuario.contrasena
    ):

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos."
        )

    if usuario.estado != "Activo":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta se encuentra desactivada."
        )

    rol = obtener_tipo_rol(usuario.rol)

    token = auth_utils.crear_access_token(
        {
            "sub": usuario.correo,
            "id": usuario.id_usuario,
            "nombre": usuario.nombre,
            "rol": rol
        }
    )

    return {

        "access_token": token,

        "token_type": "bearer",

        "usuario": {

            "nombre": usuario.nombre,

            "correo": usuario.correo,

            "rol": rol

        }

    }


# ==========================================
# Usuario autenticado
# ==========================================

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

        payload = auth_utils.decodificar_token(token)

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