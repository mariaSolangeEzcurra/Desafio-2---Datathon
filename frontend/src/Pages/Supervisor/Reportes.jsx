import React, { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Eye,
  RefreshCw,
  AlertCircle,
  CalendarDays,
  MapPin,
  Users,
  BarChart3,
  ShieldAlert,
  UserRoundCheck,
  X,
  CheckCircle,
  Filter,
} from "lucide-react";
import {
  exportarResumenKpis,
  exportarAlertasEstado,
  exportarTrabajadoresDesempeno,
} from "../../services/reportesLecturaService";

// =====================================================
// OPCIONES DE PERIODO
// =====================================================
const OPCIONES_PERIODO = [
  { value: "", label: "Personalizado" },
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
  { value: "3meses", label: "Últimos 3 meses" },
];

// =====================================================
// GERENCIA - REPORTES
// =====================================================
export default function Reportes() {
  // ===================================================
  // FECHA ACTUAL
  // ===================================================
  const hoy = new Date().toISOString().split("T")[0];

  // ===================================================
  // REPORTE SELECCIONADO
  // ===================================================
  const [reporteSeleccionado, setReporteSeleccionado] = useState(
    "kpis"
  );

  // ===================================================
  // FILTROS
  // ===================================================
  // Reporte KPIs / Alertas
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [periodo, setPeriodo] = useState("");
  const [zonaId, setZonaId] = useState("");
  // Reporte trabajadores
  const [fechaTrabajadores, setFechaTrabajadores] = useState(hoy);

  // ===================================================
  // ESTADOS
  // ===================================================
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [error, setError] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // ===================================================
  // INFORMACIÓN DE REPORTES
  // ===================================================
  const reportes = {
    kpis: {
      titulo: "Resumen de KPIs",
      descripcion:
        "Reporte consolidado de los principales indicadores operativos.",
      icono: <BarChart3 size={22} />,
      fondo: "bg-blue-50",
      texto: "text-[#006cb7]",
      endpoint: "kpis-resumen/exportar",
      archivo: "reporte_resumen_kpis",
      columnas: [
        "Indicadores generales",
        "Lecturas realizadas",
        "Eficiencia",
        "Productividad",
        "Cumplimiento",
        "Tiempo promedio",
      ],
    },
    alertas: {
      titulo: "Alertas por estado",
      descripcion:
        "Reporte de las alertas operativas agrupadas según su estado.",
      icono: <ShieldAlert size={22} />,
      fondo: "bg-red-50",
      texto: "text-red-600",
      endpoint: "alertas-estado/exportar",
      archivo: "reporte_alertas_estado",
      columnas: [
        "Alerta",
        "Fecha",
        "Nivel",
        "KPI",
        "Motivo",
        "Estado",
        "Personal",
      ],
    },
    trabajadores: {
      titulo: "Desempeño de trabajadores",
      descripcion:
        "Reporte del desempeño registrado por los trabajadores.",
      icono: <UserRoundCheck size={22} />,
      fondo: "bg-emerald-50",
      texto: "text-emerald-600",
      endpoint: "trabajadores-desempeno/exportar",
      archivo: "reporte_trabajadores_desempeno",
      columnas: [
        "Personal",
        "Eficiencia",
        "Lecturas realizadas",
        "Tiempo total",
        "Productividad",
        "Cumplimiento",
      ],
    },
  };
  const reporteActual = reportes[reporteSeleccionado];

  // ===================================================
  // ETIQUETA DEL PERIODO ACTUAL
  // ===================================================
  const obtenerEtiquetaPeriodo = () =>
    OPCIONES_PERIODO.find((o) => o.value === periodo)?.label ??
    "Personalizado";

  // ===================================================
  // VALIDAR FILTROS
  // ===================================================
  const validarFiltros = () => {
    setError("");
    if (
      (reporteSeleccionado === "kpis" ||
        reporteSeleccionado === "alertas") &&
      !periodo
    ) {
      if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
        setError(
          "La fecha final no puede ser anterior a la fecha de inicio."
        );
        return false;
      }
    }
    if (reporteSeleccionado === "trabajadores") {
      if (!fechaTrabajadores) {
        setError("Debes seleccionar una fecha para el reporte.");
        return false;
      }
    }
    return true;
  };

  // ===================================================
  // OBTENER ARCHIVO SEGÚN REPORTE
  // Si hay un periodo seleccionado, tiene prioridad sobre
  // las fechas (que quedan deshabilitadas en la UI).
  // ===================================================
  const obtenerArchivoReporte = async () => {
    if (reporteSeleccionado === "kpis") {
      return await exportarResumenKpis({
        fecha_inicio: periodo ? null : fechaInicio || null,
        fecha_fin: periodo ? null : fechaFin || null,
        zona_id: zonaId || null,
        periodo: periodo || null,
      });
    }
    if (reporteSeleccionado === "alertas") {
      return await exportarAlertasEstado({
        fecha_inicio: periodo ? null : fechaInicio || null,
        fecha_fin: periodo ? null : fechaFin || null,
        periodo: periodo || null,
      });
    }
    if (reporteSeleccionado === "trabajadores") {
      return await exportarTrabajadoresDesempeno({
        fecha: fechaTrabajadores || null,
      });
    }
    return null;
  };

  // ===================================================
  // OBTENER NOMBRE DEL ARCHIVO
  // ===================================================
  const obtenerNombreArchivo = () => {
    if (reporteSeleccionado === "trabajadores") {
      return `${reporteActual.archivo}_${fechaTrabajadores || hoy}.xlsx`;
    }
    const referencia = periodo ? periodo : fechaInicio || hoy;
    return `${reporteActual.archivo}_${referencia}.xlsx`;
  };

  // ===================================================
  // PREVISUALIZAR
  // ===================================================
  const previsualizar = async () => {
    if (!validarFiltros()) return;
    try {
      setLoadingPreview(true);
      setError("");
      setPreviewVisible(true);
      const response = await obtenerArchivoReporte();
      if (!response) {
        throw new Error("La API no devolvió información.");
      }
      const blob = response.data;
      let tipoArchivo =
        response.headers?.["content-type"] ||
        blob?.type ||
        "application/octet-stream";
      // -------------------------------------------------
      // INTENTAR LEER COMO TEXTO
      // -------------------------------------------------
      let contenidoTexto = null;
      if (
        tipoArchivo.includes("text") ||
        tipoArchivo.includes("json") ||
        tipoArchivo.includes("csv")
      ) {
        try {
          contenidoTexto = await blob.text();
        } catch (e) {
          console.warn("No se pudo leer el contenido como texto.");
        }
      }
      // -------------------------------------------------
      // CREAR URL PARA ARCHIVOS VISUALIZABLES
      // -------------------------------------------------
      let urlArchivo = null;
      if (
        tipoArchivo.includes("pdf") ||
        tipoArchivo.includes("image")
      ) {
        urlArchivo = URL.createObjectURL(blob);
      }
      setPreviewData({
        blob,
        tipoArchivo,
        contenidoTexto,
        urlArchivo,
        nombreArchivo: obtenerNombreArchivo(),
        periodo,
        fechaGeneracion: new Date().toLocaleString("es-PE"),
      });
    } catch (err) {
      console.error("Error generando previsualización:", err);
      if (err.response?.status === 422) {
        setError(
          "Los parámetros enviados no son válidos. Revisa los filtros seleccionados."
        );
      } else if (err.response?.status === 404) {
        setError(
          "No se encontró el servicio de exportación solicitado."
        );
      } else {
        setError(
          "No se pudo generar la previsualización del reporte."
        );
      }
      setPreviewVisible(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  // ===================================================
  // EXPORTAR
  // ===================================================
  const exportarReporte = async () => {
    if (!validarFiltros()) return;
    try {
      setLoadingExport(true);
      setError("");
      const response = await obtenerArchivoReporte();
      if (!response?.data) {
        throw new Error("La API no devolvió ningún archivo.");
      }
      const blob = new Blob([response.data], {
        type:
          response.headers?.["content-type"] ||
          "application/octet-stream",
      });
      const url = window.URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = obtenerNombreArchivo();
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error("Error exportando reporte:", err);
      if (err.response?.status === 422) {
        setError(
          "Los parámetros enviados no son válidos. Revisa los filtros seleccionados."
        );
      } else if (err.response?.status === 404) {
        setError(
          "No se encontró el servicio de exportación solicitado."
        );
      } else {
        setError("No se pudo exportar el reporte.");
      }
    } finally {
      setLoadingExport(false);
    }
  };

  // ===================================================
  // CAMBIAR REPORTE
  // ===================================================
  const cambiarReporte = (tipo) => {
    setReporteSeleccionado(tipo);
    setError("");
    setPreviewVisible(false);
    setPreviewData(null);
  };

  // ===================================================
  // CAMBIO DE PERIODO
  // Al elegir un periodo predefinido, las fechas quedan
  // deshabilitadas (se ignoran al generar el reporte).
  // ===================================================
  const manejarCambioPeriodo = (e) => {
    setError("");
    setPeriodo(e.target.value);
    setPreviewVisible(false);
    setPreviewData(null);
  };

  // ===================================================
  // LIMPIAR FILTROS
  // ===================================================
  const limpiarFiltros = () => {
    setFechaInicio(hoy);
    setFechaFin(hoy);
    setPeriodo("");
    setZonaId("");
    setFechaTrabajadores(hoy);
    setError("");
    setPreviewVisible(false);
    setPreviewData(null);
  };

  // ===================================================
  // RENDER
  // ===================================================
  return (
    <div className="space-y-6 text-left">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* =================================================
            TARJETAS DE REPORTES
        ================================================= */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Object.entries(reportes).map(([key, reporte]) => {
            const seleccionado =
              reporteSeleccionado === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => cambiarReporte(key)}
                className={`text-left rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                  seleccionado
                    ? "border-[#006cb7] bg-white ring-2 ring-blue-100 shadow-sm"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${reporte.fondo} ${reporte.texto}`}
                  >
                    {reporte.icono}
                  </div>
                  {seleccionado && (
                    <div className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[9px] font-bold text-[#006cb7]">
                      <CheckCircle size={11} />
                      SELECCIONADO
                    </div>
                  )}
                </div>
                <h2 className="mt-4 text-sm font-bold text-slate-800">
                  {reporte.titulo}
                </h2>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {reporte.descripcion}
                </p>
              </button>
            );
          })}
        </div>

        {/* =================================================
            FILTROS
        ================================================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-[#006cb7]">
              <CalendarDays size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                Filtros del reporte
              </h2>
              <p className="mt-1 text-[10px] text-slate-400">
                Configura los parámetros que utilizará la exportación.
              </p>
            </div>
          </div>

          {/* ===============================================
              KPIs / ALERTAS
          =============================================== */}
          {(reporteSeleccionado === "kpis" ||
            reporteSeleccionado === "alertas") && (
            <div className="space-y-4">
              {/* FILA: PERIODO + FECHAS */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* PERIODO */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
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
                      disabled={loadingPreview || loadingExport}
                      className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-10 pr-8 text-xs text-slate-700 outline-none transition focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {OPCIONES_PERIODO.map((opcion) => (
                        <option
                          key={opcion.value || "personalizado"}
                          value={opcion.value}
                        >
                          {opcion.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* FECHA INICIO */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Fecha inicio
                  </label>
                  <div className="relative">
                    <CalendarDays
                      size={15}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                        periodo ? "text-slate-300" : "text-[#006cb7]"
                      }`}
                    />
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) =>
                        setFechaInicio(e.target.value)
                      }
                      disabled={Boolean(periodo)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs text-slate-700 outline-none transition focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50"
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
                      className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                        periodo ? "text-slate-300" : "text-[#006cb7]"
                      }`}
                    />
                    <input
                      type="date"
                      value={fechaFin}
                      min={fechaInicio || undefined}
                      onChange={(e) =>
                        setFechaFin(e.target.value)
                      }
                      disabled={Boolean(periodo)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs text-slate-700 outline-none transition focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===============================================
              TRABAJADORES
          =============================================== */}
          {reporteSeleccionado === "trabajadores" && (
            <div className="max-w-sm">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Fecha del reporte
              </label>
              <div className="relative">
                <CalendarDays
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7]"
                />
                <input
                  type="date"
                  value={fechaTrabajadores}
                  onChange={(e) =>
                    setFechaTrabajadores(e.target.value)
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs text-slate-700 outline-none transition focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          )}

          {/* ===============================================
              BOTONES
          =============================================== */}
          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={limpiarFiltros}
              disabled={loadingPreview || loadingExport}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={15} />
              Limpiar
            </button>
            <button
              type="button"
              onClick={previsualizar}
              disabled={loadingPreview || loadingExport}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#006cb7] bg-white px-5 py-2.5 text-xs font-bold text-[#006cb7] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingPreview ? (
                <RefreshCw
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Eye size={15} />
              )}
              {loadingPreview
                ? "Generando..."
                : "Previsualizar"}
            </button>
            <button
              type="button"
              onClick={exportarReporte}
              disabled={loadingPreview || loadingExport}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#006cb7] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#005a9c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingExport ? (
                <RefreshCw
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Download size={15} />
              )}
              {loadingExport
                ? "Exportando..."
                : "Exportar reporte"}
            </button>
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
                No se pudo procesar el reporte
              </p>
              <p className="mt-1 text-xs">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            PREVISUALIZACIÓN
        ================================================= */}
        {previewVisible && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* CABECERA */}
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5 text-[#006cb7]">
                  <Eye size={19} />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                    Previsualización del reporte
                  </h2>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Esta es la información que será considerada en la exportación.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (previewData?.urlArchivo) {
                    URL.revokeObjectURL(
                      previewData.urlArchivo
                    );
                  }
                  setPreviewVisible(false);
                  setPreviewData(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>
            {/* CONTENIDO */}
            {previewData && (
              <div className="p-5">
                {/* INFORMACIÓN GENERAL */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet
                        size={16}
                        className="text-[#006cb7]"
                      />
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Reporte
                      </p>
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-700">
                      {reporteActual.titulo}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays
                        size={16}
                        className="text-[#006cb7]"
                      />
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Periodo
                      </p>
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-700">
                      {reporteSeleccionado === "trabajadores"
                        ? fechaTrabajadores || "Sin fecha"
                        : previewData.periodo
                        ? obtenerEtiquetaPeriodo()
                        : fechaInicio && fechaFin
                        ? `${fechaInicio} → ${fechaFin}`
                        : "Periodo completo"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                      <Download
                        size={16}
                        className="text-[#006cb7]"
                      />
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Archivo
                      </p>
                    </div>
                    <p className="mt-2 truncate text-xs font-bold text-slate-700">
                      {previewData.nombreArchivo}
                    </p>
                  </div>
                </div>
                {/* COLUMNAS */}
                <div className="mt-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Users
                      size={16}
                      className="text-[#006cb7]"
                    />
                    <h3 className="text-xs font-bold text-slate-700">
                      Información que contendrá el reporte
                    </h3>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            #
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Campo / indicador
                          </th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Incluido
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporteActual.columnas.map(
                          (columna, index) => (
                            <tr
                              key={columna}
                              className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                            >
                              <td className="px-4 py-3 text-xs font-bold text-slate-400">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                                {columna}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                                  <CheckCircle size={12} />
                                  Sí
                                </span>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* SI LA API DEVUELVE TEXTO */}
                {previewData.contenidoTexto && (
                  <div className="mt-5">
                    <div className="mb-3 flex items-center gap-2">
                      <FileText
                        size={16}
                        className="text-[#006cb7]"
                      />
                      <h3 className="text-xs font-bold text-slate-700">
                        Contenido recibido
                      </h3>
                    </div>
                    <pre className="max-h-96 overflow-auto rounded-xl border border-slate-200 bg-slate-900 p-4 text-[11px] leading-5 text-slate-100">
                      {previewData.contenidoTexto}
                    </pre>
                  </div>
                )}
                {/* ARCHIVO */}
                <div className="mt-5 flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-white p-2 text-emerald-600">
                      <CheckCircle size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-700">
                        Reporte listo para exportar
                      </p>
                      <p className="mt-1 text-[10px] leading-5 text-emerald-600">
                        Los filtros seleccionados serán utilizados
                        para generar el archivo.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={exportarReporte}
                    disabled={loadingExport}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {loadingExport ? (
                      <RefreshCw
                        size={14}
                        className="animate-spin"
                      />
                    ) : (
                      <Download size={14} />
                    )}
                    {loadingExport
                      ? "Exportando..."
                      : "Descargar archivo"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}