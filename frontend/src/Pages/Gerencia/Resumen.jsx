import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Eye,
  Filter,
  Info,
  Loader2,
  Medal,
  RefreshCw,
  Trophy,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

import {
  obtenerResumenGrupoFacturacion,
  obtenerRankingPersonal,
  obtenerRiesgoOperativo,
} from "../../services/gerenciaService";

// ============================================================
// UTILIDADES
// ============================================================

const obtenerFechaActual = () => {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, "0");
  const day = String(hoy.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ------------------------------------------------------------
// NÚMEROS
// ------------------------------------------------------------

const formatearNumero = (valor) => {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) return "0";

  return new Intl.NumberFormat("es-PE", {
    maximumFractionDigits: 0,
  }).format(numero);
};

const formatearDecimal = (valor, decimales = 2) => {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) return "0";

  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(numero);
};

// ------------------------------------------------------------
// EFICIENCIA
//
// IMPORTANTE:
// El API devuelve:
//
// 0.99 = 99%
// 0.98 = 98%
// 0.75 = 75%
//
// Por eso normalizamos el valor antes de mostrarlo.
// ------------------------------------------------------------

const normalizarEficiencia = (valor) => {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) return 0;

  // Si el API entrega decimal entre 0 y 1
  if (numero >= 0 && numero <= 1) {
    return numero * 100;
  }

  // Si eventualmente el backend ya devuelve 99, 98, etc.
  return numero;
};

const formatearPorcentaje = (valor) => {
  const numero = normalizarEficiencia(valor);

  return `${formatearDecimal(numero, 1)}%`;
};

// ------------------------------------------------------------
// FECHAS
// ------------------------------------------------------------

const formatearFecha = (fecha) => {
  if (!fecha) return "-";

  const partes = String(fecha).split("-");

  if (partes.length !== 3) return fecha;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

// ------------------------------------------------------------
// DURACIÓN
// ------------------------------------------------------------

const formatearDuracion = (minutos) => {
  const total = Number(minutos);

  if (!Number.isFinite(total)) return "0 min";

  const horas = Math.floor(total / 60);
  const mins = Math.round(total % 60);

  if (horas <= 0) {
    return `${mins} min`;
  }

  return `${horas}h ${mins}min`;
};

// ------------------------------------------------------------
// NIVEL DE RIESGO
// ------------------------------------------------------------

const normalizarNivel = (nivel) => {
  return String(nivel || "")
    .trim()
    .toLowerCase();
};

const obtenerConfiguracionNivel = (nivel) => {
  const n = normalizarNivel(nivel);

  if (
    n.includes("crít") ||
    n.includes("crit") ||
    n.includes("muy alto")
  ) {
    return {
      label: "Crítico",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      icon: AlertTriangle,
    };
  }

  if (n.includes("alto") || n.includes("severo")) {
    return {
      label: "Alto",
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
      icon: AlertTriangle,
    };
  }

  if (n.includes("medio") || n.includes("moderado")) {
    return {
      label: "Medio",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: AlertCircle,
    };
  }

  if (n.includes("bajo") || n.includes("leve")) {
    return {
      label: "Bajo",
      bg: "bg-blue-50",
      text: "text-[#006cb7]",
      border: "border-blue-200",
      icon: Info,
    };
  }

  return {
    label: nivel || "Sin nivel",
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    icon: Info,
  };
};

// ============================================================
// TOOLTIP GLOBAL
// ============================================================

function Tooltip({
  children,
  title,
  text,
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
        text &&
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
              border
              border-slate-200
              bg-white
              px-4
              py-3
              shadow-xl
              whitespace-normal
              break-words
            `}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5 shrink-0 rounded-lg bg-blue-50 p-1.5 text-[#006cb7]">
                <Info size={13} />
              </div>

              <div className="text-left">
                {title && (
                  <p className="mb-1 text-[11px] font-bold text-slate-800">
                    {title}
                  </p>
                )}

                <p className="text-[11px] leading-relaxed text-slate-600">
                  {text}
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </span>
  );
}

// ============================================================
// INFO TOOLTIP
// ============================================================

function InfoTooltip({
  title,
  text,
  width = "w-80",
}) {
  return (
    <Tooltip
      title={title}
      text={text}
      width={width}
    >
      <Info
        size={14}
        className="cursor-help text-slate-400 transition-colors hover:text-[#006cb7]"
      />
    </Tooltip>
  );
}

// ============================================================
// TARJETA KPI
// ============================================================

function KpiCard({
  icon: Icon,
  title,
  value,
  description,
  detail,
  iconClass = "bg-blue-50 text-[#006cb7]",
}) {
  return (
    <Tooltip
      title={title}
      text={
        detail
          ? `${description} ${detail}`
          : description
      }
      width="w-80"
    >
      <div className="cursor-help rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
          >
            <Icon size={21} />
          </div>

          <Info
            size={14}
            className="text-slate-300"
          />
        </div>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </p>

        <p className="mt-1 text-2xl font-extrabold text-slate-800">
          {value}
        </p>
      </div>
    </Tooltip>
  );
}

// ============================================================
// BADGE DE NIVEL
// ============================================================

function NivelBadge({ nivel }) {
  const config = obtenerConfiguracionNivel(nivel);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
}

// ============================================================
// MODAL ALERTA
// ============================================================

function ModalAlerta({
  alerta,
  onClose,
}) {
  if (!alerta) return null;

  const config = obtenerConfiguracionNivel(
    alerta.nivel
  );

  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${config.bg} ${config.text}`}
            >
              <Icon size={22} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-800">
                Detalle de alerta operativa
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Información proporcionada por el API de riesgo operativo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}

        <div className="space-y-5 p-6">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Nivel de riesgo
              </p>

              <div className="mt-2">
                <NivelBadge nivel={alerta.nivel} />
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                ID de alerta
              </p>

              <p className="mt-1 text-sm font-bold text-slate-700">
                {alerta.alerta_id || "-"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Fecha
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {formatearFecha(alerta.fecha)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                KPI afectado
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {alerta.kpi || "-"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Estado
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {alerta.estado || "-"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Código del trabajador
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {alerta.ccodprs || "-"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <AlertCircle
                size={16}
                className={config.text}
              />

              <p className="text-xs font-bold uppercase tracking-wide text-slate-700">
                Motivo registrado
              </p>
            </div>

            <div className="mt-3 rounded-lg bg-slate-50 p-4">
              <p className="text-sm leading-6 text-slate-600">
                {alerta.motivo ||
                  "El API no proporcionó un motivo."}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex gap-3">
              <Info
                size={18}
                className="mt-0.5 shrink-0 text-[#006cb7]"
              />

              <div>
                <p className="text-xs font-bold text-[#00589b]">
                  ¿Por qué es importante esta alerta?
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Esta alerta indica que el sistema detectó
                  una condición asociada al KPI registrado.
                  El nivel, motivo y estado permiten a Gerencia
                  identificar situaciones que requieren
                  seguimiento o revisión operativa.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#006cb7] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#00589b]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function GerenciaLecturas() {
  const [fechaInicio, setFechaInicio] =
    useState(obtenerFechaActual());

  const [fechaFin, setFechaFin] =
    useState(obtenerFechaActual());

  const [limit, setLimit] = useState(10);

  const [resumen, setResumen] =
    useState(null);

  const [ranking, setRanking] =
    useState([]);

  const [riesgo, setRiesgo] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [alertaSeleccionada, setAlertaSeleccionada] =
    useState(null);

  // ==========================================================
  // CARGAR DATOS
  // ==========================================================

  const cargarDatos = async () => {
    if (!fechaInicio) {
      setError(
        "Debe seleccionar una fecha inicial."
      );
      return;
    }

    if (
      fechaFin &&
      fechaInicio &&
      fechaFin < fechaInicio
    ) {
      setError(
        "La fecha final no puede ser anterior a la fecha inicial."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const filtros = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin || null,
      };

      const [
        respuestaResumen,
        respuestaRanking,
        respuestaRiesgo,
      ] = await Promise.all([
        obtenerResumenGrupoFacturacion(
          filtros
        ),

        obtenerRankingPersonal({
          ...filtros,
          limit,
        }),

        obtenerRiesgoOperativo(
          filtros
        ),
      ]);

      setResumen(
        respuestaResumen || null
      );

      setRanking(
        Array.isArray(
          respuestaRanking?.ranking
        )
          ? respuestaRanking.ranking
          : []
      );

      setRiesgo(
        respuestaRiesgo || null
      );
    } catch (err) {
      console.error(
        "Error cargando Analítica Ejecutiva de Lecturas:",
        err
      );

      const mensaje =
        err?.response?.data?.detail ||
        err?.message ||
        "No se pudo obtener la información de Gerencia.";

      setError(
        Array.isArray(mensaje)
          ? mensaje
              .map((item) => item.msg)
              .join(" | ")
          : String(mensaje)
      );

      setResumen(null);
      setRanking([]);
      setRiesgo(null);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // CARGA AUTOMÁTICA
  // ==========================================================

  useEffect(() => {
    cargarDatos();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fechaInicio,
    fechaFin,
    limit,
  ]);

  // ==========================================================
  // ESTADÍSTICAS DEL RANKING
  // ==========================================================

  const estadisticasRanking = useMemo(() => {
    if (!ranking.length) {
      return {
        promedioEficiencia: 0,
        totalLecturas: 0,
        duracionTotal: 0,
        mejor: null,
        menor: null,
      };
    }

    // IMPORTANTE:
    // Convertimos 0.99 -> 99
    // para trabajar correctamente con porcentajes.

    const eficiencias = ranking
      .map((item) =>
        normalizarEficiencia(
          item.eficiencia
        )
      )
      .filter(Number.isFinite);

    const promedioEficiencia =
      eficiencias.length
        ? eficiencias.reduce(
            (acc, value) =>
              acc + value,
            0
          ) / eficiencias.length
        : 0;

    const totalLecturas =
      ranking.reduce(
        (acc, item) =>
          acc +
          (Number(
            item.lecturas_realizadas
          ) || 0),
        0
      );

    const duracionTotal =
      ranking.reduce(
        (acc, item) =>
          acc +
          (Number(
            item.duracion_total_min
          ) || 0),
        0
      );

    const ordenados = [...ranking].sort(
      (a, b) =>
        normalizarEficiencia(
          b.eficiencia
        ) -
        normalizarEficiencia(
          a.eficiencia
        )
    );

    return {
      promedioEficiencia,
      totalLecturas,
      duracionTotal,
      mejor: ordenados[0] || null,
      menor:
        ordenados[
          ordenados.length - 1
        ] || null,
    };
  }, [ranking]);

  // ==========================================================
  // ESTADÍSTICAS DE ALERTAS
  // ==========================================================

  const estadisticasAlertas = useMemo(() => {
    const alertas = Array.isArray(
      riesgo?.detalle_alertas
    )
      ? riesgo.detalle_alertas
      : [];

    const niveles = {};

    alertas.forEach((alerta) => {
      const nivel =
        alerta?.nivel ||
        "Sin nivel";

      niveles[nivel] =
        (niveles[nivel] || 0) + 1;
    });

    return {
      total:
        Number(
          riesgo?.total_alertas
        ) ||
        alertas.length ||
        0,

      niveles,
    };
  }, [riesgo]);

  // ==========================================================
  // PERIODO
  // ==========================================================

  const periodoResumen =
    resumen?.periodo || {};

  const periodoRiesgo =
    riesgo?.periodo || {};

  const fechaPeriodoInicio =
    periodoResumen.fecha_inicio ||
    periodoRiesgo.fecha_inicio ||
    fechaInicio;

  const fechaPeriodoFin =
    periodoResumen.fecha_fin ||
    periodoRiesgo.fecha_fin ||
    fechaFin;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6 text-left">

      {/* ======================================================
          CABECERA
      ======================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5">
          {/* ==================================================
              FILTROS
          =================================================== */}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

            <div className="mb-3 flex items-center gap-2">

              <Filter
                size={15}
                className="text-[#006cb7]"
              />

              <p className="text-xs font-bold uppercase tracking-wide text-slate-700">
                Filtros de análisis
              </p>

              <InfoTooltip
                title="Filtros de análisis"
                text="Estos filtros determinan el periodo de fechas y la cantidad de trabajadores que se muestran en el ranking. Los datos se actualizan automáticamente al modificar cualquiera de estos valores."
              />

            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">

              {/* FECHA INICIO */}

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
                  <CalendarDays size={12} />
                  Fecha inicial
                </label>

                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) =>
                    setFechaInicio(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-[#006cb7] focus:ring-4 focus:ring-blue-50"
                />
              </div>

              {/* FECHA FIN */}

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
                  <CalendarDays size={12} />
                  Fecha final
                </label>

                <input
                  type="date"
                  value={fechaFin}
                  min={
                    fechaInicio ||
                    undefined
                  }
                  onChange={(e) =>
                    setFechaFin(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-[#006cb7] focus:ring-4 focus:ring-blue-50"
                />
              </div>

              {/* TOP */}

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
                  <Trophy size={12} />
                  Ranking
                </label>

                <select
                  value={limit}
                  onChange={(e) =>
                    setLimit(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-[#006cb7] focus:ring-4 focus:ring-blue-50"
                >
                  <option value={5}>
                    Top 5
                  </option>

                  <option value={10}>
                    Top 10
                  </option>

                  <option value={20}>
                    Top 20
                  </option>

                  <option value={50}>
                    Top 50
                  </option>

                  <option value={100}>
                    Top 100
                  </option>
                </select>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">

          <AlertTriangle
            size={19}
            className="mt-0.5 shrink-0 text-rose-600"
          />

          <div>
            <p className="text-xs font-bold text-rose-800">
              No se pudo cargar el análisis
            </p>

            <p className="mt-1 text-xs leading-5 text-rose-700">
              {error}
            </p>
          </div>

        </div>
      )}
      {/* ======================================================
          KPIs PRINCIPALES
      ======================================================= */}

      <section>

        <div className="mb-3 flex items-center gap-2">

          <TrendingUp
            size={17}
            className="text-[#006cb7]"
          />

          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
            Resumen ejecutivo
          </h2>

        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <KpiCard
            icon={CheckCircle2}
            title="Lecturas realizadas"
            value={formatearNumero(
              resumen?.total_lecturas_realizadas
            )}
            description="Cantidad total de lecturas realizadas durante el periodo seleccionado."
            detail={`Valor actual: ${formatearNumero(
              resumen?.total_lecturas_realizadas
            )} lecturas.`}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <KpiCard
            icon={Zap}
            title="Eficiencia promedio"
            value={formatearPorcentaje(
              resumen?.eficiencia_promedio
            )}
            description="Eficiencia promedio proporcionada directamente por el API de resumen. El API entrega el valor en decimal, por ejemplo 0.99 representa 99%."
            detail={`Valor actual: ${formatearPorcentaje(
              resumen?.eficiencia_promedio
            )}.`}
            iconClass="bg-blue-50 text-[#006cb7]"
          />

          <KpiCard
            icon={BarChart3}
            title="Registros analizados"
            value={formatearNumero(
              resumen?.total_registros_analizados
            )}
            description="Cantidad de registros considerados por el sistema para generar el análisis ejecutivo."
            detail={`Valor actual: ${formatearNumero(
              resumen?.total_registros_analizados
            )} registros.`}
            iconClass="bg-violet-50 text-violet-600"
          />

          <KpiCard
            icon={Users}
            title="Lectores evaluados"
            value={formatearNumero(
              resumen?.total_lectores_evaluados
            )}
            description="Cantidad de lectores o trabajadores evaluados en el análisis."
            detail={`Valor actual: ${formatearNumero(
              resumen?.total_lectores_evaluados
            )} lectores.`}
            iconClass="bg-amber-50 text-amber-600"
          />

        </div>
      </section>

      {/* ======================================================
          VOLUMEN OPERATIVO
      ======================================================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-4 flex items-center justify-between">

          <div>

            <div className="flex items-center gap-2">

              <Activity
                size={17}
                className="text-[#006cb7]"
              />

              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                Lectura del volumen operativo
              </h3>

              <InfoTooltip
                title="Lectura del volumen operativo"
                text="Esta sección permite interpretar conjuntamente las lecturas realizadas, registros analizados y lectores evaluados. Los valores provienen del endpoint de resumen."
              />

            </div>

            <p className="mt-1 text-[11px] text-slate-400">
              Relación entre lecturas, registros y lectores evaluados.
            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <Tooltip
            title="Lecturas realizadas"
            text="Cantidad total de lecturas completadas por el personal durante el periodo seleccionado."
            width="w-72"
          >
            <div className="cursor-help rounded-xl bg-slate-50 p-4">

              <div className="flex items-center justify-between">

                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Lecturas realizadas
                </span>

                <CheckCircle2
                  size={16}
                  className="text-emerald-500"
                />

              </div>

              <p className="mt-2 text-xl font-extrabold text-slate-800">
                {formatearNumero(
                  resumen?.total_lecturas_realizadas
                )}
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                Trabajo operativo registrado.
              </p>

            </div>
          </Tooltip>

          <Tooltip
            title="Registros analizados"
            text="Cantidad de registros que el sistema tomó en cuenta como base para calcular el resumen ejecutivo."
            width="w-72"
          >
            <div className="cursor-help rounded-xl bg-slate-50 p-4">

              <div className="flex items-center justify-between">

                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Registros analizados
                </span>

                <BarChart3
                  size={16}
                  className="text-violet-500"
                />

              </div>

              <p className="mt-2 text-xl font-extrabold text-slate-800">
                {formatearNumero(
                  resumen?.total_registros_analizados
                )}
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                Base considerada para el análisis.
              </p>

            </div>
          </Tooltip>

          <Tooltip
            title="Lectores evaluados"
            text="Cantidad de trabajadores distintos que fueron incluidos en la evaluación."
            width="w-72"
          >
            <div className="cursor-help rounded-xl bg-slate-50 p-4">

              <div className="flex items-center justify-between">

                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Lectores evaluados
                </span>

                <Users
                  size={16}
                  className="text-amber-500"
                />

              </div>

              <p className="mt-2 text-xl font-extrabold text-slate-800">
                {formatearNumero(
                  resumen?.total_lectores_evaluados
                )}
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                Personal incluido en la evaluación.
              </p>

            </div>
          </Tooltip>

        </div>
      </section>

      {/* ======================================================
          RANKING
      ======================================================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <Trophy
                size={18}
                className="text-amber-500"
              />

              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                Ranking de personal
              </h2>

              <InfoTooltip
                title="Ranking de personal"
                text="El ranking es proporcionado directamente por el endpoint. La eficiencia del API se entrega como decimal: 0.99 equivale a 99%. La tabla la transforma únicamente para su visualización."
              />

            </div>

            <p className="mt-1 text-[11px] text-slate-400">
              Comparación del desempeño individual del personal evaluado.
            </p>

          </div>

          <div className="flex flex-wrap gap-2">

            {/* PROMEDIO */}

            <Tooltip
              title="Promedio del ranking"
              text="Promedio de eficiencia de los trabajadores que aparecen actualmente en el ranking. Se transforma de decimal a porcentaje para su visualización."
              width="w-80"
            >
              <div className="cursor-help rounded-lg bg-slate-50 px-3 py-2">

                <span className="text-[9px] font-bold uppercase text-slate-400">
                  Promedio del ranking
                </span>

                <p className="text-xs font-bold text-slate-700">
                  {formatearPorcentaje(
                    estadisticasRanking.promedioEficiencia
                  )}
                </p>

              </div>
            </Tooltip>

            {/* LECTURAS */}

            <Tooltip
              title="Lecturas del Top"
              text="Suma de las lecturas realizadas por todos los trabajadores que aparecen en la tabla."
              width="w-72"
            >
              <div className="cursor-help rounded-lg bg-slate-50 px-3 py-2">

                <span className="text-[9px] font-bold uppercase text-slate-400">
                  Lecturas del Top
                </span>

                <p className="text-xs font-bold text-slate-700">
                  {formatearNumero(
                    estadisticasRanking.totalLecturas
                  )}
                </p>

              </div>
            </Tooltip>

            {/* TIEMPO */}

            <Tooltip
              title="Tiempo acumulado"
              text="Suma del tiempo total registrado para los trabajadores que aparecen en el ranking."
              width="w-72"
            >
              <div className="cursor-help rounded-lg bg-slate-50 px-3 py-2">

                <span className="text-[9px] font-bold uppercase text-slate-400">
                  Tiempo acumulado
                </span>

                <p className="text-xs font-bold text-slate-700">
                  {formatearDuracion(
                    estadisticasRanking.duracionTotal
                  )}
                </p>

              </div>
            </Tooltip>

          </div>
        </div>

        {/* ====================================================
            MEJOR / MENOR
        ===================================================== */}

        {ranking.length > 0 && (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">

            {/* MEJOR */}

            <Tooltip
              title="Mayor eficiencia del ranking"
              text="Trabajador con la eficiencia más alta dentro de los registros recibidos del API."
              width="w-80"
            >
              <div className="cursor-help rounded-xl border border-emerald-100 bg-emerald-50 p-4">

                <div className="flex items-center gap-2">

                  <Medal
                    size={17}
                    className="text-emerald-600"
                  />

                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    Mayor eficiencia del ranking
                  </p>

                </div>

                <div className="mt-2 flex items-end justify-between gap-3">

                  <div>

                    <p className="text-sm font-bold text-slate-800">
                      {estadisticasRanking.mejor?.nombre_trabajador ||
                        "-"}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-500">
                      Código:{" "}
                      {estadisticasRanking.mejor?.ccodprs ||
                        "Sin código"}
                    </p>

                  </div>

                  <p className="text-xl font-extrabold text-emerald-700">
                    {formatearPorcentaje(
                      estadisticasRanking.mejor?.eficiencia
                    )}
                  </p>

                </div>

              </div>
            </Tooltip>

            {/* MENOR */}

            <Tooltip
              title="Menor eficiencia del ranking"
              text="Trabajador con la eficiencia más baja dentro de los registros recibidos del API."
              width="w-80"
            >
              <div className="cursor-help rounded-xl border border-amber-100 bg-amber-50 p-4">

                <div className="flex items-center gap-2">

                  <AlertCircle
                    size={17}
                    className="text-amber-600"
                  />

                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    Menor eficiencia del ranking
                  </p>

                </div>

                <div className="mt-2 flex items-end justify-between gap-3">

                  <div>

                    <p className="text-sm font-bold text-slate-800">
                      {estadisticasRanking.menor?.nombre_trabajador ||
                        "-"}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-500">
                      Código:{" "}
                      {estadisticasRanking.menor?.ccodprs ||
                        "Sin código"}
                    </p>

                  </div>

                  <p className="text-xl font-extrabold text-amber-700">
                    {formatearPorcentaje(
                      estadisticasRanking.menor?.eficiencia
                    )}
                  </p>

                </div>

              </div>
            </Tooltip>

          </div>
        )}

        {/* ====================================================
            TABLA
        ===================================================== */}

        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">

          {ranking.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400">

              <Users size={28} />

              <p className="mt-2 text-xs font-medium">
                No existen trabajadores para los filtros seleccionados.
              </p>

            </div>
          ) : (
            <table className="w-full min-w-[1100px] border-collapse text-xs">

              <thead className="bg-slate-50">

                <tr className="border-b border-slate-200">

                  <th className="p-3 text-center text-[10px] font-bold uppercase text-slate-500">
                    #
                  </th>

                  <th className="p-3 text-left text-[10px] font-bold uppercase text-slate-500">
                    <Tooltip
                      title="Trabajador"
                      text="Nombre y código del trabajador evaluado."
                      width="w-72"
                    >
                      <span className="cursor-help">
                        Trabajador
                      </span>
                    </Tooltip>
                  </th>

                  <th className="p-3 text-left text-[10px] font-bold uppercase text-slate-500">
                    <Tooltip
                      title="Eficiencia"
                      text="El API entrega la eficiencia como decimal. Por ejemplo, 0.99 equivale a 99%. La barra convierte ese valor a porcentaje únicamente para visualizarlo correctamente."
                      width="w-80"
                    >
                      <span className="cursor-help">
                        Eficiencia
                      </span>
                    </Tooltip>
                  </th>

                  <th className="p-3 text-right text-[10px] font-bold uppercase text-slate-500">
                    <Tooltip
                      title="Lecturas"
                      text="Cantidad de lecturas que el trabajador completó durante el periodo."
                      width="w-72"
                    >
                      <span className="cursor-help">
                        Lecturas
                      </span>
                    </Tooltip>
                  </th>

                  <th className="p-3 text-right text-[10px] font-bold uppercase text-slate-500">
                    <Tooltip
                      title="Duración total"
                      text="Tiempo total registrado para completar las lecturas del trabajador. El API entrega este valor en minutos."
                      width="w-80"
                    >
                      <span className="cursor-help">
                        Duración total
                      </span>
                    </Tooltip>
                  </th>

                  <th className="p-3 text-right text-[10px] font-bold uppercase text-slate-500">
                    <Tooltip
                      title="Promedio / lectura"
                      text="Cálculo visual realizado en el frontend: duración total en minutos dividida entre las lecturas realizadas."
                      width="w-80"
                    >
                      <span className="cursor-help">
                        Promedio / lectura
                      </span>
                    </Tooltip>
                  </th>
  
              </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {ranking.map(
                  (persona, index) => {

                    // ========================================
                    // DATOS DEL API
                    // ========================================

                    const eficiencia =
                      normalizarEficiencia(
                        persona.eficiencia
                      );

                    const lecturas =
                      Number(
                        persona.lecturas_realizadas
                      ) || 0;

                    const duracion =
                      Number(
                        persona.duracion_total_min
                      ) || 0;

                    // ========================================
                    // CÁLCULO VISUAL
                    //
                    // 178.8 / 472 = 0.3788 min
                    // aproximadamente 22.7 segundos.
                    // ========================================

                    const promedio =
                      lecturas > 0
                        ? duracion /
                          lecturas
                        : 0;

                    const esPrimero =
                      index === 0;

                    // ========================================
                    // COLOR DE EFICIENCIA
                    // ========================================

                    const claseEficiencia =
                      eficiencia >= 90
                        ? "text-emerald-600"
                        : eficiencia >= 75
                        ? "text-amber-600"
                        : "text-rose-600";

                    return (
                      <tr
                        key={`${persona.ccodprs || "persona"}-${index}`}
                        className="group transition hover:bg-slate-50"
                      >

                        {/* POSICIÓN */}

                        <td className="p-3 text-center">

                          {esPrimero ? (
                            <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                              <Trophy size={14} />
                            </div>
                          ) : (
                            <span className="font-bold text-slate-400">
                              {index + 1}
                            </span>
                          )}

                        </td>

                        {/* TRABAJADOR */}

                        <td className="p-3">

                          <div>

                            <p className="font-bold text-slate-800">
                              {persona.nombre_trabajador ||
                                "-"}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400">
                              Código:{" "}
                              {persona.ccodprs ||
                                "-"}
                            </p>

                          </div>

                        </td>

                        {/* EFICIENCIA */}

                        <td className="p-3">

                          <div className="min-w-[170px]">

                            <div className="mb-1.5 flex items-center justify-between">

                              <span
                                className={`font-extrabold ${claseEficiencia}`}
                              >
                                {formatearPorcentaje(
                                  persona.eficiencia
                                )}
                              </span>

                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                              <div
                                className={`h-full rounded-full transition-all ${
                                  eficiencia >= 90
                                    ? "bg-emerald-500"
                                    : eficiencia >= 75
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    Math.max(
                                      eficiencia,
                                      0
                                    ),
                                    100
                                  )}%`,
                                }}
                              />

                            </div>

                          </div>

                        </td>

                        {/* LECTURAS */}

                        <td className="p-3 text-right">

                          <span className="font-bold text-slate-700">
                            {formatearNumero(
                              lecturas
                            )}
                          </span>

                        </td>

                        {/* DURACIÓN */}

                        <td className="p-3 text-right">

                          <span className="font-semibold text-slate-700">
                            {formatearDuracion(
                              duracion
                            )}
                          </span>

                          <div className="mt-0.5 text-[9px] text-slate-400">
                            {formatearDecimal(
                              duracion,
                              1
                            )}{" "}
                            min
                          </div>

                        </td>

                        {/* PROMEDIO */}

                        <td className="p-3 text-right">

                          <span className="font-semibold text-slate-700">
                            {formatearDecimal(
                              promedio,
                              2
                            )}{" "}
                            min
                          </span>

                          <div className="mt-0.5 text-[9px] text-slate-400">
                            tiempo / lectura
                          </div>

                        </td>


                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>
          )}

        </div>

      </section>

      {/* ======================================================
          RIESGO OPERATIVO
      ======================================================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <AlertTriangle
                size={18}
                className="text-rose-500"
              />

              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                Riesgo operativo
              </h2>

              <InfoTooltip
                title="Riesgo operativo"
                text="Las alertas son generadas por el endpoint de riesgo operativo. El sistema muestra el total, distribución por nivel y detalle de cada alerta."
              />

            </div>

            <p className="mt-1 text-[11px] text-slate-400">
              Situaciones detectadas que pueden requerir seguimiento.
            </p>

          </div>

          {/* TOTAL */}

          <Tooltip
            title="Total de alertas"
            text="Cantidad total de alertas de riesgo operativo detectadas durante el periodo."
            width="w-72"
          >
            <div className="flex cursor-help items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5">

              <AlertCircle
                size={17}
                className="text-rose-600"
              />

              <div>

                <p className="text-[9px] font-bold uppercase text-rose-500">
                  Total de alertas
                </p>

                <p className="text-lg font-extrabold text-rose-700">
                  {formatearNumero(
                    estadisticasAlertas.total
                  )}
                </p>

              </div>

            </div>
          </Tooltip>

        </div>

        {/* ====================================================
            DISTRIBUCIÓN
        ===================================================== */}

        <div className="mt-5">

          <div className="mb-3 flex items-center gap-2">

            <BarChart3
              size={15}
              className="text-[#006cb7]"
            />

            <p className="text-xs font-bold uppercase tracking-wide text-slate-700">
              Distribución por nivel
            </p>

            <InfoTooltip
              title="Distribución por nivel"
              text="Agrupación de las alertas recibidas desde el API según el nivel de severidad registrado."
            />

          </div>

          {Object.keys(
            estadisticasAlertas.niveles
          ).length === 0 ? (

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">

              <CheckCircle2
                size={22}
                className="mx-auto text-emerald-500"
              />

              <p className="mt-2 text-xs font-semibold text-slate-600">
                No hay niveles de alerta disponibles.
              </p>

            </div>

          ) : (

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

              {Object.entries(
                estadisticasAlertas.niveles
              ).map(
                ([nivel, cantidad]) => {

                  const config =
                    obtenerConfiguracionNivel(
                      nivel
                    );

                  const Icon =
                    config.icon;

                  return (
                    <div
                      key={nivel}
                      className={`rounded-xl border p-4 ${config.bg} ${config.border}`}
                    >

                      <div className="flex items-center justify-between">

                        <span
                          className={`text-[10px] font-bold uppercase ${config.text}`}
                        >
                          {config.label}
                        </span>

                        <Icon
                          size={15}
                          className={
                            config.text
                          }
                        />

                      </div>

                      <p
                        className={`mt-2 text-2xl font-extrabold ${config.text}`}
                      >
                        {cantidad}
                      </p>

                      <p className="mt-1 text-[9px] text-slate-500">
                        alertas registradas
                      </p>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>

        {/* ====================================================
            TABLA ALERTAS
        ===================================================== */}

        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">

          {Array.isArray(
            riesgo?.detalle_alertas
          ) &&
          riesgo.detalle_alertas.length >
            0 ? (

            <table className="w-full min-w-[950px] border-collapse text-xs">

              <thead className="bg-slate-50">

                <tr className="border-b border-slate-200">

                  <th className="p-3 text-left text-[10px] font-bold uppercase text-slate-500">
                    Alerta
                  </th>

                  <th className="p-3 text-left text-[10px] font-bold uppercase text-slate-500">
                    Fecha
                  </th>

                  <th className="p-3 text-left text-[10px] font-bold uppercase text-slate-500">
                    Nivel
                  </th>

                  <th className="p-3 text-left text-[10px] font-bold uppercase text-slate-500">
                    KPI
                  </th>

                  <th className="p-3 text-left text-[10px] font-bold uppercase text-slate-500">
                    Motivo
                  </th>

                  <th className="p-3 text-left text-[10px] font-bold uppercase text-slate-500">
                    Estado
                  </th>

                  <th className="p-3 text-left text-[10px] font-bold uppercase text-slate-500">
                    Trabajador
                  </th>

                  <th className="p-3 text-center text-[10px] font-bold uppercase text-slate-500">
                    Detalle
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {riesgo.detalle_alertas.map(
                  (alerta, index) => (

                    <tr
                      key={
                        alerta.alerta_id ||
                        `alerta-${index}`
                      }
                      className="group transition hover:bg-slate-50"
                    >

                      {/* ID */}

                      <td className="p-3">

                        <span className="font-bold text-[#006cb7]">
                          {alerta.alerta_id ||
                            "-"}
                        </span>

                      </td>

                      {/* FECHA */}

                      <td className="p-3">

                        <span className="whitespace-nowrap text-slate-600">
                          {formatearFecha(
                            alerta.fecha
                          )}
                        </span>

                      </td>

                      {/* NIVEL */}

                      <td className="p-3">

                        <NivelBadge
                          nivel={
                            alerta.nivel
                          }
                        />

                      </td>

                      {/* KPI */}

                      <td className="p-3">

                        <span className="font-semibold text-slate-700">
                          {alerta.kpi ||
                            "-"}
                        </span>

                      </td>

                      {/* MOTIVO */}

                      <td className="max-w-[300px] p-3">

                        <div
                          title={
                            alerta.motivo ||
                            "Sin motivo"
                          }
                          className="truncate text-slate-600"
                        >
                          {alerta.motivo ||
                            "Sin motivo"}
                        </div>

                      </td>

                      {/* ESTADO */}

                      <td className="p-3">

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                          {alerta.estado ||
                            "-"}
                        </span>

                      </td>

                      {/* TRABAJADOR */}

                      <td className="p-3">

                        <span className="font-medium text-slate-600">
                          {alerta.ccodprs ||
                            "-"}
                        </span>

                      </td>

                      {/* DETALLE */}

                      <td className="p-3 text-center">

                        <button
                          type="button"
                          onClick={() =>
                            setAlertaSeleccionada(
                              alerta
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-bold text-[#006cb7] transition hover:bg-blue-100"
                        >

                          <Eye size={13} />

                          Ver detalle

                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          ) : (

            <div className="flex flex-col items-center justify-center py-14 text-slate-400">

              <CheckCircle2
                size={30}
                className="text-emerald-500"
              />

              <p className="mt-2 text-xs font-semibold text-slate-600">
                No se encontraron alertas operativas.
              </p>

              <p className="mt-1 max-w-md text-center text-[10px] leading-4 text-slate-400">
                Para el periodo seleccionado,
                el endpoint no proporcionó
                alertas en detalle_alertas.
              </p>

            </div>

          )}

        </div>

      </section>

      {/* ======================================================
          PIE INFORMATIVO
      ======================================================= */}

      <div className="rounded-xl border border-slate-200 bg-white p-4">

        <div className="flex items-start gap-3">

          <Info
            size={17}
            className="mt-0.5 shrink-0 text-[#006cb7]"
          />

          <div>

            <p className="text-xs font-bold text-slate-700">
              ¿Cómo interpretar este panel?
            </p>

            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              El resumen ejecutivo permite conocer
              el volumen de lecturas, eficiencia,
              registros analizados y lectores
              evaluados. El ranking permite comparar
              el desempeño individual utilizando los
              valores proporcionados por el API.
              La eficiencia se presenta como porcentaje,
              convirtiendo valores como 0.99 en 99%.
              Finalmente, el módulo de riesgo operativo
              permite identificar y revisar las alertas
              detectadas durante el periodo.
            </p>

          </div>

        </div>

      </div>

      {/* ======================================================
          MODAL
      ======================================================= */}

      <ModalAlerta
        alerta={alertaSeleccionada}
        onClose={() =>
          setAlertaSeleccionada(null)
        }
      />

    </div>
  );
}
