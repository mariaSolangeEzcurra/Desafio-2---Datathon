from app.database import engine
from app import model
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 
# Routers
from app.routers.auth import router as auth_router
from app.routers.usuarios import router as usuarios_router
from app.routers.upload import router as upload_router
from app.routers.lectura import router as router_lectura
from app.routers import trabajadores
from app.routers.catalogo import router as catalogo_router
# 1. Crear las tablas
model.Base.metadata.create_all(bind=engine)

# 2. ÚNICA instancia de la app
app = FastAPI()

# 3. Configurar CORS sobre la única instancia
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Incluir routers
app.include_router(auth_router)
app.include_router(usuarios_router)
app.include_router(router_lectura)
app.include_router(upload_router)
app.include_router(trabajadores.router)
app.include_router(catalogo_router)

@app.get("/")
def root():
    return {"status": "online"}