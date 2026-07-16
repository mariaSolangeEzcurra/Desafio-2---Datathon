from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import model
from sqlalchemy import func
router = APIRouter(
    prefix="/api/mapa",
    tags=["Mapas"]
)

# Conexiones en el mapa
@router.get("/conexiones")
def mapa_conexiones(db: Session = Depends(get_db)):
    return db.query(
        model.Conexion.codigo_suministro,
        model.Conexion.latitud,
        model.Conexion.longitud,
        model.Conexion.estado_servicio,
        model.Conexion.tipo_conexion
    ).all()

# Actividades en el mapa
@router.get("/actividades")
def mapa_actividades(db: Session = Depends(get_db)):
    return db.query(
        model.Actividad.actividad_id,
        model.Actividad.gps_trabajador_lat,
        model.Actividad.gps_trabajador_lon,
        model.Actividad.estado,
        model.Actividad.resultado
    ).all()

# Impedimentos en el mapa
@router.get("/impedimentos")
def mapa_impedimentos(db: Session = Depends(get_db)):
    return db.query(
        model.Impedimento.impedimento_id,
        model.Impedimento.latitud,
        model.Impedimento.longitud,
        model.Impedimento.categoria,
        model.Impedimento.descripcion
    ).all()

# Alertas en el mapa
@router.get("/alertas")
def mapa_alertas(db: Session = Depends(get_db)):
    return db.query(
        model.Alerta.alerta_id,
        model.Alerta.zona_id,
        model.Alerta.trabajador_id,
        model.Alerta.nivel,
        model.Alerta.estado_alerta
    ).all()

# Vista general (overview)
@router.get("/overview")
def mapa_overview(db: Session = Depends(get_db)):
    return {
        "conexiones": db.query(model.Conexion).count(),
        "actividades": db.query(model.Actividad).count(),
        "impedimentos": db.query(model.Impedimento).count(),
        "alertas": db.query(model.Alerta).count()
    }

@router.get("/impedimentos_heatmap")
def mapa_impedimentos_heatmap(db: Session = Depends(get_db)):
    resultados = (
        db.query(
            model.Impedimento.latitud,
            model.Impedimento.longitud,
            func.count(model.Impedimento.impedimento_id).label("count")
        )
        .group_by(model.Impedimento.latitud, model.Impedimento.longitud)
        .all()
    )
    return [
        {"lat": lat, "lon": lon, "count": count}
        for lat, lon, count in resultados
    ]