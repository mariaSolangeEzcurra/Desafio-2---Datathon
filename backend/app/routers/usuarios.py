from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import re
from app.database import get_db
from app import model
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate
router = APIRouter(
    prefix="/api/usuarios",
    tags=["Usuarios"]
)

# generar codigo
def generar_codigo_usuario(db: Session):
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

# listar usuarios
@router.get("/", response_model=list[UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(model.Usuario).all()

# crear usuario
@router.post("/", response_model=UsuarioResponse)
def crear_usuario(
    datos: UsuarioCreate,
    db: Session = Depends(get_db)
):
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

# editar usuario
@router.put("/{id_usuario}", response_model=UsuarioResponse)
def actualizar_usuario(
    id_usuario: str,
    datos: UsuarioUpdate,
    db: Session = Depends(get_db)
):
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

#eliminar usuario
@router.delete("/{id_usuario}")
def eliminar_usuario(
    id_usuario: str,
    db: Session = Depends(get_db)
):
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
    return {
        "message": "Usuario eliminado correctamente."
    }