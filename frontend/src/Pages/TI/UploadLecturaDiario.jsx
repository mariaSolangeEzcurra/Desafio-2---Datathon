import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  History,
  RotateCcw,
  Search,
  RefreshCw,
  Clock,
  Camera,
  MessageSquare,
  Ban,
  BarChart3,
} from "lucide-react";

import {
  subirReporteDiario,
  obtenerHistorialReportes,
  revertirCargaReporteDiario,
} from "../../services/uploadDiarioService";

export default function CargarReporte() {
  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [revirtiendo, setRevirtiendo] = useState(null);

  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  const [reportesProcesados, setReportesProcesados] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);

  const [fechaFiltro, setFechaFiltro] = useState("");
  const [lectorFiltro, setLectorFiltro] = useState("");

  const fileInputRef = useRef(null);

  // ============================================================
  // MANEJO DE ERRORES
  // ============================================================
  const obtenerMensajeError = (
    err,
    mensajeDefecto = "Ocurrió un error inesperado."
  ) => {
    if (err?.response?.data?.detail) {
      const detail = err.response.data.detail;

      if (typeof detail === "string") {
        return detail;
      }

      if (Array.isArray(detail)) {
        return detail
          .map((item) => item.msg || JSON.stringify(item))
          .join(" | ");
      }

      return JSON.stringify(detail);
    }

    if (err?.message) {
      return err.message;
    }

    return mensajeDefecto;
  };

  // ============================================================
  // CARGAR HISTORIAL
  // ============================================================
  const cargarHistorial = async () => {
    try {
      setCargandoHistorial(true);
      setError(null);

      const data = await obtenerHistorialReportes({
        fecha: fechaFiltro,
        ccodprs: lectorFiltro,
        limit: 100,
      });

      setReportesProcesados(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Error cargando reportes diarios:",
        err
      );

      setError(
        obtenerMensajeError(
          err,
          "No se pudieron cargar los resúmenes diarios."
        )
      );
    } finally {
      setCargandoHistorial(false);
    }
  };

  // ============================================================
  // CARGAR AL INICIAR
  // ============================================================
  useEffect(() => {
    cargarHistorial();
  }, []);

  // ============================================================
  // SELECCIONAR ARCHIVO
  // ============================================================
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (!/\.(xlsx|xls)$/i.test(selectedFile.name)) {
      setError(
        "Solo se permiten archivos Excel (.xlsx, .xls)."
      );

      setArchivo(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setError(null);
    setResultado(null);
    setArchivo(selectedFile);
  };

  // ============================================================
  // PROCESAR REPORTE
  // ============================================================
  const handleProcesar = async (e) => {
    e.preventDefault();

    if (!archivo) {
      setError("Seleccione un archivo Excel.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResultado(null);

      const data = await subirReporteDiario(archivo);

      console.log(
        "Respuesta del API reporte diario:",
        data
      );

      setResultado(data);

      // Limpiar archivo
      setArchivo(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Actualizar historial
      await cargarHistorial();
    } catch (err) {
      console.error(
        "Error procesando reporte:",
        err
      );

      setError(
        obtenerMensajeError(
          err,
          "Error procesando archivo."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // REVERTIR CARGA
  // ============================================================
  const handleRevertir = async (idCarga) => {
    if (!idCarga || revirtiendo !== null) return;

    const confirmar = window.confirm(
      "¿Está seguro de revertir esta carga?\n\nEsta acción eliminará la carga asociada al reporte diario."
    );

    if (!confirmar) return;

    try {
      setRevirtiendo(idCarga);
      setError(null);

      const data =
        await revertirCargaReporteDiario(idCarga);

      console.log(
        "Respuesta al revertir carga:",
        data
      );

      setResultado({
        status: "success",
        message:
          data?.message ||
          `La carga #${idCarga} fue revertida correctamente.`,
      });

      await cargarHistorial();
    } catch (err) {
      console.error(
        "Error revirtiendo carga:",
        err
      );

      setError(
        obtenerMensajeError(
          err,
          "No se pudo revertir la carga."
        )
      );
    } finally {
      setRevirtiendo(null);
    }
  };

  // ============================================================
  // FORMATEAR DURACIÓN
  // ============================================================
  const formatearDuracion = (minutos) => {
    const valor = Number(minutos || 0);

    if (valor < 60) {
      return `${valor.toFixed(0)} min`;
    }

    const horas = Math.floor(valor / 60);
    const mins = Math.round(valor % 60);

    return `${horas}h ${mins}min`;
  };

  // ============================================================
  // FORMATEAR HORA
  // ============================================================
  const formatearHora = (fechaHora) => {
    if (!fechaHora) return "--";

    const fecha = new Date(fechaHora);

    if (Number.isNaN(fecha.getTime())) {
      return "--";
    }

    return fecha.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6 text-left">

      {/* ======================================================
          CARGA DEL REPORTE
      ======================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

        {/* CABECERA */}
        <div className="flex items-center justify-between gap-4 mb-5">

          <div className="min-w-0">

            <h3 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">

              <FileSpreadsheet
                size={16}
                className="text-[#006cb7] shrink-0"
              />

              Carga de Reporte Diario de Lecturas

            </h3>

            <p className="text-xs text-slate-500 mt-1">
              Importa el Excel diario generado por los
              lectores para actualizar los indicadores
              de desempeño.
            </p>

          </div>

          {/* BOTÓN IMPORTAR */}
          <button
            type="button"
            onClick={() =>
              !loading &&
              fileInputRef.current?.click()
            }
            disabled={loading}
            className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-[#006cb7] bg-blue-50 border border-blue-100 hover:bg-blue-100 disabled:opacity-50 transition-colors"
          >

            <UploadCloud size={14} />

            Importar información

          </button>

        </div>

        <form
          onSubmit={handleProcesar}
          className="space-y-4"
        >

          {/* INPUT OCULTO */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />

          {/* ARCHIVO SELECCIONADO */}
          {archivo && (

            <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">

              <div className="flex items-center gap-2 min-w-0">

                <FileSpreadsheet
                  size={15}
                  className="text-[#006cb7] shrink-0"
                />

                <span className="text-xs font-medium text-slate-700 truncate">
                  {archivo.name}
                </span>

              </div>

              <span className="text-[10px] text-emerald-600 font-bold shrink-0">
                Archivo seleccionado
              </span>

            </div>

          )}

          {/* BOTÓN PROCESAR */}
          <button
            type="submit"
            disabled={loading || !archivo}
            className="w-full bg-[#006cb7] text-white py-2.5 rounded-xl font-bold text-xs disabled:bg-slate-300 flex items-center justify-center gap-2 transition-colors"
          >

            {loading ? (

              <>
                <Loader2
                  size={16}
                  className="animate-spin"
                />

                Procesando reporte...
              </>

            ) : (

              <>
                <UploadCloud size={16} />

                Procesar Reporte Diario
              </>

            )}

          </button>

        </form>

        {/* ERROR */}
        {error && (

          <div className="mt-4 p-4 rounded-xl border text-xs flex gap-3 bg-rose-50 text-rose-900 border-rose-200">

            <AlertCircle
              size={18}
              className="shrink-0"
            />

            <div>

              <p className="font-bold mb-1">
                Error
              </p>

              <p>
                {error}
              </p>

            </div>

          </div>

        )}

        {/* RESULTADO */}
        {resultado && (

          <div className="mt-4 p-4 rounded-xl border bg-emerald-50 border-emerald-200">

            <div className="flex items-center gap-2 text-xs font-bold mb-3 text-emerald-800">

              <CheckCircle2 size={16} />

              {resultado.message ||
                "Reporte procesado correctamente"}

            </div>

            {resultado.total_filas_excel !==
              undefined && (

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">

                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <p className="text-[10px] text-slate-500 font-bold">
                    INSERTADOS
                  </p>

                  <b className="text-lg text-slate-700">
                    {resultado.registros_insertados ?? 0}
                  </b>
                </div>

                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <p className="text-[10px] text-slate-500 font-bold">
                    ACTUALIZADOS
                  </p>

                  <b className="text-lg text-slate-700">
                    {resultado.registros_actualizados ?? 0}
                  </b>
                </div>

                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <p className="text-[10px] text-slate-500 font-bold">
                    ERRORES
                  </p>

                  <b className="text-lg text-rose-600">
                    {resultado.registros_error ?? 0}
                  </b>
                </div>

                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <p className="text-[10px] text-slate-500 font-bold">
                    TOTAL FILAS
                  </p>

                  <b className="text-lg text-slate-700">
                    {resultado.total_filas_excel ?? 0}
                  </b>
                </div>

              </div>

            )}

          </div>

        )}

      </div>


      {/* ======================================================
          RESÚMENES DIARIOS
      ======================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

        {/* CABECERA */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">

          <h3 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">

            <History
              size={16}
              className="text-[#006cb7]"
            />

            Resúmenes Diarios ({reportesProcesados.length})

          </h3>

          <button
            type="button"
            onClick={cargarHistorial}
            disabled={cargandoHistorial}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-[#006cb7] bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
          >

            <RefreshCw
              size={14}
              className={
                cargandoHistorial
                  ? "animate-spin"
                  : ""
              }
            />

            Actualizar

          </button>

        </div>


        {/* ====================================================
            FILTROS
        ===================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5 p-4 rounded-xl bg-slate-50 border border-slate-100">

          {/* FECHA */}
          <div>

            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Fecha
            </label>

            <div className="relative">

              <Calendar
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="date"
                value={fechaFiltro}
                onChange={(e) =>
                  setFechaFiltro(e.target.value)
                }
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />

            </div>

          </div>

          {/* BOTONES */}
          <div className="flex items-end gap-2">

            <button
              type="button"
              onClick={cargarHistorial}
              disabled={cargandoHistorial}
              className="flex-1 flex items-center justify-center gap-2 bg-[#006cb7] text-white py-2 rounded-lg text-xs font-bold disabled:bg-slate-300"
            >

              <Search size={14} />

              Buscar

            </button>

            <button
              type="button"
              onClick={() => {
                setFechaFiltro("");
                setLectorFiltro("");

                setTimeout(() => {
                  obtenerHistorialReportes({
                    fecha: "",
                    ccodprs: "",
                    limit: 100,
                  })
                    .then((data) => {
                      setReportesProcesados(
                        Array.isArray(data) ? data : []
                      );
                    })
                    .catch((err) => {
                      setError(
                        obtenerMensajeError(
                          err,
                          "No se pudo limpiar el filtro."
                        )
                      );
                    });
                }, 0);
              }}
              title="Limpiar filtros"
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            >

              <RefreshCw size={14} />

            </button>

          </div>

        </div>


        {/* ====================================================
            TABLA COMPLETA
            UNA SOLA TABLE
        ===================================================== */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">

          <div className="max-h-[420px] overflow-auto">

            <table className="w-full min-w-[1450px] text-xs border-collapse">

              {/* ==================================================
                  CABECERA
              ================================================== */}
              <thead className="bg-slate-50 text-slate-500 uppercase sticky top-0 z-10">

                <tr className="border-b border-slate-200">

                  <th className="p-3 text-left whitespace-nowrap bg-slate-50">
                    Lector
                  </th>

                  <th className="p-3 text-left whitespace-nowrap bg-slate-50">
                    Fecha
                  </th>

                  <th className="p-3 text-center whitespace-nowrap bg-slate-50">
                    Lecturas
                  </th>

                  <th className="p-3 text-center whitespace-nowrap bg-slate-50">
                    Realizadas
                  </th>

                  <th className="p-3 text-center whitespace-nowrap bg-slate-50">
                    Pendientes
                  </th>

                  <th className="p-3 text-center whitespace-nowrap bg-slate-50">
                    Impedimentos
                  </th>

                  <th className="p-3 text-center whitespace-nowrap bg-slate-50">
                    Observaciones
                  </th>

                  <th className="p-3 text-center whitespace-nowrap bg-slate-50">
                    Fotos
                  </th>

                  <th className="p-3 text-center whitespace-nowrap bg-slate-50">
                    Duración
                  </th>

                  <th className="p-3 text-center whitespace-nowrap bg-slate-50">
                    Promedio
                  </th>

                  <th className="p-3 text-center whitespace-nowrap bg-slate-50">
                    Eficiencia
                  </th>

                  <th className="p-3 text-center whitespace-nowrap bg-slate-50">
                    Horario
                  </th>

                  <th className="p-3 text-center whitespace-nowrap bg-slate-50">
                    Acción
                  </th>

                </tr>

              </thead>


              {/* ==================================================
                  DATOS
              ================================================== */}
              <tbody className="divide-y divide-slate-100">

                {cargandoHistorial ? (

                  <tr>

                    <td
                      colSpan={13}
                      className="p-8 text-center text-slate-500"
                    >

                      <Loader2
                        size={20}
                        className="animate-spin inline mr-2"
                      />

                      Cargando resúmenes diarios...

                    </td>

                  </tr>

                ) : reportesProcesados.length === 0 ? (

                  <tr>

                    <td
                      colSpan={13}
                      className="p-8 text-center text-slate-400"
                    >

                      No existen reportes diarios para
                      los filtros seleccionados.

                    </td>

                  </tr>

                ) : (

                  reportesProcesados.map((item) => (

                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >

                      {/* LECTOR */}
                      <td className="p-3 font-bold text-slate-700 whitespace-nowrap">

                        {item.ccodprs || "--"}

                      </td>


                      {/* FECHA */}
                      <td className="p-3 whitespace-nowrap">

                        <Calendar
                          size={12}
                          className="inline mr-1 text-slate-400"
                        />

                        {item.fecha || "--"}

                      </td>


                      {/* LECTURAS */}
                      <td className="p-3 text-center font-semibold whitespace-nowrap">

                        {item.cantidad_lecturas ?? 0}

                      </td>


                      {/* REALIZADAS */}
                      <td className="p-3 text-center whitespace-nowrap">

                        <span className="font-semibold text-emerald-600">

                          {item.lecturas_realizadas ?? 0}

                        </span>

                      </td>


                      {/* PENDIENTES */}
                      <td className="p-3 text-center whitespace-nowrap">

                        <span className="font-semibold text-amber-600">

                          {item.lecturas_pendientes ?? 0}

                        </span>

                      </td>


                      {/* IMPEDIMENTOS */}
                      <td className="p-3 text-center whitespace-nowrap">

                        <span className="inline-flex items-center gap-1">

                          <Ban
                            size={12}
                            className="text-rose-400"
                          />

                          {item.cantidad_impedimentos ?? 0}

                        </span>

                      </td>


                      {/* OBSERVACIONES */}
                      <td className="p-3 text-center whitespace-nowrap">

                        <span className="inline-flex items-center gap-1">

                          <MessageSquare
                            size={12}
                            className="text-slate-400"
                          />

                          {item.cantidad_observaciones ?? 0}

                        </span>

                      </td>


                      {/* FOTOS */}
                      <td className="p-3 text-center whitespace-nowrap">

                        <span className="inline-flex items-center gap-1">

                          <Camera
                            size={12}
                            className="text-slate-400"
                          />

                          {item.cantidad_fotos ?? 0}

                        </span>

                      </td>


                      {/* DURACIÓN */}
                      <td className="p-3 text-center whitespace-nowrap">

                        <span className="inline-flex items-center gap-1">

                          <Clock
                            size={12}
                            className="text-slate-400"
                          />

                          {formatearDuracion(
                            item.duracion_total_min
                          )}

                        </span>

                      </td>


                      {/* PROMEDIO */}
                      <td className="p-3 text-center whitespace-nowrap">

                        {Number(
                          item.promedio_min || 0
                        ).toFixed(2)}{" "}
                        min

                      </td>


                      {/* EFICIENCIA */}
                      <td className="p-3 text-center whitespace-nowrap">

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-bold ${
                            Number(item.eficiencia || 0) >=
                            80
                              ? "bg-emerald-50 text-emerald-700"
                              : Number(
                                    item.eficiencia || 0
                                  ) >= 60
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700"
                          }`}
                        >

                          <BarChart3 size={12} />

                          {Number(
                            item.eficiencia || 0
                          ).toFixed(2)}
                          %

                        </span>

                      </td>


                      {/* HORARIO */}
                      <td className="p-3 text-center whitespace-nowrap text-slate-500">

                        {formatearHora(
                          item.hora_inicio
                        )}

                        {" - "}

                        {formatearHora(
                          item.hora_fin
                        )}

                      </td>


                      {/* ACCIÓN */}
                      <td className="p-3 text-center whitespace-nowrap">

                        <button
                          type="button"
                          onClick={() =>
                            handleRevertir(item.id)
                          }
                          disabled={
                            revirtiendo !== null ||
                            loading
                          }
                          title="Revertir carga"
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >

                          {revirtiendo === item.id ? (

                            <>
                              <Loader2
                                size={12}
                                className="animate-spin"
                              />

                              Revirtiendo

                            </>

                          ) : (

                            <>
                              <RotateCcw size={12} />

                              Revertir

                            </>

                          )}

                        </button>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}