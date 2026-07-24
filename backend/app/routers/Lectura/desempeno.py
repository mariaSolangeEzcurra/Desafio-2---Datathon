from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.model import Trabajador, EvaluacionDesempeno
from app.model import Actividad
from app.services.Lectura.desempeno_service import (
    evaluar_desempeno_trabajador,
    guardar_evaluacion_desempeno
)


router = APIRouter(
    prefix="/api/desempeno",
    tags=["Desempeño"]
)



# ==========================================
# EVALUAR UN TRABAJADOR
# ==========================================

@router.post("/evaluar/{ccodprs}")
def evaluar_trabajador(
    ccodprs: str,
    fecha_inicio: date,
    fecha_fin: date,
    db: Session = Depends(get_db)
):

    trabajador = (
        db.query(Trabajador)
        .filter(
            Trabajador.ccodprs == ccodprs
        )
        .first()
    )


    if not trabajador:
        raise HTTPException(
            status_code=404,
            detail="Trabajador no encontrado"
        )


    resultado = evaluar_desempeno_trabajador(
        db,
        ccodprs,
        fecha_inicio,
        fecha_fin
    )


    if not resultado:
        raise HTTPException(
            status_code=404,
            detail="No existen actividades para evaluar"
        )


    guardar_evaluacion_desempeno(
        db,
        resultado
    )


    return {
        "mensaje": "Evaluación generada correctamente",
        "evaluacion": resultado
    }





# ==========================================
# EVALUAR TODOS LOS TRABAJADORES
# ==========================================

@router.post("/evaluar-todos")
def evaluar_todos(
    fecha_inicio: date,
    fecha_fin: date,
    db: Session = Depends(get_db)
):


    trabajadores = (
    db.query(Trabajador)
    .join(
        Actividad,
        Actividad.ccodprs == Trabajador.ccodprs
    )
    .filter(
        Actividad.tipo_actividad.in_(
            ["Lectura", "Lectura Comercial"]
        ),
        Actividad.fecha >= fecha_inicio,
        Actividad.fecha <= fecha_fin
    )
    .distinct()
    .all()
)


    evaluados = []


    for trabajador in trabajadores:


        resultado = evaluar_desempeno_trabajador(
            db,
            trabajador.ccodprs,
            fecha_inicio,
            fecha_fin
        )


        if resultado:


            guardar_evaluacion_desempeno(
                db,
                resultado
            )


            evaluados.append(resultado)



    return {

        "mensaje": "Evaluación masiva completada",

        "cantidad_evaluados": len(evaluados),

        "resultados": evaluados

    }





# ==========================================
# RANKING DE TRABAJADORES
# ==========================================

@router.get("/ranking")
def obtener_ranking(
    limite: int = 20,
    db: Session = Depends(get_db)
):


    ranking = (

        db.query(
            EvaluacionDesempeno,
            Trabajador.nombre
        )

        .join(
            Trabajador,
            Trabajador.ccodprs ==
            EvaluacionDesempeno.ccodprs
        )

        .order_by(
            EvaluacionDesempeno.puntaje.desc()
        )

        .limit(limite)

        .all()

    )


    return [

        {

            "codigo": evaluacion.ccodprs,

            "trabajador": nombre,

            "fecha": evaluacion.fecha,

            "puntaje": evaluacion.puntaje,

            "clasificacion": evaluacion.clasificacion,

            "tendencia": evaluacion.tendencia

        }

        for evaluacion, nombre in ranking

    ]


# ==========================================
# RANKING DETALLADO TODOS LOS TRABAJADORES
# ==========================================

@router.get("/ranking-detallado")
def ranking_detallado(
    db: Session = Depends(get_db)
):

    # Obtener todos los trabajadores que tienen actividades cargadas
    trabajadores = (
        db.query(Trabajador)
        .join(
            Actividad,
            Actividad.ccodprs == Trabajador.ccodprs
        )
        .filter(
            Actividad.tipo_actividad == "Lectura"
        )
        .distinct()
        .all()
    )


    ranking = []


    for trabajador in trabajadores:


        evaluacion = evaluar_desempeno_trabajador(
            db,
            trabajador.ccodprs,
            date.min,
            date.max
        )


        if evaluacion:


            ranking.append({

                "codigo": trabajador.ccodprs,

                "nombre": trabajador.nombre,

                "supervisor": trabajador.supervisor,

                "puntaje": evaluacion["puntaje"],

                "clasificacion": evaluacion["clasificacion"],

                "tendencia": evaluacion["tendencia"],

                "problemas": evaluacion["problemas"],

                "kpis": {

                    "cumplimiento": evaluacion["cumplimiento"],

                    "productividad": evaluacion["productividad"],

                    "tiempo_promedio": evaluacion["tiempo_promedio"],

                    "eficiencia": evaluacion["eficiencia"],

                    "impedimentos": evaluacion["impedimentos"],

                    "observaciones": evaluacion["observaciones"],

                    "cobertura": evaluacion["cobertura"]

                }

            })


    ranking.sort(
        key=lambda x: x["puntaje"],
        reverse=True
    )


    return ranking

# ==========================================
# HISTORIAL DE UN TRABAJADOR
# ==========================================

@router.get("/{ccodprs}/historial")
def historial_trabajador(
    ccodprs: str,
    db: Session = Depends(get_db)
):


    historial = (

        db.query(EvaluacionDesempeno)

        .filter(
            EvaluacionDesempeno.ccodprs == ccodprs
        )

        .order_by(
            EvaluacionDesempeno.fecha.desc()
        )

        .all()

    )


    if not historial:

        raise HTTPException(
            status_code=404,
            detail="No existe historial"
        )



    return [

        {

            "fecha": item.fecha,

            "puntaje": item.puntaje,

            "clasificacion": item.clasificacion,

            "tendencia": item.tendencia

        }

        for item in historial

    ]


# ==========================================
# DETALLE COMPLETO DEL TRABAJADOR
# ==========================================
@router.get("/{ccodprs}/detalle")
def detalle_trabajador(
    ccodprs:str,
    db:Session = Depends(get_db)
):

    trabajador = (
        db.query(Trabajador)
        .filter(
            Trabajador.ccodprs == ccodprs
        )
        .first()
    )

    if not trabajador:
        raise HTTPException(
            status_code=404,
            detail="Trabajador no encontrado"
        )

    evaluacion = evaluar_desempeno_trabajador(
        db,
        ccodprs,
        date.min,
        date.max
    )

    if not evaluacion:
        raise HTTPException(
            status_code=404,
            detail="Sin actividades"
        )

    return {
        "trabajador":{
            "codigo":trabajador.ccodprs,
            "nombre":trabajador.nombre,
            "supervisor":trabajador.supervisor
        },
        "evaluacion":evaluacion
    }


