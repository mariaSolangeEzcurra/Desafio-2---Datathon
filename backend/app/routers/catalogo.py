from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.catalogo_service import CatalogoService
from app.schemas.catalogo import CatalogoCreate, CatalogoUpdate, GrupoFacturacionCreate, GrupoFacturacionUpdate

router = APIRouter(prefix="/api/catalogos", tags=["Catálogos"])

@router.get("/{tipo}")
def obtener_catalogo(tipo: str, db: Session = Depends(get_db)):
    return CatalogoService.obtener_catalogo(db, tipo)

@router.post("/{tipo}")
def crear_catalogo_item(tipo: str, payload: dict, db: Session = Depends(get_db)):
    return CatalogoService.crear_item(db, tipo, payload)

@router.put("/{tipo}/{id_item}")
def actualizar_catalogo_item(tipo: str, id_item: str, payload: dict, db: Session = Depends(get_db)):
    return CatalogoService.actualizar_item(db, tipo, id_item, payload)

@router.delete("/{tipo}/{id_item}")
def eliminar_catalogo_item(tipo: str, id_item: str, db: Session = Depends(get_db)):
    return CatalogoService.eliminar_item(db, tipo, id_item)