import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Docker inyectará la variable de entorno, si no, usa el fallback
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin_sedapar:password_seguro_2026@db:5432/db_operaciones_sedapar")
#maria
#DATABASE_URL = "sqlite:///./db_operaciones_sedapar.db"
#engine = create_engine(
#    DATABASE_URL,
#    connect_args={"check_same_thread": False}
#)
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()