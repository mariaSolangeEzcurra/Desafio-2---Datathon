import os
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from jose import jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from app import model
from app.schemas.auth import LoginRequest, LoginPasswordRequest

SECRET_KEY = os.getenv("SECRET_KEY", "clave")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def crear_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decodificar_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

def obtener_tipo_rol(rol: str) -> str:
    rol = rol.lower()
    if "supervisor" in rol: return "Supervisor"
    if "gerencia" in rol: return "Gerencia"
    if "ti" in rol: return "TI"
    return "Usuario"

def autenticar_con_google(datos: LoginRequest, db: Session):
    try:
        id_info = id_token.verify_oauth2_token(datos.token_google, google_requests.Request())
        correo_google = id_info.get("email")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token de Google inválido")
    
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
        "usuario": {"id_usuario": usuario.id_usuario, "nombre": usuario.nombre, "correo": usuario.correo, "rol": rol}
    }

def autenticar_con_password(datos: LoginPasswordRequest, db: Session):
    usuario = db.query(model.Usuario).filter(model.Usuario.correo == datos.correo).first()
    
    if not usuario or usuario.estado != "Activo":
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    if not usuario.contrasena_hash or not pwd_context.verify(datos.password, usuario.contrasena_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
        
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
        "usuario": {"id_usuario": usuario.id_usuario, "nombre": usuario.nombre, "correo": usuario.correo, "rol": rol}
    }