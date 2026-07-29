from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class PeriodoFecha(BaseModel):
    fecha_inicio: date
    fecha_fin: date

class ResumenGrupoFacturacionResponse(BaseModel):
    periodo: PeriodoFecha
    cmetfac_filtrado: str
    total_lecturas_realizadas: int
    eficiencia_promedio: float
    total_registros_analizados: int
    total_lectores_evaluados: int

    class Config:
        from_attributes = True

class DetallePersonalRanking(BaseModel):
    ccodprs: str
    nombre_trabajador: str
    eficiencia: Optional[float] = 0.0
    lecturas_realizadas: Optional[int] = 0
    duracion_total_min: Optional[float] = 0.0
    cmetfac: Optional[str] = None
    ruta_id: Optional[str] = None

    class Config:
        from_attributes = True

class RankingPersonalResponse(BaseModel):
    periodo: PeriodoFecha
    cmetfac_filtrado: str
    ranking: List[DetallePersonalRanking]

    class Config:
        from_attributes = True

class AlertaResumenItem(BaseModel):
    alerta_id: str
    fecha: date
    nivel: str
    kpi: str
    motivo: str
    estado: str
    ccodprs: Optional[str] = None

    class Config:
        from_attributes = True

class RiesgoOperativoResponse(BaseModel):
    periodo: PeriodoFecha
    total_alertas: int
    resumen_niveles: dict
    detalle_alertas: List[AlertaResumenItem]

    class Config:
        from_attributes = True