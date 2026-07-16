import pandas as pd
from sqlalchemy import create_engine
import os

def importar_alertas():
    ruta_csv = "/app/app/scrips/data/alertas.csv"
    df = pd.read_csv(ruta_csv, sep="\t")

    # Renombrar columnas para que coincidan con el modelo
    df.rename(columns={
        "id": "alerta_id",
        "fecha_generacion": "fecha_generacion"
    }, inplace=True)

    # Convertir fecha_generacion a datetime válido
    df["fecha_generacion"] = pd.to_datetime(df["fecha_generacion"], dayfirst=True, errors="coerce")

    # Solo columnas que existen en el modelo
    columnas_modelo = [
        "alerta_id", "nivel", "kpi", "motivo",
        "fecha_generacion", "estado_alerta",
        "zona_id", "trabajador_id", "supervisor_id"
    ]
    df = df[[c for c in columnas_modelo if c in df.columns]]

    print("Datos cargados desde CSV:")
    print(df.head())

    url = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://admin_sedapar:password_seguro_2026@db:5432/db_operaciones_sedapar"
    )
    engine = create_engine(url)

    df.to_sql("alertas", con=engine, if_exists="append", index=False)
    print("✅ Datos importados correctamente a la tabla 'alertas'.")

if __name__ == "__main__":
    importar_alertas()
