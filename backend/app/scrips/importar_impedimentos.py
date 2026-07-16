import pandas as pd
from sqlalchemy import create_engine, text
import os

def importar_impedimentos():
    ruta_csv = "/app/app/scrips/data/impedimentos.csv"
    df = pd.read_csv(ruta_csv, sep="\t")

    # Renombrar columnas
    df.rename(columns={
        "id": "impedimento_id",
        "lat": "latitud",
        "lon": "longitud"
    }, inplace=True)

    # Seleccionar solo columnas del modelo
    columnas_modelo = [
        "impedimento_id", "actividad_id", "codigo_impedimento",
        "categoria", "descripcion", "latitud", "longitud"
    ]
    df = df[[c for c in columnas_modelo if c in df.columns]]

    # Conexión a Postgres
    url = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://admin_sedapar:password_seguro_2026@db:5432/db_operaciones_sedapar"
    )
    engine = create_engine(url)

    # Obtener actividades existentes
    with engine.connect() as conn:
        actividades_existentes = pd.read_sql(text("SELECT actividad_id FROM actividades"), conn)

    # Filtrar impedimentos válidos
    df = df[df["actividad_id"].isin(actividades_existentes["actividad_id"])]

    print("Datos filtrados y listos para insertar:")
    print(df.head())

    # Insertar en la tabla
    df.to_sql("impedimentos", con=engine, if_exists="append", index=False)
    print("✅ Impedimentos importados correctamente.")

if __name__ == "__main__":
    importar_impedimentos()
