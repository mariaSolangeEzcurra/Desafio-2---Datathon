from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app import model

# Routers
from app.routers.auth import router as auth_router
from app.routers.usuarios import router as usuarios_router
from app.routers import usuarios, zonas, conexiones, trabajadores, actividades, impedimentos, alertas, mapas

# crear tablas (si no existen)
model.Base.metadata.create_all(bind=engine)
# 1. Primero declaras la app
app = FastAPI()

# 2. Configuras los orígenes permitidos
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# 3. Agregas el middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers

app.include_router(auth_router)
app.include_router(usuarios_router)
app.include_router(zonas.router)
app.include_router(conexiones.router)
app.include_router(trabajadores.router)
app.include_router(actividades.router)
app.include_router(impedimentos.router)
app.include_router(alertas.router)
app.include_router(mapas.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "mensaje": "Sistema Inteligente de Supervisión - SEDAPAR",
        "version": "1.1.0"
    }

@app.get("/health")
def health():
    return {
        "status": "ok"
    }