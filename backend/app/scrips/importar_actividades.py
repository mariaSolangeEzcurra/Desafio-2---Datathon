import pandas as pd
from sqlalchemy import create_engine
import os

def importar_actividades():
    ruta_csv = "/app/app/scrips/data/actividades.csv"
    df = pd.read_csv(ruta_csv, sep="\t")

    # Renombrar si es necesario
    df.rename(columns={"id": "actividad_id"}, inplace=True)

    # Convertir fecha y horas a datetime válido
    df["fecha"] = pd.to_datetime(df["fecha"], dayfirst=True, errors="coerce")
    df["hora_inicio"] = pd.to_datetime(
        df["fecha"].dt.strftime("%Y-%m-%d") + " " + df["hora_inicio"].astype(str),
        errors="coerce"
    )
    df["hora_fin"] = pd.to_datetime(
        df["fecha"].dt.strftime("%Y-%m-%d") + " " + df["hora_fin"].astype(str),
        errors="coerce"
    )

    # Solo columnas que existen en el modelo
    columnas_modelo = [
        "actividad_id", "codigo_suministro", "trabajador_id",
        "tipo_actividad", "fecha", "hora_inicio", "hora_fin",
        "duracion_min", "duracion_esperada_min", "estado",
        "resultado", "gps_trabajador_lat", "gps_trabajador_lon"
    ]
    df = df[[c for c in columnas_modelo if c in df.columns]]

    print("Datos cargados desde CSV:")
    print(df.head())

    url = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://admin_sedapar:password_seguro_2026@db:5432/db_operaciones_sedapar"
    )
    engine = create_engine(url)

    df.to_sql("actividades", con=engine, if_exists="append", index=False)
    print("✅ Datos importados correctamente a la tabla 'actividades'.")

if __name__ == "__main__":
    importar_actividades()
