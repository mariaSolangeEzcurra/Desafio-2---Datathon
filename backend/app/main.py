from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importamos Base y engine desde tu archivo database
from app.database import engine, Base
# Importamos tu archivo de modelos para que SQLAlchemy sepa qué tablas crear
from app import model 
from app.routers.auth import router as auth_router

# ESTA LÍNEA CREA LAS TABLAS AUTOMÁTICAMENTE AL ARRANCAR
model.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema Inteligente de Supervisión",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Tu frontend de React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.get("/")
def root():
    return {
        "mensaje": "API del Sistema Inteligente de Supervisión - Conectada a Postgres"
    }