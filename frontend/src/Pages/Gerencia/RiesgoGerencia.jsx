import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock3,
  CalendarDays,
  RefreshCw,
  ShieldAlert,
  Activity,
  User,
  FileWarning,
  Info,
  Loader2,
} from "lucide-react";
import { obtenerRiesgoOperativo } from "../../services/gerenciaService";

// =====================================================
// GERENCIA - RIESGO OPERATIVO
// =====================================================
export default function RiesgoGerencia() {
  // ===================================================
  // FECHA ACTUAL
  // ===================================================
  const hoy = new Date().toISOString().split("T")[0];

  // ===================================================
  // FILTROS
  // ===================================================
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);

  // ===================================================
  // DATOS
  // ===================================================
  const [periodo, setPeriodo] = useState(null);
  const [totalAlertas, setTotalAlertas] = useState(0);
  const [resumenNiveles, setResumenNiveles] = useState({});
  const [detalleAlertas, setDetalleAlertas] = useState([]);

  // ===================================================
  // ESTADOS
  // ===================================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Evita que el debounce dispare una carga extra en el
  // primer render (la carga inicial ya se hace aparte).
  const primerRenderRef = useRef(true);

  // ===================================================
  // FORMATEAR NÚMEROS
  // ===================================================
  const formatearNumero = (valor) => {
    if (valor === null || valor === undefined) return "0";
    const numero = Number(valor);
    if (Number.isNaN(numero)) return "0";
    return numero.toLocaleString("es-PE");
  };

  // ===================================================
  // VALIDAR FILTROS
  // ===================================================
  const filtrosValidos = () => {
    if (!fechaInicio) {
      setError("Debes seleccionar una fecha de inicio.");
      return false;
    }
    if (fechaFin && fechaFin < fechaInicio) {
      setError(
        "La fecha final no puede ser anterior a la fecha de inicio."
      );
      return false;
    }
    return true;
  };

  // ===================================================
  // CARGAR ALERTAS
  // ===================================================
  const cargarAlertas = async () => {
    if (!filtrosValidos()) return;
    try {
      setLoading(true);
      setError("");
      const response = await obtenerRiesgoOperativo({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin || null,
      });
      setPeriodo(response?.periodo || null);
      setTotalAlertas(response?.total_alertas ?? 0);
      setResumenNiveles(response?.resumen_niveles || {});
      setDetalleAlertas(response?.detalle_alertas || []);
    } catch (err) {
      console.error("Error cargando riesgo operativo:", err);
      setPeriodo(null);
      setTotalAlertas(0);
      setResumenNiveles({});
      setDetalleAlertas([]);
      if (err.response?.status === 422) {
        setError(
          "Los parámetros enviados no son válidos. Revisa las fechas seleccionadas."
        );
      } else if (err.response?.status === 404) {
        setError("No se encontró el servicio de riesgo operativo.");
      } else {
        setError(
          "No se pudo obtener la información de riesgo operativo."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // CARGA INICIAL (al entrar a la sección)
  // ===================================================
  useEffect(() => {
    cargarAlertas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===================================================
  // CARGA AUTOMÁTICA AL CAMBIAR FECHAS
  //
  // Cada vez que el usuario cambia la fecha de inicio o
  // fin, se vuelve a consultar el riesgo operativo solo,
  // sin necesidad de ningún botón "Aplicar filtros".
  //
  // Debounce de 400ms para no disparar una petición por
  // cada click mientras el usuario todavía está ajustando
  // las fechas.
  // ===================================================
  useEffect(() => {
    if (primerRenderRef.current) {
      primerRenderRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      cargarAlertas();
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin]);

  // ===================================================
  // NORMALIZAR NIVEL
  // ===================================================
  const normalizarNivel = (nivel) => {
    if (!nivel) return "Sin nivel";
    return String(nivel).trim().toLowerCase().replace(/\s+/g, " ");
  };

  // ===================================================
  // ESTILO DEL NIVEL
  // ===================================================
  const obtenerEstiloNivel = (nivel) => {
    const nivelNormalizado = normalizarNivel(nivel);
    if (
      nivelNormalizado.includes("alto") ||
      nivelNormalizado.includes("crítico") ||
      nivelNormalizado.includes("critico")
    ) {
      return {
        fondo: "bg-red-50",
        texto: "text-red-700",
        borde: "border-red-200",
        icono: "text-red-600",
        etiqueta: "Alto",
      };
    }
    if (
      nivelNormalizado.includes("medio") ||
      nivelNormalizado.includes("moderado")
    ) {
      return {
        fondo: "bg-amber-50",
        texto: "text-amber-700",
        borde: "border-amber-200",
        icono: "text-amber-600",
        etiqueta: "Medio",
      };
    }
    if (
      nivelNormalizado.includes("bajo") ||
      nivelNormalizado.includes("leve")
    ) {
      return {
        fondo: "bg-emerald-50",
        texto: "text-emerald-700",
        borde: "border-emerald-200",
        icono: "text-emerald-600",
        etiqueta: "Bajo",
      };
    }
    return {
      fondo: "bg-slate-50",
      texto: "text-slate-600",
      borde: "border-slate-200",
      icono: "text-slate-500",
      etiqueta: nivel || "Sin nivel",
    };
  };

  // ===================================================
  // ESTILO DEL ESTADO
  // ===================================================
  const obtenerEstiloEstado = (estado) => {
    const valor = String(estado || "").trim().toLowerCase();
    if (
      valor.includes("resuelto") ||
      valor.includes("cerrado") ||
      valor.includes("atendido") ||
      valor.includes("completado")
    ) {
      return {
        fondo: "bg-emerald-50",
        texto: "text-emerald-700",
        etiqueta: estado || "Resuelto",
      };
    }
    if (
      valor.includes("revisión") ||
      valor.includes("revision") ||
      valor.includes("proceso")
    ) {
      return {
        fondo: "bg-blue-50",
        texto: "text-blue-700",
        etiqueta: estado || "En revisión",
      };
    }
    if (valor.includes("pendiente") || valor.includes("abierto")) {
      return {
        fondo: "bg-amber-50",
        texto: "text-amber-700",
        etiqueta: estado || "Pendiente",
      };
    }
    if (valor.includes("escalada") || valor.includes("escalado")) {
      return {
        fondo: "bg-red-50",
        texto: "text-red-700",
        etiqueta: estado || "Escalada",
      };
    }
    return {
      fondo: "bg-slate-50",
      texto: "text-slate-600",
      etiqueta: estado || "Sin estado",
    };
  };

  // ===================================================
  // ICONO DEL NIVEL
  // ===================================================
  const obtenerIconoNivel = (nivel) => {
    const nivelNormalizado = normalizarNivel(nivel);
    if (
      nivelNormalizado.includes("alto") ||
      nivelNormalizado.includes("crítico") ||
      nivelNormalizado.includes("critico")
    ) {
      return <ShieldAlert size={17} />;
    }
    if (nivelNormalizado.includes("medio")) {
      return <AlertTriangle size={17} />;
    }
    if (nivelNormalizado.includes("bajo")) {
      return <CheckCircle size={17} />;
    }
    return <AlertCircle size={17} />;
  };

  // ===================================================
  // OBTENER TOTAL POR NIVEL
  // ===================================================
  const obtenerCantidadNivel = (clave, valor) => {
    if (typeof valor === "number") return valor;
    if (valor && typeof valor === "object") {
      return valor.total ?? valor.cantidad ?? valor.count ?? 0;
    }
    return Number(valor) || 0;
  };

  // ===================================================
  // CONSTRUIR NIVELES
  // ===================================================
  const niveles = Object.entries(resumenNiveles || {});

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
                  onChange={(e) => setFechaInicio(e.target.value)}
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
                  onChange={(e) => setFechaFin(e.target.value)}
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
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold">No se pudo cargar la información</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* =================================================
            PERIODO
        ================================================= */}

        {/* =================================================
            LOADING (skeleton solo cuando aún no hay datos)
        ================================================= */}
        {loading && !periodo && detalleAlertas.length === 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : (
          <div
            className={`space-y-6 transition-opacity ${
              loading ? "opacity-60" : "opacity-100"
            }`}
          >
            {/* =================================================
                TOTAL ALERTAS + NIVELES
            ================================================= */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Total de alertas
                    </p>
                    <p className="mt-3 text-3xl font-bold text-slate-900">
                      {formatearNumero(totalAlertas)}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <AlertTriangle size={20} />
                  </div>
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-400">
                  Cantidad total de alertas operativas detectadas durante
                  el periodo seleccionado.
                </p>
              </div>

              {niveles.length > 0 ? (
                niveles.slice(0, 3).map(([nivel, valor]) => {
                  const estilo = obtenerEstiloNivel(nivel);
                  const cantidad = obtenerCantidadNivel(nivel, valor);
                  return (
                    <div
                      key={nivel}
                      className={`rounded-2xl border ${estilo.borde} bg-white p-5 shadow-sm`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Nivel
                          </p>
                          <p className={`mt-3 text-xl font-bold ${estilo.texto}`}>
                            {nivel}
                          </p>
                          <p className="mt-1 text-2xl font-bold text-slate-900">
                            {formatearNumero(cantidad)}
                          </p>
                        </div>
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${estilo.fondo} ${estilo.icono}`}
                        >
                          {obtenerIconoNivel(nivel)}
                        </div>
                      </div>
                      <p className="mt-4 text-xs leading-5 text-slate-400">
                        Alertas clasificadas en este nivel de riesgo
                        operativo.
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-1 lg:col-span-3">
                  <div className="flex h-full items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                      <Info size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        Sin clasificación de niveles
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        La API no devolvió información agrupada por
                        nivel.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* =================================================
                DETALLE DE ALERTAS
            ================================================= */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
                    <FileWarning size={19} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                      Detalle de alertas
                    </h2>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Alertas detectadas durante el periodo seleccionado.
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-bold text-slate-500">
                    {formatearNumero(detalleAlertas.length)} registros
                  </p>
                </div>
              </div>

              {detalleAlertas.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                    <CheckCircle size={28} />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-slate-700">
                    No se encontraron alertas
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400">
                    No existen alertas de riesgo operativo registradas
                    para el periodo seleccionado.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70">
                        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Alerta
                        </th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Fecha
                        </th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Nivel
                        </th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          KPI
                        </th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Motivo
                        </th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Estado
                        </th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Personal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleAlertas.map((alerta, index) => {
                        const estiloNivel = obtenerEstiloNivel(alerta.nivel);
                        const estiloEstado = obtenerEstiloEstado(alerta.estado);
                        return (
                          <tr
                            key={alerta.alerta_id || `alerta-${index}`}
                            className="border-b border-slate-100 last:border-b-0 transition hover:bg-slate-50"
                          >
                            {/* ID */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${estiloNivel.fondo} ${estiloNivel.icono}`}
                                >
                                  {obtenerIconoNivel(alerta.nivel)}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">
                                    {alerta.alerta_id || "Sin ID"}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    Alerta operativa
                                  </p>
                                </div>
                              </div>
                            </td>
                            {/* FECHA */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <CalendarDays size={14} className="text-[#006cb7]" />
                                {alerta.fecha || "—"}
                              </div>
                            </td>
                            {/* NIVEL */}
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold ${estiloNivel.fondo} ${estiloNivel.texto} ${estiloNivel.borde}`}
                              >
                                {obtenerIconoNivel(alerta.nivel)}
                                {estiloNivel.etiqueta}
                              </span>
                            </td>
                            {/* KPI */}
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-700">
                                <Activity size={12} />
                                {alerta.kpi || "—"}
                              </span>
                            </td>
                            {/* MOTIVO */}
                            <td className="max-w-[320px] px-5 py-4">
                              <p
                                title={alerta.motivo || ""}
                                className="text-xs leading-5 text-slate-600"
                              >
                                {alerta.motivo || "Sin motivo registrado"}
                              </p>
                            </td>
                            {/* ESTADO */}
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${estiloEstado.fondo} ${estiloEstado.texto}`}
                              >
                                {String(alerta.estado || "")
                                  .toLowerCase()
                                  .includes("resuelto") ? (
                                  <CheckCircle size={12} />
                                ) : (
                                  <Clock3 size={12} />
                                )}
                                {estiloEstado.etiqueta}
                              </span>
                            </td>
                            {/* PERSONAL */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                  <User size={14} />
                                </div>
                                <span className="text-xs font-medium text-slate-600">
                                  {alerta.ccodprs || "—"}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}