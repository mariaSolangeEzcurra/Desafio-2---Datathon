import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Eye,
  FileWarning,
  Info,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import {
  obtenerKpisCortes,
  obtenerDesgloseCortes,
  obtenerImpedimentosCortes,
} from "../../services/gerenciaService";

// =====================================================
// TOOLTIP GLOBAL (renderizado en un portal)
//
// Mismo componente usado en los otros módulos de este proyecto:
// se dibuja con un React Portal directo sobre <body>, con posición
// "fixed" calculada desde la posición real del elemento en pantalla
// (getBoundingClientRect). Así nunca se corta por el overflow de
// ningún contenedor padre, y se ajusta solo si conviene mostrarse
// arriba o abajo de lo que se está señalando.
// =====================================================
function Tooltip({ children, title, text, width = "w-80" }) {
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
      espacioArriba > 170 || espacioArriba > espacioAbajo ? "top" : "bottom";

    let left = rect.left + rect.width / 2;
    const margen = 150;
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
    hideTimer.current = setTimeout(() => setVisible(false), 60);
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
                coords.placement === "top" ? "-100%" : "0"
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
    </span>
  );
}

// =====================================================
// CORTES - GERENCIA
// =====================================================
export default function CortesGerencia() {
  // ===================================================
  // FECHAS
  // ===================================================
  const hoy = new Date().toISOString().split("T")[0];
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  // ===================================================
  // ESTADOS
  // ===================================================
  const [kpis, setKpis] = useState(null);
  const [desglose, setDesglose] = useState(null);
  const [impedimentos, setImpedimentos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [impedimentoSeleccionado, setImpedimentoSeleccionado] =
    useState(null);
  const [modalKpi, setModalKpi] = useState(null);
  const [mostrarTodosDistritos, setMostrarTodosDistritos] =
    useState(false);
  const [mostrarTodosProgramas, setMostrarTodosProgramas] =
    useState(false);
  // ===================================================
  // CARGAR INFORMACIÓN
  // ===================================================
  const cargarDatos = async () => {
    if (!fechaInicio) {
      setError("Debes seleccionar una fecha de inicio.");
      return;
    }
    if (fechaFin && fechaFin < fechaInicio) {
      setError(
        "La fecha final no puede ser anterior a la fecha de inicio."
      );
      return;
    }
    try {
      setLoading(true);
      setError("");
      const parametros = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin || null,
      };
      const [respuestaKpis, respuestaDesglose, respuestaImpedimentos] =
        await Promise.all([
          obtenerKpisCortes(parametros),
          obtenerDesgloseCortes(parametros),
          obtenerImpedimentosCortes(parametros),
        ]);
      setKpis(respuestaKpis);
      setDesglose(respuestaDesglose);
      setImpedimentos(respuestaImpedimentos);
    } catch (err) {
      console.error("Error cargando información de cortes:", err);
      if (err.response?.status === 422) {
        setError(
          "Los parámetros enviados no son válidos. Revisa las fechas seleccionadas."
        );
      } else if (err.response?.status === 404) {
        setError(
          "No se encontró alguno de los servicios de Gerencia de Cortes."
        );
      } else {
        setError(
          "No se pudo cargar la información de cortes. Verifica que el backend esté funcionando."
        );
      }
    } finally {
      setLoading(false);
    }
  };
  // ===================================================
  // CARGA AUTOMÁTICA
  //
  // Se ejecuta al montar el componente (carga inicial) y cada vez
  // que cambia la fecha de inicio o la fecha fin, sin depender de
  // que el usuario presione un botón.
  // ===================================================
  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin]);
  // ===================================================
  // DATOS
  // ===================================================
  const datosKpi = kpis?.kpis_globales || {};
  const distritos = desglose?.desglose?.por_distrito || [];
  const programas = desglose?.desglose?.por_tipo_programa || [];
  const listaImpedimentos =
    impedimentos?.detalle_impedimentos || [];
  // ===================================================
  // VALORES KPIs
  // ===================================================
  const totalOrdenes = Number(datosKpi.total_ordenes || 0);
  const ejecutadas = Number(datosKpi.ordenes_ejecutadas || 0);
  const pendientes = Number(datosKpi.ordenes_pendientes || 0);
  const efectividad = Number(
    datosKpi.tasa_efectividad_porcentaje || 0
  );
  const deudaTotal = Number(
    datosKpi.monto_total_deuda || 0
  );
  const deudaRecuperada = Number(
    datosKpi.monto_deuda_recuperada || 0
  );
  const deudaRiesgo = Number(
    datosKpi.monto_deuda_en_riesgo || 0
  );
  // ===================================================
  // PORCENTAJES CALCULADOS
  // ===================================================
  const porcentajePendientes =
    totalOrdenes > 0
      ? (pendientes / totalOrdenes) * 100
      : 0;
  const porcentajeEjecutadas =
    totalOrdenes > 0
      ? (ejecutadas / totalOrdenes) * 100
      : 0;
  const porcentajeRecuperado =
    deudaTotal > 0
      ? (deudaRecuperada / deudaTotal) * 100
      : 0;
  const porcentajeRiesgo =
    deudaTotal > 0
      ? (deudaRiesgo / deudaTotal) * 100
      : 0;
  // ===================================================
  // FORMATEADORES
  // ===================================================
  const formatoNumero = (valor) =>
    Number(valor || 0).toLocaleString("en-US");
  const formatoDinero = (valor) =>
    `$${Number(valor || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const formatoPorcentaje = (valor) =>
    `${Number(valor || 0).toFixed(1)}%`;
  // ===================================================
  // RANKING DISTRITOS
  // ===================================================
  const distritosOrdenadosDeuda = useMemo(() => {
    return [...distritos].sort(
      (a, b) =>
        Number(b.deuda_total || 0) -
        Number(a.deuda_total || 0)
    );
  }, [distritos]);
  const distritosOrdenadosOrdenes = useMemo(() => {
    return [...distritos].sort(
      (a, b) =>
        Number(b.total_ordenes || 0) -
        Number(a.total_ordenes || 0)
    );
  }, [distritos]);
  const distritosVisibles = mostrarTodosDistritos
    ? distritosOrdenadosDeuda
    : distritosOrdenadosDeuda.slice(0, 8);
  const programasVisibles = mostrarTodosProgramas
    ? programas
    : programas.slice(0, 8);
  // ===================================================
  // TOOLTIP / EXPLICACIÓN
  // ===================================================
  const abrirExplicacion = (tipo) => {
    setModalKpi(tipo);
  };
  // ===================================================
  // COMPONENTE KPI
  // ===================================================
  const KpiCard = ({
    titulo,
    valor,
    subtitulo,
    icono,
    fondo,
    color,
    explicacion,
    detalle,
  }) => (
    <Tooltip title={titulo} text={explicacion} width="w-80">
      <button
        type="button"
        onClick={() =>
          abrirExplicacion({
            titulo,
            valor,
            explicacion,
            detalle,
          })
        }
        className="group relative w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${fondo} ${color}`}
          >
            {icono}
          </div>
          <div className="rounded-lg bg-slate-50 px-2 py-1 text-[9px] font-bold text-slate-400 transition group-hover:bg-blue-50 group-hover:text-[#006cb7]">
            VER DETALLE
          </div>
        </div>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {titulo}
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-800">
          {valor}
        </p>
        {subtitulo && (
          <p className="mt-1 text-[10px] text-slate-400">
            {subtitulo}
          </p>
        )}
      </button>
    </Tooltip>
  );
  // ===================================================
  // RENDER
  // ===================================================
  return (
    <div className="space-y-6 text-left">
      <div className="mx-auto max-w-7xl space-y-6">
      
        {/* =================================================
            FILTROS
        ================================================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Fecha inicio
              </label>
              <div className="relative">
                <CalendarDays
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7]"
                />
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) =>
                    setFechaInicio(e.target.value)
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs text-slate-700 outline-none transition focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Fecha fin
              </label>
              <div className="relative">
                <CalendarDays
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7]"
                />
                <input
                  type="date"
                  value={fechaFin}
                  min={fechaInicio || undefined}
                  onChange={(e) =>
                    setFechaFin(e.target.value)
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs text-slate-700 outline-none transition focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </div>
        {/* =================================================
            ERROR
        ================================================= */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />
            <div>
              <p className="text-xs font-bold">
                No se pudo cargar la información
              </p>
              <p className="mt-1 text-xs">
                {error}
              </p>
            </div>
          </div>
        )}
        {/* =================================================
            KPIs EJECUTIVOS
        ================================================= */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2 text-[#006cb7]">
              <BarChart3 size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                Resumen ejecutivo financiero y cobrabilidad
              </h2>
              <p className="mt-1 text-[10px] text-slate-400">
                Indicadores principales obtenidos de /cortes/kpis
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              titulo="Total de órdenes"
              valor={formatoNumero(totalOrdenes)}
              subtitulo="Órdenes registradas en el periodo"
              icono={<ClipboardList size={21} />}
              fondo="bg-blue-50"
              color="text-[#006cb7]"
              explicacion="Cantidad total de órdenes de corte generadas y registradas en el sistema dentro del rango de fechas seleccionado, sin distinguir si ya fueron ejecutadas o no."
              detalle="Es la base sobre la que se calculan los porcentajes de ejecución, pendientes y efectividad."
            />
            <KpiCard
              titulo="Órdenes ejecutadas"
              valor={formatoNumero(ejecutadas)}
              subtitulo={`${formatoPorcentaje(
                porcentajeEjecutadas
              )} del total`}
              icono={<CheckCircle2 size={21} />}
              fondo="bg-emerald-50"
              color="text-emerald-600"
              explicacion="Cantidad de órdenes de corte que ya fueron completadas por el personal de campo dentro del periodo seleccionado. El porcentaje se calcula dividiendo las órdenes ejecutadas entre el total de órdenes."
              detalle="Una mayor cantidad de órdenes ejecutadas indica mayor avance operativo sobre lo programado."
            />
            <KpiCard
              titulo="Órdenes pendientes"
              valor={formatoNumero(pendientes)}
              subtitulo={`${formatoPorcentaje(
                porcentajePendientes
              )} del total`}
              icono={<Clock3 size={21} />}
              fondo="bg-amber-50"
              color="text-amber-600"
              explicacion="Cantidad de órdenes de corte que todavía no han sido ejecutadas dentro del periodo analizado. El porcentaje se calcula dividiendo las órdenes pendientes entre el total de órdenes."
              detalle="Un número alto de pendientes puede indicar acumulación de trabajo o falta de capacidad operativa en campo."
            />
            <KpiCard
              titulo="Tasa de efectividad"
              valor={formatoPorcentaje(efectividad)}
              subtitulo="Efectividad de ejecución"
              icono={<Target size={21} />}
              fondo="bg-violet-50"
              color="text-violet-600"
              explicacion="Porcentaje que indica qué proporción de las órdenes del periodo fueron efectivamente ejecutadas. Este valor lo calcula directamente el backend a partir de las órdenes ejecutadas sobre el total de órdenes."
              detalle="Sirve para comparar rápidamente el desempeño operativo entre distintos periodos."
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <KpiCard
              titulo="Deuda total"
              valor={formatoDinero(deudaTotal)}
              subtitulo="Monto total asociado"
              icono={<CircleDollarSign size={21} />}
              fondo="bg-slate-100"
              color="text-slate-700"
              explicacion="Suma del monto de deuda asociado a todas las órdenes de corte consideradas durante el periodo seleccionado, sin importar si ya fue recuperada o si está en riesgo."
              detalle="Es la referencia financiera principal: la deuda recuperada y la deuda en riesgo se calculan como porcentaje de este monto."
            />
            <KpiCard
              titulo="Deuda recuperada"
              valor={formatoDinero(deudaRecuperada)}
              subtitulo={`${formatoPorcentaje(
                porcentajeRecuperado
              )} de la deuda total`}
              icono={<TrendingUp size={21} />}
              fondo="bg-emerald-50"
              color="text-emerald-600"
              explicacion="Monto de deuda que el sistema identifica como cobrado o recuperado a raíz de las órdenes de corte ejecutadas en el periodo. El porcentaje mostrado se calcula dividiendo este monto entre la deuda total."
              detalle="Un porcentaje alto refleja que las órdenes ejecutadas están generando recuperación efectiva del dinero adeudado."
            />
            <KpiCard
              titulo="Deuda en riesgo"
              valor={formatoDinero(deudaRiesgo)}
              subtitulo={`${formatoPorcentaje(
                porcentajeRiesgo
              )} de la deuda total`}
              icono={<TrendingDown size={21} />}
              fondo="bg-red-50"
              color="text-red-600"
              explicacion="Monto de deuda que el sistema identifica como en riesgo de no recuperarse, generalmente asociado a órdenes pendientes o con impedimentos de ejecución. El porcentaje se calcula dividiendo este monto entre la deuda total."
              detalle="Un valor elevado requiere atención prioritaria porque representa mayor exposición financiera para la empresa."
            />
          </div>
        </section>
        {/* =================================================
            BARRA FINANCIERA
        ================================================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-700">
                Distribución de la deuda
              </h3>
              <p className="mt-1 text-[10px] text-slate-400">
                Relación entre deuda recuperada, deuda en riesgo y deuda total.
              </p>
            </div>
            <Tooltip
              title="Distribución de la deuda"
              text="La barra representa qué porcentaje de la deuda total ya fue recuperado. El espacio restante corresponde a deuda que aún no se ha cobrado, incluyendo la parte identificada como en riesgo."
              width="w-80"
            >
              <span className="cursor-help">
                <CircleDollarSign size={19} className="text-[#006cb7]" />
              </span>
            </Tooltip>
          </div>
          <div className="h-5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-l-full bg-emerald-500 transition-all"
              style={{
                width: `${Math.min(
                  porcentajeRecuperado,
                  100
                )}%`,
              }}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Tooltip
              title="Deuda total"
              text="Suma del monto de deuda de todas las órdenes de corte del periodo seleccionado."
              width="w-72"
            >
              <div className="rounded-xl bg-slate-50 p-3 cursor-help">
                <p className="text-[9px] font-bold uppercase text-slate-400">
                  Deuda total
                </p>
                <p className="mt-1 text-sm font-bold text-slate-700">
                  {formatoDinero(deudaTotal)}
                </p>
              </div>
            </Tooltip>
            <Tooltip
              title="Deuda recuperada"
              text="Monto de deuda que ya se logró cobrar como resultado de las órdenes de corte ejecutadas."
              width="w-72"
            >
              <div className="rounded-xl bg-emerald-50 p-3 cursor-help">
                <p className="text-[9px] font-bold uppercase text-emerald-600">
                  Recuperada
                </p>
                <p className="mt-1 text-sm font-bold text-emerald-700">
                  {formatoDinero(deudaRecuperada)}
                </p>
              </div>
            </Tooltip>
            <Tooltip
              title="Deuda en riesgo"
              text="Monto de deuda que aún no se ha recuperado y que el sistema identifica con mayor probabilidad de no cobrarse."
              width="w-72"
            >
              <div className="rounded-xl bg-red-50 p-3 cursor-help">
                <p className="text-[9px] font-bold uppercase text-red-600">
                  En riesgo
                </p>
                <p className="mt-1 text-sm font-bold text-red-700">
                  {formatoDinero(deudaRiesgo)}
                </p>
              </div>
            </Tooltip>
          </div>
        </div>
        {/* =================================================
            DESGLOSE
        ================================================= */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <Building2 size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                Desglose operativo
              </h2>
              <p className="mt-1 text-[10px] text-slate-400">
                Distribución de órdenes y deuda por distrito y programa.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {/* =============================================
                DISTRITOS
            ============================================= */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-700">
                    Por distrito
                  </h3>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Ordenado de mayor a menor deuda.
                  </p>
                </div>
                <Building2
                  size={18}
                  className="text-[#006cb7]"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        <Tooltip
                          title="Distrito"
                          text="Distrito donde se ubican las conexiones asociadas a las órdenes de corte."
                          width="w-72"
                        >
                          <span className="cursor-help">Distrito</span>
                        </Tooltip>
                      </th>
                      <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        <Tooltip
                          title="Órdenes"
                          text="Cantidad total de órdenes de corte generadas en ese distrito durante el periodo seleccionado."
                          width="w-72"
                        >
                          <span className="cursor-help">Órdenes</span>
                        </Tooltip>
                      </th>
                      <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        <Tooltip
                          title="Ejecutadas"
                          text="Cantidad de órdenes de ese distrito que ya fueron completadas. El porcentaje entre paréntesis se calcula sobre el total de órdenes del distrito."
                          width="w-80"
                        >
                          <span className="cursor-help">Ejecutadas</span>
                        </Tooltip>
                      </th>
                      <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        <Tooltip
                          title="Pendientes"
                          text="Cantidad de órdenes de ese distrito que todavía no han sido ejecutadas."
                          width="w-72"
                        >
                          <span className="cursor-help">Pendientes</span>
                        </Tooltip>
                      </th>
                      <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        <Tooltip
                          title="Deuda"
                          text="Monto total de deuda asociado a las órdenes de corte de ese distrito."
                          width="w-72"
                        >
                          <span className="cursor-help">Deuda</span>
                        </Tooltip>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {distritosVisibles.map((item, index) => {
                      const ordenes = Number(
                        item.total_ordenes || 0
                      );
                      const ejecutadasDistrito = Number(
                        item.ejecutadas || 0
                      );
                      const pendientesDistrito = Number(
                        item.pendientes || 0
                      );
                      const deudaDistrito = Number(
                        item.deuda_total || 0
                      );
                      const efectividadDistrito =
                        ordenes > 0
                          ? (ejecutadasDistrito /
                              ordenes) *
                            100
                          : 0;
                      return (
                        <tr
                          key={`${item.distrito}-${index}`}
                          className="group border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-[9px] font-bold text-[#006cb7]">
                                {index + 1}
                              </span>
                              <span className="text-xs font-semibold text-slate-700">
                                {item.distrito || "Sin distrito"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-slate-700">
                            {formatoNumero(ordenes)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs font-bold text-emerald-600">
                              {formatoNumero(
                                ejecutadasDistrito
                              )}
                            </span>
                            <span className="ml-1 text-[9px] text-slate-400">
                              ({formatoPorcentaje(
                                efectividadDistrito
                              )})
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-amber-600">
                            {formatoNumero(
                              pendientesDistrito
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-slate-700">
                            {formatoDinero(deudaDistrito)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {distritos.length > 8 && (
                <button
                  type="button"
                  onClick={() =>
                    setMostrarTodosDistritos(
                      !mostrarTodosDistritos
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 border-t border-slate-100 py-3 text-[10px] font-bold text-[#006cb7] hover:bg-blue-50"
                >
                  {mostrarTodosDistritos ? (
                    <>
                      <ChevronUp size={14} />
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} />
                      Ver todos los distritos
                    </>
                  )}
                </button>
              )}
            </div>
            {/* =============================================
                PROGRAMAS
            ============================================= */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-700">
                    Por tipo de programa
                  </h3>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Distribución según el código de programa.
                  </p>
                </div>
                <ClipboardList
                  size={18}
                  className="text-indigo-600"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        <Tooltip
                          title="Programa"
                          text="Código del programa o tipo de corte al que pertenecen las órdenes (ctipprg)."
                          width="w-72"
                        >
                          <span className="cursor-help">Programa</span>
                        </Tooltip>
                      </th>
                      <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        <Tooltip
                          title="Órdenes"
                          text="Cantidad total de órdenes de corte generadas bajo ese programa durante el periodo seleccionado."
                          width="w-72"
                        >
                          <span className="cursor-help">Órdenes</span>
                        </Tooltip>
                      </th>
                      <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        <Tooltip
                          title="Ejecutadas"
                          text="Cantidad de órdenes de ese programa que ya fueron completadas. El porcentaje entre paréntesis se calcula sobre el total de órdenes del programa."
                          width="w-80"
                        >
                          <span className="cursor-help">Ejecutadas</span>
                        </Tooltip>
                      </th>
                      <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        <Tooltip
                          title="Pendientes"
                          text="Cantidad de órdenes de ese programa que todavía no han sido ejecutadas."
                          width="w-72"
                        >
                          <span className="cursor-help">Pendientes</span>
                        </Tooltip>
                      </th>
                      <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        <Tooltip
                          title="Deuda"
                          text="Monto total de deuda asociado a las órdenes de corte de ese programa."
                          width="w-72"
                        >
                          <span className="cursor-help">Deuda</span>
                        </Tooltip>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {programasVisibles.map((item, index) => {
                      const ordenes = Number(
                        item.total_ordenes || 0
                      );
                      const ejecutadasPrograma = Number(
                        item.ejecutadas || 0
                      );
                      const pendientesPrograma = Number(
                        item.pendientes || 0
                      );
                      const deudaPrograma = Number(
                        item.deuda_total || 0
                      );
                      const porcentajePrograma =
                        ordenes > 0
                          ? (ejecutadasPrograma /
                              ordenes) *
                            100
                          : 0;
                      return (
                        <tr
                          key={`${item.ctipprg}-${index}`}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-[9px] font-bold text-indigo-600">
                                {index + 1}
                              </span>
                              <span className="text-xs font-semibold text-slate-700">
                                {item.ctipprg || "Sin código"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-slate-700">
                            {formatoNumero(ordenes)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs font-bold text-emerald-600">
                              {formatoNumero(
                                ejecutadasPrograma
                              )}
                            </span>
                            <span className="ml-1 text-[9px] text-slate-400">
                              ({formatoPorcentaje(
                                porcentajePrograma
                              )})
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-amber-600">
                            {formatoNumero(
                              pendientesPrograma
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-slate-700">
                            {formatoDinero(deudaPrograma)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {programas.length > 8 && (
                <button
                  type="button"
                  onClick={() =>
                    setMostrarTodosProgramas(
                      !mostrarTodosProgramas
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 border-t border-slate-100 py-3 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50"
                >
                  {mostrarTodosProgramas ? (
                    <>
                      <ChevronUp size={14} />
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} />
                      Ver todos los programas
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </section>
        {/* =================================================
            RANKING DE DISTRITOS
        ================================================= */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* TOP DEUDA */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-700">
                  Distritos con mayor deuda
                </h3>
                <p className="mt-1 text-[10px] text-slate-400">
                  Identificación de zonas con mayor exposición financiera.
                </p>
              </div>
              <Tooltip
                title="Distritos con mayor deuda"
                text="Los 5 distritos con el mayor monto de deuda acumulada dentro del periodo seleccionado. El porcentaje debajo de cada barra representa qué proporción de la deuda total del periodo corresponde a ese distrito."
                width="w-80"
              >
                <span className="cursor-help">
                  <TrendingDown size={19} className="text-red-500" />
                </span>
              </Tooltip>
            </div>
            <div className="space-y-3">
              {distritosOrdenadosDeuda
                .slice(0, 5)
                .map((item, index) => {
                  const deuda = Number(
                    item.deuda_total || 0
                  );
                  const porcentaje =
                    deudaTotal > 0
                      ? (deuda / deudaTotal) * 100
                      : 0;
                  return (
                    <div
                      key={`${item.distrito}-deuda-${index}`}
                      className="group rounded-xl border border-slate-100 p-3 transition hover:border-red-100 hover:bg-red-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[10px] font-bold text-red-600">
                            {index + 1}
                          </span>
                          <span className="truncate text-xs font-semibold text-slate-700">
                            {item.distrito}
                          </span>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-red-600">
                          {formatoDinero(deuda)}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-red-500"
                          style={{
                            width: `${Math.min(
                              porcentaje,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-right text-[9px] text-slate-400">
                        {formatoPorcentaje(
                          porcentaje
                        )}{" "}
                        de la deuda total
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
          {/* TOP ORDENES */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-700">
                  Distritos con mayor carga operativa
                </h3>
                <p className="mt-1 text-[10px] text-slate-400">
                  Zonas con mayor cantidad de órdenes de corte.
                </p>
              </div>
              <Tooltip
                title="Distritos con mayor carga operativa"
                text="Los 5 distritos con la mayor cantidad de órdenes de corte generadas dentro del periodo seleccionado. El porcentaje debajo de cada barra representa qué proporción del total de órdenes corresponde a ese distrito."
                width="w-80"
              >
                <span className="cursor-help">
                  <Activity size={19} className="text-[#006cb7]" />
                </span>
              </Tooltip>
            </div>
            <div className="space-y-3">
              {distritosOrdenadosOrdenes
                .slice(0, 5)
                .map((item, index) => {
                  const ordenes = Number(
                    item.total_ordenes || 0
                  );
                  const porcentaje =
                    totalOrdenes > 0
                      ? (ordenes / totalOrdenes) * 100
                      : 0;
                  return (
                    <div
                      key={`${item.distrito}-ordenes-${index}`}
                      className="rounded-xl border border-slate-100 p-3 transition hover:border-blue-100 hover:bg-blue-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-bold text-[#006cb7]">
                            {index + 1}
                          </span>
                          <span className="truncate text-xs font-semibold text-slate-700">
                            {item.distrito}
                          </span>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-[#006cb7]">
                          {formatoNumero(ordenes)}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#006cb7]"
                          style={{
                            width: `${Math.min(
                              porcentaje,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-right text-[9px] text-slate-400">
                        {formatoPorcentaje(
                          porcentaje
                        )}{" "}
                        del total
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
        {/* =================================================
            IMPEDIMENTOS
        ================================================= */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-2 text-red-600">
              <ShieldAlert size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                Trabas e impedimentos operativos en campo
              </h2>
              <p className="mt-1 text-[10px] text-slate-400">
                Información obtenida de /cortes/impedimentos
              </p>
            </div>
          </div>
          {/* RESUMEN */}
          <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Tooltip
              title="Total impedimentos"
              text="Cantidad total de registros de impedimentos encontrados para el periodo. Un impedimento es cualquier situación en campo que evita que el lector o cortador complete la orden de corte."
              width="w-80"
            >
              <div className="rounded-2xl border border-red-100 bg-red-50 p-5 cursor-help">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white p-2.5 text-red-600">
                    <FileWarning size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-red-500">
                      Total impedimentos
                    </p>
                    <p className="mt-1 text-2xl font-bold text-red-700">
                      {formatoNumero(
                        impedimentos?.total_impedimentos || 0
                      )}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[10px] leading-5 text-red-600">
                  Cantidad total de registros de impedimentos encontrados para el periodo.
                </p>
              </div>
            </Tooltip>
            <Tooltip
              title="Deuda asociada"
              text="Suma de la deuda de las conexiones que presentaron un impedimento. Representa el monto que quedó sin poder cobrarse porque el corte no pudo ejecutarse."
              width="w-80"
            >
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 cursor-help">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white p-2.5 text-amber-600">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-amber-600">
                      Deuda asociada
                    </p>
                    <p className="mt-1 text-2xl font-bold text-amber-700">
                      {formatoDinero(
                        listaImpedimentos.reduce(
                          (total, item) =>
                            total +
                            Number(item.deuda || 0),
                          0
                        )
                      )}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[10px] leading-5 text-amber-600">
                  Suma de la deuda asociada a los registros de impedimentos disponibles.
                </p>
              </div>
            </Tooltip>
            <Tooltip
              title="Registros georreferenciados"
              text="Cantidad de impedimentos que cuentan con coordenadas de latitud y longitud registradas, y que por lo tanto pueden ubicarse en un mapa."
              width="w-80"
            >
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 cursor-help">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white p-2.5 text-[#006cb7]">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#006cb7]">
                      Registros georreferenciados
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#006cb7]">
                      {
                        listaImpedimentos.filter(
                          (item) =>
                            item.lat !== null &&
                            item.lng !== null &&
                            item.lat !== undefined &&
                            item.lng !== undefined
                        ).length
                      }
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[10px] leading-5 text-blue-600">
                  Registros que cuentan con coordenadas para análisis espacial.
                </p>
              </div>
            </Tooltip>
          </div>
          {/* TABLA */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h3 className="text-sm font-bold text-slate-700">
                  Detalle de impedimentos
                </h3>
                <p className="mt-1 text-[10px] text-slate-400">
                  Haz clic en "Ver detalle" para consultar toda la información.
                </p>
              </div>
              <FileWarning
                size={18}
                className="text-red-500"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      <Tooltip
                        title="Conexión"
                        text="Código único que identifica la conexión de agua asociada al impedimento."
                        width="w-72"
                      >
                        <span className="cursor-help">Conexión</span>
                      </Tooltip>
                    </th>
                    <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      <Tooltip
                        title="Distrito"
                        text="Distrito donde se ubica la conexión con impedimento."
                        width="w-72"
                      >
                        <span className="cursor-help">Distrito</span>
                      </Tooltip>
                    </th>
                    <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      <Tooltip
                        title="Situación"
                        text="Estado o situación registrada para la conexión al momento de intentar realizar el corte (csitreg)."
                        width="w-72"
                      >
                        <span className="cursor-help">Situación</span>
                      </Tooltip>
                    </th>
                    <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      <Tooltip
                        title="Causa"
                        text="Descripción del motivo específico por el cual no se pudo ejecutar el corte en esa conexión."
                        width="w-72"
                      >
                        <span className="cursor-help">Causa</span>
                      </Tooltip>
                    </th>
                    <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      <Tooltip
                        title="Deuda"
                        text="Monto de deuda de esa conexión que continúa pendiente de cobro debido al impedimento."
                        width="w-72"
                      >
                        <span className="cursor-help">Deuda</span>
                      </Tooltip>
                    </th>
                    <th className="px-4 py-3 text-center text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      Detalle
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {listaImpedimentos
                    .slice(0, 20)
                    .map((item, index) => (
                      <tr
                        key={`${item.ccodcnx}-${index}`}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold text-slate-700">
                            {item.ccodcnx || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold text-slate-600">
                            {item.distrito || "Sin distrito"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-lg bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-600">
                            {item.csitreg || "—"}
                          </span>
                        </td>
                        <td className="max-w-xs px-4 py-3">
                          <p className="truncate text-xs text-slate-600">
                            {item.cdesacc || "Sin descripción"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs font-bold text-red-600">
                            {formatoDinero(item.deuda)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setImpedimentoSeleccionado(
                                item
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[9px] font-bold text-[#006cb7] transition hover:bg-blue-100"
                          >
                            <Eye size={12} />
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {listaImpedimentos.length > 20 && (
              <div className="border-t border-slate-100 bg-slate-50 p-3 text-center text-[10px] text-slate-400">
                Mostrando los primeros 20 de{" "}
                <strong>
                  {formatoNumero(
                    listaImpedimentos.length
                  )}
                </strong>{" "}
                registros. El resto permanece disponible en la respuesta de la API.
              </div>
            )}
          </div>
        </section>
        {/* =================================================
            MODAL KPI
        ================================================= */}
        {modalKpi && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-2.5 text-[#006cb7]">
                    <AlertCircle size={19} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {modalKpi.titulo}
                    </h3>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Explicación del indicador
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalKpi(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={17} />
                </button>
              </div>
              <div className="p-5">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Valor actual
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">
                    {modalKpi.valor}
                  </p>
                </div>
                <div className="mt-5">
                  <h4 className="text-xs font-bold text-slate-700">
                    ¿Qué significa?
                  </h4>
                  <p className="mt-2 text-xs leading-6 text-slate-600">
                    {modalKpi.explicacion}
                  </p>
                </div>
                {modalKpi.detalle && (
                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#006cb7]">
                      ¿Cómo interpretarlo?
                    </p>
                    <p className="mt-2 text-xs leading-5 text-blue-700">
                      {modalKpi.detalle}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end border-t border-slate-100 bg-slate-50 p-4">
                <button
                  type="button"
                  onClick={() => setModalKpi(null)}
                  className="rounded-xl bg-[#006cb7] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#005a9c]"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
        {/* =================================================
            MODAL IMPEDIMENTO
        ================================================= */}
        {impedimentoSeleccionado && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              {/* CABECERA */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
                    <ShieldAlert size={19} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Detalle del impedimento
                    </h3>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Información operativa y financiera
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setImpedimentoSeleccionado(null)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={17} />
                </button>
              </div>
              <div className="space-y-5 p-5">
                {/* CONEXIÓN */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    Código de conexión
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-800">
                    {impedimentoSeleccionado.ccodcnx ||
                      "—"}
                  </p>
                </div>
                {/* GRID */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-[9px] font-bold uppercase text-slate-400">
                      Situación / estado
                    </p>
                    <p className="mt-2 text-sm font-bold text-amber-600">
                      {impedimentoSeleccionado.csitreg ||
                        "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                    <p className="text-[9px] font-bold uppercase text-red-500">
                      Deuda asociada
                    </p>
                    <p className="mt-2 text-lg font-bold text-red-700">
                      {formatoDinero(
                        impedimentoSeleccionado.deuda
                      )}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-[9px] font-bold uppercase text-slate-400">
                      Código de acceso
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-700">
                      {impedimentoSeleccionado.ccodacc ||
                        "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-[9px] font-bold uppercase text-slate-400">
                      Distrito
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-700">
                      {impedimentoSeleccionado.distrito ||
                        "—"}
                    </p>
                  </div>
                </div>
                {/* CAUSA */}
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      size={15}
                      className="text-amber-600"
                    />
                    <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                      Descripción del impedimento
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-amber-800">
                    {impedimentoSeleccionado.cdesacc ||
                      "No se proporcionó una descripción."}
                  </p>
                </div>
                {/* DIRECCIÓN */}
                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center gap-2">
                    <MapPin
                      size={15}
                      className="text-[#006cb7]"
                    />
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Dirección
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-700">
                    {impedimentoSeleccionado.direccion ||
                      "No registrada"}
                  </p>
                </div>
                {/* COORDENADAS */}
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-center gap-2">
                    <MapPin
                      size={15}
                      className="text-[#006cb7]"
                    />
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#006cb7]">
                      Geolocalización
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-[9px] text-slate-400">
                        Latitud
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-700">
                        {impedimentoSeleccionado.lat ??
                          "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-[9px] text-slate-400">
                        Longitud
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-700">
                        {impedimentoSeleccionado.lng ??
                          "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end border-t border-slate-100 bg-slate-50 p-4">
                <button
                  type="button"
                  onClick={() =>
                    setImpedimentoSeleccionado(null)
                  }
                  className="rounded-xl bg-[#006cb7] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#005a9c]"
                >
                  Cerrar detalle
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}