import pandas as pd
from datetime import datetime, date
from sqlalchemy.orm import Session

from app.model import (
    Trabajador,
    Actividad,
    ActividadLectura
)

from app.services.Lectura.desempeno_service import (
    evaluar_desempeno_trabajador,
    guardar_evaluacion_desempeno
)



def convertir_hora(valor):

    if pd.isna(valor):
        return None

    if isinstance(valor, datetime):
        return valor

    return pd.to_datetime(valor)



def limpiar_nombre(nombre):

    if pd.isna(nombre):
        return "Trabajador Temporal"

    return (
        str(nombre)
        .replace(",", "")
        .strip()
    )



def procesar_reporte_eficiencia(
    db: Session,
    archivo,
    fecha_reporte: date
):

    df = pd.read_excel(archivo)


    registros_insertados = 0

    trabajadores_procesados = set()



    # =====================================
    # RECORRER EXCEL
    # =====================================

    for index, fila in df.iterrows():


        # ===============================
        # CODIGO REAL DEL TRABAJADOR
        # ===============================

        ccodprs = str(
            fila["LECTOR"]
        ).strip()



        nombre = limpiar_nombre(
            fila["NOMBRES"]
        )



        # ===============================
        # BUSCAR TRABAJADOR
        # ===============================


        trabajador = (
            db.query(Trabajador)
            .filter(
                Trabajador.ccodprs == ccodprs
            )
            .first()
        )



        # Si no existe lo crea
        # (opcional por si viene nuevo trabajador)

        if not trabajador:


            trabajador = Trabajador(

                ccodprs=ccodprs,

                nombre=nombre

            )


            db.add(trabajador)

            db.flush()



        # ===============================
        # CREAR ACTIVIDAD
        # ===============================


        actividad_id = (

            f"{ccodprs}_"
            f"{fecha_reporte}_"
            f"{index}"

        )



        actividad = Actividad(

            actividad_id=actividad_id,
            ccodprs=ccodprs,
            tipo_actividad="Lectura",
            fecha=fecha_reporte,
            hora_inicio=convertir_hora(
                fila["HORA INICIO"]
            ),
            hora_fin=convertir_hora(
                fila["HORA FIN"]
            ),
            duracion_min=(
                pd.to_timedelta(
                    fila["DURACION"]
                ).total_seconds()/60
                if not pd.isna(
                    fila["DURACION"]
                )
                else 0
            ),
            promedio_lectura=(
                pd.to_timedelta(
                    fila["PROMEDIO"]
                ).total_seconds()
                if not pd.isna(fila["PROMEDIO"])
                else None
            ),
            lecturas_programadas=int(
                fila["CANTIDAD LECTURAS"]
            ),
            lecturas_realizadas=int(
                fila["LECTURAS REALIZADAS"]
            ),
            lecturas_pendientes=int(
                fila["LECTURAS PENDIENTES"]
            ),
            eficiencia=float(
                fila["EFICIENCIA"]
            )

        )



        db.add(actividad)

        db.flush()



        # ===============================
        # DETALLE LECTURA
        # ===============================


        detalle = ActividadLectura(
            actividad_id=actividad_id,

            cimplec=str(

                fila["CANTIDAD IMPEDIMENTOS"]

            ),



            cobsmdr=str(

                fila["CANTIDAD OBSERVACIONES"]

            )

        )



        db.add(detalle)



        trabajadores_procesados.add(
            ccodprs
        )


        registros_insertados += 1




    db.commit()



    # =====================================
    # EVALUAR DESEMPEÑO AUTOMÁTICO
    # =====================================


    evaluaciones = []



    for codigo in trabajadores_procesados:


        resultado = evaluar_desempeno_trabajador(

            db,

            codigo,

            fecha_reporte,

            fecha_reporte

        )



        if resultado:


            guardar_evaluacion_desempeno(

                db,

                resultado

            )


            evaluaciones.append(resultado)



    return {


        "mensaje":
        "Reporte procesado correctamente",



        "registros_insertados":
        registros_insertados,



        "trabajadores_procesados":
        len(trabajadores_procesados),



        "evaluaciones_generadas":
        len(evaluaciones),



        "evaluaciones":
        evaluaciones

    }