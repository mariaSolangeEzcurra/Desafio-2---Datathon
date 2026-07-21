from sqlalchemy import Column, Integer, Text, String, Float, DateTime, Date, ForeignKey
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
    
    ccodcnx = Column(String(20), primary_key=True)  # Código de conexión del suministro
    cnromdr = Column(String(30), nullable=True)     # Número de medidor
    zona_id = Column(String, ForeignKey("zonas.zona_id"))
    ruta_id = Column(String, ForeignKey("rutas.ruta_id"))
    
    direccion_ref = Column(String, nullable=True)
    tipo_conexion = Column(String, nullable=True)
    estado_servicio = Column(String, nullable=True)
    
    # Coordenadas GIS fijas del suministro (Catastro)
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
    """
    Representa al personal operativo en campo. Su rol o proceso no es estático,
    sino que se deduce del historial de actividades e inspecciones que suben en los Excel.
    """
    __tablename__ = "trabajadores"
    
    ccodprs = Column(String(20), primary_key=True)  # Código de Personal de SEDAPAR
    nombre = Column(String, nullable=False, default="Trabajador Temporal")
    #distrito_base = Column(String, nullable=True)
    supervisor = Column(String, nullable=True)      # Nombre del supervisor asignado en campo
    
    # Relaciones operativas puras
    actividades = relationship("Actividad", back_populates="trabajador")
    alertas = relationship("Alerta", back_populates="trabajador")


# ==========================================
# ACTIVIDADES (TABLA MAESTRA / MULTIPROCESO)
# ==========================================
class Actividad(Base):
    __tablename__ = "actividades"
    
    actividad_id = Column(String, primary_key=True)  # ID único (ej. cCodCnx + dLectur)
    ccodcnx = Column(String(20), ForeignKey("conexiones.ccodcnx"))
    ccodprs = Column(String(20), ForeignKey("trabajadores.ccodprs"))
    tipo_actividad = Column(String, nullable=False)  # 'Lectura', 'Corte', 'Reconexión', 'Mantenimiento'
    fecha = Column(Date, nullable=True)
    hora_inicio = Column(DateTime, nullable=True)
    hora_fin = Column(DateTime, nullable=True)
    duracion_min = Column(Float, nullable=True)
    duracion_esperada_min = Column(Float, nullable=True)
    estado = Column(String, nullable=True)          # 'Completado', 'Inconcluso'
    resultado = Column(String, nullable=True)
    cmetfac = Column(String(10), nullable=True)

    # Relaciones
    conexion = relationship("Conexion", back_populates="actividades")
    trabajador = relationship("Trabajador", back_populates="actividades")
    impedimentos = relationship("Impedimento", back_populates="actividad")
    observaciones = relationship("Observacion", back_populates="actividad")
    
    # Relación uno-a-uno con el detalle específico de lectura
    detalle_lectura = relationship("ActividadLectura", uselist=False, back_populates="actividad_general")


# ==========================================
# SUB-TABLA: DETALLE ESPECÍFICO DE LECTURA
# ==========================================
class ActividadLectura(Base):
    __tablename__ = "actividades_lectura"
    
    actividad_id = Column(String, ForeignKey("actividades.actividad_id"), primary_key=True)
    
    dlectur = Column(DateTime, nullable=True)     # Fecha y hora exacta de la lectura
    nlecact = Column(Integer, nullable=True)      # Lectura Actual (número del medidor)
    cimplec = Column(String(10), nullable=True)   # Código de Impedimento directo
    cobsmdr = Column(String(255), nullable=True)  # Código de Observación directo
    
    # Coordenadas móviles capturadas por el app del operario en el momento exacto de lectura
    cgpsalt = Column(Float, nullable=True)
    cgpslat = Column(Float, nullable=True)
    cgpslon = Column(Float, nullable=True)
    cutmx = Column(Float, nullable=True) # Nuevo campo
    cutmy = Column(Float, nullable=True) # Nuevo campo
    actividad_general = relationship("Actividad", back_populates="detalle_lectura")


# ==========================================
# CATÁLOGOS REFERENCIALES (SEDAPAR)
# ==========================================
class CatalogoImpedimento(Base):
    __tablename__ = "catalogo_impedimentos"
    
    codigo = Column(String(10), primary_key=True)  # Código de la contingencia (ej. "13")
    descripcion = Column(String, nullable=False)   # Descripción oficial (ej. "Medidor Inaccesible")
    categoria = Column(String, nullable=True)


class CatalogoObservacion(Base):
    __tablename__ = "catalogo_observaciones"
    
    codigo = Column(String(10), primary_key=True)
    descripcion = Column(String, nullable=False)


# ==========================================
# CONTINGENCIAS REGISTRADAS POR EVENTO
# ==========================================
class Impedimento(Base):
    __tablename__ = "impedimentos"
    
    impedimento_id = Column(String, primary_key=True)
    actividad_id = Column(String, ForeignKey("actividades.actividad_id"))
    cimplec = Column(String(10), nullable=True)
    categoria = Column(String, nullable=True)
    descripcion = Column(Text, nullable=True)      # Resuelto contra el catálogo para auditoría rápida
    
    # Geolocalización específica del incidente en campo
    cgpslat = Column(Float, nullable=True)
    cgpslon = Column(Float, nullable=True)
    
    actividad = relationship("Actividad", back_populates="impedimentos")


class Observacion(Base):
    __tablename__ = "observaciones"
    
    observacion_id = Column(String, primary_key=True)
    actividad_id = Column(String, ForeignKey("actividades.actividad_id"))
    codigo = Column(String(10), nullable=True)
    descripcion = Column(Text, nullable=True)       # Resuelto contra el catálogo
    
    actividad = relationship("Actividad", back_populates="observaciones")


# ==========================================
# ALERTAS DE INCIDENCIAS Y KPIS
# ==========================================
class Alerta(Base):
    __tablename__ = "alertas"
    
    alerta_id = Column(String, primary_key=True)
    nivel = Column(String, nullable=False)          # 'Crítico', 'Alto', 'Medio'
    kpi = Column(String, nullable=False)            # Nombre de la métrica rota (ej. 'Rendimiento bajo')
    motivo = Column(Text, nullable=False)
    fecha_generacion = Column(DateTime, default=func.now())
    estado_alerta = Column(String, default="Pendiente") # 'Pendiente', 'Revisada', 'Desestimada'    
    comentario_resolucion = Column(Text, nullable=True)
    fecha_actualizacion = Column(DateTime, onupdate=func.now())
    zona_id = Column(String, ForeignKey("zonas.zona_id"))
    ccodprs = Column(String(20), ForeignKey("trabajadores.ccodprs"))
    supervisor_id = Column(String, ForeignKey("usuarios.id_usuario"), nullable=True)    
    zona = relationship("Zona", back_populates="alertas")
    trabajador = relationship("Trabajador", back_populates="alertas")
    supervisor = relationship("Usuario", back_populates="alertas_revisadas")

class Intervencion(Base):
    __tablename__ = "intervenciones"
    id_intervencion = Column(Integer, primary_key=True)
    alerta_id = Column(String, ForeignKey("alertas.alerta_id"))
    supervisor_id = Column(String, ForeignKey("usuarios.id_usuario"))
    fecha_accion = Column(DateTime, default=func.now())
    accion_tomada = Column(String)
# ==========================================
# TRAZABILIDAD Y AUDITORÍA DE EXCEL
# ==========================================
class RegistroCarga(Base):
    __tablename__ = "registros_carga"
    
    id_carga = Column(Integer, primary_key=True, index=True)
    nombre_archivo = Column(String, nullable=False)
    fecha_carga = Column(DateTime, default=func.now())
    proceso = Column(String, nullable=False)        # 'Lectura', 'Corte', 'Reconexión'
    registros_insertados = Column(Integer, nullable=False)
    usuario_id = Column(String, ForeignKey("usuarios.id_usuario"), nullable=True)
    
    usuario = relationship("Usuario")