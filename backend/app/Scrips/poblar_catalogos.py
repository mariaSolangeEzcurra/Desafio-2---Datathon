import sys
import os

from app.database import SessionLocal
from app.model import (
    CatalogoGrupoFacturacion,
    CatalogoImpedimento,
    CatalogoObservacion
)

def poblar_catlogos_definitivos():
    db = SessionLocal()
    try:
        print("Iniciando la carga de catálogos definitivos en la BD...")

        # 1. GRUPOS DE FACTURACIÓN
        grupos_data = [
            {"cmetfac": "1001", "ccodmet": "1", "cnommet": "GRUPO I"},
            {"cmetfac": "1002", "ccodmet": "2", "cnommet": "GRUPO II"},
            {"cmetfac": "1003", "ccodmet": "3", "cnommet": "GRUPO III"},
            {"cmetfac": "1004", "ccodmet": "4", "cnommet": "GRUPO IV"},
            {"cmetfac": "1005", "ccodmet": "5", "cnommet": "GRUPO V"},
            {"cmetfac": "1006", "ccodmet": "6", "cnommet": "GRUPO VI"},
            {"cmetfac": "1007", "ccodmet": "7", "cnommet": "GRUPO VII"},
            {"cmetfac": "1008", "ccodmet": "8", "cnommet": "GRUPO VIII"},
            {"cmetfac": "1009", "ccodmet": "9", "cnommet": "GRUPO IX"},
            {"cmetfac": "1010", "ccodmet": "10", "cnommet": "GRUPO X"},
        ]
        for item in grupos_data:
            existe = db.query(CatalogoGrupoFacturacion).filter_by(cmetfac=item["cmetfac"]).first()
            if not existe:
                db.add(CatalogoGrupoFacturacion(**item))

        # 2. IMPEDIMENTOS
        impedimentos_data = [
            {"codigo": "00", "descripcion": "SIN IMPEDIMENTO DE LECTURA"},
            {"codigo": "10", "descripcion": "MEDIDOR INACCESIBLE"},
            {"codigo": "11", "descripcion": "TAPA DURA"},
            {"codigo": "12", "descripcion": "PERRO BRAVO"},
            {"codigo": "13", "descripcion": "DUEÑO AUSENTE"},
            {"codigo": "14", "descripcion": "VEHICULO SOBRE MEDIDOR"},
            {"codigo": "15", "descripcion": "TAPA CON CANDADO"},
            {"codigo": "16", "descripcion": "REJAS"},
            {"codigo": "17", "descripcion": "CAJA DE MEDIDOR CON DESECHOS"},
            {"codigo": "18", "descripcion": "USUARIO AGRESIVO"},
            {"codigo": "19", "descripcion": "CAJA DE MEDIDOR SELLADA/CEMENTADA"},
            {"codigo": "20", "descripcion": "LECTURA NO VISIBLE"},
            {"codigo": "21", "descripcion": "MEDIDOR OPACO/EMPAÑADO"},
            {"codigo": "22", "descripcion": "MEDIDOR ENTERRADO"},
            {"codigo": "23", "descripcion": "AGUA ESTANCADA"},
            {"codigo": "24", "descripcion": "MEDIDOR PROFUNDO"},
            {"codigo": "30", "descripcion": "NO LOCALIZADO"},
            {"codigo": "31", "descripcion": "CALLE NO LOCALIZADA"},
            {"codigo": "32", "descripcion": "NUMERO DE PREDIO NO LOCALIZADO"},
            {"codigo": "33", "descripcion": "FUERA DE RUTA"},
            {"codigo": "34", "descripcion": "DIRECCION ALTERADA"},
            {"codigo": "40", "descripcion": "IMPEDIMENTOS VARIOS"},
            {"codigo": "41", "descripcion": "NO EXISTE MEDIDOR"},
            {"codigo": "42", "descripcion": "NIPLE"},
            {"codigo": "43", "descripcion": "ACCESO NO PERMITIDO"},
            {"codigo": "44", "descripcion": "CAPSULA FUERA DE LUGAR"},
            {"codigo": "45", "descripcion": "MEDIDOR EN OBSERVACION"},
            {"codigo": "46", "descripcion": "NUMERO DE MEDIDOR NO LOCALIZADO"},
            {"codigo": "47", "descripcion": "IMPEDIMENTO EMERGENCIA"},
        ]
        for item in impedimentos_data:
            existe = db.query(CatalogoImpedimento).filter_by(codigo=item["codigo"]).first()
            if not existe:
                db.add(CatalogoImpedimento(**item))

        # 3. OBSERVACIONES
        observaciones_data = [
            {"codigo": "00", "descripcion": "SIN OBSERVACION DE LECTURA"},
            {"codigo": "50", "descripcion": "MANIPULACION"},
            {"codigo": "51", "descripcion": "MEDIDOR INVERTIDO"},
            {"codigo": "52", "descripcion": "MEDIDOR SIN PRECINTO"},
            {"codigo": "53", "descripcion": "REAPERTURA INDEBIDA"},
            {"codigo": "54", "descripcion": "CAMBIAR MEDIDOR"},
            {"codigo": "55", "descripcion": "ANCLAR PRECINTAR"},
            {"codigo": "56", "descripcion": "PROGRAMAR SEGUIMIENTO"},
            {"codigo": "57", "descripcion": "MEDIDOR TRABADO"},
            {"codigo": "60", "descripcion": "OBSERVACIONES AL MEDIDOR"},
            {"codigo": "61", "descripcion": "SUPERFICIE RAYADA"},
            {"codigo": "62", "descripcion": "VIDRIO QUEBRADO"},
            {"codigo": "63", "descripcion": "FUGA EN INSTALACION"},
            {"codigo": "64", "descripcion": "CAJA MEDIDOR CON REJA"},
            {"codigo": "65", "descripcion": "MEDIDOR SIN CAJA"},
            {"codigo": "66", "descripcion": "CAJA MEDIDOR SIN TAPA"},
            {"codigo": "67", "descripcion": "MEDIDOR DIO VUELTA"},
            {"codigo": "68", "descripcion": "TRASLADAR MEDIDRO AL EXTERIOR"},
            {"codigo": "70", "descripcion": "INFORMACION ERRONEA"},
            {"codigo": "71", "descripcion": "NO CORRESPONDE CLASE DE SERVICIO"},
            {"codigo": "72", "descripcion": "NO CORRESPONDE UNID. DE USO"},
            {"codigo": "73", "descripcion": "NUMERO DE MEDIDOR NO EXISTE"},
            {"codigo": "74", "descripcion": "NUMERO DE MEDIDOR DIFERENTE"},
            {"codigo": "75", "descripcion": "UNIDADES DE USO"},
            {"codigo": "76", "descripcion": "INDUSTRIAL - FABRICA - SIMILAR"},
            {"codigo": "80", "descripcion": "OTRAS OBSERVACIONES"},
            {"codigo": "81", "descripcion": "CAJA DE MEDIDRO INUNDADA"},
            {"codigo": "82", "descripcion": "CONEXION CLANDESTINA"},
            {"codigo": "83", "descripcion": "DESABITADA"},
            {"codigo": "84", "descripcion": "CONEXION PROFUNDA"},
            {"codigo": "85", "descripcion": "CONEXION SIN USO"},
            {"codigo": "86", "descripcion": "PREDIO HABITADO CON CONSUMO"},
            {"codigo": "87", "descripcion": "CONEXION DESAGUE ACTIVO"},
            {"codigo": "88", "descripcion": "PREDIO CON POZO PROPIO"},
            {"codigo": "89", "descripcion": "SE NOTIFICO CONSUMO ELEVADO"},
        ]
        for item in observaciones_data:
            existe = db.query(CatalogoObservacion).filter_by(codigo=item["codigo"]).first()
            if not existe:
                db.add(CatalogoObservacion(**item))

        db.commit()
        print("¡Todos los catálogos estáticos se guardaron correctamente en la base de datos!")

    except Exception as e:
        db.rollback()
        print(f"Error al poblar los catálogos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    poblar_catlogos_definitivos()