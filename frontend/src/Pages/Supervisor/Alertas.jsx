import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Eye,
  X,
  CheckCircle,
  Loader2,
  Database,
  Info,
  Search,
  Clock3,
  UserCheck,
  RefreshCw,
  CalendarDays,
  Play,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  MapPin,
  Hash,
} from "lucide-react";
import {
  obtenerAlertas,
  evaluarAlertas,
  obtenerDetalleAlerta,
  cambiarEstadoAlerta,
} from "../../services/alertasService";
import { obtenerUsuarios } from "../../services/usuarioService";

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function Alertas() {
  // ==========================================================
  // FECHA ACTUAL
  // ==========================================================
  const obtenerFechaHoy = () => {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const hoy = obtenerFechaHoy();

  // ==========================================================
  // ESTADOS
  // ==========================================================
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [evaluando, setEvaluando] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [comentario, setComentario] = useState("");
  const [supervisorNombre, setSupervisorNombre] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // ==========================================================
  // BUSCADOR LOCAL
  // ==========================================================
  const [busqueda, setBusqueda] = useState("");

  // ==========================================================
  // FILTROS API
  // Por defecto se muestran las alertas del día en curso; si el
  // usuario elige un período rápido o cambia la fecha, eso
  // reemplaza este valor inicial.
  // ==========================================================
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [zonaFiltro, setZonaFiltro] = useState("");
  const [trabajadorFiltro, setTrabajadorFiltro] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState(hoy);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [periodoFiltro, setPeriodoFiltro] = useState("");

  // ==========================================================
  // MOSTRAR / OCULTAR FILTROS AVANZADOS
  // ==========================================================
  const [mostrarMasFiltros, setMostrarMasFiltros] = useState(false);

  // ==========================================================
  // VALIDACIÓN DE FECHAS
  // ==========================================================
  const fechasInvalidas =
    Boolean(fechaInicio) && Boolean(fechaFin) && fechaFin < fechaInicio;

  // ==========================================================
  // FILTROS AVANZADOS ACTIVOS
  // (para mostrar un indicador en el botón "Más filtros")
  // ==========================================================
  const filtrosAvanzadosActivos = Boolean(
    zonaFiltro || trabajadorFiltro || fechaInicio || fechaFin
  );

  // ==========================================================
  // CAMBIO DE PERÍODO
  // Al elegir un periodo predefinido, la fecha específica se
  // limpia (se ignoraría en la consulta si quedara puesta).
  // ==========================================================
  const handlePeriodoChange = (e) => {
    const valor = e.target.value;
    setPeriodoFiltro(valor);
    if (valor) {
      setFechaFiltro("");
    }
  };

  // ==========================================================
  // CAMBIO DE FECHA ESPECÍFICA
  // ==========================================================
  const handleFechaChange = (e) => {
    const valor = e.target.value;
    setFechaFiltro(valor);
    if (valor) {
      setPeriodoFiltro("");
    }
  };

  // ==========================================================
  // OBTENER NOMBRE COMPLETO DEL USUARIO
  // ==========================================================
  const obtenerNombreUsuario = (usuario) => {
    if (!usuario) return "";
    const nombres = usuario.nombres || usuario.nombre || usuario.name || "";
    const apellidos = usuario.apellidos || usuario.apellido || "";
    const nombreCompleto = `${nombres} ${apellidos}`.trim();
    if (nombreCompleto) {
      return nombreCompleto;
    }
    return (
      usuario.nombre_completo ||
      usuario.full_name ||
      usuario.usuario ||
      usuario.correo ||
      ""
    );
  };

  // ==========================================================
  // BUSCAR NOMBRE DEL SUPERVISOR
  // ==========================================================
  const buscarNombreSupervisor = async (supervisorId) => {
    if (!supervisorId) {
      return "";
    }
    try {
      const usuarios = await obtenerUsuarios();
      const usuarioEncontrado = usuarios.find(
        (u) =>
          String(u.id_usuario || "").trim() ===
          String(supervisorId || "").trim()
      );
      if (!usuarioEncontrado) {
        return "";
      }
      return obtenerNombreUsuario(usuarioEncontrado);
    } catch (error) {
      console.error("Error buscando nombre del supervisor:", error);
      return "";
    }
  };

  // ==========================================================
  // CONSTRUIR FILTROS
  // ==========================================================
  const obtenerFiltros = () => {
    const filtros = {};
    if (estadoFiltro) {
      filtros.estado = estadoFiltro;
    }
    if (zonaFiltro.trim()) {
      filtros.zona_id = zonaFiltro.trim();
    }
    if (trabajadorFiltro.trim()) {
      filtros.ccodprs = trabajadorFiltro.trim();
    }
    if (fechaFiltro) {
      filtros.fecha = fechaFiltro;
    }
    if (fechaInicio) {
      filtros.fecha_inicio = fechaInicio;
    }
    if (fechaFin) {
      filtros.fecha_fin = fechaFin;
    }
    if (periodoFiltro) {
      filtros.periodo = periodoFiltro;
    }
    return filtros;
  };

  // ==========================================================
  // CARGAR ALERTAS
  // ==========================================================
  const cargarAlertas = async () => {
    try {
      setLoading(true);
      setError("");
      const filtros = obtenerFiltros();
      console.log("FILTROS ALERTAS:", filtros);
      const data = await obtenerAlertas(filtros);
      setAlertas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando alertas:", error);
      setAlertas([]);
      setError(
        error?.message || "No se pudieron obtener las alertas desde el API."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // EVALUAR ALERTAS
  // ==========================================================
  const ejecutarEvaluacion = async () => {
    try {
      setEvaluando(true);
      setError("");
      setMensaje("");
      const fechaEvaluacion = fechaFiltro || null;
      const resultado = await evaluarAlertas(fechaEvaluacion);
      console.log("RESULTADO EVALUACIÓN:", resultado);
      setMensaje(
        fechaEvaluacion
          ? `Evaluación de alertas ejecutada para ${fechaEvaluacion}.`
          : "Evaluación de alertas ejecutada correctamente."
      );
      await cargarAlertas();
      setTimeout(() => {
        setMensaje("");
      }, 5000);
    } catch (error) {
      console.error("Error evaluando alertas:", error);
      setError(
        error?.message || "No se pudo ejecutar la evaluación de alertas."
      );
    } finally {
      setEvaluando(false);
    }
  };

  // ==========================================================
  // CARGA AUTOMÁTICA
  // Se dispara al entrar a la sección y cada vez que cambia
  // cualquier filtro de la API, sin depender de botones.
  // ==========================================================
  useEffect(() => {
    if (fechasInvalidas) return;
    cargarAlertas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    estadoFiltro,
    zonaFiltro,
    trabajadorFiltro,
    fechaFiltro,
    fechaInicio,
    fechaFin,
    periodoFiltro,
  ]);

  // ==========================================================
  // LIMPIAR FILTROS
  // ==========================================================
  const limpiarFiltros = () => {
    setEstadoFiltro("");
    setZonaFiltro("");
    setTrabajadorFiltro("");
    setFechaFiltro(hoy);
    setFechaInicio("");
    setFechaFin("");
    setPeriodoFiltro("");
    setBusqueda("");
    // La carga se dispara sola vía useEffect al cambiar los filtros
  };

  // ==========================================================
  // REFRESCO MANUAL
  // ==========================================================
  const handleActualizarManual = async () => {
    await cargarAlertas();
    setMensaje("Alertas actualizadas correctamente.");
    setTimeout(() => {
      setMensaje("");
    }, 4000);
  };

  // ==========================================================
  // VER DETALLE
  // ==========================================================
  const verDetalle = async (alertaId) => {
    try {
      setError("");
      const data = await obtenerDetalleAlerta(alertaId);
      setDetalle(data);
      setComentario(data?.comentario_resolucion || "");
      if (data?.supervisor_id) {
        const nombre = await buscarNombreSupervisor(data.supervisor_id);
        setSupervisorNombre(nombre);
      } else {
        setSupervisorNombre("");
      }
      setMostrarDetalle(true);
    } catch (error) {
      console.error("Error obteniendo detalle:", error);
      setError(
        error?.message || "No se pudo obtener el detalle de la alerta."
      );
    }
  };

  // ==========================================================
  // ACTUALIZAR ESTADO
  // ==========================================================
  const actualizarEstado = async () => {
    if (!detalle?.alerta_id) {
      return;
    }
    try {
      setError("");
      // ------------------------------------------------------
      // USUARIO ACTIVO
      // ------------------------------------------------------
      const usuarioGuardado = localStorage.getItem("usuario");
      let usuario = null;
      try {
        usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
      } catch {
        usuario = null;
      }
      if (!usuario?.correo) {
        throw new Error(
          "No se pudo identificar el correo del usuario activo."
        );
      }
      // ------------------------------------------------------
      // OBTENER USUARIOS
      // ------------------------------------------------------
      const usuarios = await obtenerUsuarios();
      // ------------------------------------------------------
      // BUSCAR USUARIO POR CORREO
      // ------------------------------------------------------
      const usuarioBD = usuarios.find(
        (u) =>
          String(u.correo || "").trim().toLowerCase() ===
          String(usuario.correo || "").trim().toLowerCase()
      );
      if (!usuarioBD) {
        throw new Error(
          `No se encontró en la base de datos al usuario con correo ${usuario.correo}.`
        );
      }
      // ------------------------------------------------------
      // ID SUPERVISOR
      // ------------------------------------------------------
      const supervisorId = usuarioBD.id_usuario;
      if (!supervisorId) {
        throw new Error("El usuario encontrado no tiene id_usuario.");
      }
      // ------------------------------------------------------
      // NOMBRE SUPERVISOR
      // ------------------------------------------------------
      const nombreSupervisor = obtenerNombreUsuario(usuarioBD);
      // ------------------------------------------------------
      // VALIDAR COMENTARIO
      // ------------------------------------------------------
      if (!comentario.trim()) {
        throw new Error(
          "Ingrese un comentario antes de actualizar la alerta."
        );
      }
      // ------------------------------------------------------
      // ACTUALIZAR
      // ------------------------------------------------------
      await cambiarEstadoAlerta(detalle.alerta_id, {
        estado_alerta: detalle.estado_alerta,
        comentario: comentario.trim(),
        supervisor_id: supervisorId,
      });
      // ------------------------------------------------------
      // ACTUALIZAR DATOS VISUALES
      // ------------------------------------------------------
      setSupervisorNombre(nombreSupervisor);
      setDetalle((prev) => ({
        ...prev,
        supervisor_id: supervisorId,
        comentario_resolucion: comentario.trim(),
      }));
      setMensaje(
        `Alerta actualizada correctamente por ${
          nombreSupervisor || "el supervisor"
        }.`
      );
      // ------------------------------------------------------
      // CERRAR MODAL
      // ------------------------------------------------------
      setMostrarDetalle(false);
      setDetalle(null);
      setComentario("");
      // ------------------------------------------------------
      // RECARGAR
      // ------------------------------------------------------
      await cargarAlertas();
      setTimeout(() => {
        setMensaje("");
      }, 5000);
    } catch (error) {
      console.error("Error actualizando estado:", error);
      setError(
        error?.message || "No se pudo actualizar el estado de la alerta."
      );
    }
  };

  // ==========================================================
  // CERRAR MODAL
  // ==========================================================
  const cerrarDetalle = () => {
    setMostrarDetalle(false);
    setDetalle(null);
    setComentario("");
    setSupervisorNombre("");
  };

  // ==========================================================
  // COLOR NIVEL
  // ==========================================================
  const colorNivel = (nivel) => {
    const valor = String(nivel || "").trim().toLowerCase();
    switch (valor) {
      case "alto":
      case "critico":
      case "crítico":
        return "bg-red-50 text-red-700 border-red-200";
      case "medio":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "bajo":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  // ==========================================================
  // COLOR ESTADO
  // ==========================================================
  const colorEstado = (estado) => {
    const valor = String(estado || "").trim().toLowerCase();
    switch (valor) {
      case "pendiente":
        return "bg-red-50 text-red-700 border-red-200";
      case "en revisión":
      case "en revision":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "escalada":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "resuelto":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  // ==========================================================
  // RESUMEN
  // ==========================================================
  const contarPorEstado = (estado) =>
    alertas.filter(
      (a) =>
        String(a.estado_alerta || "").trim().toLowerCase() ===
        estado.toLowerCase()
    ).length;
  const resumen = {
    total: alertas.length,
    pendientes: contarPorEstado("Pendiente"),
    enRevision: alertas.filter((a) =>
      ["en revisión", "en revision"].includes(
        String(a.estado_alerta || "").trim().toLowerCase()
      )
    ).length,
    resueltas: contarPorEstado("Resuelto"),
  };

  // ==========================================================
  // BUSCADOR LOCAL
  // ==========================================================
  const alertasFiltradas = alertas.filter((a) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) {
      return true;
    }
    return (
      String(a.ccodprs || "").toLowerCase().includes(texto) ||
      String(a.kpi || "").toLowerCase().includes(texto) ||
      String(a.zona_id || "").toLowerCase().includes(texto) ||
      String(a.motivo || "").toLowerCase().includes(texto)
    );
  });

  // ==========================================================
  // TOOLTIP
  // ==========================================================
  const ANCHO_TOOLTIP = {
    "w-64": 256,
    "w-72": 288,
    "w-80": 320,
    "w-96": 384,
  };
  const Tooltip = ({ children, title, text, width = "w-80" }) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({
      top: 0,
      left: 0,
      placement: "top",
    });
    const triggerRef = useRef(null);
    const anchoPx = ANCHO_TOOLTIP[width] || 320;
    const tieneContenido = typeof text === "string" && text.trim().length > 0;
    const calcularPosicion = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const margen = 10;
      const espacioArriba = rect.top;
      const espacioAbajo = window.innerHeight - rect.bottom;
      const placement =
        espacioArriba > 170 || espacioArriba > espacioAbajo ? "top" : "bottom";
      let left = rect.left + rect.width / 2 - anchoPx / 2;
      if (left < margen) {
        left = margen;
      }
      if (left + anchoPx > window.innerWidth - margen) {
        left = window.innerWidth - anchoPx - margen;
      }
      const top = placement === "top" ? rect.top - 10 : rect.bottom + 10;
      setCoords({ top, left, placement });
    };
    useEffect(() => {
      if (!visible) return;
      calcularPosicion();
      const onScrollOrResize = () => calcularPosicion();
      window.addEventListener("scroll", onScrollOrResize, true);
      window.addEventListener("resize", onScrollOrResize);
      return () => {
        window.removeEventListener("scroll", onScrollOrResize, true);
        window.removeEventListener("resize", onScrollOrResize);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);
    if (!tieneContenido) {
      return <>{children}</>;
    }
    return (
      <div
        ref={triggerRef}
        className="w-full"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
        {visible &&
          createPortal(
            <div
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: anchoPx,
                transform:
                  coords.placement === "top" ? "translateY(-100%)" : "none",
                zIndex: 9999,
              }}
              className="pointer-events-none rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xl"
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 p-1.5 rounded-lg bg-blue-50 text-[#006cb7] shrink-0">
                  <Info size={13} />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-slate-800 mb-1">
                    {title}
                  </p>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    {text}
                  </p>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  };

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="space-y-6 text-left">
      {/* ======================================================
          LOADING
      ======================================================= */}
      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="animate-spin text-[#006cb7]" size={16} />
          Actualizando alertas...
        </div>
      )}

      {/* ======================================================
          FILTROS
      ====================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        {/* FILA PRINCIPAL: los 3 filtros más usados */}
        <div className="flex flex-col xl:flex-row xl:items-end gap-4">
          {/* ESTADO */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Estado
            </label>
            <div className="relative">
              <Filter
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7] pointer-events-none"
              />
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                disabled={loading}
                className="h-10 pl-10 pr-8 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100 transition appearance-none disabled:opacity-50 disabled:cursor-not-allowed min-w-[170px]"
              >
                <option value="">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En Revisión">En Revisión</option>
                <option value="Escalada">Escalada</option>
                <option value="Resuelto">Resuelto</option>
              </select>
            </div>
          </div>

          {/* PERÍODO RÁPIDO */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Período rápido
            </label>
            <div className="relative">
              <Filter
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7] pointer-events-none"
              />
              <select
                value={periodoFiltro}
                onChange={handlePeriodoChange}
                disabled={loading}
                className="h-10 pl-10 pr-8 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100 transition appearance-none disabled:opacity-50 disabled:cursor-not-allowed min-w-[170px]"
              >
                <option value="">Sin período</option>
                <option value="hoy">Hoy</option>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mes</option>
                <option value="3meses">Últimos 3 meses</option>
              </select>
            </div>
          </div>

          {/* FECHA ESPECÍFICA */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Fecha específica
            </label>
            <div className="relative">
              <CalendarDays
                size={15}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  periodoFiltro ? "text-slate-300" : "text-[#006cb7]"
                }`}
              />
              <input
                type="date"
                value={fechaFiltro}
                disabled={loading || Boolean(periodoFiltro)}
                onChange={handleFechaChange}
                className="h-10 pl-10 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100 transition disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* BOTONES */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMostrarMasFiltros((v) => !v)}
              className={`h-10 px-4 rounded-lg border text-xs font-bold flex items-center gap-2 transition ${
                mostrarMasFiltros || filtrosAvanzadosActivos
                  ? "border-blue-200 bg-blue-50 text-[#006cb7] hover:bg-blue-100"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal size={14} />
              Más filtros
              {filtrosAvanzadosActivos && !mostrarMasFiltros && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#006cb7]" />
              )}
              {mostrarMasFiltros ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>

            <button
              type="button"
              onClick={limpiarFiltros}
              disabled={loading}
              className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <RotateCcw size={14} />
              Limpiar
            </button>
          </div>
        </div>

        {/* ==================================================
            FILTROS AVANZADOS (colapsable)
        ================================================== */}
        {mostrarMasFiltros && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {/* ZONA */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Zona
              </label>
              <div className="relative">
                <MapPin
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={zonaFiltro}
                  onChange={(e) => setZonaFiltro(e.target.value)}
                  placeholder="ID de zona"
                  className="w-full h-10 pl-10 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            {/* TRABAJADOR */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Trabajador
              </label>
              <div className="relative">
                <Hash
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={trabajadorFiltro}
                  onChange={(e) => setTrabajadorFiltro(e.target.value)}
                  placeholder="Código del trabajador"
                  className="w-full h-10 pl-10 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            {/* FECHA INICIO */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Fecha inicio
              </label>
              <div className="relative">
                <CalendarDays
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            {/* FECHA FIN */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Fecha fin
              </label>
              <div className="relative">
                <CalendarDays
                  size={15}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    fechasInvalidas ? "text-red-500" : "text-slate-400"
                  }`}
                />
                <input
                  type="date"
                  value={fechaFin}
                  min={fechaInicio || undefined}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className={`w-full h-10 pl-10 pr-3 rounded-lg border bg-white text-xs text-slate-700 outline-none transition ${
                    fechasInvalidas
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200 focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100"
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* AVISO FECHAS INVÁLIDAS */}
        {fechasInvalidas && (
          <div className="flex items-center gap-2 text-[11px] font-semibold text-red-600 mt-3">
            <AlertTriangle size={13} />
            La fecha fin no puede ser anterior a la fecha de inicio.
          </div>
        )}
      </div>

      {/* ======================================================
          BUSCADOR LOCAL
      ====================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <Search size={18} className="text-slate-400 ml-2 shrink-0" />
        <input
          type="text"
          placeholder="Buscar dentro de los resultados por código, KPI, zona o motivo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-none text-slate-700 placeholder-slate-400"
        />
        {busqueda && (
          <button
            onClick={() => setBusqueda("")}
            title="Limpiar búsqueda"
            className="text-slate-400 hover:text-slate-600 shrink-0"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ======================================================
          MENSAJES
      ====================================================== */}
      {mensaje && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
          {mensaje}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* ======================================================
          RESUMEN
      ====================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Tooltip
          title="Alertas totales"
          text="Cantidad total de alertas devueltas por el API según los filtros seleccionados."
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-help">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Alertas totales
                </p>
                <p className="text-3xl font-bold text-slate-800 mt-2">
                  {resumen.total}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 text-[#006cb7] shrink-0">
                <AlertTriangle size={20} />
              </div>
            </div>
          </div>
        </Tooltip>
        <Tooltip
          title="Pendientes"
          text="Alertas que aún no han sido revisadas y requieren atención."
        >
          <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-help">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-red-500">
                  Pendientes
                </p>
                <p className="text-3xl font-bold text-red-700 mt-2">
                  {resumen.pendientes}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 text-red-600 shrink-0">
                <AlertTriangle size={20} />
              </div>
            </div>
          </div>
        </Tooltip>
        <Tooltip
          title="En revisión"
          text="Alertas que actualmente están siendo atendidas por un supervisor."
        >
          <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-help">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">
                  En revisión
                </p>
                <p className="text-3xl font-bold text-amber-700 mt-2">
                  {resumen.enRevision}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                <Clock3 size={20} />
              </div>
            </div>
          </div>
        </Tooltip>
        <Tooltip title="Resueltas" text="Alertas que ya fueron atendidas y cerradas.">
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-help">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                  Resueltas
                </p>
                <p className="text-3xl font-bold text-emerald-700 mt-2">
                  {resumen.resueltas}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <CheckCircle size={20} />
              </div>
            </div>
          </div>
        </Tooltip>
      </div>

      {/* ======================================================
          TABLA
      ====================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-blue-50 text-[#006cb7] rounded-xl shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Alertas registradas
              </h2>
              <p className="text-[10px] text-slate-400 mt-1">
                Alertas obtenidas directamente desde el API.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleActualizarManual}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-[10px] font-bold transition"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>
            <button
              onClick={ejecutarEvaluacion}
              disabled={evaluando}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-[#006cb7] hover:bg-[#006cb7] hover:text-white disabled:opacity-50 text-[10px] font-bold transition"
            >
              {evaluando ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Play size={13} />
              )}
              Evaluar alertas
            </button>
            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
              {alertasFiltradas.length} registros
            </span>
          </div>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-auto max-h-[560px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 className="animate-spin text-[#006cb7]" size={26} />
              <p className="text-xs">Consultando alertas desde el API...</p>
            </div>
          ) : alertasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <div className="p-3 bg-slate-50 rounded-xl">
                <Database size={24} />
              </div>
              <p className="text-xs font-medium text-slate-500">
                {busqueda ||
                estadoFiltro ||
                zonaFiltro ||
                trabajadorFiltro ||
                fechaFiltro ||
                fechaInicio ||
                fechaFin ||
                periodoFiltro
                  ? "No se encontraron alertas con esos filtros."
                  : "No existen alertas registradas."}
              </p>
              {(busqueda ||
                estadoFiltro ||
                zonaFiltro ||
                trabajadorFiltro ||
                fechaFiltro ||
                fechaInicio ||
                fechaFin ||
                periodoFiltro) && (
                <button
                  onClick={limpiarFiltros}
                  className="text-[10px] font-bold text-[#006cb7] hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <table className="w-full min-w-[1250px] text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 uppercase">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50">
                    Nivel
                  </th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50">
                    KPI
                  </th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50">
                    Trabajador
                  </th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50">
                    Estado
                  </th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50">
                    Prioridad
                  </th>
                  <th className="px-5 py-3 font-bold text-center whitespace-nowrap bg-slate-50">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alertasFiltradas.map((a) => (
                  <tr
                    key={a.alerta_id}
                    className={`transition-colors hover:bg-slate-50/70 ${
                      String(a.estado_alerta || "").trim().toLowerCase() ===
                      "pendiente"
                        ? "bg-red-50/30"
                        : ""
                    }`}
                  >
                    {/* NIVEL */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] font-bold whitespace-nowrap ${colorNivel(
                          a.nivel
                        )}`}
                      >
                        {a.nivel || "Sin nivel"}
                      </span>
                    </td>
                    {/* KPI */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-800 whitespace-nowrap">
                        {a.kpi || "No disponible"}
                      </div>
                      {a.motivo && (
                        <div
                          className="max-w-[250px] truncate text-[10px] text-slate-400 mt-0.5"
                          title={a.motivo}
                        >
                          {a.motivo}
                        </div>
                      )}
                    </td>
                    {/* TRABAJADOR */}
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-[#006cb7] whitespace-nowrap">
                        {a.ccodprs || "Sin código"}
                      </span>
                    </td>
                    {/* ESTADO */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] font-bold whitespace-nowrap ${colorEstado(
                          a.estado_alerta
                        )}`}
                      >
                        {a.estado_alerta || "Sin estado"}
                      </span>
                    </td>
                    {/* PRIORIDAD */}
                    <td className="px-5 py-4">
                      <span className="text-slate-600 whitespace-nowrap">
                        {a.prioridad || "Sin prioridad"}
                      </span>
                    </td>
                    {/* ACCIÓN */}
                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => verDetalle(a.alerta_id)}
                          className="flex items-center justify-center gap-2 min-w-[120px] px-4 py-2.5 rounded-lg bg-blue-50 text-[#006cb7] hover:bg-[#006cb7] hover:text-white transition text-[10px] font-bold whitespace-nowrap"
                        >
                          <Eye size={14} />
                          Ver detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ======================================================
          MODAL DETALLE
      ====================================================== */}
      {mostrarDetalle && detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl">
            {/* HEADER */}
            <div className="flex items-start justify-between gap-6 p-6 border-b border-slate-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-3 bg-blue-50 text-[#006cb7] rounded-xl shrink-0">
                  <AlertTriangle size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide truncate">
                    Detalle de alerta
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    ID:{" "}
                    <span className="font-mono font-semibold text-slate-700">
                      {detalle.alerta_id}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={cerrarDetalle}
                title="Cerrar"
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            {/* BODY */}
            <div className="p-6 overflow-y-auto max-h-[calc(92vh-105px)] space-y-5">
              {/* DATOS PRINCIPALES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    KPI
                  </p>
                  <p className="text-sm font-bold text-slate-700 mt-1">
                    {detalle.kpi || "No disponible"}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    Nivel
                  </p>
                  <span
                    className={`inline-flex mt-1 rounded-full border px-3 py-1.5 text-[10px] font-bold ${colorNivel(
                      detalle.nivel
                    )}`}
                  >
                    {detalle.nivel || "No disponible"}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    Trabajador
                  </p>
                  <p className="text-sm font-mono font-bold text-[#006cb7] mt-1">
                    {detalle.ccodprs || "No disponible"}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    Zona
                  </p>
                  <p className="text-sm font-bold text-slate-700 mt-1">
                    {detalle.zona_id || "No disponible"}
                  </p>
                </div>
              </div>
              {/* MOTIVO */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg text-[#006cb7] shrink-0">
                    <Info size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-[#006cb7]">
                      Motivo
                    </p>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      {detalle.motivo || "El API no proporcionó un motivo."}
                    </p>
                  </div>
                </div>
              </div>
              {/* VALORES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    Valor actual
                  </p>
                  <p className="text-lg font-bold text-slate-700 mt-1">
                    {detalle.valor_actual ?? "No disponible"}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    Valor umbral
                  </p>
                  <p className="text-lg font-bold text-slate-700 mt-1">
                    {detalle.valor_umbral ?? "No disponible"}
                  </p>
                </div>
              </div>
              {/* FECHAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Fecha
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {detalle.fecha || "No disponible"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Fecha generación
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {detalle.fecha_generacion || "No disponible"}
                  </p>
                </div>
              </div>
              {/* ESTADO */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                  Estado de la alerta
                </label>
                <select
                  value={detalle.estado_alerta || ""}
                  onChange={(e) =>
                    setDetalle({
                      ...detalle,
                      estado_alerta: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Revisión">En Revisión</option>
                  <option value="Escalada">Escalada</option>
                  <option value="Resuelto">Resuelto</option>
                </select>
              </div>
              {/* SUPERVISOR */}
              {supervisorNombre && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white text-emerald-600 shrink-0">
                      <UserCheck size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                        Supervisor que realizó la atención
                      </p>
                      <p className="text-sm font-bold text-slate-700 mt-1">
                        {supervisorNombre}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* COMENTARIO */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                  Comentario del supervisor
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Ingrese la acción realizada o una observación..."
                  className="w-full h-24 p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 resize-none outline-none focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
              {/* BOTONES */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                <button
                  onClick={cerrarDetalle}
                  className="flex-1 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 py-3 text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={actualizarEstado}
                  disabled={evaluando}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#006cb7] hover:bg-[#005a9c] disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 text-xs font-bold transition shadow-sm"
                >
                  <CheckCircle size={16} />
                  Actualizar estado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}