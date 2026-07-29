import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Info,
  Calendar,
  AlertTriangle,
  Loader2,
  Database,
  Gauge,
  Trophy,
} from "lucide-react";
import MapaRutas from "../pages/MapaRutas";

// ============================================================
// TOOLTIP
// ============================================================
function Tooltip({
  children,
  title,
  text,
  formula,
  datos,
  width = "w-80",
}) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    placement: "top",
  });

  const triggerRef = useRef(null);
  const hideTimer = useRef(null);

  const calcularPosicion = useCallback(() => {
    const el = triggerRef.current;

    if (!el) return;

    const rect = el.getBoundingClientRect();

    const espacioArriba = rect.top;
    const espacioAbajo = window.innerHeight - rect.bottom;

    const placement =
      espacioArriba > 170 || espacioArriba > espacioAbajo
        ? "top"
        : "bottom";

    let left = rect.left + rect.width / 2;

    const margen = 150;

    left = Math.min(
      Math.max(left, margen),
      window.innerWidth - margen
    );

    setCoords({
      top:
        placement === "top"
          ? rect.top - 10
          : rect.bottom + 10,
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

  const tieneContenido = Boolean(
    text || formula || datos
  );

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
                coords.placement === "top"
                  ? "-100%"
                  : "0"
              })`,
              zIndex: 9999,
            }}
            className={`
              ${width}
              pointer-events-none
              rounded-xl
              border border-slate-200
              bg-white
              px-4
              py-3
              shadow-2xl
              whitespace-normal
              break-words
            `}
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
// DASHBOARD
// ============================================================
export default function Dashboard({ idSeleccionado }) {
  // ============================================================
  // FECHA ACTUAL
  // ============================================================
  const obtenerFechaHoy = () => {
    const fecha = new Date();

    const year = fecha.getFullYear();

    const month = String(
      fecha.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      fecha.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const hoy = obtenerFechaHoy();

  // ============================================================
  // ESTADOS
  // ============================================================
  const [dashboard, setDashboard] = useState({
    resumen_general: {},
    ranking_lectores: [],
  });

  const [listaActividades, setListaActividades] =
    useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================================
  // FILTROS DE FECHA
  // ============================================================
  const [fechaInicio, setFechaInicio] =
    useState(hoy);

  const [fechaFin, setFechaFin] =
    useState(hoy);

  // ============================================================
  // VISTA ACTIVA
  // ============================================================
  const [prefijo, vistaActiva] = idSeleccionado
    ? idSeleccionado.split("_")
    : ["lecturas", "resumen"];

  // ============================================================
  // CARGAR DASHBOARD
  // ============================================================
  const cargarDashboard = async () => {
    // ----------------------------------------------------------
    // VALIDAR FECHAS
    // ----------------------------------------------------------
    if (
      fechaInicio &&
      fechaFin &&
      fechaFin < fechaInicio
    ) {
      setError(
        "La fecha fin no puede ser anterior a la fecha de inicio."
      );

      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (fechaInicio) {
        params.append(
          "fecha_inicio",
          fechaInicio
        );
      }

      if (fechaFin) {
        params.append(
          "fecha_fin",
          fechaFin
        );
      }

      const response = await fetch(
        `http://localhost:8000/lectura/kpis/dashboard?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(
          "Error obteniendo dashboard"
        );
      }

      const data = await response.json();

      console.log(
        "Dashboard recibido:",
        data
      );

      setDashboard({
        resumen_general:
          data?.resumen_general || {},

        ranking_lectores:
          Array.isArray(
            data?.ranking_lectores
          )
            ? data.ranking_lectores
            : [],
      });

      // Actualmente no existe endpoint
      // para obtener actividades individuales.
      setListaActividades([]);
    } catch (err) {
      console.error(
        "Error cargando dashboard:",
        err
      );

      setError(
        "No se pudo cargar el dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ACTUALIZAR AL CAMBIAR FECHAS
  // ============================================================
  useEffect(() => {
    cargarDashboard();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin]);

  // ============================================================
  // RESUMEN GENERAL
  // ============================================================
  const resumen =
    dashboard.resumen_general || {};

  // ============================================================
  // KPIs
  // ============================================================
  const metrics = {
    // ----------------------------------------------------------
    // CUMPLIMIENTO
    // ----------------------------------------------------------
    cumplimiento: {
      nombre: "Cumplimiento",

      valor: `${Number(
        resumen.cumplimiento_lectura ?? 0
      ).toFixed(2)}%`,

      descripcion:
        "Porcentaje de lecturas realizadas respecto a las lecturas programadas.",

      formula:
        "(Lecturas realizadas / Lecturas programadas) × 100",

      datos:
        "total_lecturas_realizadas y total_lecturas_programadas",
    },

    // ----------------------------------------------------------
    // PRODUCTIVIDAD
    // ----------------------------------------------------------
    productividad: {
      nombre: "Productividad",

      valor: `${Number(
        resumen.productividad_lectura ?? 0
      ).toFixed(2)}/h`,

      descripcion:
        "Cantidad promedio de lecturas realizadas por cada hora trabajada.",

      formula:
        "Lecturas realizadas / Horas trabajadas",

      datos:
        "productividad_lectura",
    },

    // ----------------------------------------------------------
    // TIEMPO PROMEDIO DE LECTURA
    // ----------------------------------------------------------
    tiempo_promedio: {
      nombre: "Tiempo Promedio de Lectura",

      valor: `${Number(
        resumen.tiempo_promedio_lectura ?? 0
      ).toFixed(2)} min`,

      descripcion:
        "Tiempo promedio que demora un lector en completar una lectura. Un valor menor indica una mayor rapidez en la ejecución.",

      formula:
        "Tiempo total empleado en lecturas / Cantidad de lecturas realizadas",

      datos:
        "tiempo_promedio_lectura",
    },

    // ----------------------------------------------------------
    // IMPEDIMENTOS
    // ----------------------------------------------------------
    impedimentos: {
      nombre: "Impedimentos",

      valor: `${Number(
        resumen.impedimentos_lectura ?? 0
      ).toFixed(2)}%`,

      descripcion:
        "Porcentaje de lecturas que presentaron algún impedimento.",

      formula:
        "(Impedimentos / Lecturas realizadas) × 100",

      datos:
        "impedimentos_lectura",
    },

    // ----------------------------------------------------------
    // OBSERVACIONES
    // ----------------------------------------------------------
    observaciones: {
      nombre: "Observaciones",

      valor: `${Number(
        resumen.observaciones_lectura ?? 0
      ).toFixed(2)}%`,

      descripcion:
        "Porcentaje de lecturas que registraron observaciones.",

      formula:
        "(Observaciones / Lecturas realizadas) × 100",

      datos:
        "observaciones_lectura",
    },

    // ----------------------------------------------------------
    // COBERTURA GPS
    // ----------------------------------------------------------
    coberturaGps: {
      nombre: "Cobertura geográfica",

      valor: `${Number(
        resumen.cobertura_georreferenciada ?? 0
      ).toFixed(2)}%`,

      descripcion:
        "Porcentaje de actividades que cuentan con georreferenciación válida.",

      formula:
        "(Actividades georreferenciadas / Total actividades) × 100",

      datos:
        "cobertura_georreferenciada",
    },

    // ----------------------------------------------------------
    // FUERA DE RADIO
    // ----------------------------------------------------------
    fueraDeRadio: {
      nombre: "Fuera de punto",

      valor:
        resumen.actividades_fuera_de_punto ??
        0,

      descripcion:
        "Cantidad de actividades realizadas fuera del radio geográfico permitido.",

      formula:
        "Conteo de actividades fuera del punto permitido",

      datos:
        "actividades_fuera_de_punto",
    },
  };

  // ============================================================
  // VALIDACIÓN DE FECHAS
  // ============================================================
  const fechasInvalidas =
    fechaInicio &&
    fechaFin &&
    fechaFin < fechaInicio;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6 text-left">

      {/* ======================================================
          ESTADO DE CARGA
      ======================================================= */}
      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2
            className="animate-spin text-[#006cb7]"
            size={16}
          />

          Actualizando indicadores...
        </div>
      )}

      {/* ======================================================
          FILTROS
      ======================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end gap-4">

          {/* FECHA INICIO */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Fecha inicio
            </label>

            <div className="relative">
              <Calendar
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7]"
              />

              <input
                type="date"
                value={fechaInicio}
                onChange={(e) =>
                  setFechaInicio(
                    e.target.value
                  )
                }
                className="
                  h-10
                  pl-10
                  pr-3
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  text-xs
                  text-slate-700
                  outline-none
                  focus:border-[#006cb7]
                  focus:ring-2
                  focus:ring-blue-100
                  transition
                "
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
                    : "text-[#006cb7]"
                }`}
              />

              <input
                type="date"
                value={fechaFin}
                min={
                  fechaInicio || undefined
                }
                onChange={(e) =>
                  setFechaFin(
                    e.target.value
                  )
                }
                className={`
                  h-10
                  pl-10
                  pr-3
                  rounded-lg
                  border
                  bg-white
                  text-xs
                  text-slate-700
                  outline-none
                  transition
                  ${
                    fechasInvalidas
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200 focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100"
                  }
                `}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          ERROR DE FECHAS
      ======================================================= */}
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
                La fecha fin no puede ser anterior
                a la fecha de inicio.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          ERROR API
      ======================================================= */}
      {error && !fechasInvalidas && (
        <div className="bg-white border border-red-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">

            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 shrink-0">
              <AlertTriangle size={18} />
            </div>

            <p className="text-xs font-semibold text-red-700">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          KPIs
      ======================================================= */}
      {vistaActiva === "resumen" && (
        <>
          <div>
            <div className="flex items-center justify-between mb-3">

              <div>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  Indicadores principales
                </h2>

                <p className="text-[10px] text-slate-400 mt-1">
                  Resumen del rendimiento de lecturas
                </p>
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

              {Object.entries(metrics).map(
                ([key, kpi]) => (
                  <Tooltip
                    key={key}
                    title={kpi.nombre}
                    text={kpi.descripcion}
                    formula={kpi.formula}
                    datos={kpi.datos}
                    width="w-80"
                  >
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-help">

                      <div className="flex items-center justify-between gap-4">

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            {kpi.nombre}
                          </p>

                          <p className="text-3xl font-bold text-slate-800 mt-2">
                            {kpi.valor}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-blue-50 text-[#006cb7] shrink-0">
                          <Gauge size={20} />
                        </div>

                      </div>

                    </div>
                  </Tooltip>
                )
              )}

            </div>
          </div>

          {/* ====================================================
              RANKING
          ===================================================== */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

            <div className="flex items-center gap-3 mb-4">

              <div className="p-2.5 bg-blue-50 text-[#006cb7] rounded-xl shrink-0">
                <Trophy size={18} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  Ranking de Lectores
                </h2>

                <p className="text-[10px] text-slate-400 mt-1">
                  Rendimiento de los lectores durante
                  el período seleccionado.
                </p>
              </div>

            </div>

            <div className="border border-slate-200 rounded-xl overflow-auto max-h-[500px]">

              {dashboard.ranking_lectores?.length > 0 ? (

                <table className="w-full min-w-[700px] text-left text-xs border-collapse">

                  {/* CABECERA */}
                  <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 uppercase">

                    <tr className="border-b border-slate-200">

                      {/* CÓDIGO */}
                      <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50">

                        <Tooltip
                          title="Código"
                          text="Código único que identifica al lector dentro del sistema."
                          width="w-72"
                        >
                          <span className="cursor-help">
                            Código
                          </span>
                        </Tooltip>

                      </th>

                      {/* NOMBRE */}
                      <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50 min-w-[200px]">

                        <Tooltip
                          title="Nombre"
                          text="Nombre completo del lector registrado en el sistema."
                          width="w-72"
                        >
                          <span className="cursor-help">
                            Nombre
                          </span>
                        </Tooltip>

                      </th>

                      {/* EFICIENCIA */}
                      <th className="px-5 py-3 font-bold text-center whitespace-nowrap bg-slate-50">

                        <Tooltip
                          title="Eficiencia"
                          text="Porcentaje promedio de cumplimiento de lecturas del lector en el período seleccionado. Un valor más alto indica mejor rendimiento."
                          width="w-80"
                        >
                          <span className="cursor-help">
                            Eficiencia
                          </span>
                        </Tooltip>

                      </th>

                      {/* MIN / LECTURA */}
                      <th className="px-5 py-3 font-bold text-center whitespace-nowrap bg-slate-50">

                        <Tooltip
                          title="Min/Lectura"
                          text="Promedio de minutos que le toma al lector completar una lectura. Un valor más bajo indica mayor rapidez."
                          formula="Tiempo total empleado por el lector / Cantidad de lecturas realizadas"
                          datos="promedio_min_por_lectura"
                          width="w-80"
                        >
                          <span className="cursor-help">
                            Min/Lectura
                          </span>
                        </Tooltip>

                      </th>

                    </tr>

                  </thead>

                  {/* DATOS */}
                  <tbody className="divide-y divide-slate-100">

                    {dashboard.ranking_lectores.map(
                      (r, index) => (

                        <tr
                          key={
                            r.ccodprs ||
                            `lector-${index}`
                          }
                          className="hover:bg-slate-50/70 transition-colors"
                        >

                          {/* CÓDIGO */}
                          <td className="px-5 py-4">

                            <span className="font-mono text-[11px] font-bold text-[#006cb7] whitespace-nowrap">
                              {r.ccodprs || "--"}
                            </span>

                          </td>

                          {/* NOMBRE */}
                          <td className="px-5 py-4">

                            <div className="font-semibold text-slate-800 whitespace-nowrap">
                              {r.nombre || "--"}
                            </div>

                          </td>

                          {/* EFICIENCIA */}
                          <td className="px-5 py-4 text-center">

                            <span className="font-bold text-[#006cb7] whitespace-nowrap">
                              {Number(
                                r.eficiencia_promedio ??
                                  0
                              ).toFixed(2)}
                              %
                            </span>

                          </td>

                          {/* MIN / LECTURA */}
                          <td className="px-5 py-4 text-center text-slate-600 whitespace-nowrap">

                            {Number(
                              r.promedio_min_por_lectura ??
                                0
                            ).toFixed(2)}{" "}
                            min

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              ) : (

                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <Database size={24} />
                  </div>

                  <p className="text-xs font-medium text-slate-500">
                    No hay datos de lectores para
                    el período seleccionado.
                  </p>

                </div>

              )}

            </div>
          </div>
        </>
      )}

      {/* ======================================================
          MAPA
      ======================================================= */}
      {vistaActiva === "mapa" && (
        <MapaRutas
          actividadesTotales={
            listaActividades
          }
        />
      )}

    </div>
  );
}
