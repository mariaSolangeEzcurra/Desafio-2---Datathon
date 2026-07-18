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
    # 1. Hacemos un join explícito para extraer ambas tablas unidas por ID
    resultados = db.query(Actividad, ActividadLectura).\
        join(ActividadLectura, Actividad.actividad_id == ActividadLectura.actividad_id).all()
    
    lista_final = []
    for actividad, lectura in resultados:
        # 2. Le inyectamos los valores del GPS directo en la raíz del objeto padre
        actividad.cGPSLat = lectura.cGPSLat
        actividad.cGPSLon = lectura.cGPSLon
        lista_final.append(actividad)
        
    return lista_final

@router.post("/ingesta-masiva", status_code=status.HTTP_201_CREATED)
def registrar_ingesta_masiva(payload: List[IngestaLecturaSchema], db: Session = Depends(get_db)):
    registros_insertados = 0
    
    for item in payload:
        # 1. Resolver o Crear Zona Operativa de forma dinámica
        zona_id_calculado = f"Z-{item.Distrito.upper()[:3]}-{item.cMetFac}"
        zona = db.query(Zona).filter(Zona.zona_id == zona_id_calculado).first()
        if not zona:
            zona = Zona(
                zona_id=zona_id_calculado,
                Distrito=item.Distrito,
                zona_operativa="Zona Metropolitana",
                cuadrante="Por Definir",
                cMetFac=item.cMetFac
            )
            db.add(zona)
            db.flush()

        # 2. Resolver o Crear Trabajador de Campo
        trabajador = db.query(Trabajador).filter(Trabajador.cCodPrs == item.cCodPrs).first()
        if not trabajador:
            trabajador = Trabajador(
                cCodPrs=item.cCodPrs,
                nombre=item.nombre_trabajador,
                rol="Lector",
                distrito_base=item.Distrito,
                supervisor="Supervisor SEDAPAR"
            )
            db.add(trabajador)
            db.flush()

        # 3. Resolver o Crear Punto de Conexión / Infraestructura
        conexion = db.query(Conexion).filter(Conexion.cCodCnx == item.cCodCnx).first()
        if not conexion:
            conexion = Conexion(
                cCodCnx=item.cCodCnx,
                cNroMdr=item.cNroMdr,
                zona_id=zona.zona_id,
                latitud=item.cGPSLat if item.cGPSLat and item.cGPSLat != 9999 else None,
                longitud=item.cGPSLon if item.cGPSLon and item.cGPSLon != 9999 else None,
                direccion_ref="Creado por Carga Masiva",
                tipo_conexion="Medido",
                estado_servicio="Activo",
                cDeRuLe=item.cDeRuLe
            )
            db.add(conexion)
            db.flush()

        # 4. Crear Registro en la Tabla Padre de Actividades
        id_actividad = str(uuid.uuid4())[:8].upper()
        es_inconcluso = item.cImpLec and item.cImpLec != "00"
        
        nueva_actividad = Actividad(
            actividad_id=id_actividad,
            cCodCnx=conexion.cCodCnx,
            cCodPrs=trabajador.cCodPrs,
            tipo_actividad="Lectura Comercial",
            fecha=item.dLectur.date(),
            hora_inicio=item.dLectur,
            hora_fin=item.dLectur,
            duracion_min=4.0,
            duracion_esperada_min=5.0,
            estado="Inconcluso" if es_inconcluso else "Completado",
            resultado="Fuera de Radio" if item.cGPSLat == 9999 else "OK"
        )
        db.add(nueva_actividad)

        # 5. Insertar los Datos Exclusivos en la Tabla de Detalle Lectura
        nuevo_detalle = ActividadLectura(
            actividad_id=id_actividad,
            dLectur=item.dLectur,
            nLecAct=item.nLecAct,
            cImpLec=item.cImpLec,
            cObsMdr=item.cObsMdr,
            cGPSAlt=item.cGPSAlt,
            cGPSLat=item.cGPSLat,
            cGPSLon=item.cGPSLon
        )
        db.add(nuevo_detalle)

        # 6. Si tiene un Impedimento de Lectura activo, lo sembramos en la tabla de contingencias
        if es_inconcluso:
            contingencia = Impedimento(
                impedimento_id=f"IMP-{id_actividad}",
                actividad_id=id_actividad,
                cImpLec=item.cImpLec,
                categoria="Lectura",
                descripcion=f"Impedimento {item.cImpLec}: Obs {item.cObsMdr}",
                latitud=item.cGPSLat if item.cGPSLat and item.cGPSLat != 9999 else None,
                longitud=item.cGPSLon if item.cGPSLon and item.cGPSLon != 9999 else None
            )
            db.add(contingencia)

        registros_insertados += 1

    try:
        db.commit()
        return {"status": "success", "mensaje": f"Sincronizados {registros_insertados} registros operativos."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error transaccional: {str(e)}")


@router.get("/kpis-desempeno", response_model=List[InformeTrabajadorResponse])
def obtener_kpis_desempeno(
    cMetFac: Optional[str] = None,
    db: Session = Depends(get_db)
):

    query = (
        db.query(Actividad, ActividadLectura)
        .join(
            ActividadLectura,
            Actividad.actividad_id == ActividadLectura.actividad_id
        )
    )

    if cMetFac:
        query = (
            query.join(Conexion, Actividad.cCodCnx == Conexion.cCodCnx)
            .join(Zona, Conexion.zona_id == Zona.zona_id)
            .filter(Zona.cMetFac == cMetFac)
        )

    resultados = query.all()

    data_trabajadores = {}

    # ==========================
    # AGRUPAR INFORMACIÓN
    # ==========================
    for actividad, lectura in resultados:

        lector = actividad.cCodPrs or "OPER-ANONIMO"

        if lector not in data_trabajadores:
            data_trabajadores[lector] = {
                "total_lecturas": 0,
                "lecturas_exitosas": 0,
                "con_impedimento": 0,
                "gps_valido": 0,
                "fuera_de_radio": 0,
                "fechas": []
            }

        m = data_trabajadores[lector]

        m["total_lecturas"] += 1

        # Lectura exitosa
        if lectura.cImpLec in (None, "", "0", "00", 0):
            m["lecturas_exitosas"] += 1
        else:
            m["con_impedimento"] += 1

        # GPS válido
        if lectura.cGPSLat not in (None, "", 9999):
            m["gps_valido"] += 1

        # Fuera de radio
        if actividad.resultado == "Fuera de Radio":
            m["fuera_de_radio"] += 1

        # Fecha de lectura
        if lectura.dLectur:
            m["fechas"].append(lectura.dLectur)

    # ==========================
    # CALCULAR KPIs
    # ==========================
    informe_kpis = []

    for lector, m in data_trabajadores.items():

        total = m["total_lecturas"]

        if total == 0:
            continue

        fechas = sorted(m["fechas"])

        horas_campo = 0
        tiempo_promedio = 0

        if len(fechas) >= 2:
            intervalos = []
            for i in range(1, len(fechas)):
                minutos = (
                    (fechas[i] - fechas[i-1])
                    .total_seconds()
                    / 60
                )
                # solo tiempos reales de trabajo
                if 0 < minutos <= 30:
                    intervalos.append(minutos)

            if intervalos:
                tiempo_promedio = (
                    sum(intervalos)
                    /
                    len(intervalos)
                )
                # tiempo efectivo acumulado
                minutos_efectivos = sum(intervalos)
                horas_campo = minutos_efectivos / 60

            else:
                horas_campo = 0
                tiempo_promedio = 0

        productividad = (
            total / horas_campo
            if horas_campo > 0
            else 0
        )

        pct_impedimentos = (
            m["con_impedimento"] / total
        ) * 100

        pct_cobertura_gps = (
            m["gps_valido"] / total
        ) * 100

        pct_fuera_punto = (
            m["fuera_de_radio"] / total
        ) * 100

        # Este KPI requiere la tabla de programación
        cumplimiento = (
            m["lecturas_exitosas"]
            /
            total
        )*100

        alerta_cobertura = (
            "Verde"
            if pct_cobertura_gps >= 90
            else (
                "Amarillo"
                if pct_cobertura_gps >= 80
                else "Rojo"
            )
        )

        alerta_fuera_punto = (
            "Verde"
            if pct_fuera_punto < 5
            else (
                "Amarillo"
                if pct_fuera_punto <= 10
                else "Rojo"
            )
        )

        lista_alertas = []

        fecha_actual = datetime.now()

        if alerta_cobertura == "Rojo":
            lista_alertas.append({
                "alerta_id": f"ALE-{str(uuid.uuid4())[:6].upper()}",
                "nivel": "Rojo",
                "kpi": "Cobertura GPS",
                "motivo": f"Solo {round(pct_cobertura_gps,1)}% de registros tienen GPS válido.",
                "fecha_generacion": fecha_actual,
                "estado_alerta": "Activa",
                "cCodPrs": lector
            })

        if alerta_fuera_punto == "Rojo":
            lista_alertas.append({
                "alerta_id": f"ALE-{str(uuid.uuid4())[:6].upper()}",
                "nivel": "Rojo",
                "kpi": "Fuera de Radio",
                "motivo": f"{round(pct_fuera_punto,1)}% de registros fuera de radio.",
                "fecha_generacion": fecha_actual,
                "estado_alerta": "Activa",
                "cCodPrs": lector
            })

        informe_kpis.append({
            "trabajador_id": lector,
            "resumen": {
                "total_lecturas": total,
                "lecturas_exitosas": m["lecturas_exitosas"],
                "cumplimiento_pct": None,
                "productividad_hora": round(productividad, 2),
                "tiempo_promedio_min": round(tiempo_promedio, 2),
                "impedimentos_pct": round(pct_impedimentos, 2),
                "cobertura_gps_pct": round(pct_cobertura_gps, 2),
                "fuera_radio_pct": round(pct_fuera_punto, 2)
            },
            "estado_critico": len(lista_alertas) > 0,
            "alertas_activas": lista_alertas
        })

    return informe_kpis