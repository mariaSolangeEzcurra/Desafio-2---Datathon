import pandas as pd
import io
from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from app.services.Lectura.desempeno_service import evaluar_desempeno_trabajador
from app.model import Trabajador, Actividad
from app.schemas.trabajador import TrabajadorCreate, TrabajadorUpdate

# listar trabajores
def listar_trabajadores(db: Session):
    trabajadores = (
        db.query(Trabajador)
        .order_by(Trabajador.nombre)
        .all()
    )
    resultado = []
    for trabajador in trabajadores:
        # Contar reportes cargados desde Excel
        cantidad_reportes = (
            db.query(Actividad)
            .filter(Actividad.ccodprs == trabajador.ccodprs)
            .count()
        )
        # Calcular desempeño
        evaluacion = evaluar_desempeno_trabajador(
            db,
            trabajador.ccodprs,
            date.min,
            date.max
        )
        resultado.append({
            "ccodprs": trabajador.ccodprs,
            "nombre": trabajador.nombre,
            "telefono": trabajador.telefono,
            "ultimo_puntaje": trabajador.ultimo_puntaje,
            "ultima_clasificacion": trabajador.ultima_clasificacion,
            "fecha_ultima_evaluacion": trabajador.fecha_ultima_evaluacion,
            "cantidad_reportes": cantidad_reportes,
            "desempeno": evaluacion
        })
    return resultado

# obtener trabajador
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

# crear trabajador
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
        telefono=trabajador.telefono
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

#actualziar
def actualizar_trabajador(
    db: Session,
    ccodprs: str,
    datos: TrabajadorUpdate
):
    trabajador = obtener_trabajador(db, ccodprs)
    if datos.nombre is not None:
        trabajador.nombre = datos.nombre
    if datos.telefono is not None:
        trabajador.telefono = datos.telefono
    db.commit()
    db.refresh(trabajador)
    return trabajador

# eliminar
def eliminar_trabajador(db: Session, ccodprs: str):
    trabajador = obtener_trabajador(db, ccodprs)
    db.delete(trabajador)
    db.commit()
    return {
        "mensaje": "Trabajador eliminado correctamente"
    }

# cargar excel
def cargar_trabajadores_excel(
    db: Session,
    archivo: UploadFile
):
    try:
        # Leer el contenido del archivo de forma segura a la memoria
        contenido = archivo.file.read()
        df = pd.read_excel(io.BytesIO(contenido), header=3)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"No se pudo leer el archivo Excel. Asegúrate de que sea un formato válido. Detalle: {str(e)}"
        )

    # Limpiar espacios en los nombres de las columnas
    df.columns = df.columns.str.strip()
    columnas_requeridas = ["COD. LECTOR", "APELLIDOS Y NOMBRES"]
    faltantes = [c for c in columnas_requeridas if c not in df.columns]
    if faltantes:
        raise HTTPException(
            status_code=400,
            detail=f"Faltan las columnas obligatorias en el Excel: {', '.join(faltantes)}"
        )
    nuevos = 0
    actualizados = 0
    for _, fila in df.iterrows():
        codigo_raw = fila["COD. LECTOR"]
        if pd.isna(codigo_raw):
            continue
        codigo = str(int(codigo_raw)).strip() if isinstance(codigo_raw, (int, float)) else str(codigo_raw).strip()
        nombre = str(fila["APELLIDOS Y NOMBRES"]).strip()           
        telefono = None
        if "NUMEROS" in df.columns and not pd.isna(fila["NUMEROS"]):
            telefono = str(int(fila["NUMEROS"])).strip() if isinstance(fila["NUMEROS"], (int, float)) else str(fila["NUMEROS"]).strip()
        trabajador = (
            db.query(Trabajador)
            .filter(Trabajador.ccodprs == codigo)
            .first()
        )
        if trabajador:
            trabajador.nombre = nombre
            if telefono:
                trabajador.telefono = telefono
            actualizados += 1
        else:
            nuevo = Trabajador(
                ccodprs=codigo,
                nombre=nombre,
                telefono=telefono
            )
            db.add(nuevo)
            nuevos += 1
    db.commit()
    return {
        "mensaje": "Carga de trabajadores completada exitosamente",
        "nuevos": nuevos,
        "actualizados": actualizados,
        "total": nuevos + actualizados
    }