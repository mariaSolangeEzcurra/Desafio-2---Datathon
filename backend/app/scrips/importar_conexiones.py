import pandas as pd
from sqlalchemy import create_engine
import os

def importar_conexiones():
    ruta_csv = "/app/app/scrips/data/conexiones.csv"
    df = pd.read_csv(ruta_csv, sep="\t")

    # Renombrar columnas si es necesario
    df.rename(columns={
        "lat": "latitud",
        "lon": "longitud"
    }, inplace=True)

    # Solo columnas que existen en el modelo
    columnas_modelo = [
        "codigo_suministro", "zona_id", "latitud", "longitud",
        "direccion_ref", "tipo_conexion", "estado_servicio", "ruta_id"
    ]
    df = df[[c for c in columnas_modelo if c in df.columns]]

    print("Datos cargados desde CSV:")
    print(df.head())

    url = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://admin_sedapar:password_seguro_2026@db:5432/db_operaciones_sedapar"
    )
    engine = create_engine(url)

    df.to_sql("conexiones", con=engine, if_exists="append", index=False)
    print("✅ Datos importados correctamente a la tabla 'conexiones'.")

if __name__ == "__main__":
    importar_conexiones()
