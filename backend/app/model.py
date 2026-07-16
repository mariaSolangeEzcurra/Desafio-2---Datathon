from sqlalchemy import Column, Integer,Text, String, Float, DateTime, Date, Time, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# usuarios
class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(String, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    correo = Column(String, unique=True, index=True, nullable=False)
    contrasena = Column(String, nullable=False)  # Aquí se guarda el Hash
    rol = Column(String, nullable=False)  # 'Supervisor de campo', 'Supervisor de Área Comercial', etc.
    estado = Column(String, default="Activo")

    # Relación con las alertas que revisa este usuario/supervisor
    alertas_revisadas = relationship("Alerta", back_populates="supervisor")

class Zona(Base):
    __tablename__ = "zonas"

    zona_id = Column(String, primary_key=True)

    distrito = Column(String, nullable=False)

    zona_operativa = Column(String, nullable=False)

    cuadrante = Column(String, nullable=False)

    grupo_facturacion = Column(String, nullable=False)

    conexiones = relationship(
        "Conexion",
        back_populates="zona"
    )

    alertas = relationship(
        "Alerta",
        back_populates="zona"
    )

class Conexion(Base):
    __tablename__ = "conexiones"

    codigo_suministro = Column(String, primary_key=True)

    zona_id = Column(
        String,
        ForeignKey("zonas.zona_id")
    )

    latitud = Column(Float)

    longitud = Column(Float)

    direccion_ref = Column(String)

    tipo_conexion = Column(String)

    estado_servicio = Column(String)

    ruta_id = Column(String)

    zona = relationship(
        "Zona",
        back_populates="conexiones"
    )

    actividades = relationship(
        "Actividad",
        back_populates="conexion"
    )

class Trabajador(Base):
    __tablename__ = "trabajadores"

    trabajador_id = Column(String, primary_key=True)

    nombre = Column(String, nullable=False)

    rol = Column(String)

    distrito_base = Column(String)

    supervisor = Column(String)

    actividades = relationship(
        "Actividad",
        back_populates="trabajador"
    )

    alertas = relationship(
        "Alerta",
        back_populates="trabajador"
    )

class Actividad(Base):
    __tablename__ = "actividades"

    actividad_id = Column(String, primary_key=True)

    codigo_suministro = Column(
        String,
        ForeignKey("conexiones.codigo_suministro")
    )

    trabajador_id = Column(
        String,
        ForeignKey("trabajadores.trabajador_id")
    )

    tipo_actividad = Column(String)

    fecha = Column(Date)

    hora_inicio = Column(DateTime)

    hora_fin = Column(DateTime)

    duracion_min = Column(Float)

    duracion_esperada_min = Column(Float)

    estado = Column(String)

    resultado = Column(String)

    gps_trabajador_lat = Column(Float)

    gps_trabajador_lon = Column(Float)

    conexion = relationship(
        "Conexion",
        back_populates="actividades"
    )

    trabajador = relationship(
        "Trabajador",
        back_populates="actividades"
    )

    impedimentos = relationship(
        "Impedimento",
        back_populates="actividad"
    )

class Impedimento(Base):
    __tablename__ = "impedimentos"

    impedimento_id = Column(String, primary_key=True)

    actividad_id = Column(
        String,
        ForeignKey("actividades.actividad_id")
    )

    codigo_impedimento = Column(String)

    categoria = Column(String)

    descripcion = Column(Text)

    latitud = Column(Float)

    longitud = Column(Float)

    actividad = relationship(
        "Actividad",
        back_populates="impedimentos"
    )

class Alerta(Base):
    __tablename__ = "alertas"

    alerta_id = Column(String, primary_key=True)

    nivel = Column(String)

    kpi = Column(String)

    motivo = Column(Text)

    fecha_generacion = Column(DateTime)

    estado_alerta = Column(String)

    zona_id = Column(
        String,
        ForeignKey("zonas.zona_id")
    )

    trabajador_id = Column(
        String,
        ForeignKey("trabajadores.trabajador_id")
    )

    supervisor_id = Column(
        String,
        ForeignKey("usuarios.id_usuario")
    )

    zona = relationship(
        "Zona",
        back_populates="alertas"
    )

    trabajador = relationship(
        "Trabajador",
        back_populates="alertas"
    )

    supervisor = relationship(
        "Usuario",
        back_populates="alertas_revisadas"
    )