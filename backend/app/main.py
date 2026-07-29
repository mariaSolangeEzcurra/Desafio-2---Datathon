from app.database import engine
from app import model
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 

# Routers unificados usando siempre la ruta base "app.routers"
from app.routers.auth import router as auth_router
from app.routers.usuarios import router as usuarios_router
from app.routers.catalogo import router as catalogo_router
from app.routers.Lectura import uploadLectura, uploadReporteDiario, dashboard_kpis , personal, mapas, alertas, reportes
from app.routers.gerencia import router as gerencia_router
from app.routers.Corte import uploadCorte, kpisCorte, mapa, reporte
# 1. Crear las tablas
#model.Base.metadata.create_all(bind=engine)

# 2. ÚNICA instancia de la app
app = FastAPI()

# 3. Configurar CORS sobre la única instancia
app.add_middleware(
    CORSMiddleware,    
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Incluir routers
app.include_router(auth_router)
app.include_router(usuarios_router)
app.include_router(catalogo_router)
app.include_router(gerencia_router)

# Registrar los routers
app.include_router(uploadLectura.router)
app.include_router(uploadReporteDiario.router)
app.include_router(dashboard_kpis.router)
app.include_router(personal.router)
app.include_router(mapas.router)
app.include_router(alertas.router)
app.include_router(reportes.router)
app.include_router(uploadCorte.router)
app.include_router(kpisCorte.router)
app.include_router(mapa.router)
app.include_router(reporte.router)

@app.get("/")
def root():
    return {"status": "online"}