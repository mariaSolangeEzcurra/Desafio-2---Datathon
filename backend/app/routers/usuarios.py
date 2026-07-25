from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from app.services import usuario_service

router = APIRouter(
    prefix="/api/usuarios",
    tags=["Usuarios"]
)

@router.get("/", response_model=list[UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    return usuario_service.obtener_usuarios(db)

@router.post("/", response_model=UsuarioResponse)
def crear_usuario(datos: UsuarioCreate, db: Session = Depends(get_db)):
    return usuario_service.crear_usuario(db, datos)

@router.put("/{id_usuario}", response_model=UsuarioResponse)
def actualizar_usuario(id_usuario: str, datos: UsuarioUpdate, db: Session = Depends(get_db)):
    return usuario_service.actualizar_usuario(db, id_usuario, datos)

@router.delete("/{id_usuario}")
def eliminar_usuario(id_usuario: str, db: Session = Depends(get_db)):
    return usuario_service.eliminar_usuario(db, id_usuario)