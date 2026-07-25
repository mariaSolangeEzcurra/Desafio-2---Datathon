import re
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app import model
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate

def generar_codigo_usuario(db: Session) -> str:
    usuarios = db.query(model.Usuario.id_usuario).all()
    if not usuarios:
        return "USR0001"
    ultimo_numero = 0
    for (codigo,) in usuarios:
        if codigo:
            match = re.search(r"USR(\d+)", codigo)
            if match:
                numero = int(match.group(1))
                if numero > ultimo_numero:
                    ultimo_numero = numero
                    
    return f"USR{ultimo_numero + 1:04d}"

def obtener_usuarios(db: Session):
    return db.query(model.Usuario).all()

def crear_usuario(db: Session, datos: UsuarioCreate):
    existe = (
        db.query(model.Usuario)
        .filter(model.Usuario.correo == datos.correo)
        .first()
    )
    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con ese correo."
        )        
    nuevo = model.Usuario(
        id_usuario=generar_codigo_usuario(db),
        nombre=datos.nombre,
        correo=datos.correo,
        rol=datos.rol,
        estado=datos.estado
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

def actualizar_usuario(db: Session, id_usuario: str, datos: UsuarioUpdate):
    usuario = (
        db.query(model.Usuario)
        .filter(model.Usuario.id_usuario == id_usuario)
        .first()
    )
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )        
    existe = (
        db.query(model.Usuario)
        .filter(
            model.Usuario.correo == datos.correo,
            model.Usuario.id_usuario != id_usuario
        )
        .first()
    )
    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con ese correo."
        )
        
    usuario.nombre = datos.nombre
    usuario.correo = datos.correo
    usuario.rol = datos.rol
    usuario.estado = datos.estado    
    db.commit()
    db.refresh(usuario)
    return usuario

def eliminar_usuario(db: Session, id_usuario: str):
    usuario = (
        db.query(model.Usuario)
        .filter(model.Usuario.id_usuario == id_usuario)
        .first()
    )
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )
        
    db.delete(usuario)
    db.commit()
    return {"message": "Usuario eliminado correctamente."}