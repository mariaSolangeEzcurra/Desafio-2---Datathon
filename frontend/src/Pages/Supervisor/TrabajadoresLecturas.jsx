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
  Gauge,
  Clock3,
  Info,
  Filter,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
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
  // FILTROS API
  // ============================================================

  const [fechaFiltro, setFechaFiltro] = useState("");
  const [periodoFiltro, setPeriodoFiltro] = useState("");

  // ============================================================
  // ORDENAMIENTO
  // ============================================================

  // mayor = mayor puntaje primero
  // menor = menor puntaje primero
  const [ordenPuntaje, setOrdenPuntaje] = useState("mayor");

  // ============================================================
  // FILTROS DE HISTORIAL
  // ============================================================

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // ============================================================
  // CARGA INICIAL
  // ============================================================

  useEffect(() => {
    cargarPersonal();
  }, []);

  // ============================================================
  // EXTRAER LISTA DE LA RESPUESTA API
  // ============================================================

  const extraerLista = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.items)) {
      return data.items;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.resultados)) {
      return data.resultados;
    }

    return [];
  };

  // ============================================================
  // CARGAR PERSONAL DESDE API
  // ============================================================

  const cargarPersonal = async () => {
    try {
      setLoading(true);

      console.log("=================================");
      console.log("CARGANDO PERSONAL");
      console.log("Fecha:", fechaFiltro || "TODAS");
      console.log("Periodo:", periodoFiltro || "TODOS");
      console.log("=================================");

      const data = await obtenerPersonal({
        skip: 0,
        limit: 100,
        fecha: fechaFiltro || undefined,
        periodo: periodoFiltro || undefined,
      });

      console.log("RESPUESTA API PERSONAL:", data);

      const lista = extraerLista(data);

      console.log("LISTA PERSONAL:", lista);
      console.log("TOTAL:", lista.length);

      setTrabajadores(lista);
      calcularResumen(lista);
    } catch (error) {
      console.error("Error cargando personal:", error);

      setTrabajadores([]);
      setResumen(null);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CALCULAR RESUMEN
  // ============================================================

  const calcularResumen = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      setResumen(null);
      return;
    }

    const conPuntaje = data.filter(
      (t) =>
        t.ultimo_puntaje !== null &&
        t.ultimo_puntaje !== undefined &&
        !Number.isNaN(Number(t.ultimo_puntaje))
    );

    let mejorPuntaje = null;
    let menorPuntaje = null;

    if (conPuntaje.length > 0) {
      mejorPuntaje = [...conPuntaje].sort(
        (a, b) =>
          Number(b.ultimo_puntaje) -
          Number(a.ultimo_puntaje)
      )[0];

      menorPuntaje = [...conPuntaje].sort(
        (a, b) =>
          Number(a.ultimo_puntaje) -
          Number(b.ultimo_puntaje)
      )[0];
    }

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
  // CAMBIO DE PERIODO
  // ============================================================

  const handlePeriodoChange = (e) => {
    const valor = e.target.value;

    setPeriodoFiltro(valor);

    if (valor) {
      setFechaFiltro("");
    }
  };

  // ============================================================
  // CAMBIO DE FECHA
  // ============================================================

  const handleFechaChange = (e) => {
    const valor = e.target.value;

    setFechaFiltro(valor);

    if (valor) {
      setPeriodoFiltro("");
    }
  };

  // ============================================================
  // APLICAR FILTROS
  // ============================================================

  const aplicarFiltros = async () => {
    await cargarPersonal();
  };

  // ============================================================
  // LIMPIAR FILTROS
  // ============================================================

  const limpiarFiltros = async () => {
    setFechaFiltro("");
    setPeriodoFiltro("");
    setBusqueda("");

    try {
      setLoading(true);

      const data = await obtenerPersonal({
        skip: 0,
        limit: 100,
      });

      const lista = extraerLista(data);

      setTrabajadores(lista);
      calcularResumen(lista);
    } catch (error) {
      console.error(
        "Error limpiando filtros:",
        error
      );

      setTrabajadores([]);
      setResumen(null);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RECALCULAR DESEMPEÑO
  // ============================================================

  const handleEjecutarCalculo = async () => {
    try {
      setCalculando(true);

      await calcularDesempeno({
        ccodprs: undefined,
        fecha_eval: fechaFiltro || undefined,
        periodo: periodoFiltro || undefined,
      });

      await cargarPersonal();
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

      setFechaDesde("");
      setFechaHasta("");

      const fichaData =
        await obtenerFichaPersonal(ccodprs);

      console.log(
        "FICHA DEL TRABAJADOR:",
        fichaData
      );

      setDetalle(fichaData);
    } catch (error) {
      console.error(
        "Error obteniendo ficha:",
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
  // COLOR ESTADO
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

  // ============================================================
  // NORMALIZAR FECHA
  // ============================================================

  const normalizarFecha = (fecha) => {
    if (!fecha) return "";

    return String(fecha).substring(0, 10);
  };

  // ============================================================
  // HISTORIAL FILTRADO
  // ============================================================

  const historialFiltrado =
    detalle?.historial_asistencia?.filter((h) => {
      const fechaRegistro =
        normalizarFecha(h.fecha);

      if (!fechaRegistro) {
        return false;
      }

      if (
        fechaDesde &&
        fechaRegistro < fechaDesde
      ) {
        return false;
      }

      if (
        fechaHasta &&
        fechaRegistro > fechaHasta
      ) {
        return false;
      }

      return true;
    }) || [];

  // ============================================================
  // BUSCADOR
  // ============================================================

  const trabajadoresBuscados =
    trabajadores.filter((t) => {
      const texto =
        busqueda.trim().toLowerCase();

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
  // ORDENAR POR PUNTAJE
  // ============================================================

  const trabajadoresFiltrados = [
    ...trabajadoresBuscados,
  ].sort((a, b) => {
    const puntajeA =
      a.ultimo_puntaje === null ||
      a.ultimo_puntaje === undefined
        ? -Infinity
        : Number(a.ultimo_puntaje);

    const puntajeB =
      b.ultimo_puntaje === null ||
      b.ultimo_puntaje === undefined
        ? -Infinity
        : Number(b.ultimo_puntaje);

    if (ordenPuntaje === "mayor") {
      return puntajeB - puntajeA;
    }

    return puntajeA - puntajeB;
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

  const Tooltip = ({
    children,
    title,
    text,
    width = "w-80",
  }) => {
    const [visible, setVisible] =
      useState(false);

    const [coords, setCoords] =
      useState({
        top: 0,
        left: 0,
        placement: "top",
      });

    const triggerRef = useRef(null);

    const anchoPx =
      ANCHO_TOOLTIP[width] || 320;

    const tieneContenido =
      typeof text === "string" &&
      text.trim().length > 0;

    const calcularPosicion = () => {
      const el = triggerRef.current;

      if (!el) return;

      const rect =
        el.getBoundingClientRect();

      const margen = 10;

      const espacioArriba = rect.top;

      const espacioAbajo =
        window.innerHeight -
        rect.bottom;

      const placement =
        espacioArriba > 170 ||
        espacioArriba > espacioAbajo
          ? "top"
          : "bottom";

      let left =
        rect.left +
        rect.width / 2 -
        anchoPx / 2;

      if (left < margen) {
        left = margen;
      }

      if (
        left + anchoPx >
        window.innerWidth - margen
      ) {
        left =
          window.innerWidth -
          anchoPx -
          margen;
      }

      const top =
        placement === "top"
          ? rect.top - 10
          : rect.bottom + 10;

      setCoords({
        top,
        left,
        placement,
      });
    };

    useEffect(() => {
      if (!visible) return;

      calcularPosicion();

      const onScrollOrResize =
        () => calcularPosicion();

      window.addEventListener(
        "scroll",
        onScrollOrResize,
        true
      );

      window.addEventListener(
        "resize",
        onScrollOrResize
      );

      return () => {
        window.removeEventListener(
          "scroll",
          onScrollOrResize,
          true
        );

        window.removeEventListener(
          "resize",
          onScrollOrResize
        );
      };
    }, [visible]);

    if (!tieneContenido) {
      return <>{children}</>;
    }

    return (
      <div
        ref={triggerRef}
        className="w-full"
        onMouseEnter={() =>
          setVisible(true)
        }
        onMouseLeave={() =>
          setVisible(false)
        }
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
              className="
                pointer-events-none
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-3
                shadow-2xl
              "
            >
              <div className="flex items-start gap-2">
                <div
                  className="
                    mt-0.5
                    p-1.5
                    rounded-lg
                    bg-blue-50
                    text-[#006cb7]
                    shrink-0
                  "
                >
                  <Info size={13} />
                </div>

                <div className="text-left">
                  <p
                    className="
                      text-[11px]
                      font-bold
                      text-slate-800
                      mb-1
                    "
                  >
                    {title}
                  </p>

                  <p
                    className="
                      text-[11px]
                      leading-relaxed
                      text-slate-600
                    "
                  >
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

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6 text-left">



      {/* ======================================================
          FILTROS
      ======================================================= */}

      <div
        className="
          bg-white
          border
          border-slate-200
          rounded-2xl
          p-5
          shadow-sm
        "
      >
        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-4
            gap-4
            items-end
          "
        >
          {/* PERIODO */}

          <div>
            <label
              className="
                block
                text-[10px]
                font-bold
                uppercase
                tracking-wide
                text-slate-500
                mb-2
              "
            >
              Periodo
            </label>

            <div className="relative">
              <Activity
                size={15}
                className={`
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  ${
                    fechaFiltro
                      ? "text-slate-300"
                      : "text-[#006cb7]"
                  }
                `}
              />

              <select
                value={periodoFiltro}
                onChange={handlePeriodoChange}
                disabled={!!fechaFiltro}
                className={`
                  w-full
                  h-10
                  pl-10
                  pr-3
                  rounded-lg
                  border
                  text-xs
                  outline-none
                  transition

                  ${
                    fechaFiltro
                      ? `
                        bg-slate-100
                        border-slate-200
                        text-slate-400
                        cursor-not-allowed
                      `
                      : `
                        bg-white
                        border-slate-200
                        text-slate-700
                        focus:border-[#006cb7]
                        focus:ring-2
                        focus:ring-blue-100
                      `
                  }
                `}
              >
                <option value="">
                  Todos los registros
                </option>

                <option value="hoy">
                  Hoy
                </option>

                <option value="semana">
                  Esta semana
                </option>

                <option value="mes">
                  Este mes
                </option>

                <option value="3meses">
                  Últimos 3 meses
                </option>
              </select>
            </div>
          </div>

          {/* FECHA */}

          <div>
            <label
              className="
                block
                text-[10px]
                font-bold
                uppercase
                tracking-wide
                text-slate-500
                mb-2
              "
            >
              Fecha exacta
            </label>

            <div className="relative">
              <Calendar
                size={15}
                className={`
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  ${
                    periodoFiltro
                      ? "text-slate-300"
                      : "text-[#006cb7]"
                  }
                `}
              />

              <input
                type="date"
                value={fechaFiltro}
                onChange={handleFechaChange}
                disabled={!!periodoFiltro}
                className={`
                  w-full
                  h-10
                  pl-10
                  pr-3
                  rounded-lg
                  border
                  text-xs
                  outline-none
                  transition

                  ${
                    periodoFiltro
                      ? `
                        bg-slate-100
                        border-slate-200
                        text-slate-400
                        cursor-not-allowed
                      `
                      : `
                        bg-white
                        border-slate-200
                        text-slate-700
                        focus:border-[#006cb7]
                        focus:ring-2
                        focus:ring-blue-100
                      `
                  }
                `}
              />
            </div>
          </div>

          {/* BOTONES */}

          <div className="flex gap-2">
            <button
              onClick={aplicarFiltros}
              disabled={loading}
              className="
                flex-1
                h-10
                flex
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-[#006cb7]
                hover:bg-[#005a9c]
                text-white
                text-xs
                font-bold
                transition
                disabled:opacity-60
                disabled:cursor-not-allowed
              "
            >
              {loading ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Search size={15} />
              )}

              Buscar
            </button>

            <button
              onClick={limpiarFiltros}
              disabled={
                loading ||
                (!fechaFiltro &&
                  !periodoFiltro)
              }
              className="
                h-10
                px-4
                flex
                items-center
                justify-center
                gap-2
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
                disabled:opacity-40
                disabled:cursor-not-allowed
              "
            >
              <RefreshCw size={14} />
              Limpiar
            </button>
          </div>

          {/* RECALCULAR */}

          <button
            onClick={handleEjecutarCalculo}
            disabled={calculando || loading}
            className="
              h-10
              flex
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-blue-200
              bg-blue-50
              text-[#006cb7]
              hover:bg-blue-100
              text-xs
              font-bold
              transition
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {calculando ? (
              <Loader2
                size={15}
                className="animate-spin"
              />
            ) : (
              <RefreshCw size={15} />
            )}

            Recalcular desempeño
          </button>
        </div>
      </div>

      {/* ======================================================
          RESUMEN
      ======================================================= */}

      {resumen && (
        <>
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              xl:grid-cols-4
              gap-4
            "
          >
            {/* TOTAL */}

            <Tooltip
              title="Personal registrado"
              text={
                fechaFiltro
                  ? `Cantidad de trabajadores encontrados para el día ${fechaFiltro}.`
                  : periodoFiltro
                  ? `Cantidad de trabajadores encontrados durante el periodo seleccionado.`
                  : "Cantidad total de trabajadores encontrados en los registros disponibles."
              }
              width="w-80"
            >
              <div
                className="
                  bg-white
                  border
                  border-slate-200
                  rounded-2xl
                  p-5
                  shadow-sm
                  cursor-help
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                  "
                >
                  <div>
                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-400
                      "
                    >
                      Personal registrado
                    </p>

                    <p
                      className="
                        text-3xl
                        font-bold
                        text-slate-800
                        mt-2
                      "
                    >
                      {resumen.total}
                    </p>
                  </div>

                  <div
                    className="
                      p-3
                      rounded-xl
                      bg-blue-50
                      text-[#006cb7]
                      shrink-0
                    "
                  >
                    <Users size={20} />
                  </div>
                </div>
              </div>
            </Tooltip>

            {/* CRÍTICOS */}

            <Tooltip
              title="Atención crítica"
              text="Número de trabajadores clasificados como Crítico dentro del resultado filtrado."
              width="w-80"
            >
              <div
                className="
                  bg-white
                  border
                  border-red-200
                  rounded-2xl
                  p-5
                  shadow-sm
                  cursor-help
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                  "
                >
                  <div>
                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-red-500
                      "
                    >
                      Atención crítica
                    </p>

                    <p
                      className="
                        text-3xl
                        font-bold
                        text-red-700
                        mt-2
                      "
                    >
                      {resumen.criticos}
                    </p>
                  </div>

                  <div
                    className="
                      p-3
                      rounded-xl
                      bg-red-50
                      text-red-600
                    "
                  >
                    <AlertTriangle size={20} />
                  </div>
                </div>
              </div>
            </Tooltip>

            {/* REGULARES */}

            <Tooltip
              title="Desempeño regular"
              text="Número de trabajadores clasificados como Regular dentro del resultado filtrado."
              width="w-80"
            >
              <div
                className="
                  bg-white
                  border
                  border-amber-200
                  rounded-2xl
                  p-5
                  shadow-sm
                  cursor-help
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                  "
                >
                  <div>
                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-amber-600
                      "
                    >
                      Desempeño regular
                    </p>

                    <p
                      className="
                        text-3xl
                        font-bold
                        text-amber-700
                        mt-2
                      "
                    >
                      {resumen.regulares}
                    </p>
                  </div>

                  <div
                    className="
                      p-3
                      rounded-xl
                      bg-amber-50
                      text-amber-600
                    "
                  >
                    <AlertCircle size={20} />
                  </div>
                </div>
              </div>
            </Tooltip>

            {/* BUENOS + EXCELENTES */}

            <Tooltip
              title="Buen desempeño"
              text="Cantidad de trabajadores clasificados como Bueno o Excelente dentro del resultado filtrado."
              width="w-80"
            >
              <div
                className="
                  bg-white
                  border
                  border-emerald-200
                  rounded-2xl
                  p-5
                  shadow-sm
                  cursor-help
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                  "
                >
                  <div>
                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-emerald-600
                      "
                    >
                      Buen desempeño
                    </p>

                    <p
                      className="
                        text-3xl
                        font-bold
                        text-emerald-700
                        mt-2
                      "
                    >
                      {resumen.buenos +
                        resumen.excelentes}
                    </p>
                  </div>

                  <div
                    className="
                      p-3
                      rounded-xl
                      bg-emerald-50
                      text-emerald-600
                    "
                  >
                    <CheckCircle size={20} />
                  </div>
                </div>
              </div>
            </Tooltip>
          </div>

          {/* ====================================================
              COMPARATIVA: MEJOR Y PEOR
          ==================================================== */}

          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-4
            "
          >
            {/* MEJOR */}

            {resumen.mejorPuntaje && (
              <Tooltip
                title="Mejor desempeño"
                text="Trabajador con el puntaje más alto dentro del conjunto de trabajadores mostrado según el filtro seleccionado."
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
                    border
                    border-slate-200
                    rounded-2xl
                    p-5
                    shadow-sm
                    text-left
                    hover:border-emerald-300
                    hover:shadow-md
                    transition
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                    "
                  >
                    <div
                      className="
                        flex
                        items-center
                        gap-3
                        min-w-0
                      "
                    >
                      <div
                        className="
                          p-2.5
                          bg-emerald-50
                          text-emerald-600
                          rounded-xl
                        "
                      >
                        <Trophy size={18} />
                      </div>

                      <div className="min-w-0">
                        <p
                          className="
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wide
                            text-slate-400
                          "
                        >
                          Mejor desempeño
                        </p>

                        <p
                          className="
                            text-sm
                            font-bold
                            text-slate-700
                            mt-0.5
                            truncate
                          "
                        >
                          {resumen.mejorPuntaje.nombre}
                        </p>

                        <p
                          className="
                            text-[10px]
                            text-slate-400
                            mt-1
                          "
                        >
                          Código:{" "}
                          {resumen.mejorPuntaje.ccodprs}
                        </p>
                      </div>
                    </div>

                    <div
                      className="
                        text-right
                        shrink-0
                      "
                    >
                      <p
                        className="
                          text-xl
                          font-bold
                          text-emerald-600
                        "
                      >
                        {
                          resumen.mejorPuntaje
                            .ultimo_puntaje
                        }
                      </p>

                      <p
                        className="
                          text-[10px]
                          text-slate-400
                        "
                      >
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
                text="Trabajador con el puntaje más bajo dentro del conjunto de trabajadores mostrado según el filtro seleccionado."
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
                    border
                    border-slate-200
                    rounded-2xl
                    p-5
                    shadow-sm
                    text-left
                    hover:border-red-300
                    hover:shadow-md
                    transition
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                    "
                  >
                    <div
                      className="
                        flex
                        items-center
                        gap-3
                        min-w-0
                      "
                    >
                      <div
                        className="
                          p-2.5
                          bg-red-50
                          text-red-600
                          rounded-xl
                        "
                      >
                        <AlertCircle size={18} />
                      </div>

                      <div className="min-w-0">
                        <p
                          className="
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wide
                            text-slate-400
                          "
                        >
                          Requiere atención
                        </p>

                        <p
                          className="
                            text-sm
                            font-bold
                            text-slate-700
                            mt-0.5
                            truncate
                          "
                        >
                          {resumen.menorPuntaje.nombre}
                        </p>

                        <p
                          className="
                            text-[10px]
                            text-slate-400
                            mt-1
                          "
                        >
                          Código:{" "}
                          {resumen.menorPuntaje.ccodprs}
                        </p>
                      </div>
                    </div>

                    <div
                      className="
                        text-right
                        shrink-0
                      "
                    >
                      <p
                        className="
                          text-xl
                          font-bold
                          text-red-600
                        "
                      >
                        {
                          resumen.menorPuntaje
                            .ultimo_puntaje
                        }
                      </p>

                      <p
                        className="
                          text-[10px]
                          text-slate-400
                        "
                      >
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

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-[1fr_auto]
          gap-3
        "
      >
        {/* BUSCADOR */}

        <div
          className="
            bg-white
            border
            border-slate-200
            rounded-2xl
            p-4
            shadow-sm
            flex
            items-center
            gap-3
          "
        >
          <Search
            size={18}
            className="
              text-slate-400
              ml-2
              shrink-0
            "
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
              className="
                text-slate-400
                hover:text-slate-600
                shrink-0
              "
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ORDENAR POR PUNTAJE */}

        <div
          className="
            bg-white
            border
            border-slate-200
            rounded-2xl
            p-4
            shadow-sm
            flex
            items-center
            gap-3
          "
        >
          <div
            className="
              p-2
              bg-blue-50
              text-[#006cb7]
              rounded-lg
              shrink-0
            "
          >
            {ordenPuntaje === "mayor" ? (
              <ArrowDownWideNarrow size={17} />
            ) : (
              <ArrowUpWideNarrow size={17} />
            )}
          </div>

          <div className="min-w-[180px]">
            <label
              className="
                block
                text-[10px]
                font-bold
                uppercase
                tracking-wide
                text-slate-400
                mb-1
              "
            >
              Comparar por puntaje
            </label>

            <select
              value={ordenPuntaje}
              onChange={(e) =>
                setOrdenPuntaje(e.target.value)
              }
              className="
                w-full
                text-xs
                font-semibold
                text-slate-700
                bg-transparent
                outline-none
                cursor-pointer
              "
            >
              <option value="mayor">
                Mayor → menor
              </option>

              <option value="menor">
                Menor → mayor
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================
          TABLA
      ======================================================= */}

      <div
        className="
          bg-white
          border
          border-slate-200
          rounded-2xl
          p-6
          shadow-sm
        "
      >
        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-3
            mb-4
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
              min-w-0
            "
          >
            <div
              className="
                p-2.5
                bg-blue-50
                text-[#006cb7]
                rounded-xl
              "
            >
              <Users size={18} />
            </div>

            <div className="min-w-0">
              <h2
                className="
                  text-sm
                  font-bold
                  text-slate-700
                  uppercase
                  tracking-wide
                "
              >
                Personal Registrado
              </h2>

              <p
                className="
                  text-[10px]
                  text-slate-400
                  mt-1
                "
              >
                Comparativa de trabajadores ordenada por puntaje de desempeño.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span
              className="
                text-[10px]
                font-bold
                text-slate-400
                uppercase
              "
            >
              {trabajadoresFiltrados.length} registros
            </span>

            <p
              className="
                text-[9px]
                text-[#006cb7]
                mt-1
                font-semibold
              "
            >
              {ordenPuntaje === "mayor"
                ? "Mayor puntaje primero"
                : "Menor puntaje primero"}
            </p>
          </div>
        </div>

        <div
          className="
            border
            border-slate-200
            rounded-xl
            overflow-auto
            max-h-[500px]
          "
        >
          {loading ? (
            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                py-16
                text-slate-400
                gap-2
              "
            >
              <Loader2
                className="
                  animate-spin
                  text-[#006cb7]
                "
                size={26}
              />

              <p className="text-xs">
                Cargando personal...
              </p>
            </div>
          ) : trabajadoresFiltrados.length === 0 ? (
            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                py-16
                text-slate-400
                gap-2
              "
            >
              <div
                className="
                  p-3
                  bg-slate-50
                  rounded-xl
                "
              >
                <Database size={24} />
              </div>

              <p
                className="
                  text-xs
                  font-medium
                  text-slate-500
                "
              >
                {busqueda
                  ? "No se encontraron trabajadores con esa búsqueda."
                  : "No se encontraron registros de personal."}
              </p>

              {busqueda && (
                <button
                  onClick={() =>
                    setBusqueda("")
                  }
                  className="
                    text-[10px]
                    font-bold
                    text-[#006cb7]
                    hover:underline
                  "
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <table
              className="
                w-full
                min-w-[1050px]
                text-left
                text-xs
                border-collapse
              "
            >
              <thead
                className="
                  sticky
                  top-0
                  z-10
                  bg-slate-50
                  text-slate-600
                  uppercase
                "
              >
                <tr
                  className="
                    border-b
                    border-slate-200
                  "
                >
                  <th
                    className="
                      px-4
                      py-3
                      font-bold
                      whitespace-nowrap
                      bg-slate-50
                    "
                  >
                    #
                  </th>

                  <th
                    className="
                      px-5
                      py-3
                      font-bold
                      whitespace-nowrap
                      bg-slate-50
                    "
                  >
                    Código
                  </th>

                  <th
                    className="
                      px-5
                      py-3
                      font-bold
                      whitespace-nowrap
                      bg-slate-50
                      min-w-[250px]
                    "
                  >
                    Nombre
                  </th>

                  <th
                    className="
                      px-5
                      py-3
                      font-bold
                      whitespace-nowrap
                      bg-slate-50
                      min-w-[150px]
                    "
                  >
                    Puntaje
                  </th>

                  <th
                    className="
                      px-5
                      py-3
                      font-bold
                      whitespace-nowrap
                      bg-slate-50
                      min-w-[150px]
                    "
                  >
                    Clasificación
                  </th>

                  <th
                    className="
                      px-5
                      py-3
                      font-bold
                      text-center
                      whitespace-nowrap
                      bg-slate-50
                      min-w-[150px]
                    "
                  >
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody
                className="
                  divide-y
                  divide-slate-100
                "
              >
                {trabajadoresFiltrados.map(
                  (t, index) => {
                    const esPrimero =
                      index === 0 &&
                      ordenPuntaje === "mayor" &&
                      t.ultimo_puntaje !== null &&
                      t.ultimo_puntaje !== undefined;

                    const esUltimo =
                      index ===
                        trabajadoresFiltrados.length - 1 &&
                      ordenPuntaje === "mayor" &&
                      t.ultimo_puntaje !== null &&
                      t.ultimo_puntaje !== undefined;

                    return (
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

                          ${
                            esPrimero
                              ? "bg-emerald-50/40"
                              : ""
                          }

                          ${
                            esUltimo
                              ? "bg-red-50/20"
                              : ""
                          }
                        `}
                      >
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
                                esPrimero
                                  ? "bg-emerald-100 text-emerald-700"
                                  : esUltimo
                                  ? "bg-red-100 text-red-700"
                                  : t.ultima_clasificacion ===
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

                        <td className="px-5 py-4">
                          <span
                            className="
                              font-mono
                              text-[11px]
                              font-bold
                              text-[#006cb7]
                              whitespace-nowrap
                            "
                          >
                            {t.ccodprs || "--"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div
                            className="
                              font-semibold
                              text-slate-800
                              whitespace-nowrap
                            "
                          >
                            {t.nombre || "--"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {esPrimero && (
                              <Trophy
                                size={15}
                                className="text-emerald-500"
                              />
                            )}

                            {esUltimo && (
                              <AlertCircle
                                size={15}
                                className="text-red-500"
                              />
                            )}

                            <span
                              className={`
                                font-bold
                                whitespace-nowrap
                                ${
                                  esPrimero
                                    ? "text-emerald-600"
                                    : esUltimo
                                    ? "text-red-600"
                                    : "text-slate-800"
                                }
                              `}
                            >
                              {t.ultimo_puntaje !==
                                null &&
                              t.ultimo_puntaje !==
                                undefined
                                ? `${t.ultimo_puntaje} pts`
                                : "--"}
                            </span>
                          </div>
                        </td>

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
                    );
                  }
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
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/40
            backdrop-blur-sm
            p-4
          "
        >
          <div
            className="
              bg-white
              rounded-2xl
              w-full
              max-w-6xl
              max-h-[92vh]
              overflow-hidden
              shadow-2xl
            "
          >
            {/* HEADER */}

            <div
              className="
                flex
                items-start
                justify-between
                gap-6
                p-6
                border-b
                border-slate-200
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                  min-w-0
                "
              >
                <div
                  className="
                    p-3
                    bg-blue-50
                    text-[#006cb7]
                    rounded-xl
                    shrink-0
                  "
                >
                  <Users size={22} />
                </div>

                <div className="min-w-0">
                  <h2
                    className="
                      text-base
                      font-bold
                      text-slate-800
                      uppercase
                      tracking-wide
                      truncate
                    "
                  >
                    {detalle?.nombre ||
                      "Ficha del trabajador"}
                  </h2>

                  <p
                    className="
                      text-xs
                      text-slate-500
                      mt-1
                    "
                  >
                    Código:{" "}
                    <span
                      className="
                        font-mono
                        font-semibold
                        text-slate-700
                      "
                    >
                      {detalle?.ccodprs ||
                        "--"}
                    </span>
                  </p>
                </div>
              </div>

              <div
                className="
                  flex
                  items-start
                  gap-5
                  shrink-0
                "
              >
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

                    <p
                      className="
                        text-2xl
                        font-bold
                        text-slate-800
                        mt-2
                      "
                    >
                      {detalle.ultimo_puntaje !==
                        null &&
                      detalle.ultimo_puntaje !==
                        undefined
                        ? detalle.ultimo_puntaje
                        : "--"}
                    </p>

                    <p
                      className="
                        text-[10px]
                        text-slate-400
                      "
                    >
                      Último puntaje
                    </p>
                  </div>
                )}

                <button
                  onClick={cerrarDetalle}
                  title="Cerrar ficha"
                  className="
                    p-2
                    rounded-lg
                    text-slate-400
                    hover:bg-slate-100
                    hover:text-slate-700
                    transition
                  "
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* BODY */}

            <div
              className="
                p-6
                overflow-y-auto
                max-h-[calc(92vh-105px)]
              "
            >
              {loadingDetalle ? (
                <div
                  className="
                    flex
                    flex-col
                    items-center
                    justify-center
                    py-16
                    text-slate-400
                    gap-2
                  "
                >
                  <Loader2
                    size={26}
                    className="
                      animate-spin
                      text-[#006cb7]
                    "
                  />

                  <p className="text-xs">
                    Cargando información detallada...
                  </p>
                </div>
              ) : detalle ? (
                <>
                  {/* RESUMEN */}

                  <div
                    className="
                      grid
                      grid-cols-1
                      md:grid-cols-3
                      gap-4
                      mb-6
                    "
                  >
                    {/* ÚLTIMA EVALUACIÓN */}

                    <div
                      className="
                        bg-slate-50
                        border
                        border-slate-200
                        rounded-xl
                        p-4
                        flex
                        items-center
                        gap-3
                      "
                    >
                      <div
                        className="
                          p-2.5
                          bg-blue-50
                          text-[#006cb7]
                          rounded-lg
                        "
                      >
                        <Calendar size={18} />
                      </div>

                      <div>
                        <p
                          className="
                            text-[10px]
                            uppercase
                            font-bold
                            text-slate-400
                          "
                        >
                          Última evaluación
                        </p>

                        <p
                          className="
                            text-sm
                            font-semibold
                            text-slate-700
                            mt-1
                          "
                        >
                          {detalle.fecha_ultima_evaluacion ||
                            "Sin registro"}
                        </p>
                      </div>
                    </div>

                    {/* ALERTAS */}

                    <div
                      className="
                        bg-slate-50
                        border
                        border-slate-200
                        rounded-xl
                        p-4
                        flex
                        items-center
                        gap-3
                      "
                    >
                      <div
                        className="
                          p-2.5
                          bg-amber-50
                          text-amber-600
                          rounded-lg
                        "
                      >
                        <AlertTriangle size={18} />
                      </div>

                      <div>
                        <p
                          className="
                            text-[10px]
                            uppercase
                            font-bold
                            text-slate-400
                          "
                        >
                          Alertas pendientes
                        </p>

                        <p
                          className="
                            text-sm
                            font-semibold
                            text-slate-700
                            mt-1
                          "
                        >
                          {detalle.total_alertas_pendientes ??
                            0}{" "}
                          alertas
                        </p>
                      </div>
                    </div>

                    {/* RUTA */}

                    <div
                      className="
                        bg-slate-50
                        border
                        border-slate-200
                        rounded-xl
                        p-4
                        flex
                        items-center
                        gap-3
                      "
                    >
                      <div
                        className="
                          p-2.5
                          bg-emerald-50
                          text-emerald-600
                          rounded-lg
                        "
                      >
                        <Activity size={18} />
                      </div>

                      <div className="min-w-0">
                        <p
                          className="
                            text-[10px]
                            uppercase
                            font-bold
                            text-slate-400
                          "
                        >
                          Ruta actual
                        </p>

                        <p
                          className="
                            text-sm
                            font-semibold
                            text-slate-700
                            mt-1
                            truncate
                          "
                        >
                          {detalle.ruta_actual ||
                            "Sin ruta"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* DATOS ACTUALES */}

                  <div
                    className="
                      grid
                      grid-cols-1
                      md:grid-cols-2
                      gap-4
                      mb-6
                    "
                  >
                    <div
                      className="
                        border
                        border-slate-200
                        rounded-xl
                        p-4
                      "
                    >
                      <p
                        className="
                          text-[10px]
                          uppercase
                          font-bold
                          text-slate-400
                        "
                      >
                        Metfac actual
                      </p>

                      <p
                        className="
                          text-sm
                          font-semibold
                          text-slate-700
                          mt-2
                        "
                      >
                        {detalle.metfac_actual ||
                          "Sin metfac"}
                      </p>
                    </div>

                    <div
                      className="
                        border
                        border-slate-200
                        rounded-xl
                        p-4
                      "
                    >
                      <p
                        className="
                          text-[10px]
                          uppercase
                          font-bold
                          text-slate-400
                        "
                      >
                        Puntaje actual
                      </p>

                      <p
                        className="
                          text-xl
                          font-bold
                          text-[#006cb7]
                          mt-1
                        "
                      >
                        {detalle.ultimo_puntaje ??
                          "--"}{" "}
                        pts
                      </p>
                    </div>
                  </div>

                  {/* HISTORIAL */}

                  <div
                    className="
                      flex
                      flex-col
                      lg:flex-row
                      lg:items-center
                      lg:justify-between
                      gap-4
                      mb-4
                    "
                  >
                    <div>
                      <h3
                        className="
                          text-sm
                          font-bold
                          text-slate-700
                          uppercase
                          tracking-wide
                        "
                      >
                        Historial de asistencia
                      </h3>

                      <p
                        className="
                          text-[10px]
                          text-slate-400
                          mt-1
                        "
                      >
                        Registro histórico de rendimiento y lecturas.
                      </p>
                    </div>
                  </div>

                  {/* FILTRO HISTORIAL */}

                  <div
                    className="
                      bg-slate-50
                      border
                      border-slate-200
                      rounded-xl
                      p-4
                      mb-5
                    "
                  >
                    <div
                      className="
                        grid
                        grid-cols-1
                        md:grid-cols-[1fr_1fr_auto]
                        gap-3
                        items-end
                      "
                    >
                      <div>
                        <label
                          className="
                            block
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wide
                            text-slate-500
                            mb-2
                          "
                        >
                          Desde
                        </label>

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
                            px-3
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
                          "
                        />
                      </div>

                      <div>
                        <label
                          className="
                            block
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wide
                            text-slate-500
                            mb-2
                          "
                        >
                          Hasta
                        </label>

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
                            px-3
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
                          "
                        />
                      </div>

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
                            text-xs
                            font-bold
                          "
                        >
                          Limpiar
                        </button>
                      )}
                    </div>

                    <div
                      className="
                        flex
                        flex-col
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                        gap-2
                        mt-4
                        pt-3
                        border-t
                        border-slate-200
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          gap-2
                        "
                      >
                        <Info
                          size={14}
                          className="text-[#006cb7]"
                        />

                        <p
                          className="
                            text-[10px]
                            text-slate-500
                          "
                        >
                          {fechaDesde &&
                          fechaHasta
                            ? `Mostrando registros desde ${fechaDesde} hasta ${fechaHasta}.`
                            : fechaDesde
                            ? `Mostrando registros desde ${fechaDesde}.`
                            : fechaHasta
                            ? `Mostrando registros hasta ${fechaHasta}.`
                            : "Mostrando todo el historial disponible."}
                        </p>
                      </div>

                      <span
                        className="
                          text-[10px]
                          font-bold
                          text-[#006cb7]
                        "
                      >
                        {historialFiltrado.length}{" "}
                        registros
                      </span>
                    </div>
                  </div>

                  {/* TABLA HISTORIAL */}

                  {historialFiltrado.length === 0 ? (
                    <div
                      className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        py-12
                        bg-slate-50
                        border
                        border-slate-200
                        rounded-xl
                      "
                    >
                      <p
                        className="
                          text-xs
                          text-center
                          text-slate-500
                        "
                      >
                        {detalle.historial_asistencia
                          ?.length > 0
                          ? "No existen registros para el rango seleccionado."
                          : "No hay registros de asistencia."}
                      </p>
                    </div>
                  ) : (
                    <div
                      className="
                        border
                        border-slate-200
                        rounded-xl
                        overflow-auto
                        max-h-[400px]
                      "
                    >
                      <table
                        className="
                          w-full
                          min-w-[1000px]
                          text-left
                          text-xs
                          border-collapse
                        "
                      >
                        <thead
                          className="
                            sticky
                            top-0
                            z-10
                            bg-slate-50
                            text-slate-600
                            uppercase
                          "
                        >
                          <tr>
                            <th
                              className="
                                px-5
                                py-3
                                font-bold
                                bg-slate-50
                              "
                            >
                              Fecha
                            </th>

                            <th
                              className="
                                px-5
                                py-3
                                font-bold
                                bg-slate-50
                              "
                            >
                              Ruta
                            </th>

                            <th
                              className="
                                px-5
                                py-3
                                font-bold
                                bg-slate-50
                              "
                            >
                              Metfac
                            </th>

                            <th
                              className="
                                px-5
                                py-3
                                font-bold
                                bg-slate-50
                              "
                            >
                              Lecturas prog.
                            </th>

                            <th
                              className="
                                px-5
                                py-3
                                font-bold
                                bg-slate-50
                              "
                            >
                              Realizadas
                            </th>

                            <th
                              className="
                                px-5
                                py-3
                                font-bold
                                bg-slate-50
                              "
                            >
                              Eficiencia
                            </th>

                            <th
                              className="
                                px-5
                                py-3
                                font-bold
                                bg-slate-50
                              "
                            >
                              Duración
                            </th>
                          </tr>
                        </thead>

                        <tbody
                          className="
                            divide-y
                            divide-slate-100
                          "
                        >
                          {historialFiltrado.map(
                            (h, i) => (
                              <tr
                                key={i}
                                className="
                                  hover:bg-slate-50/70
                                  transition
                                "
                              >
                                <td
                                  className="
                                    px-5
                                    py-4
                                    font-semibold
                                    text-slate-700
                                  "
                                >
                                  {h.fecha || "--"}
                                </td>

                                <td
                                  className="
                                    px-5
                                    py-4
                                    text-slate-600
                                  "
                                >
                                  {h.ruta_id ||
                                    "--"}
                                </td>

                                <td
                                  className="
                                    px-5
                                    py-4
                                    text-slate-600
                                  "
                                >
                                  {h.cmetfac ||
                                    "--"}
                                </td>

                                <td
                                  className="
                                    px-5
                                    py-4
                                    text-slate-600
                                  "
                                >
                                  {h.cantidad_lecturas ??
                                    0}
                                </td>

                                <td
                                  className="
                                    px-5
                                    py-4
                                    font-semibold
                                    text-slate-700
                                  "
                                >
                                  {h.lecturas_realizadas ??
                                    0}
                                </td>

                                <td className="px-5 py-4">
                                  <div
                                    className="
                                      flex
                                      items-center
                                      gap-2
                                    "
                                  >
                                    <Gauge
                                      size={15}
                                      className="text-[#006cb7]"
                                    />

                                    <span
                                      className="
                                        font-bold
                                        text-[#006cb7]
                                      "
                                    >
                                      {formatearEficiencia(
                                        h.eficiencia
                                      )}
                                    </span>
                                  </div>
                                </td>

                                <td
                                  className="
                                    px-5
                                    py-4
                                    text-slate-600
                                  "
                                >
                                  <div
                                    className="
                                      flex
                                      items-center
                                      gap-2
                                    "
                                  >
                                    <Clock3
                                      size={15}
                                      className="text-slate-400"
                                    />

                                    {formatearDuracion(
                                      h.duracion_total_min
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* EXPLICACIÓN */}

                  <div
                    className="
                      mt-6
                      bg-blue-50
                      border
                      border-blue-100
                      rounded-xl
                      p-4
                    "
                  >
                    <div
                      className="
                        flex
                        items-start
                        gap-3
                      "
                    >
                      <div
                        className="
                          p-2
                          bg-white
                          rounded-lg
                          text-[#006cb7]
                        "
                      >
                        <Info size={17} />
                      </div>

                      <div>
                        <h4
                          className="
                            text-xs
                            font-bold
                            text-slate-700
                          "
                        >
                          ¿Qué significa esta información?
                        </h4>

                        <div
                          className="
                            grid
                            grid-cols-1
                            md:grid-cols-2
                            gap-x-8
                            gap-y-3
                            mt-3
                          "
                        >
                          <p
                            className="
                              text-[11px]
                              text-slate-600
                            "
                          >
                            <strong>
                              Lecturas programadas:
                            </strong>{" "}
                            cantidad de lecturas asignadas.
                          </p>

                          <p
                            className="
                              text-[11px]
                              text-slate-600
                            "
                          >
                            <strong>
                              Realizadas:
                            </strong>{" "}
                            lecturas completadas.
                          </p>

                          <p
                            className="
                              text-[11px]
                              text-slate-600
                            "
                          >
                            <strong>
                              Eficiencia:
                            </strong>{" "}
                            porcentaje de cumplimiento.
                          </p>

                          <p
                            className="
                              text-[11px]
                              text-slate-600
                            "
                          >
                            <strong>
                              Duración:
                            </strong>{" "}
                            tiempo total empleado.
                          </p>

                          <p
                            className="
                              text-[11px]
                              text-slate-600
                            "
                          >
                            <strong>
                              Puntaje:
                            </strong>{" "}
                            valor utilizado para comparar el desempeño entre trabajadores.
                          </p>

                          <p
                            className="
                              text-[11px]
                              text-slate-600
                            "
                          >
                            <strong>
                              Clasificación:
                            </strong>{" "}
                            categoría asignada según el desempeño obtenido.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CERRAR */}

                  <div
                    className="
                      flex
                      justify-end
                      mt-6
                    "
                  >
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
                      "
                    >
                      <CheckCircle size={16} />
                      Cerrar ficha
                    </button>
                  </div>
                </>
              ) : (
                <div
                  className="
                    flex
                    flex-col
                    items-center
                    justify-center
                    py-12
                    text-slate-400
                    gap-2
                  "
                >
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