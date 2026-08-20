from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import Optional, Dict, Any, Tuple
from app.model import OrdenCorte

def _calcular_fechas_por_periodo(
    periodo: Optional[str] = None, 
    fecha_inicio: Optional[date] = None, 
    fecha_fin: Optional[date] = None
) -> Tuple[Optional[date], Optional[date]]:
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

def _sanitizar_coordenada(lat: Any, lng: Any) -> Tuple[Optional[float], Optional[float]]:
    if lat is None or lng is None:
        return None, None
    try:
        v_lat = float(lat)
        v_lng = float(lng)
        if (-90.0 <= v_lat <= 90.0) and (-180.0 <= v_lng <= 180.0):
            if v_lat == 0.0 and v_lng == 0.0:
                return None, None
            return v_lat, v_lng
        if (100000.0 <= v_lng <= 900000.0) and (7000000.0 <= v_lat <= 9000000.0):
            return v_lat, v_lng
        return None, None
    except (ValueError, TypeError):
        return None, None

def obtener_datos_heatmap(
    db: Session,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    periodo: Optional[str] = None,
    distrito: Optional[str] = None,
    ccodprs: Optional[str] = None,
    limite: int = 2000
) -> Dict[str, Any]:
    if not fecha_inicio and not fecha_fin and not periodo:
        periodo = "mes"
    f_inicio, f_fin = _calcular_fechas_por_periodo(periodo, fecha_inicio, fecha_fin)
    query = db.query(
        OrdenCorte.ccodcnx,
        OrdenCorte.cutmy,
        OrdenCorte.cutmx,
        OrdenCorte.ntotdeu,
        OrdenCorte.distrito,
        OrdenCorte.direccion,
        OrdenCorte.dejecuc
    ).filter(
        OrdenCorte.cutmx.isnot(None),
        OrdenCorte.cutmy.isnot(None),
        OrdenCorte.cutmx != 0,
        OrdenCorte.cutmy != 0
    )

    if f_inicio:
        query = query.filter(OrdenCorte.dgenprg >= f_inicio)
    if f_fin:
        query = query.filter(OrdenCorte.dgenprg <= f_fin)
    if distrito:
        query = query.filter(OrdenCorte.distrito == distrito.strip().upper())
    if ccodprs:
        query = query.filter(OrdenCorte.ccodprs == ccodprs)

    if limite > 0:
        query = query.limit(limite)

    ordenes = query.all()
    puntos = []

    for o in ordenes:
        lat, lng = _sanitizar_coordenada(o.cutmy, o.cutmx)
        if lat is None or lng is None:
            continue

        puntos.append({
            "ccodcnx": o.ccodcnx,
            "lat": lat,
            "lng": lng,
            "deuda": float(o.ntotdeu or 0.0),
            "distrito": o.distrito,
            "direccion": o.direccion,
            "ejecutada": o.dejecuc is not None
        })

    return {
        "total_puntos": len(puntos),
        "puntos": puntos
    }

def obtener_datos_impedimentos(
    db: Session,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    periodo: Optional[str] = None,
    distrito: Optional[str] = None,
    ccodprs: Optional[str] = None,
    limite: int = 2000
) -> Dict[str, Any]:
    if not fecha_inicio and not fecha_fin and not periodo:
        periodo = "mes"

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
            OrdenCorte.cutmx != 0,
            OrdenCorte.cutmy != 0,
            OrdenCorte.csitreg == "S",
        )
    )

    if f_inicio:
        query = query.filter(OrdenCorte.dgenprg >= f_inicio)
    if f_fin:
        query = query.filter(OrdenCorte.dgenprg <= f_fin)
    if distrito:
        query = query.filter(OrdenCorte.distrito == distrito.strip().upper())
    if ccodprs:
        query = query.filter(OrdenCorte.ccodprs == ccodprs)

    if limite > 0:
        query = query.limit(limite)

    ordenes = query.all()
    impedimentos = []

    for o in ordenes:
        lat, lng = _sanitizar_coordenada(o.cutmy, o.cutmx)
        if lat is None or lng is None:
            continue

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