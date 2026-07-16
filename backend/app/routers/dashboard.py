from fastapi import APIRouter

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)

@router.get("/")
def obtener_dashboard():
    return {"message": "Endpoint de dashboard listo."}
