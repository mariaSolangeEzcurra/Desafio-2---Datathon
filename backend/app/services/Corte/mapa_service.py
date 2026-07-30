from sqlalchemy.orm import Session
from datetime import date
from typing import Optional
from app.model import OrdenCorte

def obtener_datos_heatmap(
    db: Session,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None
) -> dict:
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
    if fecha_inicio:
        query = query.filter(OrdenCorte.dgenprg >= fecha_inicio)
    if fecha_fin:
        query = query.filter(OrdenCorte.dgenprg <= fecha_fin)
    ordenes = query.all()
    puntos = [
        {
            "ccodcnx": o.ccodcnx,
            "lat": float(o.cutmy),  # cutmy actúa como latitud / Y
            "lng": float(o.cutmx),  # cutmx actúa como longitud / X
            "deuda": float(o.ntotdeu or 0.0),
            "distrito": o.distrito,
            "direccion": o.direccion
        }
        for o in ordenes
    ]

    return {
        "total_puntos": len(puntos),
        "puntos": puntos
    }

def obtener_datos_impedimentos(
    db: Session,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
) -> dict:
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
          # Filtrar explícitamente solo las órdenes no ejecutadas/sin acción
          OrdenCorte.csitreg == "S",
      )
  )

  if fecha_inicio:
    query = query.filter(OrdenCorte.dgenprg >= fecha_inicio)
  if fecha_fin:
    query = query.filter(OrdenCorte.dgenprg <= fecha_fin)

  ordenes = query.all()

  impedimentos = [
      {
          "ccodcnx": o.ccodcnx,
          "lat": float(o.cutmy),
          "lng": float(o.cutmx),
          "csitreg": o.csitreg,
          "ccodacc": o.ccodacc,
          "cdesacc": o.cdesacc,
          "distrito": o.distrito,
          "direccion": o.direccion,
          "deuda": float(o.ntotdeu or 0.0),
      }
      for o in ordenes
  ]

  # Calculamos también la deuda total involucrada en estos impedimentos
  total_deuda_impedimentos = sum(i["deuda"] for i in impedimentos)

  return {
      "total_impedimentos": len(impedimentos),
      "monto_total_impedimentos": round(total_deuda_impedimentos, 2),
      "impedimentos": impedimentos,
  }