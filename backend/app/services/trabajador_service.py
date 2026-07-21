import pandas as pd
from sqlalchemy.orm import Session
from fastapi import HTTPException
from fastapi import UploadFile, File


from app.model import Trabajador
from app.schemas.trabajador import (
    TrabajadorCreate,
    TrabajadorUpdate
)


# ==========================================
# LISTAR TRABAJADORES
# ==========================================
def listar_trabajadores(db: Session):
    return db.query(Trabajador).order_by(Trabajador.nombre).all()


# ==========================================
# OBTENER TRABAJADOR
# ==========================================
def obtener_trabajador(db: Session, ccodprs: str):
    trabajador = (
        db.query(Trabajador)
        .filter(Trabajador.ccodprs == ccodprs)
        .first()
    )

    if not trabajador:
        raise HTTPException(
            status_code=404,
            detail="Trabajador no encontrado"
        )

    return trabajador


# ==========================================
# CREAR TRABAJADOR
# ==========================================
def crear_trabajador(db: Session, trabajador: TrabajadorCreate):

    existente = (
        db.query(Trabajador)
        .filter(Trabajador.ccodprs == trabajador.ccodprs)
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=400,
            detail="El trabajador ya existe"
        )

    nuevo = Trabajador(
        ccodprs=trabajador.ccodprs,
        nombre=trabajador.nombre,
        supervisor=trabajador.supervisor
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return nuevo


# ==========================================
# ACTUALIZAR TRABAJADOR
# ==========================================
def actualizar_trabajador(
    db: Session,
    ccodprs: str,
    datos: TrabajadorUpdate
):

    trabajador = obtener_trabajador(db, ccodprs)

    if datos.nombre is not None:
        trabajador.nombre = datos.nombre

    if datos.supervisor is not None:
        trabajador.supervisor = datos.supervisor

    db.commit()
    db.refresh(trabajador)

    return trabajador


# ==========================================
# ELIMINAR TRABAJADOR
# ==========================================
def eliminar_trabajador(db: Session, ccodprs: str):

    trabajador = obtener_trabajador(db, ccodprs)

    db.delete(trabajador)
    db.commit()

    return {
        "mensaje": "Trabajador eliminado correctamente"
    }


# ==========================================
# CARGAR EXCEL
# ==========================================
def cargar_trabajadores_excel(
    db: Session,
    archivo: UploadFile
):

    df = pd.read_excel(archivo.file)

    columnas = ["CCODPRS", "NOMBRE"]

    faltantes = [c for c in columnas if c not in df.columns]

    if faltantes:
        raise HTTPException(
            status_code=400,
            detail=f"Faltan las columnas: {', '.join(faltantes)}"
        )

    nuevos = 0
    actualizados = 0

    for _, fila in df.iterrows():

        codigo = str(fila["CCODPRS"]).strip()
        nombre = str(fila["NOMBRE"]).strip()

        trabajador = (
            db.query(Trabajador)
            .filter(Trabajador.ccodprs == codigo)
            .first()
        )

        if trabajador:
            trabajador.nombre = nombre
            actualizados += 1

        else:
            nuevo = Trabajador(
                ccodprs=codigo,
                nombre=nombre
            )

            db.add(nuevo)
            nuevos += 1

    db.commit()

    return {
        "mensaje": "Carga de trabajadores completada",
        "nuevos": nuevos,
        "actualizados": actualizados,
        "total": nuevos + actualizados
    }