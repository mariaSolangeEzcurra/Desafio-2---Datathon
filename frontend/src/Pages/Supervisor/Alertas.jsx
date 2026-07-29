import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  RefreshCw,
  Eye,
  X,
  Calendar,
  CheckCircle,
  MapPin,
  Loader2,
  Database,
  Filter,
  Info,
  Search,
  Clock3,
} from "lucide-react";
import {
  obtenerAlertas,
  evaluarAlertas,
  obtenerDetalleAlerta,
  cambiarEstadoAlerta,
} from "../../services/alertasService";

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function Alertas() {
  // ==========================================================
  // ESTADOS
  // ==========================================================
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [evaluando, setEvaluando] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [comentario, setComentario] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  // Único filtro por estado
  const [estadoFiltro, setEstadoFiltro] = useState("");

  // ==========================================================
  // CARGAR ALERTAS DESDE EL API
  // ==========================================================
  const cargarAlertas = async () => {
    try {
      setLoading(true);
      setError("");
      const filtros = {};
      if (estadoFiltro) {
        filtros.estado = estadoFiltro;
      }
      const data = await obtenerAlertas(filtros);
      setAlertas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando alertas:", error);
      setAlertas([]);
      setError(
        error?.message ||
          "No se pudieron obtener las alertas desde el API."
      );
    } finally {
      setLoading(false);
    }
  };


  const evaluarYCargar = async () => {
    try {
      setEvaluando(true);
      setError("");
      await evaluarAlertas();
      await cargarAlertas();
    } catch (error) {
      console.error("Error evaluando alertas:", error);
      setError(
        error?.message ||
          "No se pudo ejecutar la evaluación automática."
      );
      // Aunque falle la evaluación, igual mostramos las
      // alertas que ya existan en el backend.
      await cargarAlertas();
    } finally {
      setEvaluando(false);
    }
  };

  // ==========================================================
  // AL ENTRAR A LA SECCIÓN → evaluación automática, siempre
  // ==========================================================
  useEffect(() => {
    evaluarYCargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================
  // CAMBIO DE FILTRO → solo vuelve a consultar (no re-evalúa)
  // ==========================================================
  useEffect(() => {
    cargarAlertas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoFiltro]);

  // ==========================================================
  // REFRESCO MANUAL (opcional, ya no es necesario para operar)
  // ==========================================================
  const handleActualizarManual = async () => {
    await evaluarYCargar();
    setMensaje("Alertas actualizadas correctamente.");
    setTimeout(() => setMensaje(""), 4000);
  };

  // ==========================================================
  // VER DETALLE DE ALERTA
  // ==========================================================
  const verDetalle = async (alertaId) => {
    try {
      setError("");
      const data = await obtenerDetalleAlerta(alertaId);
      setDetalle(data);
      setComentario(data?.comentario_resolucion || "");
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
    if (!detalle?.alerta_id) return;
    try {
      setError("");
      const usuarioGuardado = localStorage.getItem("usuario");
      let usuario = null;
      try {
        usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
      } catch {
        usuario = null;
      }
      const supervisorId =
        usuario?.id || usuario?.ccodprs || usuario?.codigo || "SUP001";

      await cambiarEstadoAlerta(detalle.alerta_id, {
        estado_alerta: detalle.estado_alerta,
        comentario,
        supervisor_id: supervisorId,
      });

      setMensaje("Estado de la alerta actualizado correctamente.");
      setMostrarDetalle(false);
      setDetalle(null);
      setComentario("");
      await cargarAlertas();
      setTimeout(() => setMensaje(""), 4000);
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
  };

  // ==========================================================
  // COLOR NIVEL / ESTADO
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
  // RESUMEN POR ESTADO (para las tarjetas KPI)
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
  // BUSCADOR (código / trabajador / kpi)
  // ==========================================================
  const alertasFiltradas = alertas.filter((a) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return (
      String(a.ccodprs || "").toLowerCase().includes(texto) ||
      String(a.kpi || "").toLowerCase().includes(texto) ||
      String(a.zona_id || "").toLowerCase().includes(texto)
    );
  });

  // ==========================================================
  // TOOLTIP PERSONALIZADO (vía portal, no se corta por overflow)
  // ==========================================================
  const ANCHO_TOOLTIP = {
    "w-64": 256,
    "w-72": 288,
    "w-80": 320,
    "w-96": 384,
  };

  const Tooltip = ({ children, title, text, width = "w-80" }) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, placement: "top" });
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
      if (left < margen) left = margen;
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

    if (!tieneContenido) return <>{children}</>;

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
          RESUMEN (KPI cards)
      ======================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Tooltip
          title="Alertas totales"
          text="Cantidad total de alertas devueltas por el API para el filtro de estado seleccionado."
          width="w-80"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm cursor-help">
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
          text="Alertas que aún no han sido revisadas por un supervisor y requieren atención."
          width="w-80"
        >
          <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm cursor-help">
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
          title="En revisión / escaladas"
          text="Alertas que ya están siendo atendidas por un supervisor o que fueron escaladas a un nivel superior."
          width="w-80"
        >
          <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm cursor-help">
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

        <Tooltip
          title="Resueltas"
          text="Alertas que ya fueron atendidas y cerradas por un supervisor."
          width="w-80"
        >
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm cursor-help">
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
          BUSCADOR + FILTRO
      ======================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Search size={18} className="text-slate-400 ml-2 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por código, KPI o zona..."
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

        <div className="flex items-center gap-2 shrink-0">
          <Filter size={15} className="text-slate-400 shrink-0" />
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="
              h-10 min-w-[190px] rounded-lg border border-slate-200
              bg-white px-3 text-xs text-slate-700 outline-none
              focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100
              transition
            "
          >
            <option value="">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En Revisión">En Revisión</option>
            <option value="Escalada">Escalada</option>
            <option value="Resuelto">Resuelto</option>
          </select>
        </div>
      </div>

      {/* ======================================================
          TABLA
      ======================================================= */}
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
          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
            {alertasFiltradas.length} registros
          </span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-auto max-h-[560px]">
          {/* LOADING */}
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
                {busqueda || estadoFiltro
                  ? "No se encontraron alertas con esos filtros."
                  : "No existen alertas registradas."}
              </p>
              {(busqueda || estadoFiltro) && (
                <button
                  onClick={() => {
                    setBusqueda("");
                    setEstadoFiltro("");
                  }}
                  className="text-[10px] font-bold text-[#006cb7] hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <table className="w-full min-w-[1150px] text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 uppercase">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50">
                    Nivel
                  </th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50">
                    KPI
                  </th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50 min-w-[260px]">
                    Motivo
                  </th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50">
                    Estado
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
                    className={`
                      transition-colors hover:bg-slate-50/70
                      ${
                        String(a.estado_alerta || "").toLowerCase() ===
                        "pendiente"
                          ? "bg-red-50/30"
                          : ""
                      }
                    `}
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
                      {a.prioridad && (
                        <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                          Prioridad: {a.prioridad}
                        </div>
                      )}
                    </td>
                    {/* MOTIVO */}
                    <td className="px-5 py-4 max-w-[300px]">
                      <div
                        className="text-slate-600 leading-relaxed truncate"
                        title={a.motivo || "Sin motivo"}
                      >
                        {a.motivo || "Sin motivo"}
                      </div>
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
                    {/* ACCIÓN */}
                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => verDetalle(a.alerta_id)}
                          className="
                            flex items-center justify-center gap-2
                            min-w-[120px] px-4 py-2.5 rounded-lg
                            bg-blue-50 text-[#006cb7]
                            hover:bg-[#006cb7] hover:text-white
                            transition text-[10px] font-bold whitespace-nowrap
                          "
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
      ======================================================= */}
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

              {/* INFO GENERACIÓN */}
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
                    setDetalle({ ...detalle, estado_alerta: e.target.value })
                  }
                  className="
                    w-full h-10 px-3 rounded-lg border border-slate-200
                    bg-white text-xs text-slate-700 outline-none
                    focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100
                    transition
                  "
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Revisión">En Revisión</option>
                  <option value="Escalada">Escalada</option>
                  <option value="Resuelto">Resuelto</option>
                </select>
              </div>

              {/* COMENTARIO */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                  Comentario del supervisor
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Ingrese la acción realizada o una observación..."
                  className="
                    w-full h-24 p-3 rounded-xl border border-slate-200
                    bg-white text-xs text-slate-700 resize-none outline-none
                    focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100
                    transition
                  "
                />
              </div>

              {/* BOTONES */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                <button
                  onClick={cerrarDetalle}
                  className="
                    flex-1 rounded-xl border border-slate-200 bg-white
                    text-slate-600 hover:bg-slate-50 py-3 text-xs font-bold
                    transition
                  "
                >
                  Cancelar
                </button>
                <button
                  onClick={actualizarEstado}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    rounded-xl bg-[#006cb7] hover:bg-[#005a9c]
                    text-white py-3 text-xs font-bold transition shadow-sm
                  "
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