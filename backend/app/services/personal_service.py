from sqlalchemy.orm import Session
from sqlalchemy import func
from app.model import Trabajador, Actividad

# 1. Corregido: Nombre cambiado para que coincida con el Router
def obtener_desempeno_personal(db: Session):
    # Hacemos un LEFT JOIN (outerjoin) y agrupamos por trabajador para calcular todo en UNA sola consulta
    resultados = (
        db.query(
            Trabajador.ccodprs,
            func.count(Actividad.actividad_id).label("total"),
            func.sum(func.case((Actividad.estado == "Completado", 1), else_=0)).label("ejecutadas")
        )
        .outerjoin(Actividad, Trabajador.ccodprs == Actividad.ccodprs) # 2. Corregido: .left_join no existe, se usa .outerjoin
        .group_by(Trabajador.ccodprs)
        .all()
    )

    resultado = []
    for ccodprs, total, ejecutadas in resultados:
        ejecutadas = ejecutadas or 0 # Evitar None si sum dio null
        cumplimiento = ((ejecutadas / total) * 100) if total > 0 else 0 # 3. Sugerencia: Mejor retornar 0 que None para que Pydantic no chille si espera un float

        resultado.append({
            "trabajador_id": str(ccodprs), # Nos aseguramos de que sea un string para el esquema
            "resumen": {
                "total_lecturas": total, # Asegúrate de mapear los nombres exactos que pusimos en el Schema
                "lecturas_exitosas": ejecutadas,
                "cumplimiento_pct": cumplimiento,
                "productividad_hora": 0.0,
                "tiempo_promedio_min": 0.0,
                "impedimentos_pct": 0.0,
                "cobertura_gps_pct": 0.0,
                "fuera_radio_pct": 0.0
            },
            "estado_critico": False,
            "alertas_activas": []
        })

    return resultado