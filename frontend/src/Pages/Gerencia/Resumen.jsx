import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  TrendingUp,
  BarChart3,
  Users,
  CalendarDays,
  RefreshCw,
  AlertCircle,
  Target,
  Zap,
  Clock3,
  Ban,
  MessageSquare,
  Info,
} from "lucide-react";

// =====================================================
// API GERENCIA
// =====================================================
import { obtenerResumenGrupoFacturacion } from "../../services/gerenciaService";

// =====================================================
// API SUPERVISOR
// NO MODIFICAMOS ESTE SERVICE
// =====================================================
import { obtenerResumenLectura } from "../../services/LecturaKPIService";

// =====================================================
// GERENCIA - ANALÍTICA EJECUTIVA
// =====================================================
export default function Resumen() {
  // ===================================================
  // FECHA ACTUAL
  // ===================================================
  const hoy = new Date().toISOString().split("T")[0];

  // ===================================================
  // FILTROS
  // ===================================================
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [cmetfac, setCmetfac] = useState("");

  // ===================================================
  // DATOS API GERENCIA / SUPERVISOR
  // ===================================================
  const [resumenGerencia, setResumenGerencia] = useState(null);
  const [resumenSupervisor, setResumenSupervisor] = useState(null);

  // ===================================================
  // ESTADOS
  // ===================================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===================================================
  // CONTROL DEL PRIMER RENDER
  // Evita hacer doble petición al cargar la página
  // ===================================================
  const primerRenderRef = useRef(true);

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

      const [gerencia, supervisor] = await Promise.all([
        obtenerResumenGrupoFacturacion({
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin || null,
          cmetfac: cmetfac || null,
        }),

        obtenerResumenLectura(
          fechaInicio,
          fechaFin
        ),
      ]);

      setResumenGerencia(gerencia);
      setResumenSupervisor(supervisor);

    } catch (err) {
      console.error(
        "Error cargando analítica ejecutiva:",
        err
      );

      if (err.response?.status === 422) {
        setError(
          "Los parámetros enviados no son válidos. Revisa las fechas seleccionadas."
        );
      } else if (err.response?.status === 404) {
        setError(
          "No se encontró uno de los servicios solicitados."
        );
      } else {
        setError(
          "No se pudo obtener la información de analítica ejecutiva."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // CARGA INICIAL
  // ===================================================
  useEffect(() => {
    cargarDatos();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===================================================
  // RECARGA AUTOMÁTICA AL CAMBIAR FILTROS
  //
  // Se ejecuta cuando cambia:
  // - fechaInicio
  // - fechaFin
  // - cmetfac
  //
  // Se espera 400ms para evitar múltiples peticiones.
  // ===================================================
  useEffect(() => {
    if (primerRenderRef.current) {
      primerRenderRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      cargarDatos();
    }, 400);

    return () => clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin, cmetfac]);

  // ===================================================
  // FORMATEAR NÚMEROS
  // ===================================================
  const formatearNumero = (valor) => {
    if (valor === null || valor === undefined) {
      return "0";
    }

    const numero = Number(valor);

    if (Number.isNaN(numero)) {
      return "0";
    }

    return numero.toLocaleString("es-PE");
  };

  // ===================================================
  // FORMATEAR PORCENTAJE
  // ===================================================
  const formatearPorcentaje = (valor) => {
    if (valor === null || valor === undefined) {
      return "0%";
    }

    const numero = Number(valor);

    if (Number.isNaN(numero)) {
      return "0%";
    }

    if (numero > 0 && numero <= 1) {
      return `${(numero * 100).toFixed(1)}%`;
    }

    return `${numero.toFixed(1)}%`;
  };

  // ===================================================
  // FORMATEAR TIEMPO
  // ===================================================
  const formatearTiempo = (valor) => {
    if (valor === null || valor === undefined) {
      return "0 min";
    }

    const numero = Number(valor);

    if (Number.isNaN(numero)) {
      return `${valor}`;
    }

    return `${numero.toFixed(2)} min`;
  };

  // ===================================================
  // DATOS DE GERENCIA
  // ===================================================
  const lecturasRealizadas =
    resumenGerencia?.total_lecturas_realizadas ?? 0;

  const eficienciaPromedio =
    resumenGerencia?.eficiencia_promedio ?? 0;

  const registrosAnalizados =
    resumenGerencia?.total_registros_analizados ?? 0;

  const lectoresEvaluados =
    resumenGerencia?.total_lectores_evaluados ?? 0;

  // ===================================================
  // DATOS DEL SUPERVISOR
  // SOLO LOS 5 INDICADORES SOLICITADOS
  // ===================================================
  const cumplimiento =
    resumenSupervisor?.cumplimiento_lectura ?? 0;

  const productividad =
    resumenSupervisor?.productividad_lectura ?? 0;

  const tiempoPromedio =
    resumenSupervisor?.tiempo_promedio_lectura ?? 0;

  const impedimentos =
    resumenSupervisor?.impedimentos_lectura ?? 0;

  const observaciones =
    resumenSupervisor?.observaciones_lectura ?? 0;

  // ===================================================
  // TOOLTIP PERSONALIZADO
  // ===================================================
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

    const anchoPx =
      ANCHO_TOOLTIP[width] || 320;

    const tieneContenido =
      typeof text === "string" &&
      text.trim().length > 0;

    const calcularPosicion = () => {
      const el = triggerRef.current;

      if (!el) return;

      const rect = el.getBoundingClientRect();

      const margen = 10;

      const espacioArriba = rect.top;

      const espacioAbajo =
        window.innerHeight - rect.bottom;

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

      const onScrollOrResize = () =>
        calcularPosicion();

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

      // eslint-disable-next-line react-hooks/exhaustive-deps
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
              className="pointer-events-none rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xl"
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 shrink-0 rounded-lg bg-blue-50 p-1.5 text-[#006cb7]">
                  <Info size={13} />
                </div>

                <div className="text-left">
                  <p className="mb-1 text-[11px] font-bold text-slate-800">
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

  // ===================================================
  // TARJETA KPI
  // ===================================================
  const TarjetaKPI = ({
    titulo,
    valor,
    descripcion,
    icono,
    fondo,
    texto,
    tooltipTitulo,
    tooltipTexto,
  }) => {
    return (
      <Tooltip
        title={tooltipTitulo || titulo}
        text={tooltipTexto}
        width="w-96"
      >
        <div className="h-full cursor-help rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {titulo}
              </p>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {valor}
              </p>
            </div>

            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${fondo} ${texto}`}
            >
              {icono}
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-400">
            {descripcion}
          </p>
        </div>
      </Tooltip>
    );
  };

  // ===================================================
  // RENDER
  // ===================================================
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* =================================================
            FILTROS
        ================================================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex items-center gap-3">
            <div className="shrink-0 rounded-xl bg-blue-50 p-2.5 text-[#006cb7]">
              <CalendarDays size={18} />
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                Filtros de análisis
              </h2>

              <p className="mt-1 text-[10px] text-slate-400">
                Los indicadores se actualizan automáticamente al cambiar el periodo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* FECHA INICIO */}
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

            {/* FECHA FIN */}
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
                  min={fechaInicio}
                  onChange={(e) =>
                    setFechaFin(e.target.value)
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs text-slate-700 outline-none transition focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

          </div>

         

          {/* ESTADO DE ACTUALIZACIÓN */}
          {loading && (
            <div className="mt-3 flex items-center justify-end gap-2 text-[10px] font-medium text-[#006cb7]">
              <RefreshCw
                size={12}
                className="animate-spin"
              />
              Actualizando indicadores...
            </div>
          )}

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
            LOADING
        ================================================= */}
        {loading &&
        !resumenGerencia &&
        !resumenSupervisor ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              )
            )}

          </div>
        ) : (
          <>

            {/* =================================================
                RESUMEN EJECUTIVO
            ================================================= */}
            <div className="flex items-center gap-3">

              <div className="shrink-0 rounded-xl bg-blue-50 p-2.5 text-[#006cb7]">
                <BarChart3 size={18} />
              </div>

              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                  Resumen ejecutivo
                </h2>

                <p className="mt-1 text-[10px] text-slate-400">
                  Indicadores generales del periodo seleccionado.
                </p>
              </div>

            </div>

            <div
              className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 transition-opacity ${
                loading
                  ? "opacity-60"
                  : "opacity-100"
              }`}
            >

              {/* LECTURAS REALIZADAS */}
              <TarjetaKPI
                titulo="Lecturas realizadas"
                valor={formatearNumero(
                  lecturasRealizadas
                )}
                descripcion="Total de lecturas realizadas en el periodo"
                icono={
                  <BookOpen size={20} />
                }
                fondo="bg-blue-50"
                texto="text-blue-600"
                tooltipTitulo="Lecturas realizadas"
                tooltipTexto="Suma total de lecturas que efectivamente se completaron dentro del rango de fechas seleccionado, considerando a todos los grupos de facturación filtrados."
              />

              {/* EFICIENCIA */}
              <TarjetaKPI
                titulo="Eficiencia promedio"
                valor={formatearPorcentaje(
                  eficienciaPromedio
                )}
                descripcion="Eficiencia promedio registrada"
                icono={
                  <TrendingUp size={20} />
                }
                fondo="bg-emerald-50"
                texto="text-emerald-600"
                tooltipTitulo="Eficiencia promedio"
                tooltipTexto="Promedio de la eficiencia individual de cada registro analizado en el periodo. Un valor más alto indica un mejor desempeño general."
              />

              {/* REGISTROS */}
              <TarjetaKPI
                titulo="Registros analizados"
                valor={formatearNumero(
                  registrosAnalizados
                )}
                descripcion="Registros considerados en el análisis"
                icono={
                  <BarChart3 size={20} />
                }
                fondo="bg-violet-50"
                texto="text-violet-600"
                tooltipTitulo="Registros analizados"
                tooltipTexto="Cantidad total de registros que el sistema tomó en cuenta para calcular los indicadores del periodo seleccionado."
              />

              {/* LECTORES */}
              <TarjetaKPI
                titulo="Lectores evaluados"
                valor={formatearNumero(
                  lectoresEvaluados
                )}
                descripcion="Personal incluido en la evaluación"
                icono={
                  <Users size={20} />
                }
                fondo="bg-amber-50"
                texto="text-amber-600"
                tooltipTitulo="Lectores evaluados"
                tooltipTexto="Número de trabajadores distintos que tuvieron al menos un registro dentro del periodo seleccionado."
              />

            </div>

            {/* =================================================
                INDICADORES OPERATIVOS
            ================================================= */}
            <div className="flex items-center gap-3 pt-2">

              <div className="shrink-0 rounded-xl bg-blue-50 p-2.5 text-[#006cb7]">
                <Target size={18} />
              </div>

              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                  Indicadores operativos
                </h2>

                <p className="mt-1 text-[10px] text-slate-400">
                  Métricas de cumplimiento, productividad y control operativo.
                </p>
              </div>

            </div>

            <div
              className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 transition-opacity ${
                loading
                  ? "opacity-60"
                  : "opacity-100"
              }`}
            >

              {/* CUMPLIMIENTO */}
              <TarjetaKPI
                titulo="Cumplimiento"
                valor={formatearPorcentaje(
                  cumplimiento
                )}
                descripcion="Cumplimiento de las lecturas programadas"
                icono={
                  <Target size={20} />
                }
                fondo="bg-cyan-50"
                texto="text-cyan-600"
                tooltipTitulo="Cumplimiento"
                tooltipTexto="Porcentaje de lecturas efectivamente realizadas frente a las lecturas programadas para el periodo."
              />

              {/* PRODUCTIVIDAD */}
              <TarjetaKPI
                titulo="Productividad"
                valor={formatearPorcentaje(
                  productividad
                )}
                descripcion="Productividad registrada en las lecturas"
                icono={
                  <Zap size={20} />
                }
                fondo="bg-yellow-50"
                texto="text-yellow-600"
                tooltipTitulo="Productividad"
                tooltipTexto="Mide el rendimiento del personal en función del tiempo empleado y la cantidad de lecturas completadas."
              />

              {/* TIEMPO PROMEDIO */}
              <TarjetaKPI
                titulo="Tiempo promedio"
                valor={formatearTiempo(
                  tiempoPromedio
                )}
                descripcion="Tiempo promedio empleado por lectura"
                icono={
                  <Clock3 size={20} />
                }
                fondo="bg-indigo-50"
                texto="text-indigo-600"
                tooltipTitulo="Tiempo promedio"
                tooltipTexto="Promedio de minutos empleados para completar una lectura durante el periodo seleccionado."
              />

              {/* IMPEDIMENTOS */}
              <TarjetaKPI
                titulo="Impedimentos"
                valor={formatearNumero(
                  impedimentos
                )}
                descripcion="Impedimentos registrados durante las lecturas"
                icono={
                  <Ban size={20} />
                }
                fondo="bg-red-50"
                texto="text-red-600"
                tooltipTitulo="Impedimentos"
                tooltipTexto="Cantidad de impedimentos registrados durante el proceso de lectura, como medidores inaccesibles, propiedades cerradas u otras causas."
              />

              {/* OBSERVACIONES */}
              <TarjetaKPI
                titulo="Observaciones"
                valor={formatearNumero(
                  observaciones
                )}
                descripcion="Observaciones registradas durante las lecturas"
                icono={
                  <MessageSquare size={20} />
                }
                fondo="bg-orange-50"
                texto="text-orange-600"
                tooltipTitulo="Observaciones"
                tooltipTexto="Número de observaciones o comentarios registrados junto a las lecturas durante el periodo seleccionado."
              />

            </div>

          </>
        )}

      </div>
    </div>
  );
}