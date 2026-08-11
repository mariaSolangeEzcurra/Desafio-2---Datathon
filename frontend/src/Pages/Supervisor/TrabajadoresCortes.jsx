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
  Calendar,
  Search,
  Loader2,
  Database,
  Info,
  Filter,
  RotateCcw,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  MapPin,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Percent,
} from "lucide-react";
import { cortesPersonalService } from "../../services/CortesPersonal";

export default function CortesPersonalDesempeno() {
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
  const hoy = obtenerFechaHoy();

  // ============================================================
  // ESTADOS PRINCIPALES
  // ============================================================
  const [operarios, setOperarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [ccodprsSeleccionado, setCcodprsSeleccionado] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  // ============================================================
  // FILTROS API (LISTADO)
  // Por defecto se muestran los datos del día en curso; si el
  // usuario elige un periodo o cambia las fechas, eso reemplaza
  // este valor inicial.
  // ============================================================
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [periodoFiltro, setPeriodoFiltro] = useState("");
  const [distritoInput, setDistritoInput] = useState("");
  const [distritoFiltro, setDistritoFiltro] = useState("");

  // ============================================================
  // ORDENAMIENTO
  // ============================================================
  // mayor = mayor efectividad primero
  // menor = menor efectividad primero
  const [ordenEfectividad, setOrdenEfectividad] = useState("mayor");

  // ============================================================
  // FILTROS DEL DETALLE (paginado por servidor)
  // ============================================================
  const [fechaDesdeDetalle, setFechaDesdeDetalle] = useState("");
  const [fechaHastaDetalle, setFechaHastaDetalle] = useState("");
  const [paginaDetalle, setPaginaDetalle] = useState(1);
  const limiteDetalle = 50;

  // ============================================================
  // DEBOUNCE DEL DISTRITO
  // Evita disparar un fetch por cada letra escrita.
  // ============================================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDistritoFiltro(distritoInput.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [distritoInput]);

  // ============================================================
  // CALCULAR RESUMEN
  // ============================================================
  const calcularResumen = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      setResumen(null);
      return;
    }
    const sum = (campo) =>
      data.reduce((acc, t) => acc + (Number(t[campo]) || 0), 0);

    const conEfectividad = data.filter(
      (t) => t.tasa_efectividad !== null && t.tasa_efectividad !== undefined
    );
    let mejorEfectividad = null;
    let menorEfectividad = null;
    if (conEfectividad.length > 0) {
      mejorEfectividad = [...conEfectividad].sort(
        (a, b) => Number(b.tasa_efectividad) - Number(a.tasa_efectividad)
      )[0];
      menorEfectividad = [...conEfectividad].sort(
        (a, b) => Number(a.tasa_efectividad) - Number(b.tasa_efectividad)
      )[0];
    }

    setResumen({
      totalOperarios: data.length,
      totalOrdenes: sum("total_ordenes"),
      totalEjecutadas: sum("ejecutadas"),
      totalPendientes: sum("pendientes"),
      deudaAsignada: sum("deuda_asignada"),
      deudaRecuperada: sum("deuda_recuperada"),
      mejorEfectividad,
      menorEfectividad,
    });
  };

  // ============================================================
  // CARGAR RENDIMIENTO DESDE API
  // ============================================================
  const cargarRendimiento = async () => {
    try {
      setLoading(true);
      const data = await cortesPersonalService.getRendimientoPersonal({
        fecha_inicio: periodoFiltro ? undefined : fechaInicio || undefined,
        fecha_fin: periodoFiltro ? undefined : fechaFin || undefined,
        periodo: periodoFiltro || undefined,
        distrito: distritoFiltro || undefined,
      });
      const lista = Array.isArray(data) ? data : [];
      setOperarios(lista);
      calcularResumen(lista);
    } catch (error) {
      console.error("Error cargando rendimiento de personal de cortes:", error);
      setOperarios([]);
      setResumen(null);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ACTUALIZAR LISTADO
  // Se dispara cada vez que cambian fechas, periodo o distrito.
  // ============================================================
  useEffect(() => {
    cargarRendimiento();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin, periodoFiltro, distritoFiltro]);

  // ============================================================
  // CAMBIO DE PERIODO
  // ============================================================
  const handlePeriodoChange = (e) => {
    const valor = e.target.value;
    setPeriodoFiltro(valor);
    if (valor) {
      setFechaInicio("");
      setFechaFin("");
    }
  };

  // ============================================================
  // CAMBIO DE FECHAS
  // ============================================================
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

  // ============================================================
  // LIMPIAR FILTROS
  // La recarga se dispara sola vía useEffect al cambiar los filtros
  // ============================================================
  const limpiarFiltros = () => {
    setFechaInicio(hoy);
    setFechaFin(hoy);
    setPeriodoFiltro("");
    setDistritoInput("");
    setDistritoFiltro("");
    setBusqueda("");
  };

  // ============================================================
  // CARGAR DETALLE (paginado por servidor)
  // ============================================================
  const cargarDetalle = async (ccodprs, pagina) => {
    try {
      setLoadingDetalle(true);
      const data = await cortesPersonalService.getDetalleTrabajador(ccodprs, {
        fecha_inicio: fechaDesdeDetalle || undefined,
        fecha_fin: fechaHastaDetalle || undefined,
        pagina,
        limite: limiteDetalle,
      });
      setDetalle(data);
    } catch (error) {
      console.error("Error obteniendo detalle del operario:", error);
      setDetalle(null);
    } finally {
      setLoadingDetalle(false);
    }
  };

  // ============================================================
  // ABRIR FICHA
  // ============================================================
  const verDetalle = (operario) => {
    const ccodprs = operario?.ccodprs;
    if (!ccodprs) return;
    setCcodprsSeleccionado(ccodprs);
    setFechaDesdeDetalle("");
    setFechaHastaDetalle("");
    setPaginaDetalle(1);
    setDetalle(null);
    setMostrarDetalle(true);
  };

  // ============================================================
  // RECARGAR DETALLE AL CAMBIAR PÁGINA O FECHAS
  // ============================================================
  useEffect(() => {
    if (!mostrarDetalle || !ccodprsSeleccionado) return;
    cargarDetalle(ccodprsSeleccionado, paginaDetalle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarDetalle, ccodprsSeleccionado, paginaDetalle, fechaDesdeDetalle, fechaHastaDetalle]);

  // ============================================================
  // CERRAR FICHA
  // ============================================================
  const cerrarDetalle = () => {
    setMostrarDetalle(false);
    setDetalle(null);
    setCcodprsSeleccionado(null);
    setFechaDesdeDetalle("");
    setFechaHastaDetalle("");
    setPaginaDetalle(1);
  };

  // ============================================================
  // CLASIFICAR EFECTIVIDAD (no viene de la API, se calcula acá)
  // ============================================================
  const clasificarEfectividad = (tasa) => {
    const valor = Number(tasa);
    if (Number.isNaN(valor)) {
      return { label: "Sin evaluar", clases: "bg-slate-50 text-slate-600 border-slate-200" };
    }
    if (valor >= 90) {
      return { label: "Excelente", clases: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    if (valor >= 75) {
      return { label: "Bueno", clases: "bg-blue-50 text-blue-700 border-blue-200" };
    }
    if (valor >= 50) {
      return { label: "Regular", clases: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    return { label: "Crítico", clases: "bg-red-50 text-red-700 border-red-200" };
  };

  // ============================================================
  // FORMATEAR MONEDA
  // ============================================================
  const formatearMoneda = (valor) => {
    const numero = Number(valor);
    if (Number.isNaN(numero)) return "--";
    return `S/ ${numero.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // ============================================================
  // FORMATEAR PORCENTAJE
  // ============================================================
  const formatearPorcentaje = (valor) => {
    const numero = Number(valor);
    if (Number.isNaN(numero)) return "--";
    return `${numero.toFixed(0)}%`;
  };

  // ============================================================
  // BUSCADOR
  // ============================================================
  const operariosBuscados = operarios.filter((t) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return (
      String(t.ccodprs || "").toLowerCase().includes(texto) ||
      String(t.nombre_trabajador || "").toLowerCase().includes(texto)
    );
  });

  // ============================================================
  // ORDENAR POR EFECTIVIDAD
  // ============================================================
  const operariosFiltrados = [...operariosBuscados].sort((a, b) => {
    const efA =
      a.tasa_efectividad === null || a.tasa_efectividad === undefined
        ? -Infinity
        : Number(a.tasa_efectividad);
    const efB =
      b.tasa_efectividad === null || b.tasa_efectividad === undefined
        ? -Infinity
        : Number(b.tasa_efectividad);
    if (ordenEfectividad === "mayor") {
      return efB - efA;
    }
    return efA - efB;
  });

  // ============================================================
  // TOOLTIP
  // ============================================================
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

  // ============================================================
  // PAGINACIÓN DEL DETALLE
  // ============================================================
  const totalPaginasDetalle = detalle
    ? Math.max(1, Math.ceil((detalle.total_registros || 0) / limiteDetalle))
    : 1;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6 text-left">
      {/* ======================================================
          LOADING
      ======================================================= */}
      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="animate-spin text-[#006cb7]" size={16} />
          Actualizando operarios...
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
              Desde
            </label>
            <div className="relative">
              <Calendar
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
              Hasta
            </label>
            <div className="relative">
              <Calendar
                size={15}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  periodoFiltro ? "text-slate-300" : "text-[#006cb7]"
                }`}
              />
              <input
                type="date"
                value={fechaFin}
                min={fechaInicio || undefined}
                disabled={loading || Boolean(periodoFiltro)}
                onChange={handleFechaFinChange}
                className="h-10 pl-10 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100 transition disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
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

          {/* LIMPIAR */}
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
      </div>

      {/* ======================================================
          RESUMEN
      ======================================================= */}
      {resumen && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* TOTAL OPERARIOS */}
            <Tooltip
              title="Operarios registrados"
              text="Cantidad de operarios de corte encontrados según el filtro seleccionado."
              width="w-80"
            >
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-help">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Operarios
                    </p>
                    <p className="text-3xl font-bold text-slate-800 mt-2">
                      {resumen.totalOperarios}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 text-[#006cb7] shrink-0">
                    <Users size={20} />
                  </div>
                </div>
              </div>
            </Tooltip>

            {/* ÓRDENES PENDIENTES */}
            <Tooltip
              title="Órdenes pendientes"
              text="Suma de órdenes de corte aún no ejecutadas por todos los operarios filtrados."
              width="w-80"
            >
              <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-help">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">
                      Pendientes
                    </p>
                    <p className="text-3xl font-bold text-amber-700 mt-2">
                      {resumen.totalPendientes}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                    <ClipboardList size={20} />
                  </div>
                </div>
              </div>
            </Tooltip>

            {/* DEUDA ASIGNADA */}
            <Tooltip
              title="Deuda asignada"
              text="Suma del monto total de deuda asignada a los operarios dentro del filtro seleccionado."
              width="w-80"
            >
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-help">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Deuda asignada
                    </p>
                    <p className="text-2xl font-bold text-slate-800 mt-2">
                      {formatearMoneda(resumen.deudaAsignada)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 text-[#006cb7] shrink-0">
                    <DollarSign size={20} />
                  </div>
                </div>
              </div>
            </Tooltip>

            {/* DEUDA RECUPERADA */}
            <Tooltip
              title="Deuda recuperada"
              text="Suma del monto total de deuda recuperada a partir de las órdenes ejecutadas."
              width="w-80"
            >
              <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-help">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                      Deuda recuperada
                    </p>
                    <p className="text-2xl font-bold text-emerald-700 mt-2">
                      {formatearMoneda(resumen.deudaRecuperada)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle size={20} />
                  </div>
                </div>
              </div>
            </Tooltip>
          </div>

          {/* ====================================================
              COMPARATIVA: MEJOR Y PEOR EFECTIVIDAD
          ==================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumen.mejorEfectividad && (
              <Tooltip
                title="Mejor efectividad"
                text="Operario con la tasa de efectividad más alta dentro del conjunto filtrado."
                width="w-80"
              >
                <button
                  onClick={() => verDetalle(resumen.mejorEfectividad)}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left hover:border-emerald-300 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Trophy size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Mejor efectividad
                        </p>
                        <p className="text-sm font-bold text-slate-700 mt-0.5 truncate">
                          {resumen.mejorEfectividad.nombre_trabajador}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Código: {resumen.mejorEfectividad.ccodprs}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-emerald-600">
                        {formatearPorcentaje(resumen.mejorEfectividad.tasa_efectividad)}
                      </p>
                      <p className="text-[10px] text-slate-400">efectividad</p>
                    </div>
                  </div>
                </button>
              </Tooltip>
            )}

            {resumen.menorEfectividad && (
              <Tooltip
                title="Requiere atención"
                text="Operario con la tasa de efectividad más baja dentro del conjunto filtrado."
                width="w-80"
              >
                <button
                  onClick={() => verDetalle(resumen.menorEfectividad)}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left hover:border-red-300 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                        <AlertCircle size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Requiere atención
                        </p>
                        <p className="text-sm font-bold text-slate-700 mt-0.5 truncate">
                          {resumen.menorEfectividad.nombre_trabajador}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Código: {resumen.menorEfectividad.ccodprs}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-red-600">
                        {formatearPorcentaje(resumen.menorEfectividad.tasa_efectividad)}
                      </p>
                      <p className="text-[10px] text-slate-400">efectividad</p>
                    </div>
                  </div>
                </button>
              </Tooltip>
            )}
          </div>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
        {/* BUSCADOR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <Search size={18} className="text-slate-400 ml-2 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
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

        {/* ORDENAR POR EFECTIVIDAD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-[#006cb7] rounded-lg shrink-0">
            {ordenEfectividad === "mayor" ? (
              <ArrowDownWideNarrow size={17} />
            ) : (
              <ArrowUpWideNarrow size={17} />
            )}
          </div>
          <div className="min-w-[180px]">
            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
              Comparar por efectividad
            </label>
            <select
              value={ordenEfectividad}
              onChange={(e) => setOrdenEfectividad(e.target.value)}
              className="w-full text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="mayor">Mayor → menor</option>
              <option value="menor">Menor → mayor</option>
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================
          TABLA
      ======================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-blue-50 text-[#006cb7] rounded-xl">
              <Users size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Operarios de Corte
              </h2>
              <p className="text-[10px] text-slate-400 mt-1">
                Comparativa de operarios ordenada por tasa de efectividad.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {operariosFiltrados.length} registros
            </span>
            <p className="text-[9px] text-[#006cb7] mt-1 font-semibold">
              {ordenEfectividad === "mayor" ? "Mayor efectividad primero" : "Menor efectividad primero"}
            </p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-auto max-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 className="animate-spin text-[#006cb7]" size={26} />
              <p className="text-xs">Cargando operarios...</p>
            </div>
          ) : operariosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <div className="p-3 bg-slate-50 rounded-xl">
                <Database size={24} />
              </div>
              <p className="text-xs font-medium text-slate-500">
                {busqueda
                  ? "No se encontraron operarios con esa búsqueda."
                  : "No se encontraron registros de operarios."}
              </p>
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="text-[10px] font-bold text-[#006cb7] hover:underline"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <table className="w-full min-w-[1150px] text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 uppercase">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 font-bold whitespace-nowrap bg-slate-50">#</th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50">Código</th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50 min-w-[230px]">
                    Nombre
                  </th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50">Órdenes</th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50">Ejecutadas</th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50">Pendientes</th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50 min-w-[140px]">
                    Efectividad
                  </th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50">Deuda asig.</th>
                  <th className="px-5 py-3 font-bold whitespace-nowrap bg-slate-50">Deuda recup.</th>
                  <th className="px-5 py-3 font-bold text-center whitespace-nowrap bg-slate-50 min-w-[150px]">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {operariosFiltrados.map((t, index) => {
                  const clasificacion = clasificarEfectividad(t.tasa_efectividad);
                  const esPrimero =
                    index === 0 &&
                    ordenEfectividad === "mayor" &&
                    t.tasa_efectividad !== null &&
                    t.tasa_efectividad !== undefined;
                  const esUltimo =
                    index === operariosFiltrados.length - 1 &&
                    ordenEfectividad === "mayor" &&
                    t.tasa_efectividad !== null &&
                    t.tasa_efectividad !== undefined;
                  return (
                    <tr
                      key={t.ccodprs || `operario-${index}`}
                      className={`transition-colors hover:bg-slate-50/70 ${
                        clasificacion.label === "Crítico" ? "bg-red-50/30" : ""
                      } ${esPrimero ? "bg-emerald-50/40" : ""} ${
                        esUltimo ? "bg-red-50/20" : ""
                      }`}
                    >
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-bold ${
                            esPrimero
                              ? "bg-emerald-100 text-emerald-700"
                              : esUltimo
                              ? "bg-red-100 text-red-700"
                              : clasificacion.label === "Crítico"
                              ? "bg-red-100 text-red-700"
                              : clasificacion.label === "Regular"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-[11px] font-bold text-[#006cb7] whitespace-nowrap">
                          {t.ccodprs || "--"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800 whitespace-nowrap">
                          {t.nombre_trabajador || "--"}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{t.total_ordenes ?? 0}</td>
                      <td className="px-5 py-4 text-slate-600">{t.ejecutadas ?? 0}</td>
                      <td className="px-5 py-4 text-slate-600">{t.pendientes ?? 0}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {esPrimero && <Trophy size={15} className="text-emerald-500" />}
                          {esUltimo && <AlertCircle size={15} className="text-red-500" />}
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold whitespace-nowrap ${clasificacion.clases}`}
                          >
                            {formatearPorcentaje(t.tasa_efectividad)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                        {formatearMoneda(t.deuda_asignada)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-emerald-700 whitespace-nowrap">
                        {formatearMoneda(t.deuda_recuperada)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => verDetalle(t)}
                            className="flex items-center justify-center gap-2 min-w-[120px] px-4 py-2.5 rounded-lg bg-blue-50 text-[#006cb7] hover:bg-[#006cb7] hover:text-white transition text-[10px] font-bold whitespace-nowrap"
                          >
                            <Eye size={14} />
                            Ver ficha
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
            {/* HEADER */}
            <div className="flex items-start justify-between gap-6 p-6 border-b border-slate-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-3 bg-blue-50 text-[#006cb7] rounded-xl shrink-0">
                  <Users size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide truncate">
                    {detalle?.nombre_trabajador || "Ficha del operario"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Código:{" "}
                    <span className="font-mono font-semibold text-slate-700">
                      {detalle?.ccodprs || ccodprsSeleccionado || "--"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-5 shrink-0">
                {detalle && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-800">
                      {detalle.total_registros ?? 0}
                    </p>
                    <p className="text-[10px] text-slate-400">órdenes totales</p>
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

            {/* BODY */}
            <div className="p-6 overflow-y-auto max-h-[calc(92vh-105px)]">
              {/* HISTORIAL */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                    Órdenes de corte
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Registro histórico de órdenes asignadas al operario.
                  </p>
                </div>
              </div>

              {/* FILTRO HISTORIAL */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                      Desde
                    </label>
                    <input
                      type="date"
                      value={fechaDesdeDetalle}
                      max={fechaHastaDetalle || undefined}
                      onChange={(e) => {
                        setFechaDesdeDetalle(e.target.value);
                        setPaginaDetalle(1);
                      }}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                      Hasta
                    </label>
                    <input
                      type="date"
                      value={fechaHastaDetalle}
                      min={fechaDesdeDetalle || undefined}
                      onChange={(e) => {
                        setFechaHastaDetalle(e.target.value);
                        setPaginaDetalle(1);
                      }}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  {(fechaDesdeDetalle || fechaHastaDetalle) && (
                    <button
                      onClick={() => {
                        setFechaDesdeDetalle("");
                        setFechaHastaDetalle("");
                        setPaginaDetalle(1);
                      }}
                      className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 text-xs font-bold"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <Info size={14} className="text-[#006cb7]" />
                    <p className="text-[10px] text-slate-500">
                      {fechaDesdeDetalle && fechaHastaDetalle
                        ? `Mostrando registros desde ${fechaDesdeDetalle} hasta ${fechaHastaDetalle}.`
                        : fechaDesdeDetalle
                        ? `Mostrando registros desde ${fechaDesdeDetalle}.`
                        : fechaHastaDetalle
                        ? `Mostrando registros hasta ${fechaHastaDetalle}.`
                        : "Mostrando todo el historial disponible."}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-[#006cb7]">
                    {detalle?.total_registros ?? 0} registros
                  </span>
                </div>
              </div>

              {/* TABLA HISTORIAL */}
              {loadingDetalle ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <Loader2 size={26} className="animate-spin text-[#006cb7]" />
                  <p className="text-xs">Cargando órdenes...</p>
                </div>
              ) : !detalle || (detalle.ordenes || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-xs text-center text-slate-500">
                    No existen órdenes para el rango seleccionado.
                  </p>
                </div>
              ) : (
                <>
                  <div className="border border-slate-200 rounded-xl overflow-auto max-h-[400px]">
                    <table className="w-full min-w-[1050px] text-left text-xs border-collapse">
                      <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 uppercase">
                        <tr>
                          <th className="px-5 py-3 font-bold bg-slate-50">Programa</th>
                          <th className="px-5 py-3 font-bold bg-slate-50">Conexión</th>
                          <th className="px-5 py-3 font-bold bg-slate-50">F. generación</th>
                          <th className="px-5 py-3 font-bold bg-slate-50">F. ejecución</th>
                          <th className="px-5 py-3 font-bold bg-slate-50">Distrito</th>
                          <th className="px-5 py-3 font-bold bg-slate-50 min-w-[220px]">Dirección</th>
                          <th className="px-5 py-3 font-bold bg-slate-50">Deuda</th>
                          <th className="px-5 py-3 font-bold bg-slate-50 min-w-[160px]">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detalle.ordenes.map((o) => (
                          <tr key={o.id_orden} className="hover:bg-slate-50/70 transition">
                            <td className="px-5 py-4 font-mono text-[11px] text-[#006cb7] font-bold">
                              {o.ccodprg || "--"}
                            </td>
                            <td className="px-5 py-4 font-mono text-[11px] text-slate-600">
                              {o.ccodcnx || "--"}
                            </td>
                            <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                              {o.dgenprg || "--"}
                            </td>
                            <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                              {o.dejecuc || "--"}
                            </td>
                            <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                              {o.distrito || "--"}
                            </td>
                            <td className="px-5 py-4 text-slate-600">{o.direccion || "--"}</td>
                            <td className="px-5 py-4 font-semibold text-slate-700 whitespace-nowrap">
                              {formatearMoneda(o.ntotdeu)}
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600 whitespace-nowrap">
                                {o.cdesacc || o.csitreg || "--"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* PAGINACIÓN */}
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-[10px] text-slate-400">
                      Página {detalle.pagina} de {totalPaginasDetalle}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPaginaDetalle((p) => Math.max(1, p - 1))}
                        disabled={paginaDetalle <= 1}
                        className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-bold"
                      >
                        <ChevronLeft size={14} />
                        Anterior
                      </button>
                      <button
                        onClick={() =>
                          setPaginaDetalle((p) => Math.min(totalPaginasDetalle, p + 1))
                        }
                        disabled={paginaDetalle >= totalPaginasDetalle}
                        className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-bold"
                      >
                        Siguiente
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* EXPLICACIÓN */}
              <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg text-[#006cb7]">
                    <Percent size={17} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">
                      ¿Qué significa esta información?
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mt-3">
                      <p className="text-[11px] text-slate-600">
                        <strong>Órdenes:</strong> total de órdenes de corte asignadas.
                      </p>
                      <p className="text-[11px] text-slate-600">
                        <strong>Ejecutadas / Pendientes:</strong> órdenes ya realizadas
                        frente a las que aún faltan.
                      </p>
                      <p className="text-[11px] text-slate-600">
                        <strong>Efectividad:</strong> porcentaje de órdenes ejecutadas
                        sobre el total asignado.
                      </p>
                      <p className="text-[11px] text-slate-600">
                        <strong>Deuda asignada:</strong> monto total a cobrar en las
                        órdenes del operario.
                      </p>
                      <p className="text-[11px] text-slate-600">
                        <strong>Deuda recuperada:</strong> monto efectivamente cobrado
                        tras la ejecución.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CERRAR */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={cerrarDetalle}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006cb7] hover:bg-[#005a9c] text-white text-xs font-bold transition"
                >
                  <CheckCircle size={16} />
                  Cerrar ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}