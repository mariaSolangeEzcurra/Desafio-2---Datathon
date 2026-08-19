import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Info,
  Calendar,
  AlertTriangle,
  Loader2,
  Database,
  Gauge,
  CheckCircle2,
  Clock3,
  DollarSign,
  ListChecks,
  CircleAlert,
  MapPin,
  BarChart3,
  RotateCcw,
  Filter,
  Trophy,
  Hash,
} from "lucide-react";
import { cortesKPIService } from "../services/CortesKPIService";

// ============================================================
// TOOLTIP
// ============================================================
function Tooltip({ children, title, text, formula, datos, width = "w-80" }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: "top" });
  const triggerRef = useRef(null);
  const hideTimer = useRef(null);
  const calcularPosicion = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const espacioArriba = rect.top;
    const espacioAbajo = window.innerHeight - rect.bottom;
    const placement =
      espacioArriba > 190 || espacioArriba > espacioAbajo ? "top" : "bottom";
    let left = rect.left + rect.width / 2;
    const margen = 160;
    left = Math.min(Math.max(left, margen), window.innerWidth - margen);
    setCoords({
      top: placement === "top" ? rect.top - 10 : rect.bottom + 10,
      left,
      placement,
    });
  }, []);
  const mostrar = () => {
    clearTimeout(hideTimer.current);
    calcularPosicion();
    setVisible(true);
  };
  const ocultar = () => {
    hideTimer.current = setTimeout(() => {
      setVisible(false);
    }, 60);
  };
  const tieneContenido = Boolean(text || formula || datos);
  return (
    <span
      ref={triggerRef}
      onMouseEnter={mostrar}
      onMouseLeave={ocultar}
      onFocus={mostrar}
      onBlur={ocultar}
      className="inline-block"
    >
      {children}
      {visible &&
        tieneContenido &&
        createPortal(
          <div
            onMouseEnter={mostrar}
            onMouseLeave={ocultar}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform: `translate(-50%, ${
                coords.placement === "top" ? "-100%" : "0"
              })`,
              zIndex: 9999,
            }}
            className={`${width} pointer-events-none rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xl whitespace-normal break-words`}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5 p-1.5 rounded-lg bg-blue-50 text-[#006cb7] shrink-0">
                <Info size={13} />
              </div>
              <div className="text-left w-full">
                <p className="text-[11px] font-bold text-slate-800 mb-1">
                  {title}
                </p>
                {text && (
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {text}
                  </p>
                )}
                {formula && (
                  <div className="border-t border-slate-100 mt-3 pt-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Fórmula
                    </p>
                    <p className="text-[10px] text-slate-700 mt-1 leading-relaxed">
                      {formula}
                    </p>
                  </div>
                )}
                {datos && (
                  <div className="border-t border-slate-100 mt-3 pt-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Datos utilizados
                    </p>
                    <p className="text-[10px] text-slate-700 mt-1 leading-relaxed">
                      {datos}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </span>
  );
}

// ============================================================
// AVISO DE DATOS NO DISPONIBLES POR FILTRO
// Se usa cuando el endpoint /resumen no soporta el filtro activo
// (distrito y/o ccodprs) y por lo tanto no podemos mostrar la
// tabla/sección sin arriesgarnos a mezclar datos que no corresponden.
// ============================================================
function AvisoFiltroNoSoportado({ mensaje }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2 px-6 text-center">
      <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
        <AlertTriangle size={22} />
      </div>
      <p className="text-xs font-medium text-slate-500 max-w-md">{mensaje}</p>
    </div>
  );
}

// ============================================================
// FORMATO MONEDA
// ============================================================
const formatearMonto = (valor) => {
  const numero = Number(valor ?? 0);
  return numero.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// ============================================================
// PORCENTAJE
// ============================================================
const formatearPorcentaje = (valor) => {
  return `${Number(valor ?? 0).toFixed(2)}%`;
};

// ============================================================
// FECHA ACTUAL
// ============================================================
const obtenerFechaHoy = () => {
  const fecha = new Date();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ============================================================
// OPCIONES DE PERIODO
// ============================================================
const OPCIONES_PERIODO = [
  { value: "", label: "Personalizado" },
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
  { value: "3meses", label: "Últimos 3 meses" },
];

// ============================================================
// DASHBOARD DE CORTES
// ============================================================
export default function CortesKPI({ idSeleccionado }) {
  const hoy = obtenerFechaHoy();

  // ==========================================================
  // ESTADOS
  // ==========================================================
  const [dashboard, setDashboard] = useState({
    total_ordenes: 0,
    ordenes_ejecutadas: 0,
    ordenes_pendientes: 0,
    tasa_efectividad_porcentaje: 0,
    monto_total_deuda: 0,
    monto_deuda_recuperada: 0,
    monto_deuda_en_riesgo: 0,
  });
  const [resumen, setResumen] = useState({
    por_distrito: [],
    por_tipo_programa: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================================
  // FILTROS
  // ==========================================================
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [periodo, setPeriodo] = useState("");
  const [distritoInput, setDistritoInput] = useState("");
  const [distritoFiltro, setDistritoFiltro] = useState("");
  const [ccodprsInput, setCcodprsInput] = useState("");
  const [ccodprsFiltro, setCcodprsFiltro] = useState("");

  // ==========================================================
  // FILTROS APLICADOS (último filtro realmente consultado)
  // ==========================================================
  const [filtroAplicado, setFiltroAplicado] = useState({
    fechaInicio: hoy,
    fechaFin: hoy,
    periodo: "",
  });

  // ==========================================================
  // VISTA
  // ==========================================================
  const [, vistaActiva] = idSeleccionado
    ? idSeleccionado.split("_")
    : ["cortes", "resumen"];

  // ==========================================================
  // VALIDACIÓN DE FECHAS
  // Solo aplica cuando NO hay un periodo predefinido seleccionado,
  // ya que en ese caso las fechas quedan deshabilitadas.
  // ==========================================================
  const fechasInvalidas =
    !periodo &&
    Boolean(fechaInicio) &&
    Boolean(fechaFin) &&
    fechaFin < fechaInicio;

  // ==========================================================
  // DEBOUNCE DISTRITO Y TRABAJADOR
  // Evita disparar un fetch por cada letra escrita.
  // ==========================================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDistritoFiltro(distritoInput.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [distritoInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCcodprsFiltro(ccodprsInput.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [ccodprsInput]);

  // ==========================================================
  // EXTRAER MENSAJE DEL ERROR
  // ==========================================================
  const obtenerMensajeError = (err) => {
    if (!err) {
      return "No se pudieron cargar los indicadores de cortes.";
    }
    // Error HTTP
    if (err?.response) {
      const status = err.response.status;
      const detalle = err.response.data?.detail;
      if (status === 500) {
        return (
          "El API de cortes respondió con un error interno (500). " +
          "Los endpoints están disponibles, pero el backend presenta un problema al procesar los filtros enviados."
        );
      }
      if (status === 422) {
        if (Array.isArray(detalle)) {
          return detalle
            .map((item) => item?.msg || JSON.stringify(item))
            .join(" | ");
        }
        return typeof detalle === "string"
          ? detalle
          : "Los parámetros enviados no son válidos.";
      }
      if (typeof detalle === "string") {
        return detalle;
      }
      return `El servidor respondió con el código ${status}.`;
    }
    // Error de red / CORS
    if (err?.request) {
      return (
        "No se pudo conectar con el API de cortes. " +
        "Verifica que el backend esté ejecutándose."
      );
    }
    return err?.message || "No se pudieron cargar los indicadores de cortes.";
  };

  // ==========================================================
  // CARGAR DATOS
  // Si hay un periodo seleccionado, tiene prioridad sobre las
  // fechas (que además quedan deshabilitadas en la UI).
  // distrito y ccodprs solo aplican al dashboard: el endpoint
  // de resumen no los soporta (limitación del backend, no se
  // puede modificar). Por eso el resumen se filtra/oculta en
  // el cliente según corresponda (ver bloque de cálculos abajo).
  // ==========================================================
  const cargarDashboard = async (inicio, fin, periodoActual, distrito, ccodprs) => {
    if (!periodoActual) {
      if (!inicio || !fin) {
        setError("Debes seleccionar una fecha de inicio y una fecha de fin.");
        return;
      }
      if (fin < inicio) {
        setError("La fecha fin no puede ser anterior a la fecha de inicio.");
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const inicioConsulta = periodoActual ? "" : inicio;
      const finConsulta = periodoActual ? "" : fin;

      console.log("Consultando cortes:", {
        periodo: periodoActual,
        fecha_inicio: inicioConsulta,
        fecha_fin: finConsulta,
        distrito,
        ccodprs,
      });

      const [dashboardData, resumenData] = await Promise.all([
        cortesKPIService.obtenerDashboardKpis({
          periodo: periodoActual,
          fechaInicio: inicioConsulta,
          fechaFin: finConsulta,
          distrito,
          ccodprs,
        }),
        cortesKPIService.obtenerResumen({
          periodo: periodoActual,
          fechaInicio: inicioConsulta,
          fechaFin: finConsulta,
        }),
      ]);

      console.log("Dashboard KPIs cortes:", dashboardData);
      console.log("Resumen analítico cortes:", resumenData);

      // ======================================================
      // DASHBOARD
      // ======================================================
      setDashboard({
        total_ordenes: dashboardData?.total_ordenes ?? 0,
        ordenes_ejecutadas: dashboardData?.ordenes_ejecutadas ?? 0,
        ordenes_pendientes: dashboardData?.ordenes_pendientes ?? 0,
        tasa_efectividad_porcentaje:
          dashboardData?.tasa_efectividad_porcentaje ?? 0,
        monto_total_deuda: dashboardData?.monto_total_deuda ?? 0,
        monto_deuda_recuperada: dashboardData?.monto_deuda_recuperada ?? 0,
        monto_deuda_en_riesgo: dashboardData?.monto_deuda_en_riesgo ?? 0,
      });

      // ======================================================
      // RESUMEN
      // ======================================================
      setResumen({
        por_distrito: Array.isArray(resumenData?.por_distrito)
          ? resumenData.por_distrito
          : [],
        por_tipo_programa: Array.isArray(resumenData?.por_tipo_programa)
          ? resumenData.por_tipo_programa
          : [],
      });

      // Guardar el filtro realmente consultado
      setFiltroAplicado({
        fechaInicio: inicioConsulta,
        fechaFin: finConsulta,
        periodo: periodoActual,
      });
    } catch (err) {
      console.error("Error cargando KPIs de cortes:", err);
      setError(obtenerMensajeError(err));
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // CARGA AUTOMÁTICA
  // Se dispara al entrar a la sección (cambio de idSeleccionado)
  // y cada vez que cambian fechas, periodo, distrito o trabajador,
  // sin depender de botones.
  // ==========================================================
  useEffect(() => {
    if (fechasInvalidas) return;
    cargarDashboard(fechaInicio, fechaFin, periodo, distritoFiltro, ccodprsFiltro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin, periodo, distritoFiltro, ccodprsFiltro, idSeleccionado]);

  // ==========================================================
  // CAMBIO DE PERIODO
  // Al elegir un periodo predefinido, las fechas quedan
  // deshabilitadas (se ignoran en la consulta).
  // ==========================================================
  const manejarCambioPeriodo = (e) => {
    setError(null);
    setPeriodo(e.target.value);
  };

  // ==========================================================
  // LIMPIAR FILTROS
  // ==========================================================
  const limpiarFiltros = () => {
    setError(null);
    setFechaInicio(hoy);
    setFechaFin(hoy);
    setPeriodo("");
    setDistritoInput("");
    setDistritoFiltro("");
    setCcodprsInput("");
    setCcodprsFiltro("");
    // La carga se dispara sola vía useEffect al cambiar los filtros
  };

  // ==========================================================
  // DATOS CALCULADOS
  // ==========================================================
  const totalOrdenes = Number(dashboard.total_ordenes ?? 0);
  const ejecutadas = Number(dashboard.ordenes_ejecutadas ?? 0);
  const pendientes = Number(dashboard.ordenes_pendientes ?? 0);
  const efectividad = Number(dashboard.tasa_efectividad_porcentaje ?? 0);
  const deudaTotal = Number(dashboard.monto_total_deuda ?? 0);
  const deudaRecuperada = Number(dashboard.monto_deuda_recuperada ?? 0);
  const deudaRiesgo = Number(dashboard.monto_deuda_en_riesgo ?? 0);

  // ==========================================================
  // KPIs
  // ==========================================================
  const metrics = [
    {
      nombre: "Total de órdenes",
      valor: totalOrdenes.toLocaleString("en-US"),
      descripcion:
        "Cantidad total de órdenes de corte consideradas durante el período seleccionado.",
      datos: "total_ordenes",
      icon: ListChecks,
    },
    {
      nombre: "Órdenes ejecutadas",
      valor: ejecutadas.toLocaleString("en-US"),
      descripcion:
        "Cantidad de órdenes de corte que fueron ejecutadas durante el período seleccionado.",
      datos: "ordenes_ejecutadas",
      icon: CheckCircle2,
    },
    {
      nombre: "Órdenes pendientes",
      valor: pendientes.toLocaleString("en-US"),
      descripcion:
        "Cantidad de órdenes de corte que permanecen pendientes durante el período seleccionado.",
      datos: "ordenes_pendientes",
      icon: Clock3,
    },
    {
      nombre: "Tasa de efectividad",
      valor: formatearPorcentaje(efectividad),
      descripcion:
        "Porcentaje de efectividad de las órdenes de corte.",
      formula: "(Órdenes ejecutadas / Total de órdenes) × 100",
      datos: "tasa_efectividad_porcentaje",
      icon: Gauge,
    },
    {
      nombre: "Deuda total",
      valor: formatearMonto(deudaTotal),
      descripcion:
        "Monto total de deuda asociado a las órdenes consideradas en el período seleccionado.",
      datos: "monto_total_deuda",
      icon: DollarSign,
    },
    {
      nombre: "Deuda recuperada",
      valor: formatearMonto(deudaRecuperada),
      descripcion:
        "Monto de deuda que ha sido recuperado.",
      datos: "monto_deuda_recuperada",
      icon: CheckCircle2,
    },
    {
      nombre: "Deuda en riesgo",
      valor: formatearMonto(deudaRiesgo),
      descripcion:
        "Monto de deuda identificado como deuda en riesgo.",
      datos: "monto_deuda_en_riesgo",
      icon: CircleAlert,
    },
  ];

  // ==========================================================
  // RANKINGS Y TABLAS DERIVADAS DEL RESUMEN
  //
  // IMPORTANTE: el endpoint /resumen (backend) NO soporta los
  // filtros de distrito ni ccodprs, a diferencia de /dashboard.
  // Como no podemos modificar el backend, nos adaptamos así:
  //
  //  - Sin filtro de distrito/trabajador -> se muestra todo tal
  //    cual llega del API (comportamiento normal).
  //  - Solo filtro de distrito (sin trabajador) -> SÍ podemos
  //    filtrar "por_distrito" en el cliente, porque el campo
  //    coincide exactamente con lo que el usuario pidió.
  //  - Filtro de trabajador (con o sin distrito) -> NO hay forma
  //    de filtrar ninguna tabla del resumen en el cliente, porque
  //    el API no devuelve el detalle por trabajador. En ese caso
  //    ocultamos las tablas/rankings y mostramos un aviso, en vez
  //    de mostrar datos de otros distritos/trabajadores que
  //    confundirían al usuario.
  //  - "por_tipo_programa" nunca se puede filtrar por distrito en
  //    el cliente porque esa fila no trae el campo distrito.
  // ==========================================================
  const hayFiltroDistrito = Boolean(distritoFiltro);
  const hayFiltroTrabajador = Boolean(ccodprsFiltro);

  const distritosConEfectividad = (resumen.por_distrito || []).map((d) => {
    const total = Number(d?.total_ordenes ?? 0);
    const ejec = Number(d?.ejecutadas ?? 0);
    return {
      ...d,
      efectividadCalc: total > 0 ? (ejec / total) * 100 : 0,
    };
  });

  // Filtrado en cliente por distrito (seguro, el campo coincide)
  const distritosFiltradosCliente = hayFiltroDistrito
    ? distritosConEfectividad.filter((d) =>
        (d?.distrito || "")
          .toLowerCase()
          .includes(distritoFiltro.toLowerCase())
      )
    : distritosConEfectividad;

  // Tabla "por distrito": disponible salvo que haya filtro de trabajador
  const mostrarTablaDistrito = !hayFiltroTrabajador;
  const datosTablaDistrito = mostrarTablaDistrito ? distritosFiltradosCliente : [];

  // Tabla "por tipo de programa": nunca se puede filtrar en cliente,
  // así que solo se muestra sin ningún filtro de distrito/trabajador
  const mostrarTablaPrograma = !hayFiltroDistrito && !hayFiltroTrabajador;

  // Rankings destacados: mezclan distrito + programa, así que solo
  // tienen sentido sin filtro de distrito/trabajador activo
  const mostrarRankings = !hayFiltroDistrito && !hayFiltroTrabajador;

  const mejorDistrito =
    distritosFiltradosCliente.length > 0
      ? [...distritosFiltradosCliente].sort(
          (a, b) => b.efectividadCalc - a.efectividadCalc
        )[0]
      : null;

  const peorDistrito =
    distritosFiltradosCliente.length > 0
      ? [...distritosFiltradosCliente].sort(
          (a, b) => a.efectividadCalc - b.efectividadCalc
        )[0]
      : null;

  const distritoMayorDeuda =
    distritosFiltradosCliente.length > 0
      ? [...distritosFiltradosCliente].sort(
          (a, b) => Number(b?.deuda_total ?? 0) - Number(a?.deuda_total ?? 0)
        )[0]
      : null;

  const programaMayorVolumen =
    resumen.por_tipo_programa.length > 0
      ? [...resumen.por_tipo_programa].sort(
          (a, b) => Number(b?.total_ordenes ?? 0) - Number(a?.total_ordenes ?? 0)
        )[0]
      : null;

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="space-y-6 text-left">
      {/* ======================================================
          CARGANDO
      ====================================================== */}
      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="animate-spin text-[#006cb7]" size={16} />
          Consultando indicadores de cortes...
        </div>
      )}

      {/* ======================================================
          FILTROS
      ====================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-end gap-4 flex-wrap">
          {/* PERIODO */}
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
                value={periodo}
                onChange={manejarCambioPeriodo}
                disabled={loading}
                className="h-10 pl-10 pr-8 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100 transition appearance-none disabled:opacity-50 disabled:cursor-not-allowed min-w-[170px]"
              >
                {OPCIONES_PERIODO.map((opcion) => (
                  <option key={opcion.value || "personalizado"} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FECHA INICIO */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Fecha inicio
            </label>
            <div className="relative">
              <Calendar
                size={15}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  periodo ? "text-slate-300" : "text-[#006cb7]"
                }`}
              />
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                disabled={Boolean(periodo)}
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
              <Calendar
                size={15}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  fechasInvalidas
                    ? "text-red-500"
                    : periodo
                    ? "text-slate-300"
                    : "text-[#006cb7]"
                }`}
              />
              <input
                type="date"
                value={fechaFin}
                min={fechaInicio || undefined}
                onChange={(e) => setFechaFin(e.target.value)}
                disabled={Boolean(periodo)}
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
                className="h-10 pl-10 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px]"
              />
            </div>
          </div>

          {/* TRABAJADOR (ccodprs) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Trabajador
            </label>
            <div className="relative">
              <Hash
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Código"
                value={ccodprsInput}
                onChange={(e) => setCcodprsInput(e.target.value)}
                disabled={loading}
                className="h-10 pl-10 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
              />
            </div>
          </div>

          {/* BOTÓN LIMPIAR */}
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
          </div>
        </div>

        {(distritoFiltro || ccodprsFiltro) && (
          <p className="text-[10px] text-[#006cb7] font-semibold mt-3">
            {distritoFiltro && `Distrito: ${distritoFiltro}`}
            {distritoFiltro && ccodprsFiltro && " · "}
            {ccodprsFiltro && `Trabajador: ${ccodprsFiltro}`}
            {" — los indicadores principales de arriba sí respetan este filtro; el análisis por distrito/programa se adapta o se oculta según lo que se pueda filtrar (ver avisos abajo)."}
          </p>
        )}
      </div>

      {/* ======================================================
          ERROR FECHAS
      ====================================================== */}
      {fechasInvalidas && (
        <div className="bg-white border border-red-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-red-700">
                Rango de fechas inválido
              </p>
              <p className="text-[11px] text-red-600 mt-1">
                La fecha fin no puede ser anterior a la fecha de inicio.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          ERROR API
      ====================================================== */}
      {error && !fechasInvalidas && (
        <div className="bg-white border border-red-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-red-700">
                No se pudieron cargar los indicadores
              </p>
              <p className="text-[11px] text-red-600 mt-1 leading-relaxed">
                {error}
              </p>
              <p className="text-[10px] text-slate-400 mt-2">
                {filtroAplicado.periodo ? (
                  <>
                    Periodo aplicado:{" "}
                    <span className="font-semibold">
                      {
                        OPCIONES_PERIODO.find(
                          (o) => o.value === filtroAplicado.periodo
                        )?.label
                      }
                    </span>
                  </>
                ) : (
                  <>
                    Rango enviado:{" "}
                    <span className="font-semibold">
                      {filtroAplicado.fechaInicio}
                    </span>
                    {" → "}
                    <span className="font-semibold">
                      {filtroAplicado.fechaFin}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          RESUMEN GENERAL
      ====================================================== */}
      {vistaActiva === "resumen" && (
        <>
          {/* ==================================================
              INDICADORES PRINCIPALES
              (estos SÍ respetan distrito/ccodprs, vienen de
              /dashboard, que sí soporta esos filtros)
          ================================================== */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  Indicadores principales
                </h2>
                <p className="text-[10px] text-slate-400 mt-1">
                  Resumen global de las órdenes de corte y situación de la
                  deuda.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {metrics.map((kpi, index) => {
                const Icon = kpi.icon || Gauge;
                return (
                  <Tooltip
                    key={`${kpi.nombre}-${index}`}
                    title={kpi.nombre}
                    text={kpi.descripcion}
                    formula={kpi.formula}
                    datos={kpi.datos}
                    width="w-80"
                  >
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-help h-full">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            {kpi.nombre}
                          </p>
                          <p className="text-2xl xl:text-3xl font-bold text-slate-800 mt-2 truncate">
                            {kpi.valor}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-50 text-[#006cb7] shrink-0">
                          <Icon size={20} />
                        </div>
                      </div>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* ==================================================
              EJECUTADAS VS PENDIENTES
          ================================================== */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* EJECUTADAS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                    Ejecución de órdenes
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Distribución de órdenes ejecutadas y pendientes.
                  </p>
                </div>
              </div>
              <div className="space-y-5">
                {/* EJECUTADAS */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600">
                      Ejecutadas
                    </span>
                    <span className="text-xs font-bold text-emerald-600">
                      {ejecutadas.toLocaleString("en-US")}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(efectividad, 100)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">
                    {formatearPorcentaje(efectividad)} del total
                  </p>
                </div>
                {/* PENDIENTES */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600">
                      Pendientes
                    </span>
                    <span className="text-xs font-bold text-amber-600">
                      {pendientes.toLocaleString("en-US")}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          totalOrdenes > 0
                            ? Math.min((pendientes / totalOrdenes) * 100, 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">
                    {totalOrdenes > 0
                      ? formatearPorcentaje((pendientes / totalOrdenes) * 100)
                      : "0.00%"}{" "}
                    del total
                  </p>
                </div>
              </div>
            </div>

            {/* DEUDA */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-blue-50 text-[#006cb7] rounded-xl">
                  <DollarSign size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                    Situación de la deuda
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Comparativa de deuda total, recuperada y en riesgo.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    Total
                  </p>
                  <p className="text-lg font-bold text-slate-800 mt-2 break-all">
                    {formatearMonto(deudaTotal)}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                    Recuperada
                  </p>
                  <p className="text-lg font-bold text-emerald-700 mt-2 break-all">
                    {formatearMonto(deudaRecuperada)}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-amber-600">
                    En riesgo
                  </p>
                  <p className="text-lg font-bold text-amber-700 mt-2 break-all">
                    {formatearMonto(deudaRiesgo)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              COMPARATIVAS DESTACADAS
              (calculadas a partir del resumen por distrito/programa;
              solo se muestran sin filtro de distrito/trabajador,
              porque el API de resumen no soporta esos filtros)
          ================================================== */}
          {mostrarRankings ? (
            (mejorDistrito || peorDistrito || distritoMayorDeuda || programaMayorVolumen) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {mejorDistrito && (
                  <Tooltip
                    title="Distrito más efectivo"
                    text="Distrito con la mayor tasa de efectividad (ejecutadas / total) dentro del período consultado."
                    width="w-80"
                  >
                    <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-help h-full">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                          <Trophy size={16} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Distrito más efectivo
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {mejorDistrito.distrito || "Sin distrito"}
                      </p>
                      <p className="text-xl font-bold text-emerald-600 mt-1">
                        {formatearPorcentaje(mejorDistrito.efectividadCalc)}
                      </p>
                    </div>
                  </Tooltip>
                )}

                {peorDistrito && (
                  <Tooltip
                    title="Distrito que requiere atención"
                    text="Distrito con la menor tasa de efectividad dentro del período consultado."
                    width="w-80"
                  >
                    <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-help h-full">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-red-50 text-red-600 shrink-0">
                          <CircleAlert size={16} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Requiere atención
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {peorDistrito.distrito || "Sin distrito"}
                      </p>
                      <p className="text-xl font-bold text-red-600 mt-1">
                        {formatearPorcentaje(peorDistrito.efectividadCalc)}
                      </p>
                    </div>
                  </Tooltip>
                )}

                {distritoMayorDeuda && (
                  <Tooltip
                    title="Distrito con mayor deuda"
                    text="Distrito que concentra el mayor monto de deuda total dentro del período consultado."
                    width="w-80"
                  >
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-help h-full">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-blue-50 text-[#006cb7] shrink-0">
                          <MapPin size={16} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Mayor deuda por distrito
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {distritoMayorDeuda.distrito || "Sin distrito"}
                      </p>
                      <p className="text-lg font-bold text-slate-700 mt-1 truncate">
                        {formatearMonto(distritoMayorDeuda.deuda_total)}
                      </p>
                    </div>
                  </Tooltip>
                )}

                {programaMayorVolumen && (
                  <Tooltip
                    title="Programa con más órdenes"
                    text="Tipo de programa con el mayor volumen de órdenes de corte dentro del período consultado."
                    width="w-80"
                  >
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-help h-full">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-blue-50 text-[#006cb7] shrink-0">
                          <BarChart3 size={16} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Mayor volumen
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-800 truncate">
                        Programa {programaMayorVolumen.ctipprg ?? "--"}
                      </p>
                      <p className="text-xl font-bold text-[#006cb7] mt-1">
                        {Number(programaMayorVolumen.total_ordenes ?? 0).toLocaleString("en-US")}{" "}
                        <span className="text-xs font-semibold text-slate-400">órdenes</span>
                      </p>
                    </div>
                  </Tooltip>
                )}
              </div>
            )
          ) : (
            <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                  <AlertTriangle size={16} />
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Los indicadores destacados (distrito más efectivo, mayor
                  deuda, programa con más volumen, etc.) se ocultan con el
                  filtro actual porque comparan varios distritos y programas
                  a la vez.
                  Revisa las tarjetas de arriba: esas sí reflejan el filtro
                  aplicado con exactitud.
                </p>
              </div>
            </div>
          )}

          {/* ==================================================
              ANÁLISIS POR DISTRITO
              Se filtra en el cliente si solo hay filtro de distrito.
              Se oculta si hay filtro de trabajador (ccodprs), porque
              el API de resumen no distingue por trabajador y no
              podemos saber qué distritos le corresponden.
          ================================================== */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 text-[#006cb7] rounded-xl shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  Análisis por distrito
                </h2>
                <p className="text-[10px] text-slate-400 mt-1">
                  Órdenes, ejecución y deuda agrupadas por distrito.
                </p>
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-auto max-h-[450px]">
              {!mostrarTablaDistrito ? (
                <AvisoFiltroNoSoportado
                  mensaje="No disponible al filtrar por trabajador: Usa las tarjetas de arriba, que sí respetan el filtro."
                />
              ) : datosTablaDistrito.length > 0 ? (
                <table className="w-full min-w-[950px] text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 uppercase">
                    <tr className="border-b border-slate-200">
                      <th className="px-5 py-3 font-bold bg-slate-50">
                        Distrito
                      </th>
                      <th className="px-5 py-3 font-bold text-center bg-slate-50">
                        Total órdenes
                      </th>
                      <th className="px-5 py-3 font-bold text-center bg-slate-50">
                        Ejecutadas
                      </th>
                      <th className="px-5 py-3 font-bold text-center bg-slate-50">
                        Pendientes
                      </th>
                      <th className="px-5 py-3 font-bold bg-slate-50 min-w-[160px]">
                        Efectividad
                      </th>
                      <th className="px-5 py-3 font-bold text-right bg-slate-50">
                        Deuda total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...datosTablaDistrito]
                      .sort((a, b) => Number(b.total_ordenes ?? 0) - Number(a.total_ordenes ?? 0))
                      .map((item, index) => (
                        <tr
                          key={`distrito-${index}`}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-blue-50 text-[#006cb7]">
                                <MapPin size={14} />
                              </div>
                              <span className="font-semibold text-slate-800">
                                {item?.distrito || "Sin distrito"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center font-bold text-slate-700">
                            {Number(item?.total_ordenes ?? 0).toLocaleString("en-US")}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="font-bold text-emerald-600">
                              {Number(item?.ejecutadas ?? 0).toLocaleString("en-US")}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="font-bold text-amber-600">
                              {Number(item?.pendientes ?? 0).toLocaleString("en-US")}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                <div
                                  className={`h-full rounded-full ${
                                    item.efectividadCalc >= 75
                                      ? "bg-emerald-500"
                                      : item.efectividadCalc >= 50
                                      ? "bg-amber-400"
                                      : "bg-red-400"
                                  }`}
                                  style={{ width: `${Math.min(item.efectividadCalc, 100)}%` }}
                                />
                              </div>
                              <span className="font-bold text-slate-700 whitespace-nowrap">
                                {formatearPorcentaje(item.efectividadCalc)}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-slate-700">
                            {formatearMonto(item?.deuda_total)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <Database size={24} />
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    {hayFiltroDistrito
                      ? "No hay información para el distrito y período seleccionados."
                      : "No hay información por distrito para el período seleccionado."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ==================================================
              ANÁLISIS POR TIPO DE PROGRAMA
              No se puede filtrar en cliente (el resumen no trae
              distrito por fila), así que se oculta con cualquier
              filtro de distrito o trabajador activo.
          ================================================== */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 text-[#006cb7] rounded-xl shrink-0">
                <BarChart3 size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  Análisis por tipo de programa
                </h2>
                <p className="text-[10px] text-slate-400 mt-1">
                  Desglose de órdenes y deuda según el tipo de programa.
                </p>
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-auto max-h-[450px]">
              {!mostrarTablaPrograma ? (
                <AvisoFiltroNoSoportado
                  mensaje="No disponible con este filtro: Usa las tarjetas de arriba."
                />
              ) : resumen.por_tipo_programa?.length > 0 ? (
                <table className="w-full min-w-[950px] text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 uppercase">
                    <tr className="border-b border-slate-200">
                      <th className="px-5 py-3 font-bold bg-slate-50">
                        Tipo de programa
                      </th>
                      <th className="px-5 py-3 font-bold text-center bg-slate-50">
                        Total órdenes
                      </th>
                      <th className="px-5 py-3 font-bold text-center bg-slate-50">
                        Ejecutadas
                      </th>
                      <th className="px-5 py-3 font-bold text-center bg-slate-50">
                        Pendientes
                      </th>
                      <th className="px-5 py-3 font-bold bg-slate-50 min-w-[160px]">
                        Efectividad
                      </th>
                      <th className="px-5 py-3 font-bold text-right bg-slate-50">
                        Deuda total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resumen.por_tipo_programa.map((item, index) => {
                      const total = Number(item?.total_ordenes ?? 0);
                      const ejecutadasPrograma = Number(
                        item?.ejecutadas ?? 0
                      );
                      const efectividadPrograma =
                        total > 0 ? (ejecutadasPrograma / total) * 100 : 0;
                      return (
                        <tr
                          key={`programa-${index}`}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 text-[#006cb7] px-3 py-1.5 text-[10px] font-bold">
                              <BarChart3 size={13} />
                              Programa {item?.ctipprg ?? "--"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center font-bold text-slate-700">
                            {total.toLocaleString("en-US")}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="font-bold text-emerald-600">
                              {ejecutadasPrograma.toLocaleString("en-US")}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="font-bold text-amber-600">
                              {Number(item?.pendientes ?? 0).toLocaleString(
                                "en-US"
                              )}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                <div
                                  className={`h-full rounded-full ${
                                    efectividadPrograma >= 75
                                      ? "bg-emerald-500"
                                      : efectividadPrograma >= 50
                                      ? "bg-amber-400"
                                      : "bg-red-400"
                                  }`}
                                  style={{ width: `${Math.min(efectividadPrograma, 100)}%` }}
                                />
                              </div>
                              <span className="font-bold text-slate-700 whitespace-nowrap">
                                {formatearPorcentaje(efectividadPrograma)}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-slate-700">
                            {formatearMonto(item?.deuda_total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <Database size={24} />
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    No hay información por tipo de programa para el período
                    seleccionado.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}