import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Lee DATABASE_URL desde la variable de entorno de Render.
# Si estás en desarrollo local sin variable, usa el fallback a Docker Desktop.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://admin_sedapar:password_seguro_2026@db:5432/db_operaciones_sedapar"
)

# 2. Corrección para compatibilidad con SQLAlchemy si la URL empieza con 'postgres://'
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()