from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.model import CatalogoImpedimento, CatalogoObservacion, CatalogoGrupoFacturacion

router = APIRouter(prefix="/api/catalogos", tags=["Catálogos"])

@router.get("/{tipo}")
def obtener_catalogo(tipo: str, db: Session = Depends(get_db)):
    if tipo == "impedimentos":
        return db.query(CatalogoImpedimento).all()
    elif tipo == "observaciones":
        return db.query(CatalogoObservacion).all()
    elif tipo == "grupos":
        return db.query(CatalogoGrupoFacturacion).all()
    else:
        raise HTTPException(status_code=404, detail="Catálogo no encontrado")