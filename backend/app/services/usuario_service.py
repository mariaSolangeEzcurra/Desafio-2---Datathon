import re
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from passlib.context import CryptContext
from app import model
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generar_codigo_usuario(db: Session) -> str:
    # Optimización: Buscar directamente el último usuario ordenado descendentemente
    ultimo_usuario = db.query(model.Usuario.id_usuario).order_by(model.Usuario.id_usuario.desc()).first()
    
    if not ultimo_usuario or not ultimo_usuario[0]:
        return "USR0001"
    
    match = re.search(r"USR(\d+)", ultimo_usuario[0])
    if match:
        numero = int(match.group(1))
        return f"USR{numero + 1:04d}"
    
    return "USR0001"

def obtener_usuarios(db: Session):
    return db.query(model.Usuario).all()

def crear_usuario(db: Session, datos: UsuarioCreate):
    existe = db.query(model.Usuario).filter(model.Usuario.correo == datos.correo).first()
    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con ese correo."
        )        
    
    contrasena_hash = None
    proveedor = "google"
    
    if datos.password and datos.password.strip():
        contrasena_hash = pwd_context.hash(datos.password)
        proveedor = "local"

    nuevo = model.Usuario(
        id_usuario=generar_codigo_usuario(db),
        nombre=datos.nombre,
        correo=datos.correo,
        contrasena_hash=contrasena_hash,
        proveedor=proveedor,
        rol=datos.rol,
        estado=datos.estado
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

def actualizar_usuario(db: Session, id_usuario: str, datos: UsuarioUpdate):
    usuario = db.query(model.Usuario).filter(model.Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )        
    
    # Validar correo duplicado solo si el correo cambió
    if datos.correo != usuario.correo:
        existe = db.query(model.Usuario).filter(
            model.Usuario.correo == datos.correo,
            model.Usuario.id_usuario != id_usuario
        ).first()
        if existe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un usuario con ese correo."
            )
        
    usuario.nombre = datos.nombre
    usuario.correo = datos.correo
    usuario.rol = datos.rol
    usuario.estado = datos.estado 
    
    if datos.password and datos.password.strip():
        usuario.contrasena_hash = pwd_context.hash(datos.password)
        usuario.proveedor = "local"
        
    db.commit()
    db.refresh(usuario)
    return usuario

def eliminar_usuario(db: Session, id_usuario: str):
    usuario = db.query(model.Usuario).filter(model.Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )
        
    db.delete(usuario)
    db.commit()
    return {"message": "Usuario eliminado correctamente."}