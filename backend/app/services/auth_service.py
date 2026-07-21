from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from jose import jwt
from datetime import datetime, timedelta, timezone
from app import model
from app.schemas.auth import LoginRequest

SECRET_KEY = "clave"
ALGORITHM = "HS256"

# 1. Lógica para crear y decodificar el token (lo que antes era auth_utils)
def crear_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decodificar_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

# 2. Lógica de roles
def obtener_tipo_rol(rol: str) -> str:
    rol = rol.lower()
    if "supervisor" in rol: return "Supervisor"
    if "coordinador" in rol: return "Coordinador"
    if "gerencia" in rol: return "Gerencia"
    if "ti" in rol: return "TI"
    return "Usuario"

# 3. Lógica de autenticación con Google
def autenticar_con_google(datos: LoginRequest, db: Session):
    try:
        id_info = id_token.verify_oauth2_token(datos.token_google, google_requests.Request())
        correo_google = id_info.get("email")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token inválido")
    usuario = db.query(model.Usuario).filter(model.Usuario.correo == correo_google).first()
    if not usuario or usuario.estado != "Activo":
        raise HTTPException(status_code=401, detail="Usuario no autorizado")
    rol = obtener_tipo_rol(usuario.rol)
    token_interno = crear_access_token({
        "sub": usuario.correo,
        "id": usuario.id_usuario,
        "nombre": usuario.nombre,
        "rol": rol
    })
    return {
        "access_token": token_interno,
        "token_type": "bearer",
        "usuario": {"nombre": usuario.nombre, "correo": usuario.correo, "rol": rol}
    }