from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Time, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# ==========================================
# 13. TABLA: USUARIOS (Acceso al Sistema)
# ==========================================
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


# ==========================================
# 1. TABLA: TRABAJADORES
# ==========================================
class Trabajador(Base):
    __tablename__ = "trabajadores"

    id_trabajador = Column(String, primary_key=True, index=True)
    nombre_completo = Column(String, nullable=False)
    documento_identidad = Column(String, unique=True, nullable=False)
    cargo = Column(String, nullable=False)
    zona_asignada = Column(String, nullable=True)  # Ref: SEGMENTOS
    grupo_facturacion = Column(String, nullable=True)  # Ref: SEGMENTOS
    supervisor_asignado = Column(String, ForeignKey("usuarios.id_usuario"), nullable=True)
    fecha_ingreso = Column(Date, nullable=False)
    estado = Column(String, default="Activo")
    tipo_contracto = Column(String, nullable=True)  # Planilla, tercerizado...

    # Relaciones
    actividades = relationship("Actividad", back_populates="trabajador")
    registros_gps = relationship("RegistroGPS", back_populates="trabajador")
    alertas = relationship("Alerta", back_populates="trabajador")


# ==========================================
# 6. TABLA: IMPEDIMENTOS
# ==========================================
class Impedimento(Base):
    __tablename__ = "impedimentos"

    id_impedimento = Column(String, primary_key=True, index=True)
    descripcion = Column(String, nullable=False)
    tipo_actividad_aplicable = Column(String, nullable=False)
    es_critico = Column(Boolean, default=False)

    actividades = relationship("Actividad", back_populates="impedimento")


# ==========================================
# 7. TABLA: OBSERVACIONES
# ==========================================
class Observacion(Base):
    __tablename__ = "observaciones"

    id_observacion = Column(String, primary_key=True, index=True)
    descripcion = Column(String, nullable=False)
    tipo_actividad_aplicable = Column(String, nullable=False)

    actividades = relationship("Actividad", back_populates="observacion")


# ==========================================
# 10. TABLA: SEGMENTOS
# ==========================================
class Segmento(Base):
    __tablename__ = "segmentos"

    id_segmento = Column(String, primary_key=True, index=True)
    zona = Column(String, nullable=False)
    distrito = Column(String, nullable=False)
    cuadrante = Column(String, nullable=False)
    grupo_facturacion = Column(String, nullable=False)
    tipo_actividad = Column(String, nullable=False)
    complejidad_operativa = Column(String, nullable=False)

    actividades = relationship("Actividad", back_populates="segmento")
    estandares = relationship("Estandar", back_populates="segmento")


# ==========================================
# 8. TABLA: RUTAS
# ==========================================
class Ruta(Base):
    __tablename__ = "rutas"

    id_ruta = Column(String, primary_key=True, index=True)
    nombre_ruta = Column(String, nullable=False)
    zona = Column(String, nullable=False)
    cantidad_puntos = Column(Integer, nullable=False)
    tiempo_estimado_total = Column(Float, nullable=True)

    lecturas = relationship("Lectura", back_populates="ruta")


# ==========================================
# 2. TABLA CENTRAL: ACTIVIDADES
# ==========================================
class Actividad(Base):
    __tablename__ = "actividades"

    id_actividad = Column(String, primary_key=True, index=True)
    id_trabajador = Column(String, ForeignKey("trabajadores.id_trabajador"), nullable=False)
    tipo_actividad = Column(String, nullable=False)  # Lectura, Inspección, Corte, Reapertura
    id_punto_servicio = Column(String, nullable=False)
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(DateTime, nullable=False)
    hora_fin = Column(DateTime, nullable=False)
    duracion_minutos = Column(Float, nullable=False)
    resultado = Column(String, nullable=False)
    id_impedimento = Column(String, ForeignKey("impedimentos.id_impedimento"), nullable=True)
    id_observacion = Column(String, ForeignKey("observaciones.id_observacion"), nullable=True)
    id_segmento = Column(String, ForeignKey("segmentos.id_segmento"), nullable=True)
    evidencia_url = Column(String, nullable=True)
    id_orden = Column(String, nullable=True)

    # Relaciones inversas (Padres)
    trabajador = relationship("Trabajador", back_populates="actividades")
    impedimento = relationship("Impedimento", back_populates="actividades")
    observacion = relationship("Observacion", back_populates="actividades")
    segmento = relationship("Segmento", back_populates="actividades")

    # Relaciones uno a uno (Hijos específicos)
    detalle_lectura = relationship("Lectura", back_populates="actividad", uselist=False)
    detalle_inspeccion = relationship("Inspeccion", back_populates="actividad", uselist=False)
    detalle_corte_reapertura = relationship("CorteReapertura", back_populates="actividad", uselist=False)
    
    # Relaciones a otras tablas de control
    registros_gps = relationship("RegistroGPS", back_populates="actividad")
    alertas = relationship("Alerta", back_populates="actividad")


# ==========================================
# 3. TABLA: LECTURAS (Detalle)
# ==========================================
class Lectura(Base):
    __tablename__ = "lecturas_detalle"

    id_actividad = Column(String, ForeignKey("actividades.id_actividad"), primary_key=True)
    numero_medidor = Column(String, nullable=False)
    lectura_anterior = Column(Float, nullable=False)
    lectura_actual = Column(Float, nullable=False)
    consumo_calculado = Column(Float, nullable=False)
    metodo_lectura = Column(String, nullable=False)
    ruta_id = Column(String, ForeignKey("rutas.id_ruta"), nullable=True)
    secuencia_ruta = Column(Integer, nullable=True)

    # Relaciones
    actividad = relationship("Actividad", back_populates="detalle_lectura")
    ruta = relationship("Ruta", back_populates="lecturas")


# ==========================================
# 4. TABLA: INSPECCIONES (Detalle)
# ==========================================
class Inspeccion(Base):
    __tablename__ = "inspecciones_detalle"

    id_actividad = Column(String, ForeignKey("actividades.id_actividad"), primary_key=True)
    tipo_inspeccion = Column(String, nullable=False)  # Interna / Externa
    resultado_inspeccion = Column(String, nullable=False)
    detalle_anomalia = Column(String, nullable=True)
    requiere_seguimiento = Column(Boolean, default=False)

    actividad = relationship("Actividad", back_populates="detalle_inspeccion")


# ==========================================
# 5. TABLA: CORTES_REAPERTURAS (Detalle)
# ==========================================
class CorteReapertura(Base):
    __tablename__ = "cortes_reaperturas_detalle"

    id_actividad = Column(String, ForeignKey("actividades.id_actividad"), primary_key=True)
    tipo_orden = Column(String, nullable=False)  # Corte o Reapertura
    motivo_orden = Column(String, nullable=False)
    fecha_emision_orden = Column(Date, nullable=False)
    fecha_ejecucion = Column(Date, nullable=False)
    ubicacion_ejecucion = Column(String, nullable=True)  # Formato texto o coordenadas
    evidencia_fotografica = Column(String, nullable=True)  # URL del archivo
    productividad_unitaria = Column(Float, nullable=True)

    actividad = relationship("Actividad", back_populates="detalle_corte_reapertura")


# ==========================================
# 9. TABLA: REGISTROS_GPS
# ==========================================
class RegistroGPS(Base):
    __tablename__ = "registros_gps"

    id_registro_gps = Column(String, primary_key=True, index=True)
    id_trabajador = Column(String, ForeignKey("trabajadores.id_trabajador"), nullable=False)
    id_actividad = Column(String, ForeignKey("actividades.id_actividad"), nullable=True)
    latitud = Column(Float, nullable=False)
    longitud = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False, server_default=func.now())
    precision_metros = Column(Float, nullable=True)

    trabajador = relationship("Trabajador", back_populates="registros_gps")
    actividad = relationship("Actividad", back_populates="registros_gps")


# ==========================================
# 11. TABLA: ESTANDARES
# ==========================================
class Estandar(Base):
    __tablename__ = "estandares"

    id_estandar = Column(String, primary_key=True, index=True)
    id_segmento = Column(String, ForeignKey("segmentos.id_segmento"), nullable=False)
    tiempo_promedio_minutos = Column(Float, nullable=False)
    productividad_promedio = Column(Float, nullable=False)
    porcentaje_impedimento_normal = Column(Float, nullable=False)
    desviacion_estandar = Column(Float, nullable=False)
    fecha_calculo = Column(Date, nullable=False, server_default=func.current_date())
    tamano_muestra = Column(Integer, nullable=False)
    vigencia_desde = Column(Date, nullable=False)

    segmento = relationship("Segmento", back_populates="estandares")


# ==========================================
# 12. TABLA: ALERTAS
# ==========================================
class Alerta(Base):
    __tablename__ = "alertas"

    id_alerta = Column(String, primary_key=True, index=True)
    id_actividad = Column(String, ForeignKey("actividades.id_actividad"), nullable=True)
    id_trabajador = Column(String, ForeignKey("trabajadores.id_trabajador"), nullable=False)
    tipo_alerta = Column(String, nullable=False)  # Baja productividad, tiempo anómalo, fuera de ruta...
    severidad = Column(String, nullable=False)  # Baja, Media, Alta, Crítica
    fecha_generacion = Column(DateTime, nullable=False, server_default=func.now())
    estado_alerta = Column(String, default="Nueva")  # Nueva, En revisión, Justificada, Confirmada
    comentario_supervisor = Column(String, nullable=True)
    id_supervisor_revisor = Column(String, ForeignKey("usuarios.id_usuario"), nullable=True)

    actividad = relationship("Actividad", back_populates="alertas")
    trabajador = relationship("Trabajador", back_populates="alertas")
    supervisor = relationship("Usuario", back_populates="alertas_revisadas")