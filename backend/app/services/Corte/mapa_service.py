from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import Optional
from app.model import OrdenCorte

def _calcular_fechas_por_periodo(periodo: Optional[str], fecha_inicio: Optional[date] = None, fecha_fin: Optional[date] = None):
    """Calcula automáticamente las fechas si se pasa un período predefinido"""
    if fecha_inicio and fecha_fin:
        return fecha_inicio, fecha_fin
        
    hoy = date.today()
    if periodo == "hoy":
        return hoy, hoy
    elif periodo == "semana":
        return hoy - timedelta(days=7), hoy
    elif periodo == "mes":
        return hoy - timedelta(days=30), hoy
    elif periodo == "3meses":
        return hoy - timedelta(days=90), hoy
        
    return fecha_inicio, fecha_fin

def _sanitizar_coordenada(lat, lng) -> tuple[Optional[float], Optional[float]]:
    """
    Valida y convierte a float.
    Filtra valores nulos, no numéricos o fuera de rangos terrestres (ej: 9999999999).
    """
    if lat is None or lng is None:
        return None, None
    try:
        v_lat = float(lat)
        v_lng = float(lng)

        # Si están guardando Lat/Lng (-90 a 90, -180 a 180)
        if (-90.0 <= v_lat <= 90.0) and (-180.0 <= v_lng <= 180.0):
            if v_lat == 0.0 and v_lng == 0.0:
                return None, None
            return v_lat, v_lng

        # Si están usando UTM en Perú (Zona 18S/19S aprox: X entre 100k-900k, Y entre 7M-9M)
        if (100000.0 <= v_lng <= 900000.0) and (7000000.0 <= v_lat <= 9000000.0):
            return v_lat, v_lng

        return None, None
    except (ValueError, TypeError):
        return None, None


def obtener_datos_heatmap(
    db: Session,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    periodo: Optional[str] = None
) -> dict:
    f_inicio, f_fin = _calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)

    query = db.query(
        OrdenCorte.ccodcnx,
        OrdenCorte.cutmy,
        OrdenCorte.cutmx,
        OrdenCorte.ntotdeu,
        OrdenCorte.distrito,
        OrdenCorte.direccion
    ).filter(
        OrdenCorte.cutmx.isnot(None),
        OrdenCorte.cutmy.isnot(None)
    )

    if f_inicio:
        query = query.filter(OrdenCorte.dgenprg >= f_inicio)
    if f_fin:
        query = query.filter(OrdenCorte.dgenprg <= f_fin)

    ordenes = query.all()
    puntos = []

    for o in ordenes:
        lat, lng = _sanitizar_coordenada(o.cutmy, o.cutmx)
        if lat is None or lng is None:
            continue  # Descarta valores 9999999999 o corruptos

        puntos.append({
            "ccodcnx": o.ccodcnx,
            "lat": lat,
            "lng": lng,
            "deuda": float(o.ntotdeu or 0.0),
            "distrito": o.distrito,
            "direccion": o.direccion
        })

    return {
        "total_puntos": len(puntos),
        "puntos": puntos
    }


def obtener_datos_impedimentos(
    db: Session,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    periodo: Optional[str] = None
) -> dict:
    f_inicio, f_fin = _calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)

    query = (
        db.query(
            OrdenCorte.ccodcnx,
            OrdenCorte.cutmy,
            OrdenCorte.cutmx,
            OrdenCorte.csitreg,
            OrdenCorte.ccodacc,
            OrdenCorte.cdesacc,
            OrdenCorte.distrito,
            OrdenCorte.direccion,
            OrdenCorte.ntotdeu,
        )
        .filter(
            OrdenCorte.cutmx.isnot(None),
            OrdenCorte.cutmy.isnot(None),
            OrdenCorte.csitreg == "S",
        )
    )

    if f_inicio:
        query = query.filter(OrdenCorte.dgenprg >= f_inicio)
    if f_fin:
        query = query.filter(OrdenCorte.dgenprg <= f_fin)

    ordenes = query.all()
    impedimentos = []

    for o in ordenes:
        lat, lng = _sanitizar_coordenada(o.cutmy, o.cutmx)
        if lat is None or lng is None:
            continue  # Igualmente filtramos basura geográfica

        impedimentos.append({
            "ccodcnx": o.ccodcnx,
            "lat": lat,
            "lng": lng,
            "csitreg": o.csitreg,
            "ccodacc": o.ccodacc,
            "cdesacc": o.cdesacc,
            "distrito": o.distrito,
            "direccion": o.direccion,
            "deuda": float(o.ntotdeu or 0.0),
        })

    total_deuda_impedimentos = sum(i["deuda"] for i in impedimentos)

    return {
        "total_impedimentos": len(impedimentos),
        "monto_total_impedimentos": round(total_deuda_impedimentos, 2),
        "impedimentos": impedimentos,
    }