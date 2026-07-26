from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class FiltroKpiParams(BaseModel):
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    zona_id: Optional[str] = None
    ccodprs: Optional[str] = None

class IndicadorGeneralResponse(BaseModel):
    total_lecturas_programadas: int
    total_lecturas_realizadas: int
    cumplimiento_lectura: float          # 1. (Ejecutadas / Programadas) * 100
    productividad_lectura: float         # 2. Lecturas / horas campo
    tiempo_promedio_lectura: float       # 3. Tiempo total / lecturas
    impedimentos_lectura: float          # 4. Con impedimento / programadas × 100
    observaciones_lectura: float         # 5. Con observación / ejecutadas × 100
    cobertura_georreferenciada: float    # 6. Lecturas con GPS válido / programadas × 100
    actividades_fuera_de_punto: float     # 7. Lecturas fuera zona / total × 100
    total_impedimentos: int
    total_observaciones: int

class RankingLectorResponse(BaseModel):
    ccodprs: str
    nombre: str
    total_lecturas: int
    eficiencia_promedio: float
    promedio_min_por_lectura: float

class KpiDashboardResponse(BaseModel):
    resumen_general: IndicadorGeneralResponse
    ranking_lectores: List[RankingLectorResponse]