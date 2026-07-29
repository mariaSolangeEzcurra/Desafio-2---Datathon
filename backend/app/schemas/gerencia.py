from pydantic import BaseModel
from typing import List, Optional, Any
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

# --- Subpanel 1: Resumen Ejecutivo Financiero ---
class KpisGlobalesCorte(BaseModel):
    total_ordenes: int
    ordenes_ejecutadas: int
    ordenes_pendientes: int
    tasa_efectividad_porcentaje: float
    monto_total_deuda: float
    monto_deuda_recuperada: float
    monto_deuda_en_riesgo: float

class KpisCortesResponse(BaseModel):
    periodo: PeriodoFecha
    kpis_globales: KpisGlobalesCorte

    class Config:
        from_attributes = True


# --- Subpanel 2: Análisis Territorial y Programas ---
class ItemDesgloseDistrito(BaseModel):
    distrito: str
    total_ordenes: int
    ejecutadas: int
    pendientes: int
    deuda_total: float

class ItemDesgloseTipoPrograma(BaseModel):
    ctipprg: Any
    total_ordenes: int
    ejecutadas: int
    pendientes: int
    deuda_total: float

class DesgloseCortes(BaseModel):
    por_distrito: List[ItemDesgloseDistrito]
    por_tipo_programa: List[ItemDesgloseTipoPrograma]

class DesgloseCortesResponse(BaseModel):
    periodo: PeriodoFecha
    desglose: DesgloseCortes

    class Config:
        from_attributes = True


# --- Subpanel 3: Impedimentos Operativos ---
class PuntoImpedimento(BaseModel):
    ccodcnx: str
    lat: float
    lng: float
    csitreg: str
    ccodacc: Optional[str] = None
    cdesacc: Optional[str] = None
    distrito: Optional[str] = None
    direccion: Optional[str] = None
    deuda: float

class ImpedimentosCortesResponse(BaseModel):
    periodo: PeriodoFecha
    total_impedimentos: int
    detalle_impedimentos: List[PuntoImpedimento]

    class Config:
        from_attributes = True