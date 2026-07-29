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
  BarChart3,
  ShieldAlert,
  X,
  CheckCircle,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

import {
  exportarReporteFinanciero,
  exportarReporteIneficiencia,
} from "../../services/CortesReportesService";

// =====================================================
// REPORTES DE CORTES
// =====================================================

export default function ReportesCortes() {
  // ===================================================
  // FECHA ACTUAL
  // ===================================================

  const hoy = new Date().toISOString().split("T")[0];

  // ===================================================
  // REPORTE SELECCIONADO
  // ===================================================

  const [reporteSeleccionado, setReporteSeleccionado] =
    useState("financiero");

  // ===================================================
  // FILTROS
  // ===================================================

  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);

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
    financiero: {
      titulo: "Reporte financiero",
      descripcion:
        "Reporte consolidado de deuda, dinero recuperado y deuda en riesgo por distrito y zona.",
      icono: <DollarSign size={22} />,
      fondo: "bg-blue-50",
      texto: "text-[#006cb7]",
      archivo: "reporte_financiero",
      columnas: [
        "Distrito",
        "Zona",
        "Deuda total",
        "Dinero recuperado",
        "Deuda en riesgo",
        "Conexiones procesadas",
      ],
    },

    ineficiencia: {
      titulo: "Reporte de ineficiencia",
      descripcion:
        "Reporte detallado de conexiones no ejecutadas, impedimentos, causas de fallo y meses de deuda.",
      icono: <ShieldAlert size={22} />,
      fondo: "bg-red-50",
      texto: "text-red-600",
      archivo: "reporte_ineficiencia_impedimentos",
      columnas: [
        "Código de conexión",
        "Distrito",
        "Dirección",
        "Situación registrada",
        "Código de acceso",
        "Causa del impedimento",
        "Deuda",
        "Meses de deuda",
      ],
    },
  };

  const reporteActual = reportes[reporteSeleccionado];

  // ===================================================
  // VALIDAR FILTROS
  // ===================================================

  const validarFiltros = () => {
    setError("");

    if (!fechaInicio || !fechaFin) {
      setError(
        "Debes seleccionar una fecha de inicio y una fecha de fin."
      );

      return false;
    }

    if (fechaFin < fechaInicio) {
      setError(
        "La fecha final no puede ser anterior a la fecha de inicio."
      );

      return false;
    }

    return true;
  };

  // ===================================================
  // OBTENER REPORTE DESDE API
  // ===================================================

  const obtenerReporte = async () => {
    if (reporteSeleccionado === "financiero") {
      return await exportarReporteFinanciero({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
    }

    if (reporteSeleccionado === "ineficiencia") {
      return await exportarReporteIneficiencia({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
    }

    return null;
  };

  // ===================================================
  // OBTENER NOMBRE DE ARCHIVO
  // ===================================================

  const obtenerNombreArchivo = () => {
    if (previewData?.nombre_archivo) {
      return previewData.nombre_archivo;
    }

    return `${reporteActual.archivo}_${fechaInicio}_a_${fechaFin}.xlsx`;
  };

  // ===================================================
  // PREVISUALIZAR
  // ===================================================

  const previsualizar = async () => {
    if (!validarFiltros()) return;

    try {
      setLoadingPreview(true);
      setError("");

      const response = await obtenerReporte();

      if (!response) {
        throw new Error("La API no devolvió información.");
      }

      /*
       * La API devuelve:
       *
       * {
       *   status: "success",
       *   message: "...",
       *   tipo_reporte: "...",
       *   nombre_archivo: "...",
       *   url_descarga: "...",
       *   total_registros: 1086
       * }
       */

      const data = response.data || response;

      setPreviewData({
        status: data.status,
        message: data.message,
        tipoReporte: data.tipo_reporte,
        nombreArchivo:
          data.nombre_archivo ||
          `${reporteActual.archivo}_${fechaInicio}_a_${fechaFin}.xlsx`,
        urlDescarga: data.url_descarga,
        totalRegistros: data.total_registros ?? 0,
        fechaGeneracion: new Date().toLocaleString("es-PE"),
      });

      setPreviewVisible(true);
    } catch (err) {
      console.error(
        "Error generando previsualización:",
        err
      );

      if (err.response?.status === 422) {
        setError(
          "Los parámetros enviados no son válidos. Revisa las fechas seleccionadas."
        );
      } else if (err.response?.status === 404) {
        setError(
          "No se encontró el servicio de generación del reporte."
        );
      } else {
        setError(
          "No se pudo generar la previsualización del reporte."
        );
      }

      setPreviewVisible(false);
      setPreviewData(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  // ===================================================
  // EXPORTAR REPORTE
  // ===================================================

  const exportarReporte = async () => {
    if (!validarFiltros()) return;

    try {
      setLoadingExport(true);
      setError("");

      /*
       * Si ya tenemos la URL generada por la previsualización,
       * utilizamos directamente ese archivo.
       */

      if (previewData?.urlDescarga) {
        const url = previewData.urlDescarga.startsWith("http")
          ? previewData.urlDescarga
          : `http://localhost:8000${previewData.urlDescarga}`;

        window.open(url, "_blank");

        return;
      }

      /*
       * Si no existe previsualización, generamos el reporte.
       */

      const response = await obtenerReporte();

      if (!response) {
        throw new Error("La API no devolvió información.");
      }

      const data = response.data || response;

      if (!data.url_descarga) {
        throw new Error(
          "La API no devolvió la URL de descarga."
        );
      }

      const url = data.url_descarga.startsWith("http")
        ? data.url_descarga
        : `http://localhost:8000${data.url_descarga}`;

      window.open(url, "_blank");
    } catch (err) {
      console.error("Error exportando reporte:", err);

      if (err.response?.status === 422) {
        setError(
          "Los parámetros enviados no son válidos. Revisa las fechas seleccionadas."
        );
      } else if (err.response?.status === 404) {
        setError(
          "No se encontró el servicio de exportación solicitado."
        );
      } else {
        setError(
          "No se pudo exportar el reporte."
        );
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
  // LIMPIAR FILTROS
  // ===================================================

  const limpiarFiltros = () => {
    setFechaInicio(hoy);
    setFechaFin(hoy);

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

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {Object.entries(reportes).map(
            ([key, reporte]) => {
              const seleccionado =
                reporteSeleccionado === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    cambiarReporte(key)
                  }
                  className={`text-left rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    seleccionado
                      ? "border-[#006cb7] bg-white ring-2 ring-blue-100"
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
            }
          )}

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
                Configura el periodo que utilizará la generación del reporte.
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
                  min={fechaInicio || undefined}
                  onChange={(e) =>
                    setFechaFin(e.target.value)
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs text-slate-700 outline-none transition focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>

          </div>

          {/* INFORMACIÓN DEL REPORTE */}

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">

            <div className="mt-0.5 rounded-lg bg-white p-2 text-[#006cb7]">
              {reporteSeleccionado === "financiero" ? (
                <BarChart3 size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
            </div>

            <div>

              <p className="text-xs font-bold text-[#006cb7]">
                {reporteActual.titulo}
              </p>

              <p className="mt-1 text-[10px] leading-5 text-blue-600">
                Se generará la información correspondiente
                al periodo seleccionado.
              </p>

            </div>

          </div>

          {/* BOTONES */}

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={limpiarFiltros}
              disabled={
                loadingPreview || loadingExport
              }
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={15} />
              Limpiar
            </button>

            <button
              type="button"
              onClick={previsualizar}
              disabled={
                loadingPreview || loadingExport
              }
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
              disabled={
                loadingPreview || loadingExport
              }
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
                    Información generada por la API para el periodo seleccionado.
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() => {
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

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

                  {/* REPORTE */}

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

                  {/* PERIODO */}

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
                      {fechaInicio} → {fechaFin}
                    </p>

                  </div>

                  {/* REGISTROS */}

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">

                    <div className="flex items-center gap-2">

                      <MapPin
                        size={16}
                        className="text-[#006cb7]"
                      />

                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Registros
                      </p>

                    </div>

                    <p className="mt-2 text-xs font-bold text-slate-700">
                      {previewData.totalRegistros.toLocaleString(
                        "en-US"
                      )}
                    </p>

                  </div>

                  {/* ARCHIVO */}

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

                    <p
                      className="mt-2 truncate text-xs font-bold text-slate-700"
                      title={previewData.nombreArchivo}
                    >
                      {previewData.nombreArchivo}
                    </p>

                  </div>

                </div>

                {/* MENSAJE API */}

                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">

                  <div className="flex items-start gap-3">

                    <div className="mt-0.5 rounded-lg bg-white p-2 text-[#006cb7]">
                      <FileText size={16} />
                    </div>

                    <div>

                      <p className="text-xs font-bold text-[#006cb7]">
                        Respuesta del sistema
                      </p>

                      <p className="mt-1 text-xs leading-5 text-blue-700">
                        {previewData.message}
                      </p>

                    </div>

                  </div>

                </div>

                {/* COLUMNAS */}

                <div className="mt-5">

                  <div className="mb-3 flex items-center gap-2">

                    {reporteSeleccionado ===
                    "financiero" ? (
                      <BarChart3
                        size={16}
                        className="text-[#006cb7]"
                      />
                    ) : (
                      <ShieldAlert
                        size={16}
                        className="text-[#006cb7]"
                      />
                    )}

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

                {/* ARCHIVO LISTO */}

                <div className="mt-5 flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-start gap-3">

                    <div className="mt-0.5 rounded-lg bg-white p-2 text-emerald-600">
                      <CheckCircle size={16} />
                    </div>

                    <div>

                      <p className="text-xs font-bold text-emerald-700">
                        Reporte listo para descargar
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-emerald-600">
                        La API generó correctamente el archivo
                        correspondiente al periodo seleccionado.
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
                      ? "Descargando..."
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
