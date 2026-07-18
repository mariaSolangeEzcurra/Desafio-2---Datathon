from sqlalchemy import Column, Integer, Text, String, Float, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


# ==========================================
# USUARIOS DEL SISTEMA (WEB/WEB ADM)
# ==========================================
class Usuario(Base):
    __tablename__ = "usuarios"
    id_usuario = Column(String, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    correo = Column(String, unique=True, index=True, nullable=False)
    contrasena = Column(String, nullable=False)
    rol = Column(String, nullable=False)
    estado = Column(String, default="Activo")
    alertas_revisadas = relationship("Alerta", back_populates="supervisor")


# ==========================================
# LOGÍSTICA / ZONAS (Para todos los servicios)
# ==========================================
class Zona(Base):
    __tablename__ = "zonas"
    zona_id = Column(String, primary_key=True)  # Se genera combinando Distrito + cMetFac
    Distrito = Column(String(100), nullable=False)
    zona_operativa = Column(String, nullable=True)
    cuadrante = Column(String, nullable=True)
    cMetFac = Column(String(10), nullable=False)  # Grupo de Facturación del Excel (ej. "1001")
    conexiones = relationship("Conexion", back_populates="zona")
    alertas = relationship("Alerta", back_populates="zona")


# ==========================================
# RUTAS DE LECTURA
# ==========================================
class Ruta(Base):
    """
    Antes cDeRuLe era un String suelto en Conexion. Una ruta agrupa varias
    conexiones (ej. "RUTA 0104910" contiene N suministros), así que se
    modela como entidad propia.
    """
    __tablename__ = "rutas"
    ruta_id = Column(String(50), primary_key=True)  # ej. "RUTA 0104910" (valor crudo de cDeRuLe)
    nombre = Column(String, nullable=True)
    conexiones = relationship("Conexion", back_populates="ruta")


# ==========================================
# INFRAESTRUCTURA / SUMINISTROS
# ==========================================
class Conexion(Base):
    __tablename__ = "conexiones"
    cCodCnx = Column(String(20), primary_key=True)  # Código de Conexión / Suministro (ej. "17")
    cNroMdr = Column(String(30), nullable=True)      # Número de Medidor (ej. "PA24359726")
    zona_id = Column(String, ForeignKey("zonas.zona_id"), nullable=True)
    ruta_id = Column(String, ForeignKey("rutas.ruta_id"), nullable=True)

    direccion_ref = Column(String, nullable=True)
    tipo_conexion = Column(String, nullable=True)
    estado_servicio = Column(String, nullable=True)

    # Ubicación FÍSICA REAL del medidor (padrón GIS oficial de SEDAPAR).
    # NO se llena desde el Excel de lecturas: esas coordenadas pertenecen
    # al trabajador que hizo la lectura, no al medidor. Ver
    # ActividadLectura.cGPSLat/cGPSLon para la ubicación capturada en campo.
    # Estos dos campos quedan en NULL hasta que se importe el padrón GIS.
    latitud_real = Column(Float, nullable=True)
    longitud_real = Column(Float, nullable=True)

    zona = relationship("Zona", back_populates="conexiones")
    ruta = relationship("Ruta", back_populates="conexiones")
    actividades = relationship("Actividad", back_populates="conexion")


# ==========================================
# PERSONAL DE CAMPO (Multiproceso)
# ==========================================
class Trabajador(Base):
    __tablename__ = "trabajadores"
    cCodPrs = Column(String(20), primary_key=True)  # Código de Personal (ej. "5010364")
    nombre = Column(String, nullable=False, default="Trabajador Temporal")
    distrito_base = Column(String, nullable=True)
    supervisor = Column(String, nullable=True)
    proceso_actual = Column(String, default="Lectura")
    actividades = relationship("Actividad", back_populates="trabajador")
    alertas = relationship("Alerta", back_populates="trabajador")

    @property
    def trabajador_id(self) -> str:
        return self.cCodPrs

    @property
    def rol(self) -> str:
        return self.proceso_actual or "Lectura"

    @property
    def estado(self) -> str:
        return "Activo"


# ==========================================
# ACTIVIDADES (TABLA PADRE GENERAL)
# ==========================================
class Actividad(Base):
    __tablename__ = "actividades"
    actividad_id = Column(String, primary_key=True)  # ID único (cCodCnx + dLectur)
    cCodCnx = Column(String(20), ForeignKey("conexiones.cCodCnx"))
    cCodPrs = Column(String(20), ForeignKey("trabajadores.cCodPrs"))

    tipo_actividad = Column(String, nullable=False)  # 'Lectura', 'Corte', 'Reconexión', 'Mantenimiento'

    fecha = Column(Date, nullable=True)
    hora_inicio = Column(DateTime, nullable=True)
    hora_fin = Column(DateTime, nullable=True)

    duracion_min = Column(Float, nullable=True)
    duracion_esperada_min = Column(Float, nullable=True)
    estado = Column(String)  # 'Completado', 'Inconcluso'
    resultado = Column(String, nullable=True)

    conexion = relationship("Conexion", back_populates="actividades")
    trabajador = relationship("Trabajador", back_populates="actividades")
    impedimentos = relationship("Impedimento", back_populates="actividad")
    observaciones = relationship("Observacion", back_populates="actividad")

    detalle_lectura = relationship("ActividadLectura", uselist=False, back_populates="actividad_general")


# ==========================================
# DETALLE ESPECÍFICO: SÓLO PARA LECTURA
# ==========================================
class ActividadLectura(Base):
    __tablename__ = "actividades_lectura"
    actividad_id = Column(String, ForeignKey("actividades.actividad_id"), primary_key=True)

    dLectur = Column(DateTime, nullable=True)    # Fecha hora de Lectura
    nLecAct = Column(Integer, nullable=True)     # Lectura Actual
    cImpLec = Column(String(10), nullable=True)  # Código de Impedimento
    cObsMdr = Column(String(255), nullable=True) # Código de Observación

    # Coordenadas del TRABAJADOR capturadas por el aplicativo móvil en el
    # momento de la lectura (no son la ubicación del medidor).
    cGPSAlt = Column(Float, nullable=True)
    cGPSLat = Column(Float, nullable=True)
    cGPSLon = Column(Float, nullable=True)

    actividad_general = relationship("Actividad", back_populates="detalle_lectura")


# ==========================================
# CATÁLOGOS (código -> descripción oficial SEDAPAR)
# Quedan vacíos hasta que se cargue el catálogo real; ver upload.py para
# el fallback cuando un código no está registrado todavía.
# ==========================================
class CatalogoImpedimento(Base):
    __tablename__ = "catalogo_impedimentos"
    codigo = Column(String(10), primary_key=True)
    descripcion = Column(String, nullable=False)
    categoria = Column(String, nullable=True)


class CatalogoObservacion(Base):
    __tablename__ = "catalogo_observaciones"
    codigo = Column(String(10), primary_key=True)
    descripcion = Column(String, nullable=False)


# ==========================================
# CONTINGENCIAS Y ALERTAS (una fila por ocurrencia)
# ==========================================
class Impedimento(Base):
    __tablename__ = "impedimentos"
    impedimento_id = Column(String, primary_key=True)
    actividad_id = Column(String, ForeignKey("actividades.actividad_id"))

    cImpLec = Column(String(10), nullable=True)  # Código del impedimento (ej. "13")
    categoria = Column(String, nullable=True)
    descripcion = Column(Text, nullable=True)
    latitud = Column(Float, nullable=True)
    longitud = Column(Float, nullable=True)
    actividad = relationship("Actividad", back_populates="impedimentos")


class Observacion(Base):
    """Una fila por cada observación de medidor registrada en una lectura."""
    __tablename__ = "observaciones"
    observacion_id = Column(String, primary_key=True)
    actividad_id = Column(String, ForeignKey("actividades.actividad_id"))

    codigo = Column(String(10), nullable=True)   # Código crudo (cObsMdr)
    descripcion = Column(Text, nullable=True)    # Resuelto contra CatalogoObservacion
    actividad = relationship("Actividad", back_populates="observaciones")


class Alerta(Base):
    __tablename__ = "alertas"
    alerta_id = Column(String, primary_key=True)
    nivel = Column(String)
    kpi = Column(String)
    motivo = Column(Text)
    fecha_generacion = Column(DateTime, default=func.now())
    estado_alerta = Column(String, default="Pendiente")

    zona_id = Column(String, ForeignKey("zonas.zona_id"))
    cCodPrs = Column(String(20), ForeignKey("trabajadores.cCodPrs"))
    supervisor_id = Column(String, ForeignKey("usuarios.id_usuario"), nullable=True)
    zona = relationship("Zona", back_populates="alertas")
    trabajador = relationship("Trabajador", back_populates="alertas")
    supervisor = relationship("Usuario", back_populates="alertas_revisadas")