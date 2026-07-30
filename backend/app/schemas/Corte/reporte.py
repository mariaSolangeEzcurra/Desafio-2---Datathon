from pydantic import BaseModel, ConfigDict

class ReporteGeneradoResponse(BaseModel):
    status: str
    message: str
    tipo_reporte: str  # "financiero" o "ineficiencia"
    nombre_archivo: str
    url_descarga: str | None = None
    total_registros: int

    # Opcional: Esto ayuda a que Swagger UI muestre un ejemplo claro
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "success",
                "message": "Reporte financiero generado con 15 registros.",
                "tipo_reporte": "financiero",
                "nombre_archivo": "reporte_financiero_cortes_20260729.xlsx",
                "url_descarga": "/static/exports/reporte_financiero_cortes_20260729.xlsx",
                "total_registros": 15
            }
        }
    )