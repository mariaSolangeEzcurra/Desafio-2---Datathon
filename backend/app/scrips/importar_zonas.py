import pandas as pd
from sqlalchemy import create_engine

def importar_zonas():
    # Ruta del archivo CSV
    ruta_csv = "/app/app/scrips/data/zonas.csv"

    # Leer el CSV con separador de tabulaciones
    df = pd.read_csv(ruta_csv, sep="\t")

    print("Datos cargados desde CSV:")
    print(df.head())

    engine = create_engine(
    "postgresql+psycopg2://admin_sedapar:password_seguro_2026@db:5432/db_operaciones_sedapar"
)


    # Importar los datos a la tabla 'zonas'
    df.to_sql("zonas", con=engine, if_exists="append", index=False)

    print("Datos importados correctamente a la tabla 'zonas'.")

if __name__ == "__main__":
    importar_zonas()
