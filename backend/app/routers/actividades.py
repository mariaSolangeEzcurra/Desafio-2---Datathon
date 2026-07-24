from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.model import Zona, Trabajador, Conexion, Actividad, ActividadLectura, Impedimento  # Importación explícita corregida
from typing import List, Optional
import uuid
from datetime import datetime  # 💡 CORREGIDO: Importación que faltaba para las alertas
from app.schemas.actividad import ActividadResponse, IngestaLecturaSchema
from app.schemas.alerta import AlertaResponse, InformeTrabajadorResponse

router = APIRouter(
    prefix="/api/actividades",
    tags=["Actividades"]
)

# Listar actividades
@router.get("/", response_model=List[ActividadResponse])
def listar_actividades(db: Session = Depends(get_db)):

    resultados = (
        db.query(Actividad)
        .options(
            joinedload(Actividad.detalle_lectura)
        )
        .all()
    )

    for actividad in resultados:

        if actividad.detalle_lectura:

            actividad.cgpslat = actividad.detalle_lectura.cgpslat
            actividad.cgpslon = actividad.detalle_lectura.cgpslon


    return resultados
