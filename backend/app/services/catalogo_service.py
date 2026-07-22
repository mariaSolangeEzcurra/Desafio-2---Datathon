from sqlalchemy.orm import Session
from app.model import (
    CatalogoImpedimento, 
    CatalogoObservacion, 
    CatalogoGrupoFacturacion, 
    Zona
)

class CatalogoService:
    @staticmethod
    def obtener_catalogo(db: Session, tipo: str):
        if tipo == "impedimentos":
            return db.query(CatalogoImpedimento).all()
        elif tipo == "observaciones":
            return db.query(CatalogoObservacion).all()
        elif tipo == "grupos":
            return db.query(CatalogoGrupoFacturacion).all()
        elif tipo == "zonas":
            return db.query(Zona).all()
        elif tipo == "distritos":
            return [{"distrito": d[0]} for d in db.query(Zona.distrito).distinct().all() if d[0]]
        elif tipo == "cuadrantes":
            return [{"cuadrante": c[0]} for c in db.query(Zona.cuadrante).distinct().all() if c[0]]
        elif tipo == "tipos_actividad":
            return [
                {"codigo": "1", "descripcion": "Lectura Comercial"},
                {"codigo": "2", "descripcion": "Corte y Reapertura"}
            ]
        return []