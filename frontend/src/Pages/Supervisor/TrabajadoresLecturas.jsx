import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  Eye,
  AlertTriangle,
  CheckCircle,
  X,
  Trophy,
  AlertCircle,
  RefreshCw,
  Calendar,
  Activity,
  Search,
  Loader2,
  Database,
  Phone,
  Gauge,
  Clock3,
  Info,
  Filter,
} from "lucide-react";
import {
  obtenerPersonal,
  obtenerFichaPersonal,
  calcularDesempeno,
} from "../../services/trabajadorService";
export default function TrabajadoresDesempeno() {
  // ============================================================
  // ESTADOS PRINCIPALES
  // ============================================================
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculando, setCalculando] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [resumen, setResumen] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  // ============================================================
  // FILTROS DE FECHA
  // ============================================================
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  // ============================================================
  // CARGA AUTOMÁTICA
  // ============================================================
  useEffect(() => {
    inicializarDatos();
  }, []);
  // ============================================================
  // INICIALIZAR DATOS
  //
  // 1. Calcula desempeño
  // 2. Obtiene información actualizada
  // ============================================================
  const inicializarDatos = async () => {
    try {
      setLoading(true);
      // Primero calculamos el desempeño
      await calcularDesempeno();
      // Después obtenemos los datos actualizados
      await cargarDatosInternos();
    } catch (error) {
      console.error(
        "Error inicializando datos de trabajadores:",
        error
      );
      setTrabajadores([]);
      setResumen(null);
    } finally {
      setLoading(false);
    }
  };
  // ============================================================
  // OBTENER PERSONAL
  // ============================================================
  const cargarDatosInternos = async () => {
    const data = await obtenerPersonal(0, 100);
    if (!Array.isArray(data) || data.length === 0) {
      setTrabajadores([]);
      setResumen(null);
      return;
    }
    // ==========================================================
    // PRIORIDAD DE CLASIFICACIÓN
    // ==========================================================
    const prioridad = {
      Crítico: 1,
      Regular: 2,
      Bueno: 3,
      Excelente: 4,
    };
    // ==========================================================
    // ORDENAR PERSONAL
    // ==========================================================
    const ordenados = [...data].sort((a, b) => {
      const pA =
        prioridad[a.ultima_clasificacion] || 99;
      const pB =
        prioridad[b.ultima_clasificacion] || 99;
      if (pA !== pB) {
        return pA - pB;
      }
      return (
        (a.ultimo_puntaje ?? 0) -
        (b.ultimo_puntaje ?? 0)
      );
    });
    setTrabajadores(ordenados);
    // ==========================================================
    // PERSONAL CON PUNTAJE
    // ==========================================================
    const conPuntaje = data.filter(
      (t) =>
        t.ultimo_puntaje !== null &&
        t.ultimo_puntaje !== undefined
    );
    // ==========================================================
    // MEJOR PUNTAJE
    // ==========================================================
    const mejorPuntaje =
      [...conPuntaje].sort(
        (a, b) =>
          (b.ultimo_puntaje ?? 0) -
          (a.ultimo_puntaje ?? 0)
      )[0];
    // ==========================================================
    // MENOR PUNTAJE
    // ==========================================================
    const menorPuntaje =
      [...conPuntaje].sort(
        (a, b) =>
          (a.ultimo_puntaje ?? 0) -
          (b.ultimo_puntaje ?? 0)
      )[0];
    // ==========================================================
    // RESUMEN
    // ==========================================================
    setResumen({
      total: data.length,
      criticos: data.filter(
        (t) =>
          t.ultima_clasificacion === "Crítico"
      ).length,
      regulares: data.filter(
        (t) =>
          t.ultima_clasificacion === "Regular"
      ).length,
      buenos: data.filter(
        (t) =>
          t.ultima_clasificacion === "Bueno"
      ).length,
      excelentes: data.filter(
        (t) =>
          t.ultima_clasificacion === "Excelente"
      ).length,
      mejorPuntaje,
      menorPuntaje,
    });
  };
  // ============================================================
  // RECALCULAR MANUALMENTE
  // ============================================================
  const handleEjecutarCalculo = async () => {
    try {
      setCalculando(true);
      await calcularDesempeno();
      await cargarDatosInternos();
    } catch (error) {
      console.error(
        "Error calculando desempeño:",
        error
      );
    } finally {
      setCalculando(false);
    }
  };
  // ============================================================
  // ABRIR FICHA
  // ============================================================
  const verDetalle = async (trabajador) => {
    const ccodprs =
      trabajador?.ccodprs ||
      trabajador?.codigo;
    if (!ccodprs) return;
    try {
      setLoadingDetalle(true);
      setMostrarDetalle(true);
      setDetalle(null);
      // Limpiar filtro de fechas al abrir una nueva ficha
      setFechaDesde("");
      setFechaHasta("");
      const fichaData =
        await obtenerFichaPersonal(ccodprs);
      setDetalle(fichaData);
    } catch (error) {
      console.error(
        "Error obteniendo ficha del trabajador:",
        error
      );
      setDetalle(null);
    } finally {
      setLoadingDetalle(false);
    }
  };
  // ============================================================
  // CERRAR FICHA
  // ============================================================
  const cerrarDetalle = () => {
    setMostrarDetalle(false);
    setDetalle(null);
    setFechaDesde("");
    setFechaHasta("");
  };
  // ============================================================
  // COLOR DE ESTADO
  // ============================================================
  const colorEstado = (estado) => {
    switch (estado) {
      case "Crítico":
        return "bg-red-50 text-red-700 border-red-200";
      case "Regular":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Bueno":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Excelente":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };
  // ============================================================
  // FORMATEAR EFICIENCIA
  // ============================================================
  const formatearEficiencia = (eficiencia) => {
    if (
      eficiencia === null ||
      eficiencia === undefined
    ) {
      return "--";
    }
    const numero = Number(eficiencia);
    if (Number.isNaN(numero)) {
      return "--";
    }
    const porcentaje =
      numero <= 1
        ? numero * 100
        : numero;
    return `${porcentaje.toFixed(0)}%`;
  };
  // ============================================================
  // FORMATEAR DURACIÓN
  // ============================================================
  const formatearDuracion = (minutos) => {
    if (
      minutos === null ||
      minutos === undefined
    ) {
      return "--";
    }
    const totalMinutos = Number(minutos);
    if (Number.isNaN(totalMinutos)) {
      return "--";
    }
    const horas =
      Math.floor(totalMinutos / 60);
    const mins =
      Math.round(totalMinutos % 60);
    if (horas > 0) {
      return `${horas} h ${mins} min`;
    }
    return `${mins} min`;
  };
  // NORMALIZAR FECHA
  const normalizarFecha = (fecha) => {
    if (!fecha) return "";
    return String(fecha).substring(0, 10);
  };
  // HISTORIAL FILTRADO POR FECHA
  const historialFiltrado =
    detalle?.historial_asistencia?.filter((h) => {
      const fechaRegistro =
        normalizarFecha(h.fecha);
      if (!fechaRegistro) {
        return false;
      }
      // Desde
      if (
        fechaDesde &&
        fechaRegistro < fechaDesde
      ) {
        return false;
      }
      // Hasta
      if (
        fechaHasta &&
        fechaRegistro > fechaHasta
      ) {
        return false;
      }
      return true;
    }) || [];
  // ============================================================
  // BUSCADOR DE PERSONAL
  // ============================================================
  const trabajadoresFiltrados =
    trabajadores.filter((t) => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();
      if (!texto) return true;
      return (
        String(t.ccodprs || "")
          .toLowerCase()
          .includes(texto) ||
        String(t.nombre || "")
          .toLowerCase()
          .includes(texto)
      );
    });

  // ============================================================
  // TOOLTIP PERSONALIZADO (vía portal, no se corta por overflow)
  //
  // En vez de posicionarse dentro del contenedor (que en las
  // tablas tiene overflow-auto y recorta el tooltip), este
  // tooltip calcula la posición en pantalla del elemento y se
  // "monta" directamente sobre document.body con position:fixed.
  // Así siempre se ve completo, sin importar dónde esté.
  // ============================================================
  const ANCHO_TOOLTIP = {
    "w-64": 256,
    "w-72": 288,
    "w-80": 320,
    "w-96": 384,
  };

  const Tooltip = ({
    children,
    title,
    text,
    width = "w-80",
  }) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({
      top: 0,
      left: 0,
      placement: "top",
    });
    const triggerRef = useRef(null);
    const anchoPx = ANCHO_TOOLTIP[width] || 320;

    // No renderizamos tooltip si no hay texto que mostrar:
    // evita "tarjetas vacías" al pasar el mouse.
    const tieneContenido =
      typeof text === "string" && text.trim().length > 0;

    const calcularPosicion = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const margen = 10;

      const espacioArriba = rect.top;
      const espacioAbajo = window.innerHeight - rect.bottom;
      const placement =
        espacioArriba > 170 || espacioArriba > espacioAbajo
          ? "top"
          : "bottom";

      let left = rect.left + rect.width / 2 - anchoPx / 2;
      if (left < margen) left = margen;
      if (left + anchoPx > window.innerWidth - margen) {
        left = window.innerWidth - anchoPx - margen;
      }

      const top =
        placement === "top"
          ? rect.top - 10
          : rect.bottom + 10;

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
      // Sin información que explicar: se muestra el contenido
      // normal, sin tooltip (para no dejar tooltips "en blanco").
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
                  coords.placement === "top"
                    ? "translateY(-100%)"
                    : "none",
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

  return (
    <div className="space-y-6 text-left">
      {/* ======================================================
          RESUMEN
      ======================================================= */}
      {resumen && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* TOTAL */}
            <Tooltip
              title="Personal registrado"
              text="Cantidad total de trabajadores que se encuentran registrados en el sistema y disponibles para su evaluación de desempeño."
              width="w-80"
            >
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm cursor-help">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Personal registrado
                    </p>
                    <p className="text-3xl font-bold text-slate-800 mt-2">
                      {resumen.total}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 text-[#006cb7] shrink-0">
                    <Users size={20} />
                  </div>
                </div>
              </div>
            </Tooltip>
            {/* CRÍTICOS */}
            <Tooltip
              title="Atención crítica"
              text="Número de trabajadores clasificados como Crítico, es decir, cuyo desempeño se encuentra muy por debajo de lo esperado y requiere seguimiento inmediato."
              width="w-80"
            >
              <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm cursor-help">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-red-500">
                      Atención crítica
                    </p>
                    <p className="text-3xl font-bold text-red-700 mt-2">
                      {resumen.criticos}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                </div>
              </div>
            </Tooltip>
            {/* REGULARES */}
            <Tooltip
              title="Desempeño regular"
              text="Número de trabajadores clasificados como Regular, con un desempeño aceptable pero con oportunidades claras de mejora."
              width="w-80"
            >
              <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm cursor-help">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">
                      Desempeño regular
                    </p>
                    <p className="text-3xl font-bold text-amber-700 mt-2">
                      {resumen.regulares}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                    <AlertCircle size={20} />
                  </div>
                </div>
              </div>
            </Tooltip>
            {/* BUENOS */}
            <Tooltip
              title="Buen desempeño"
              text="Suma de trabajadores clasificados como Bueno o Excelente, es decir, aquellos con un desempeño satisfactorio o sobresaliente."
              width="w-80"
            >
              <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm cursor-help">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                      Buen desempeño
                    </p>
                    <p className="text-3xl font-bold text-emerald-700 mt-2">
                      {resumen.buenos +
                        resumen.excelentes}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                    <CheckCircle size={20} />
                  </div>
                </div>
              </div>
            </Tooltip>
          </div>
          {/* ==================================================
              DESTACADOS
          =================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MEJOR */}
            {resumen.mejorPuntaje && (
              <Tooltip
                title="Mejor desempeño"
                text="Trabajador que presenta el puntaje de desempeño más alto entre los registros disponibles."
                width="w-80"
              >
                <button
                  onClick={() =>
                    verDetalle(
                      resumen.mejorPuntaje
                    )
                  }
                  className="
                    w-full
                    bg-white
                    border border-slate-200
                    rounded-2xl
                    p-5
                    shadow-sm
                    text-left
                    hover:border-emerald-300
                    hover:shadow-md
                    transition
                  "
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                        <Trophy size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Mejor desempeño
                        </p>
                        <p className="text-sm font-bold text-slate-700 mt-0.5 truncate">
                          {resumen.mejorPuntaje.nombre}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-emerald-600">
                        {resumen.mejorPuntaje.ultimo_puntaje ??
                          "--"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        puntos
                      </p>
                    </div>
                  </div>
                </button>
              </Tooltip>
            )}
            {/* MENOR */}
            {resumen.menorPuntaje && (
              <Tooltip
                title="Requiere atención"
                text="Trabajador que presenta el puntaje de desempeño más bajo entre los registros disponibles."
                width="w-80"
              >
                <button
                  onClick={() =>
                    verDetalle(
                      resumen.menorPuntaje
                    )
                  }
                  className="
                    w-full
                    bg-white
                    border border-slate-200
                    rounded-2xl
                    p-5
                    shadow-sm
                    text-left
                    hover:border-red-300
                    hover:shadow-md
                    transition
                  "
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-red-50 text-red-600 rounded-xl shrink-0">
                        <AlertCircle size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Requiere atención
                        </p>
                        <p className="text-sm font-bold text-slate-700 mt-0.5 truncate">
                          {resumen.menorPuntaje.nombre}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-red-600">
                        {resumen.menorPuntaje.ultimo_puntaje ??
                          "--"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        puntos
                      </p>
                    </div>
                  </div>
                </button>
              </Tooltip>
            )}
          </div>
        </>
      )}
      {/* ======================================================
          BUSCADOR
      ======================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <Search
          size={18}
          className="text-slate-400 ml-2 shrink-0"
        />
        <input
          type="text"
          placeholder="Buscar por código o nombre..."
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
          className="
            w-full
            text-xs
            bg-transparent
            focus:outline-none
            text-slate-700
            placeholder-slate-400
          "
        />
        {busqueda && (
          <button
            onClick={() =>
              setBusqueda("")
            }
            title="Limpiar búsqueda"
            className="text-slate-400 hover:text-slate-600 shrink-0"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {/* ======================================================
          TABLA
      ======================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-blue-50 text-[#006cb7] rounded-xl shrink-0">
              <Users size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Personal Registrado
              </h2>
              <p className="text-[10px] text-slate-400 mt-1">
                Evaluación actual del desempeño operativo.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
            {trabajadoresFiltrados.length} registros
          </span>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-auto max-h-[500px]">
          {/* LOADING */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2
                className="animate-spin text-[#006cb7]"
                size={26}
              />
              <p className="text-xs">
                Actualizando desempeño y cargando personal...
              </p>
            </div>
          ) : trabajadoresFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <div className="p-3 bg-slate-50 rounded-xl">
                <Database size={24} />
              </div>
              <p className="text-xs font-medium text-slate-500">
                {busqueda
                  ? "No se encontraron trabajadores con esa búsqueda."
                  : "No se encontraron registros de personal."}
              </p>
              {busqueda && (
                <button
                  onClick={() =>
                    setBusqueda("")
                  }
                  className="text-[10px] font-bold text-[#006cb7] hover:underline"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <table className="w-full min-w-[1050px] text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 uppercase">
                <tr className="border-b border-slate-200">
                  <th
                    className="px-4 py-3 font-bold whitespace-nowrap bg-slate-50"
                  >
                    #
                  </th>
                  <th
                    className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50"
                  >
                    <Tooltip
                      title="Código"
                      text="Código único que identifica al trabajador dentro del sistema."
                      width="w-64"
                    >
                      <span className="cursor-help">Código</span>
                    </Tooltip>
                  </th>
                  <th
                    className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50 min-w-[230px]"
                  >
                    <Tooltip
                      title="Nombre"
                      text="Nombre completo del trabajador registrado."
                      width="w-64"
                    >
                      <span className="cursor-help">Nombre</span>
                    </Tooltip>
                  </th>
                  <th
                    className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50 min-w-[120px]"
                  >
                    <Tooltip
                      title="Puntaje"
                      text="Resultado numérico de la última evaluación de desempeño calculada para el trabajador."
                      width="w-72"
                    >
                      <span className="cursor-help">Puntaje</span>
                    </Tooltip>
                  </th>
                  <th
                    className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50 min-w-[150px]"
                  >
                    <Tooltip
                      title="Clasificación"
                      text="Categoría asignada según el puntaje obtenido: Crítico, Regular, Bueno o Excelente."
                      width="w-72"
                    >
                      <span className="cursor-help">Clasificación</span>
                    </Tooltip>
                  </th>
                  <th
                    className="px-5 py-3 font-bold text-center whitespace-nowrap bg-slate-50 min-w-[150px]"
                  >
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trabajadoresFiltrados.map(
                  (t, index) => (
                    <tr
                      key={
                        t.ccodprs ||
                        `trabajador-${index}`
                      }
                      className={`
                        transition-colors
                        hover:bg-slate-50/70
                        ${
                          t.ultima_clasificacion ===
                          "Crítico"
                            ? "bg-red-50/30"
                            : ""
                        }
                      `}
                    >
                      {/* NUMERO */}
                      <td className="px-4 py-4">
                        <span
                          className={`
                            inline-flex
                            items-center
                            justify-center
                            w-8
                            h-8
                            rounded-lg
                            text-[10px]
                            font-bold
                            ${
                              t.ultima_clasificacion ===
                              "Crítico"
                                ? "bg-red-100 text-red-700"
                                : t.ultima_clasificacion ===
                                  "Regular"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }
                          `}
                        >
                          {index + 1}
                        </span>
                      </td>
                      {/* CODIGO */}
                      <td className="px-5 py-4">
                        <span className="font-mono text-[11px] font-bold text-[#006cb7] whitespace-nowrap">
                          {t.ccodprs || "--"}
                        </span>
                      </td>
                      {/* NOMBRE */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800 whitespace-nowrap">
                          {t.nombre || "--"}
                        </div>
                      </td>
                      {/* PUNTAJE */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-800 whitespace-nowrap">
                          {t.ultimo_puntaje !== null &&
                          t.ultimo_puntaje !== undefined
                            ? `${t.ultimo_puntaje} pts`
                            : "--"}
                        </span>
                      </td>
                      {/* CLASIFICACION */}
                      <td className="px-5 py-4">
                        <span
                          className={`
                            inline-flex
                            items-center
                            rounded-full
                            border
                            px-3
                            py-1.5
                            text-[10px]
                            font-bold
                            whitespace-nowrap
                            ${colorEstado(
                              t.ultima_clasificacion
                            )}
                          `}
                        >
                          {t.ultima_clasificacion ||
                            "Sin evaluar"}
                        </span>
                      </td>
                      {/* ACCION */}
                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() =>
                              verDetalle(t)
                            }
                            className="
                              flex
                              items-center
                              justify-center
                              gap-2
                              min-w-[120px]
                              px-4
                              py-2.5
                              rounded-lg
                              bg-blue-50
                              text-[#006cb7]
                              hover:bg-[#006cb7]
                              hover:text-white
                              transition
                              text-[10px]
                              font-bold
                              whitespace-nowrap
                            "
                          >
                            <Eye size={14} />
                            Ver ficha
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/* ======================================================
          MODAL FICHA
      ======================================================= */}
      {mostrarDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden shadow-2xl">
            {/* ==================================================
                HEADER
            =================================================== */}
            <div className="flex items-start justify-between gap-6 p-6 border-b border-slate-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-3 bg-blue-50 text-[#006cb7] rounded-xl shrink-0">
                  <Users size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide truncate">
                    {detalle?.nombre ||
                      "Ficha del trabajador"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Código:{" "}
                    <span className="font-mono font-semibold text-slate-700">
                      {detalle?.ccodprs ||
                        "--"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-5 shrink-0">
                {detalle && (
                  <div className="text-right">
                    <span
                      className={`
                        inline-flex
                        rounded-full
                        border
                        px-3
                        py-1.5
                        text-[10px]
                        font-bold
                        whitespace-nowrap
                        ${colorEstado(
                          detalle.ultima_clasificacion
                        )}
                      `}
                    >
                      {detalle.ultima_clasificacion ||
                        "Sin evaluar"}
                    </span>
                    <p className="text-2xl font-bold text-slate-800 mt-2">
                      {detalle.ultimo_puntaje !== null &&
                      detalle.ultimo_puntaje !== undefined
                        ? detalle.ultimo_puntaje
                        : "--"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Último puntaje
                    </p>
                  </div>
                )}
                <button
                  onClick={cerrarDetalle}
                  title="Cerrar ficha"
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            {/* ==================================================
                BODY
            =================================================== */}
            <div className="p-6 overflow-y-auto max-h-[calc(92vh-105px)]">
              {loadingDetalle ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <Loader2
                    size={26}
                    className="animate-spin text-[#006cb7]"
                  />
                  <p className="text-xs">
                    Cargando información detallada...
                  </p>
                </div>
              ) : detalle ? (
                <>
                  {/* =================================================
                      RESUMEN DE FICHA
                  ================================================== */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* ÚLTIMA EVALUACIÓN */}
                    <Tooltip
                      title="Última evaluación"
                      text="Fecha correspondiente a la última evaluación de desempeño calculada para este trabajador."
                      width="w-80"
                    >
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3 cursor-help">
                        <div className="p-2.5 bg-blue-50 text-[#006cb7] rounded-lg shrink-0">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">
                            Última evaluación
                          </p>
                          <p className="text-sm font-semibold text-slate-700 mt-1">
                            {detalle.fecha_ultima_evaluacion ||
                              "Sin registro"}
                          </p>
                        </div>
                      </div>
                    </Tooltip>
                    {/* ALERTAS */}
                    <Tooltip
                      title="Alertas pendientes"
                      text="Cantidad de alertas pendientes asociadas al trabajador. Estas alertas pueden servir como indicador para realizar seguimiento."
                      width="w-80"
                    >
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3 cursor-help">
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                          <AlertTriangle size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">
                            Alertas pendientes
                          </p>
                          <p className="text-sm font-semibold text-slate-700 mt-1">
                            {detalle.total_alertas_pendientes ??
                              0}{" "}
                            alertas
                          </p>
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                  {/* =================================================
                      HISTORIAL
                  ================================================== */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                          Historial de asistencia
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Registro histórico de rendimiento y lecturas.
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* =================================================
                      FILTRO DE FECHAS
                  ================================================== */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                      {/* DESDE */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                          Desde
                        </label>
                        <div className="relative">
                          <Calendar
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7]"
                          />
                          <input
                            type="date"
                            value={fechaDesde}
                            max={
                              fechaHasta ||
                              undefined
                            }
                            onChange={(e) =>
                              setFechaDesde(
                                e.target.value
                              )
                            }
                            className="
                              w-full
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
                      {/* HASTA */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                          Hasta
                        </label>
                        <div className="relative">
                          <Calendar
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7]"
                          />
                          <input
                            type="date"
                            value={fechaHasta}
                            min={
                              fechaDesde ||
                              undefined
                            }
                            onChange={(e) =>
                              setFechaHasta(
                                e.target.value
                              )
                            }
                            className="
                              w-full
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
                      {/* LIMPIAR */}
                      {(fechaDesde ||
                        fechaHasta) && (
                        <button
                          onClick={() => {
                            setFechaDesde("");
                            setFechaHasta("");
                          }}
                          className="
                            h-10
                            px-4
                            rounded-lg
                            border
                            border-slate-200
                            bg-white
                            text-slate-500
                            hover:bg-slate-100
                            hover:text-slate-700
                            text-xs
                            font-bold
                            transition
                          "
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                    {/* INFORMACIÓN DEL FILTRO */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <Info
                          size={14}
                          className="text-[#006cb7] shrink-0"
                        />
                        <p className="text-[10px] text-slate-500">
                          {fechaDesde &&
                          fechaHasta
                            ? `Mostrando registros desde ${fechaDesde} hasta ${fechaHasta}.`
                            : fechaDesde
                            ? `Mostrando registros desde ${fechaDesde}.`
                            : fechaHasta
                            ? `Mostrando registros hasta ${fechaHasta}.`
                            : "Mostrando todo el historial disponible."
                          }
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-[#006cb7] whitespace-nowrap">
                        {historialFiltrado.length}{" "}
                        {historialFiltrado.length === 1
                          ? "registro"
                          : "registros"}
                      </span>
                    </div>
                  </div>
                  {/* =================================================
                      SIN HISTORIAL
                  ================================================== */}
                  {historialFiltrado.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 gap-2">
                      <p className="text-xs text-center">
                        {detalle.historial_asistencia?.length > 0
                          ? "No existen registros para el rango de fechas seleccionado."
                          : "No hay registros de asistencia en el historial."
                        }
                      </p>
                      {(fechaDesde ||
                        fechaHasta) && (
                        <button
                          onClick={() => {
                            setFechaDesde("");
                            setFechaHasta("");
                          }}
                          className="text-[10px] font-bold text-[#006cb7] hover:underline"
                        >
                          Mostrar todo el historial
                        </button>
                      )}
                    </div>
                  ) : (
                    /* =================================================
                       TABLA HISTORIAL
                    ================================================== */
                    <div className="border border-slate-200 rounded-xl overflow-auto max-h-[400px]">
                      <table className="w-full min-w-[1100px] text-left text-xs border-collapse">
                        <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 uppercase">
                          <tr>
                            <th className="px-5 py-3 font-bold bg-slate-50 whitespace-nowrap">
                              Fecha
                            </th>
                            <th className="px-5 py-3 font-bold bg-slate-50 whitespace-nowrap">
                              Lecturas prog.
                            </th>
                            <th className="px-5 py-3 font-bold bg-slate-50 whitespace-nowrap">
                              Realizadas
                            </th>
                            <th className="px-5 py-3 font-bold bg-slate-50 whitespace-nowrap">
                              Eficiencia
                            </th>
                            <th className="px-5 py-3 font-bold bg-slate-50 whitespace-nowrap">
                              Duración
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {historialFiltrado.map(
                            (h, i) => (
                              <tr
                                key={i}
                                className="hover:bg-slate-50/70 transition"
                              >
                                {/* FECHA */}
                                <td className="px-5 py-4 font-semibold text-slate-700 whitespace-nowrap">
                                  <Tooltip
                                    title="Fecha"
                                    text="Fecha correspondiente a la jornada de trabajo y al registro de asistencia del trabajador."
                                    width="w-72"
                                  >
                                    <span className="cursor-help">
                                      {h.fecha ||
                                        "--"}
                                    </span>
                                  </Tooltip>
                                </td>
                                {/* PROGRAMADAS */}
                                <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                                  <Tooltip
                                    title="Lecturas programadas"
                                    text="Cantidad total de lecturas que estaban programadas para que el trabajador realizara durante esta jornada."
                                    width="w-80"
                                  >
                                    <span className="cursor-help font-medium">
                                      {h.cantidad_lecturas ??
                                        0}
                                    </span>
                                  </Tooltip>
                                </td>
                                {/* REALIZADAS */}
                                <td className="px-5 py-4 font-semibold text-slate-700 whitespace-nowrap">
                                  <Tooltip
                                    title="Lecturas realizadas"
                                    text="Cantidad de lecturas que el trabajador logró completar efectivamente durante la jornada registrada."
                                    width="w-80"
                                  >
                                    <span className="cursor-help">
                                      {h.lecturas_realizadas ??
                                        0}
                                    </span>
                                  </Tooltip>
                                </td>
                                {/* EFICIENCIA */}
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <Tooltip
                                    title="Eficiencia"
                                    text="Porcentaje de cumplimiento de las lecturas programadas. Se obtiene comparando las lecturas realizadas con las lecturas programadas. Un porcentaje más alto indica un mayor cumplimiento de las actividades asignadas."
                                    width="w-96"
                                  >
                                    <div className="flex items-center gap-2 cursor-help">
                                      <Gauge
                                        size={15}
                                        className="text-[#006cb7]"
                                      />
                                      <span className="font-bold text-[#006cb7]">
                                        {formatearEficiencia(
                                          h.eficiencia
                                        )}
                                      </span>
                                    </div>
                                  </Tooltip>
                                </td>
                                {/* DURACIÓN */}
                                <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                                  <Tooltip
                                    title="Duración"
                                    text="Tiempo total empleado por el trabajador para completar las actividades registradas en esta jornada. El valor original está expresado en minutos y aquí se muestra de una forma más fácil de interpretar."
                                    width="w-96"
                                  >
                                    <div className="flex items-center gap-2 cursor-help">
                                      <Clock3
                                        size={15}
                                        className="text-slate-400"
                                      />
                                      <span>
                                        {formatearDuracion(
                                          h.duracion_total_min
                                        )}
                                      </span>
                                    </div>
                                  </Tooltip>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {/* =================================================
                      EXPLICACIÓN
                  ================================================== */}
                  <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-lg text-[#006cb7] shrink-0">
                        <Info size={17} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-700">
                          ¿Qué significa esta información?
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mt-3">
                          <p className="text-[11px] leading-relaxed text-slate-600">
                            <strong className="text-slate-700">
                              Lecturas programadas:
                            </strong>{" "}
                            cantidad de lecturas que el trabajador tenía asignadas para realizar.
                          </p>
                          <p className="text-[11px] leading-relaxed text-slate-600">
                            <strong className="text-slate-700">
                              Realizadas:
                            </strong>{" "}
                            cantidad de lecturas que fueron completadas efectivamente.
                          </p>
                          <p className="text-[11px] leading-relaxed text-slate-600">
                            <strong className="text-slate-700">
                              Eficiencia:
                            </strong>{" "}
                            porcentaje que representa el cumplimiento de las lecturas programadas.
                          </p>
                          <p className="text-[11px] leading-relaxed text-slate-600">
                            <strong className="text-slate-700">
                              Duración:
                            </strong>{" "}
                            tiempo total empleado para realizar las actividades registradas.
                          </p>
                          <p className="text-[11px] leading-relaxed text-slate-600">
                            <strong className="text-slate-700">
                              Puntaje:
                            </strong>{" "}
                            resultado general utilizado para evaluar el desempeño del trabajador.
                          </p>
                          <p className="text-[11px] leading-relaxed text-slate-600">
                            <strong className="text-slate-700">
                              Clasificación:
                            </strong>{" "}
                            categoría asignada según el resultado de la evaluación: Crítico, Regular, Bueno o Excelente.
                          </p>
                          <p className="text-[11px] leading-relaxed text-slate-600">
                            <strong className="text-slate-700">
                              Ruta ID:
                            </strong>{" "}
                            identificador de la ruta de trabajo asociada a la jornada.
                          </p>
                          <p className="text-[11px] leading-relaxed text-slate-600">
                            <strong className="text-slate-700">
                              Centro de medición:
                            </strong>{" "}
                            código del centro asociado a las lecturas registradas.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* =================================================
                      CERRAR
                  ================================================== */}
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={cerrarDetalle}
                      className="
                        flex
                        items-center
                        gap-2
                        px-5
                        py-2.5
                        rounded-xl
                        bg-[#006cb7]
                        hover:bg-[#005a9c]
                        text-white
                        text-xs
                        font-bold
                        transition
                        shadow-sm
                      "
                    >
                      <CheckCircle size={16} />
                      Cerrar ficha
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                  <Database size={24} />
                  <p className="text-xs">
                    No se pudo obtener la información del trabajador.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}