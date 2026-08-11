import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  Filter,
  RotateCcw,
  CalendarDays,
  MapPin,
  Gauge,
  Target,
  RefreshCw,
} from "lucide-react";
import { cortesAlertasService } from "../../services/CortesAlertas";

export default function AlertasCortes() {
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
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================================
  // FILTROS API
  // Por defecto se consulta con periodo "hoy", tal como lo hace
  // la API por defecto; si el usuario elige fechas exactas, eso
  // reemplaza el periodo.
  // ==========================================================
  const [periodoFiltro, setPeriodoFiltro] = useState("hoy");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [distritoInput, setDistritoInput] = useState("");
  const [distritoFiltro, setDistritoFiltro] = useState("");

  // ==========================================================
  // VALIDACIÓN DE FECHAS
  // ==========================================================
  const fechasInvalidas =
    Boolean(fechaInicio) && Boolean(fechaFin) && fechaFin < fechaInicio;

  // ==========================================================
  // DEBOUNCE DEL DISTRITO
  // ==========================================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDistritoFiltro(distritoInput.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [distritoInput]);

  // ==========================================================
  // CAMBIO DE PERÍODO
  // ==========================================================
  const handlePeriodoChange = (e) => {
    const valor = e.target.value;
    setPeriodoFiltro(valor);
    if (valor) {
      setFechaInicio("");
      setFechaFin("");
    }
  };

  // ==========================================================
  // CAMBIO DE FECHAS
  // ==========================================================
  const handleFechaInicioChange = (e) => {
    const valor = e.target.value;
    setFechaInicio(valor);
    if (valor) {
      setPeriodoFiltro("");
    }
  };
  const handleFechaFinChange = (e) => {
    const valor = e.target.value;
    setFechaFin(valor);
    if (valor) {
      setPeriodoFiltro("");
    }
  };

  // ==========================================================
  // CARGAR ALERTAS
  // ==========================================================
  const cargarAlertas = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await cortesAlertasService.getAlertas({
        fecha_inicio: periodoFiltro ? undefined : fechaInicio || undefined,
        fecha_fin: periodoFiltro ? undefined : fechaFin || undefined,
        periodo: periodoFiltro || undefined,
        distrito: distritoFiltro || undefined,
      });
      setResultado(data);
    } catch (error) {
      console.error("Error cargando alertas operativas de corte:", error);
      setResultado(null);
      setError(
        error?.message || "No se pudieron obtener las alertas desde el API."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // CARGA AUTOMÁTICA
  // ==========================================================
  useEffect(() => {
    if (fechasInvalidas) return;
    cargarAlertas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoFiltro, fechaInicio, fechaFin, distritoFiltro]);

  // ==========================================================
  // LIMPIAR FILTROS
  // ==========================================================
  const limpiarFiltros = () => {
    setPeriodoFiltro("hoy");
    setFechaInicio("");
    setFechaFin("");
    setDistritoInput("");
    setDistritoFiltro("");
  };

  // ==========================================================
  // COLOR / ICONO SEGÚN NIVEL
  // ==========================================================
  const estiloNivel = (nivel) => {
    const valor = String(nivel || "").trim().toLowerCase();
    switch (valor) {
      case "rojo":
        return {
          card: "border-red-200 bg-red-50/40",
          badge: "bg-red-50 text-red-700 border-red-200",
          icono: "bg-red-50 text-red-600",
          Icon: AlertTriangle,
        };
      case "amarillo":
        return {
          card: "border-amber-200 bg-amber-50/40",
          badge: "bg-amber-50 text-amber-700 border-amber-200",
          icono: "bg-amber-50 text-amber-600",
          Icon: AlertCircle,
        };
      case "verde":
        return {
          card: "border-emerald-200 bg-emerald-50/40",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icono: "bg-emerald-50 text-emerald-600",
          Icon: CheckCircle,
        };
      default:
        return {
          card: "border-slate-200 bg-white",
          badge: "bg-slate-50 text-slate-600 border-slate-200",
          icono: "bg-slate-50 text-slate-600",
          Icon: Info,
        };
    }
  };

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
                transform: coords.placement === "top" ? "translateY(-100%)" : "none",
                zIndex: 9999,
              }}
              className="pointer-events-none rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xl"
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 p-1.5 rounded-lg bg-blue-50 text-[#006cb7] shrink-0">
                  <Info size={13} />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-slate-800 mb-1">{title}</p>
                  <p className="text-[11px] leading-relaxed text-slate-600">{text}</p>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  };

  const alertas = resultado?.alertas || [];

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
          Evaluando alertas operativas...
        </div>
      )}

      {/* ======================================================
          FILTROS
      ======================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-end gap-4">
          {/* PERÍODO */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Periodo
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
                <option value="">Personalizado</option>
                <option value="hoy">Hoy</option>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mes</option>
                <option value="3meses">Últimos 3 meses</option>
              </select>
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
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  periodoFiltro ? "text-slate-300" : "text-[#006cb7]"
                }`}
              />
              <input
                type="date"
                value={fechaInicio}
                max={fechaFin || undefined}
                disabled={loading || Boolean(periodoFiltro)}
                onChange={handleFechaInicioChange}
                className="h-10 pl-10 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100 transition disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
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
                  fechasInvalidas
                    ? "text-red-500"
                    : periodoFiltro
                    ? "text-slate-300"
                    : "text-[#006cb7]"
                }`}
              />
              <input
                type="date"
                value={fechaFin}
                min={fechaInicio || undefined}
                disabled={loading || Boolean(periodoFiltro)}
                onChange={handleFechaFinChange}
                className={`h-10 pl-10 pr-3 rounded-lg border bg-white text-xs text-slate-700 outline-none transition disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                  fechasInvalidas
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200 focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100"
                }`}
              />
            </div>
          </div>

          {/* DISTRITO */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Distrito
            </label>
            <div className="relative">
              <MapPin
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Todos"
                value={distritoInput}
                onChange={(e) => setDistritoInput(e.target.value)}
                disabled={loading}
                className="h-10 pl-10 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
              />
            </div>
          </div>

          {/* BOTONES */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={limpiarFiltros}
              disabled={loading}
              className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <RotateCcw size={14} />
              Limpiar
            </button>
            <button
              type="button"
              onClick={cargarAlertas}
              disabled={loading}
              className="h-10 px-4 rounded-lg border border-blue-200 bg-blue-50 text-[#006cb7] hover:bg-blue-100 text-xs font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>
        </div>

        {fechasInvalidas && (
          <div className="flex items-center gap-2 text-[11px] font-semibold text-red-600 mt-3">
            <AlertTriangle size={13} />
            La fecha fin no puede ser anterior a la fecha de inicio.
          </div>
        )}
      </div>

      {/* ======================================================
          ERROR
      ======================================================= */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* ======================================================
          RESUMEN
      ======================================================= */}
      {resultado && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Tooltip
            title="Periodo evaluado"
            text="Rango de fechas y fecha de consulta utilizados para calcular las 4 alertas operativas."
          >
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-help">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Periodo evaluado
              </p>
              <p className="text-sm font-bold text-slate-700 mt-2">
                {resultado.periodo_evaluado || "--"}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Consulta: {resultado.fecha_consulta || "--"}
              </p>
            </div>
          </Tooltip>

          <Tooltip
            title="Alertas rojas"
            text="KPIs que están en nivel crítico según los umbrales definidos."
          >
            <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-help">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-red-500">
                    Rojas
                  </p>
                  <p className="text-3xl font-bold text-red-700 mt-2">
                    {resultado.total_alertas_rojas ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-red-50 text-red-600 shrink-0">
                  <AlertTriangle size={20} />
                </div>
              </div>
            </div>
          </Tooltip>

          <Tooltip
            title="Alertas amarillas"
            text="KPIs que están en nivel de advertencia, cerca del umbral crítico."
          >
            <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-help">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">
                    Amarillas
                  </p>
                  <p className="text-3xl font-bold text-amber-700 mt-2">
                    {resultado.total_alertas_amarillas ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                  <AlertCircle size={20} />
                </div>
              </div>
            </div>
          </Tooltip>

          <Tooltip
            title="Alertas verdes"
            text="KPIs que se encuentran dentro de la meta establecida."
          >
            <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-help">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                    Verdes
                  </p>
                  <p className="text-3xl font-bold text-emerald-700 mt-2">
                    {resultado.total_alertas_verdes ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                  <CheckCircle size={20} />
                </div>
              </div>
            </div>
          </Tooltip>
        </div>
      )}

      {/* ======================================================
          TARJETAS DE ALERTAS (semáforo)
      ======================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-blue-50 text-[#006cb7] rounded-xl">
            <Gauge size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Alertas Operativas de Corte
            </h2>
            <p className="text-[10px] text-slate-400 mt-1">
              Evaluación determinística de los 4 KPIs operativos según el filtro seleccionado.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="animate-spin text-[#006cb7]" size={26} />
            <p className="text-xs">Evaluando alertas...</p>
          </div>
        ) : alertas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <div className="p-3 bg-slate-50 rounded-xl">
              <Info size={24} />
            </div>
            <p className="text-xs font-medium text-slate-500">
              No se pudo obtener la evaluación de alertas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alertas.map((a, index) => {
              const estilo = estiloNivel(a.nivel_alerta);
              const Icono = estilo.Icon;
              return (
                <div
                  key={`${a.kpi}-${index}`}
                  className={`border rounded-2xl p-5 ${estilo.card}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2.5 rounded-xl shrink-0 ${estilo.icono}`}>
                        <Icono size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {a.kpi || "KPI sin nombre"}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {a.descripcion || "Sin descripción"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase whitespace-nowrap ${estilo.badge}`}
                    >
                      {a.nivel_alerta || "--"}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-2xl font-bold text-slate-800">
                      {a.valor_actual ?? "--"}
                    </span>
                    {a.unidad && (
                      <span className="text-xs font-semibold text-slate-400">
                        {a.unidad}
                      </span>
                    )}
                  </div>

                  {a.mensaje && (
                    <div className="flex items-start gap-2 bg-white/70 border border-slate-200 rounded-xl p-3 mb-3">
                      <Info size={14} className="text-[#006cb7] mt-0.5 shrink-0" />
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {a.mensaje}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-2.5 py-2 text-center">
                      <p className="text-[9px] font-bold uppercase text-emerald-600">Verde</p>
                      <p className="text-[11px] font-bold text-emerald-700 mt-0.5 truncate">
                        {a.meta_verde || "--"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-2.5 py-2 text-center">
                      <p className="text-[9px] font-bold uppercase text-amber-600">Amarillo</p>
                      <p className="text-[11px] font-bold text-amber-700 mt-0.5 truncate">
                        {a.meta_amarillo || "--"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50/60 px-2.5 py-2 text-center">
                      <p className="text-[9px] font-bold uppercase text-red-600">Rojo</p>
                      <p className="text-[11px] font-bold text-red-700 mt-0.5 truncate">
                        {a.meta_rojo || "--"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================
          LEYENDA
      ======================================================= */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg text-[#006cb7] shrink-0">
            <Target size={17} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-700">
              ¿Qué significa esta información?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mt-3">
              <p className="text-[11px] text-slate-600">
                <strong>Valor actual:</strong> resultado del KPI para el filtro
                seleccionado.
              </p>
              <p className="text-[11px] text-slate-600">
                <strong>Nivel de alerta:</strong> semáforo (rojo, amarillo, verde)
                calculado de forma determinística por el sistema.
              </p>
              <p className="text-[11px] text-slate-600">
                <strong>Metas:</strong> umbrales de referencia que definen cada
                nivel del semáforo para ese KPI.
              </p>
              <p className="text-[11px] text-slate-600">
                <strong>Mensaje:</strong> explicación puntual generada por el
                sistema sobre el estado actual del KPI.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}