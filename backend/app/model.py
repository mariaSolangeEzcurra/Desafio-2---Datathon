from sqlalchemy import Column, Integer, Text, String, Float, DateTime, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# ==========================================
# USUARIOS DEL SISTEMA (Plataforma Web)
# ==========================================
class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(String, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    correo = Column(String, unique=True, index=True, nullable=False)
    rol = Column(String, nullable=False)  # 'Administrador', 'Supervisor', etc.
    estado = Column(String, default="Activo")

    # Relaciones
    alertas_revisadas = relationship("Alerta", back_populates="supervisor")
    intervenciones = relationship("Intervencion", back_populates="supervisor")


# ==========================================
# LOGÍSTICA / ZONAS
# ==========================================
class Zona(Base):
    __tablename__ = "zonas"

    zona_id = Column(String, primary_key=True)  # Combinación de Distrito + cMetFac
    distrito = Column(String(100), nullable=False)
    zona_operativa = Column(String, nullable=True)
    cuadrante = Column(String, nullable=True)
    cmetfac = Column(String(10), nullable=False)  # Grupo de Facturación del Excel (ej. "1001")

    # Relaciones
    conexiones = relationship("Conexion", back_populates="zona")
    alertas = relationship("Alerta", back_populates="zona")
    kpis_diarios = relationship("KpiDiario", back_populates="zona")


# ==========================================
# RUTAS DE LECTURA / OPERATIVAS
# ==========================================
class Ruta(Base):
    __tablename__ = "rutas"

    ruta_id = Column(String(50), primary_key=True)  # Valor crudo de cDeRuLe (ej. "RUTA 0104910")
    nombre = Column(String, nullable=True)

    # Relaciones
    conexiones = relationship("Conexion", back_populates="ruta")


# ==========================================
# INFRAESTRUCTURA / SUMINISTROS (Conexiones)
# ==========================================
class Conexion(Base):
    __tablename__ = "conexiones"

    ccodcnx = Column(String(20), primary_key=True)
    cnromdr = Column(String(30), nullable=True)
    zona_id = Column(String, ForeignKey("zonas.zona_id"))
    ruta_id = Column(String, ForeignKey("rutas.ruta_id"))
    # Datos de catastro (Excel de TI)
    direccion = Column(String, nullable=True)       # DIRECCION
    categoria = Column(String(50), nullable=True)    # CATEGORIA (Comercial, Residencial, etc.)
    condicion = Column(String(50), nullable=True)    # CONDICION (Servicio Activo, etc.)
    latitud_real = Column(Float, nullable=True)
    longitud_real = Column(Float, nullable=True)
    utm_x = Column(Float, nullable=True)
    utm_y = Column(Float, nullable=True)

    # Relaciones
    zona = relationship("Zona", back_populates="conexiones")
    ruta = relationship("Ruta", back_populates="conexiones")
    actividades = relationship("Actividad", back_populates="conexion")


# ==========================================
# PERSONAL DE CAMPO (Entidades Operativas de Excel)
# ==========================================
class Trabajador(Base):
    __tablename__ = "trabajadores"

    ccodprs = Column(String(20), primary_key=True)  # Código de Personal de SEDAPAR
    nombre = Column(String, nullable=False, default="Trabajador Temporal")
    telefono = Column(String, nullable=True)
    ultimo_puntaje = Column(Float, nullable=True)
    ultima_clasificacion = Column(String(30), nullable=True)  # Excelente, Bueno, Regular, Crítico
    fecha_ultima_evaluacion = Column(Date, nullable=True)

    actividades = relationship("Actividad", back_populates="trabajador", cascade="all, delete-orphan")
    alertas = relationship("Alerta", back_populates="trabajador", cascade="all, delete-orphan")
    resumenes_diarios = relationship("ResumenDiarioLector", back_populates="trabajador", cascade="all, delete-orphan")
    evaluaciones = relationship("EvaluacionDesempeno", back_populates="trabajador", cascade="all, delete-orphan")


# ==========================================
# ACTIVIDADES (TABLA MAESTRA / MULTIPROCESO)
# ==========================================
class Actividad(Base):
    __tablename__ = "actividades"

    actividad_id = Column(String, primary_key=True)  # ID único (ej. cCodCnx + dLectur)
    ccodcnx = Column(String(20), ForeignKey("conexiones.ccodcnx"))
    ccodprs = Column(String(20), ForeignKey("trabajadores.ccodprs"))
    tipo_actividad = Column(String, nullable=False, index=True)  # 'Lectura', 'Corte', 'Reconexión', 'Mantenimiento'
    fecha = Column(Date, nullable=True, index=True)
    hora_inicio = Column(DateTime, nullable=True)
    hora_fin = Column(DateTime, nullable=True)
    duracion_min = Column(Float, nullable=True)
    duracion_esperada_min = Column(Float, nullable=True)
    estado = Column(String, nullable=True)          # 'Completado', 'Inconcluso'
    resultado = Column(String, nullable=True)       # 'OK', 'Fuera de Punto'
    cmetfac = Column(String(10), nullable=True)
    promedio_lectura = Column(Float, nullable=True)
    distancia_metros = Column(Float, nullable=True)
    id_carga = Column(Integer, ForeignKey("registros_carga.id_carga"), nullable=True)

    conexion = relationship("Conexion", back_populates="actividades")
    trabajador = relationship("Trabajador", back_populates="actividades")    
    impedimentos = relationship("Impedimento", back_populates="actividad", cascade="all, delete-orphan")
    observaciones = relationship("Observacion", back_populates="actividad", cascade="all, delete-orphan")
    detalle_lectura = relationship("ActividadLectura", uselist=False, back_populates="actividad_general", cascade="all, delete-orphan")
    registro_carga = relationship("RegistroCarga", back_populates="actividades")
# ==========================================
# SUB-TABLA: DETALLE ESPECÍFICO DE LECTURA
# ==========================================
class ActividadLectura(Base):
    __tablename__ = "actividades_lectura"

    actividad_id = Column(String, ForeignKey("actividades.actividad_id"), primary_key=True)
    dlectur = Column(DateTime, nullable=True)
    nlecact = Column(Integer, nullable=True)
    cimplec = Column(String(10), nullable=True)
    cobsmdr = Column(String(255), nullable=True)
    cperfac = Column(String(10), nullable=True, index=True)  
    cgpsalt = Column(Float, nullable=True)
    cgpslat = Column(Float, nullable=True)
    cgpslon = Column(Float, nullable=True)
    cutmx = Column(Float, nullable=True)
    cutmy = Column(Float, nullable=True)

    actividad_general = relationship("Actividad", back_populates="detalle_lectura")


# ==========================================
# CATÁLOGOS REFERENCIALES (SEDAPAR)
# ==========================================
class CatalogoImpedimento(Base):
    __tablename__ = "catalogo_impedimentos"

    codigo = Column(String(10), primary_key=True)
    descripcion = Column(String, nullable=False)


class CatalogoObservacion(Base):
    __tablename__ = "catalogo_observaciones"

    codigo = Column(String(10), primary_key=True)
    descripcion = Column(String, nullable=False)


class CatalogoGrupoFacturacion(Base):
    __tablename__ = "catalogo_grupos_facturacion"

    cmetfac = Column(String(10), primary_key=True)
    ccodmet = Column(String(10), nullable=True)
    cnommet = Column(String, nullable=False)


# ==========================================
# CONTINGENCIAS REGISTRADAS POR EVENTO
# ==========================================
class Impedimento(Base):
    __tablename__ = "impedimentos"

    impedimento_id = Column(String, primary_key=True)
    actividad_id = Column(String, ForeignKey("actividades.actividad_id"))
    cimplec = Column(String(10), nullable=True)
    categoria = Column(String, nullable=True)
    descripcion = Column(Text, nullable=True) 
    cgpslat = Column(Float, nullable=True)
    cgpslon = Column(Float, nullable=True)

    actividad = relationship("Actividad", back_populates="impedimentos")


class Observacion(Base):
    __tablename__ = "observaciones"

    observacion_id = Column(String, primary_key=True)
    actividad_id = Column(String, ForeignKey("actividades.actividad_id"))
    codigo = Column(String(10), nullable=True)
    descripcion = Column(Text, nullable=True)  # Resuelto contra el catálogo

    actividad = relationship("Actividad", back_populates="observaciones")


# ==========================================
# RESUMEN DIARIO POR LECTOR (Excel de Reportes Diarios)
# ==========================================
class ResumenDiarioLector(Base):
    __tablename__ = "resumen_diario_lector"

    id = Column(Integer, primary_key=True, index=True)
    ccodprs = Column(String(20), ForeignKey("trabajadores.ccodprs"), nullable=False)
    fecha = Column(Date, nullable=False)

    cantidad_lecturas = Column(Integer, nullable=True)    
    lecturas_realizadas = Column(Integer, nullable=True)
    lecturas_pendientes = Column(Integer, nullable=True)
    cantidad_impedimentos = Column(Integer, nullable=True)
    cantidad_observaciones = Column(Integer, nullable=True)
    cantidad_fotos = Column(Integer, nullable=True)
    ruta_id = Column(String(50), nullable=True)
    cmetfac = Column(String(10), nullable=True)
    id_carga = Column(Integer, ForeignKey("registros_carga.id_carga"), nullable=True)
    fecha_inicio = Column(Date, nullable=True)
    hora_inicio = Column(DateTime, nullable=True)
    fecha_fin = Column(Date, nullable=True)
    hora_fin = Column(DateTime, nullable=True)
    duracion_total_min = Column(Float, nullable=True)       # DURACION, convertida a minutos
    promedio_min = Column(Float, nullable=True)              # PROMEDIO por lectura, en minutos
    eficiencia = Column(Float, nullable=True)  
    trabajador = relationship("Trabajador", back_populates="resumenes_diarios")
    registro_carga = relationship("RegistroCarga", back_populates="resumenes_diarios")

    __table_args__ = (
        UniqueConstraint("ccodprs", "fecha", name="uq_resumen_diario_lector_ccodprs_fecha"),
    )


# ==========================================
# KPIs AGREGADOS (Día / Zona) — base para vistas Día / Semana / Mes
# ==========================================
class KpiDiario(Base):
    __tablename__ = "kpi_diario"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False)
    zona_id = Column(String, ForeignKey("zonas.zona_id"), nullable=True) 
    kpi_nombre = Column(String, nullable=False)  
    numerador = Column(Float, nullable=True)
    denominador = Column(Float, nullable=True)
    valor = Column(Float, nullable=False)        
    nivel_alerta = Column(String, nullable=True)  

    zona = relationship("Zona", back_populates="kpis_diarios")

    __table_args__ = (
        UniqueConstraint("fecha", "zona_id", "kpi_nombre", name="uq_kpi_diario_fecha_zona_kpi"),
    )


# ==========================================
# ALERTAS DE INCIDENCIAS Y KPIS
# ==========================================
class Alerta(Base):
    __tablename__ = "alertas"

    alerta_id = Column(String, primary_key=True)
    nivel = Column(String, nullable=False)  
    kpi = Column(String, nullable=False)     
    motivo = Column(Text, nullable=False)
    fecha_generacion = Column(DateTime, default=func.now())
    fecha = Column(Date, nullable=False, default=func.current_date()) 
    estado_alerta = Column(String, default="Pendiente")  
    comentario_resolucion = Column(Text, nullable=True)
    fecha_actualizacion = Column(DateTime, onupdate=func.now())
    zona_id = Column(String, ForeignKey("zonas.zona_id"))
    ccodprs = Column(String(20), ForeignKey("trabajadores.ccodprs"))
    supervisor_id = Column(String, ForeignKey("usuarios.id_usuario"), nullable=True)
    valor_actual = Column(Float, nullable=True)
    valor_umbral = Column(Float, nullable=True)
    prioridad = Column(String, default="Media", nullable=True)  

    zona = relationship("Zona", back_populates="alertas")
    trabajador = relationship("Trabajador", back_populates="alertas")
    supervisor = relationship("Usuario", back_populates="alertas_revisadas")
    intervenciones = relationship("Intervencion", back_populates="alerta")

    __table_args__ = (
        UniqueConstraint("ccodprs", "kpi", "fecha", name="uq_alerta_ccodprs_kpi_fecha"),
    )


class Intervencion(Base):
    __tablename__ = "intervenciones"

    id_intervencion = Column(Integer, primary_key=True)
    alerta_id = Column(String, ForeignKey("alertas.alerta_id"))
    supervisor_id = Column(String, ForeignKey("usuarios.id_usuario"))
    fecha_accion = Column(DateTime, default=func.now())
    accion_tomada = Column(String)

    alerta = relationship("Alerta", back_populates="intervenciones")
    supervisor = relationship("Usuario", back_populates="intervenciones")


# ==========================================
# TRAZABILIDAD Y AUDITORÍA DE EXCEL
# ==========================================
class RegistroCarga(Base):
    __tablename__ = "registros_carga"

    id_carga = Column(Integer, primary_key=True, index=True)
    nombre_archivo = Column(String, nullable=False)
    tipo_archivo = Column(String, nullable=False)  # 'TI' (catastro+GPS) o 'Reporte Diario'
    fecha_carga = Column(DateTime, default=func.now())
    proceso = Column(String, nullable=False)  # 'Lectura', 'Corte', 'Reconexión'
    estado = Column(String, nullable=False, default="Exitoso")  # 'Exitoso', 'Con errores', 'Fallido'
    registros_insertados = Column(Integer, nullable=False)
    registros_error = Column(Integer, nullable=False, default=0)
    detalle_errores = Column(Text, nullable=True)  
    usuario_id = Column(String, ForeignKey("usuarios.id_usuario"), nullable=True)

    usuario = relationship("Usuario")
    actividades = relationship("Actividad", back_populates="registro_carga", cascade="all, delete-orphan")
    resumenes_diarios = relationship("ResumenDiarioLector", back_populates="registro_carga", cascade="all, delete-orphan")

class EvaluacionDesempeno(Base):
    __tablename__ = "evaluaciones_desempeno"
    id = Column(Integer, primary_key=True, index=True)
    ccodprs = Column(String(20), ForeignKey("trabajadores.ccodprs"))
    fecha = Column(Date, nullable=False)
    puntaje = Column(Float, nullable=False)
    clasificacion = Column(String(30), nullable=False)  # Excelente, Bueno, Regular, Crítico
    tendencia = Column(String(20), nullable=True)        # Mejora, Estable, Disminuye
    eficiencia = Column(Float)
    cumplimiento = Column(Float)
    productividad = Column(Float)
    impedimentos = Column(Float)
    observaciones = Column(Float)
    cobertura = Column(Float)
    motivos = Column(Text)

    trabajador = relationship("Trabajador", back_populates="evaluaciones")