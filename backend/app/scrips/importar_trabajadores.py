import pandas as pd
from sqlalchemy import create_engine
import os

def importar_trabajadores():
    # Ruta del archivo CSV/Excel
    ruta_csv = "/app/app/scrips/data/trabajadores.csv"  # ajusta según dónde lo guardaste

    # Leer el archivo (si es CSV con tabulaciones)
    df = pd.read_csv(ruta_csv, sep="\t")

    # Si es Excel, usa:
    # df = pd.read_excel(ruta_csv)

    print("Datos cargados desde archivo:")
    print(df.head())

    # Conexión a Postgres dentro del contenedor
    url = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://admin_sedapar:password_seguro_2026@db:5432/db_operaciones_sedapar"
    )
    engine = create_engine(url)

    # Importar los datos a la tabla 'trabajadores'
    df.to_sql("trabajadores", con=engine, if_exists="append", index=False)

    print("✅ Datos importados correctamente a la tabla 'trabajadores'.")

if __name__ == "__main__":
    importar_trabajadores()
