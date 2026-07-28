from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.model import (CatalogoImpedimento, CatalogoObservacion, CatalogoGrupoFacturacion, Zona)

class CatalogoService:
    
    @staticmethod
    def _get_model_class(tipo: str):
        mapping = {
            "impedimentos": CatalogoImpedimento,
            "observaciones": CatalogoObservacion,
            "grupos": CatalogoGrupoFacturacion,
            "zonas": Zona
        }
        model = mapping.get(tipo)
        if not model:
            raise HTTPException(status_code=404, detail="Catálogo no encontrado")
        return model

    @staticmethod
    def obtener_catalogo(db: Session, tipo: str):
        if tipo in ["impedimentos", "observaciones", "grupos", "zonas"]:
            model = CatalogoService._get_model_class(tipo)
            return db.query(model).all()
        elif tipo == "distritos":
            return [{"distrito": d[0]} for d in db.query(Zona.distrito).distinct().all() if d[0]]
        elif tipo == "cuadrantes":
            return [{"cuadrante": c[0]} for c in db.query(Zona.cuadrante).distinct().all() if c[0]]
        elif tipo == "tipos_actividad":
            return [
                {"codigo": "1", "descripcion": "Lectura Comercial"},
                {"codigo": "2", "descripcion": "Corte y Reapertura"}
            ]
        raise HTTPException(status_code=404, detail="Catálogo no encontrado")

    @staticmethod
    def crear_item(db: Session, tipo: str, data: dict):
        model = CatalogoService._get_model_class(tipo)        
        pk_field = "cmetfac" if tipo == "grupos" else "codigo"
        pk_value = data.get(pk_field)        
        existe = db.query(model).filter(getattr(model, pk_field) == pk_value).first()
        if existe:
            raise HTTPException(status_code=400, detail=f"El registro con código {pk_value} ya existe.")
        nuevo_item = model(**data)
        db.add(nuevo_item)
        db.commit()
        db.refresh(nuevo_item)
        return nuevo_item

    @staticmethod
    def actualizar_item(db: Session, tipo: str, id_item: str, data: dict):
        model = CatalogoService._get_model_class(tipo)
        pk_field = "cmetfac" if tipo == "grupos" else "codigo"        
        item = db.query(model).filter(getattr(model, pk_field) == id_item).first()
        if not item:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
        for key, value in data.items():
            if value is not None:
                setattr(item, key, value)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def eliminar_item(db: Session, tipo: str, id_item: str):
        model = CatalogoService._get_model_class(tipo)
        pk_field = "cmetfac" if tipo == "grupos" else "codigo"        
        item = db.query(model).filter(getattr(model, pk_field) == id_item).first()
        if not item:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
        db.delete(item)
        db.commit()
        return {"mensaje": "Registro eliminado exitosamente"}