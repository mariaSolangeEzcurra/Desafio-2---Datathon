from app.database import engine
from app import model
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 

from app.routers.auth import router as auth_router
from app.routers.usuarios import router as usuarios_router
from app.routers.catalogo import router as catalogo_router
from app.routers.gerencia import router as gerencia_router

from app.routers.Lectura import (
    uploadLectura, 
    uploadReporteDiario, 
    dashboard_kpis, 
    personal as personal_lectura, 
    mapas, 
    alertas, 
    reportes
)

from app.routers.Corte import (
    uploadCorte, 
    kpisCorte, 
    mapa, 
    reporte, 
    personal as personal_corte,
    alertas as alertas_corte
)

# Crear las tablas
model.Base.metadata.create_all(bind=engine)

# instancia de la app
app = FastAPI()

# Configurar CORS sobre la única instancia
app.add_middleware(
    CORSMiddleware,    
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers de uso general
app.include_router(auth_router)
app.include_router(usuarios_router)
app.include_router(catalogo_router)
app.include_router(gerencia_router)

# routers de Lectura 
app.include_router(uploadLectura.router)
app.include_router(uploadReporteDiario.router)
app.include_router(dashboard_kpis.router)
app.include_router(personal_lectura.router)
app.include_router(mapas.router)
app.include_router(alertas.router)
app.include_router(reportes.router)

# routers de Corte 
app.include_router(uploadCorte.router)
app.include_router(kpisCorte.router)
app.include_router(mapa.router)
app.include_router(reporte.router)
app.include_router(personal_corte.router)
app.include_router(alertas_corte.router)

@app.get("/")
def root():
    return {"status": "online"}