import React, { useState, useEffect, useRef } from "react";
import { uploadService } from "../../services/uploadService";

import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  History,
  Database,
  Loader2,
  Clock,
  RotateCcw,
  RefreshCw,
} from "lucide-react";

export default function UploadLectura({
  onSincronizacionExitosa,
}) {
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [revirtiendo, setRevirtiendo] = useState(null);

  const [status, setStatus] = useState({
    type: "",
    message: "",
  });

  const [historial, setHistorial] = useState([]);

  const fileInputRef = useRef(null);

  // ============================================================
  // TIPO DE PROCESO
  // ============================================================

  const PROCESO_TIPO = "Lectura";

  // ============================================================
  // OBTENER MENSAJE DE ERROR
  // ============================================================

  const obtenerMensajeError = (
    error,
    mensajePorDefecto = "Ocurrió un error inesperado."
  ) => {
    if (error?.code === "ECONNABORTED") {
      return "El servidor tardó demasiado en responder. El archivo Excel puede ser muy pesado.";
    }

    const detail = error?.response?.data?.detail;

    if (detail) {
      if (typeof detail === "string") {
        return detail;
      }

      if (Array.isArray(detail)) {
        return detail
          .map((item) => {
            if (typeof item === "string") {
              return item;
            }

            if (item?.msg) {
              const ubicacion = item?.loc
                ? ` (${item.loc.join(" → ")})`
                : "";

              return `${item.msg}${ubicacion}`;
            }

            return JSON.stringify(item);
          })
          .join(" | ");
      }

      return JSON.stringify(detail);
    }

    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    if (error?.message) {
      return error.message;
    }

    return mensajePorDefecto;
  };

  // ============================================================
  // CARGAR HISTORIAL
  // ============================================================

  const cargarHistorial = async () => {
    try {
      const data = await uploadService.getHistorial();

      setHistorial(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "Error al cargar historial:",
        error
      );

      setStatus({
        type: "error",
        message: obtenerMensajeError(
          error,
          "No se pudo cargar el historial de lecturas."
        ),
      });
    }
  };

  // ============================================================
  // CARGAR AL MONTAR
  // ============================================================

  useEffect(() => {
    cargarHistorial();
  }, []);

  // ============================================================
  // LIMPIAR INPUT
  // ============================================================

  const resetInputArchivo = () => {
    setArchivo(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ============================================================
  // SELECCIONAR ARCHIVO
  // ============================================================

  const handleSeleccionArchivo = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const nombreValido =
      /\.(xlsx|xls)$/i.test(file.name);

    if (!nombreValido) {
      setStatus({
        type: "error",
        message:
          "Formato no válido. El archivo debe ser .xlsx o .xls.",
      });

      resetInputArchivo();
      return;
    }

    setStatus({
      type: "",
      message: "",
    });

    setArchivo(file);
  };

  // ============================================================
  // SUBIR ARCHIVO
  // ============================================================

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!archivo || subiendo) return;

    setSubiendo(true);

    setStatus({
      type: "info",
      message:
        "Procesando archivo y validando las lecturas en el servidor...",
    });

    try {
      const result =
        await uploadService.uploadArchivo(
          archivo,
          PROCESO_TIPO
        );

      console.log(
        "Respuesta del API de carga:",
        result
      );

      const insertados = Number(
        result?.registros_insertados || 0
      );

      const errores = Number(
        result?.registros_error || 0
      );

      const total = Number(
        result?.total_filas_excel || 0
      );

      let mensaje =
        result?.message ||
        "Carga procesada correctamente.";

      mensaje += ` Filas del Excel: ${total}.`;
      mensaje += ` Insertadas: ${insertados}.`;

      if (errores > 0) {
        mensaje += ` Errores: ${errores}.`;
      }

      setStatus({
        type: errores > 0 ? "info" : "success",
        message: mensaje,
      });

      resetInputArchivo();

      await cargarHistorial();

      if (onSincronizacionExitosa) {
        onSincronizacionExitosa(result);
      }
    } catch (error) {
      console.error(
        "Error de subida:",
        error
      );

      const mensaje = obtenerMensajeError(
        error,
        "No se pudo procesar el archivo. Verifique la conexión o el formato del Excel."
      );

      setStatus({
        type: "error",
        message: `Error de carga: ${mensaje}`,
      });
    } finally {
      setSubiendo(false);
    }
  };

  // ============================================================
  // REVERTIR CARGA
  // ============================================================

  const handleRevertirCarga = async (idCarga) => {
    if (!idCarga || revirtiendo) return;

    const confirmar = window.confirm(
      "¿Está seguro de revertir esta carga de lecturas?\n\nEsta acción eliminará la carga y sus registros asociados."
    );

    if (!confirmar) return;

    setRevirtiendo(idCarga);

    setStatus({
      type: "info",
      message: "Revirtiendo carga de lecturas...",
    });

    try {
      const result =
        await uploadService.revertirCarga(
          idCarga
        );

      console.log(
        "Respuesta del API al revertir:",
        result
      );

      setStatus({
        type: "success",
        message:
          result?.message ||
          `La carga #${idCarga} fue revertida correctamente.`,
      });

      await cargarHistorial();

      if (onSincronizacionExitosa) {
        onSincronizacionExitosa();
      }
    } catch (error) {
      console.error(
        "Error al revertir carga:",
        error
      );

      const mensaje = obtenerMensajeError(
        error,
        "No se pudo revertir la carga seleccionada."
      );

      setStatus({
        type: "error",
        message: `Error al revertir: ${mensaje}`,
      });
    } finally {
      setRevirtiendo(null);
    }
  };

  // ============================================================
  // FILTRAR HISTORIAL
  // ============================================================

  const historialFiltrado = historial.filter(
    (h) => h.proceso === PROCESO_TIPO
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6 text-left">

      {/* ======================================================
          CABECERA + IMPORTAR
      ======================================================= */}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

        <div className="flex items-center justify-between gap-4">

          <div className="min-w-0">

            <h3 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">

              <Database
                size={16}
                className="text-[#006cb7] shrink-0"
              />

              Gestión de Lecturas Comerciales

            </h3>

            <p className="text-xs text-slate-500 mt-1">
              Importa y administra los archivos de
              lecturas comerciales.
            </p>

          </div>

          {/* BOTÓN IMPORTAR */}

          <button
            type="button"
            onClick={() =>
              !subiendo &&
              fileInputRef.current?.click()
            }
            disabled={subiendo}
            className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-[#006cb7] bg-blue-50 border border-blue-100 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >

            <UploadCloud size={14} />

            Importar información

          </button>

        </div>

        {/* INPUT */}

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleSeleccionArchivo}
          disabled={subiendo}
        />

        {/* ARCHIVO SELECCIONADO */}

        {archivo && (

          <div className="mt-4 flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">

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

        {/* FORMULARIO */}

        <form
          onSubmit={handleUpload}
          className="mt-4"
        >

          <button
            type="submit"
            disabled={!archivo || subiendo}
            className="w-full bg-[#006cb7] text-white py-2.5 rounded-xl font-bold text-xs disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >

            {subiendo ? (

              <>
                <Loader2
                  size={16}
                  className="animate-spin"
                />

                Procesando...
              </>

            ) : (

              <>
                <UploadCloud size={16} />

                Procesar Lecturas
              </>

            )}

          </button>

        </form>

        {/* ESTADO */}

        {status.message && (

          <div
            className={`mt-4 p-4 rounded-xl border text-xs flex items-start gap-3 ${
              status.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : status.type === "error"
                  ? "bg-rose-50 text-rose-900 border-rose-200"
                  : "bg-blue-50 text-blue-900 border-blue-200"
            }`}
          >

            <div className="mt-0.5 shrink-0">

              {status.type === "error" ? (

                <AlertCircle size={16} />

              ) : status.type === "success" ? (

                <CheckCircle2 size={16} />

              ) : (

                <Loader2
                  size={16}
                  className="animate-spin"
                />

              )}

            </div>

            <div className="leading-relaxed min-w-0">

              <span className="font-bold block mb-0.5">

                {status.type === "error"
                  ? "Error"
                  : status.type === "success"
                    ? "Completado"
                    : "Procesando"}

              </span>

              {status.message}

            </div>

          </div>

        )}

      </div>


      {/* ======================================================
          AUDITORÍA / HISTORIAL
      ======================================================= */}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

        {/* CABECERA */}

        <div className="flex items-center justify-between gap-4 mb-5">

          <div className="min-w-0">

            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">

              <History
                size={16}
                className="text-[#006cb7] shrink-0"
              />

              Auditoría de Cargas

            </h4>

            <p className="text-[10px] text-slate-400 mt-1">
              Historial de archivos procesados para
              lecturas comerciales.
            </p>

          </div>

          <button
            type="button"
            onClick={cargarHistorial}
            disabled={
              subiendo ||
              revirtiendo !== null
            }
            className="shrink-0 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-[#006cb7] bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition-colors"
          >

            <RefreshCw
              size={14}
              className={
                subiendo ||
                revirtiendo !== null
                  ? "animate-spin"
                  : ""
              }
            />

            Actualizar

          </button>

        </div>


        {/* ====================================================
            UNA SOLA TABLA
        ===================================================== */}

        <div className="border border-slate-200 rounded-xl overflow-hidden">

          {/* CONTENEDOR DE SCROLL */}

          <div className="overflow-auto max-h-[420px]">

            <table className="w-full min-w-[900px] table-fixed text-xs border-collapse">

              {/* =================================================
                  CABECERA
              ================================================== */}

              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-700 uppercase">

                <tr className="border-b border-slate-200">

                  {/* ARCHIVO */}

                  <th className="w-[32%] p-3 text-left font-bold whitespace-nowrap bg-slate-50">
                    Archivo
                  </th>

                  {/* ESTADO */}

                  <th className="w-[14%] p-3 text-left font-bold whitespace-nowrap bg-slate-50">
                    Estado
                  </th>

                  {/* INSERTADOS */}

                  <th className="w-[12%] p-3 text-center font-bold whitespace-nowrap bg-slate-50">
                    Insertados
                  </th>

                  {/* ERRORES */}

                  <th className="w-[10%] p-3 text-center font-bold whitespace-nowrap bg-slate-50">
                    Errores
                  </th>

                  {/* FECHA */}

                  <th className="w-[20%] p-3 text-left font-bold whitespace-nowrap bg-slate-50">

                    <span className="flex items-center gap-1">

                      <Clock size={12} />

                      Fecha y Hora

                    </span>

                  </th>

                  {/* ACCIÓN */}

                  <th className="w-[12%] p-3 text-center font-bold whitespace-nowrap bg-slate-50">
                    Acción
                  </th>

                </tr>

              </thead>


              {/* =================================================
                  CUERPO
              ================================================== */}

              <tbody className="divide-y divide-slate-200">

                {/* SIN DATOS */}

                {historialFiltrado.length === 0 ? (

                  <tr>

                    <td
                      colSpan={6}
                      className="p-10 text-center"
                    >

                      <div className="flex flex-col items-center gap-2">

                        <div className="p-3 bg-slate-50 rounded-xl text-slate-300">

                          <History size={24} />

                        </div>

                        <p className="text-xs font-medium text-slate-500">
                          No se registran cargas previas
                        </p>

                        <p className="text-[10px] text-slate-400">
                          El historial aparecerá aquí
                          después de procesar un archivo.
                        </p>

                      </div>

                    </td>

                  </tr>

                ) : (

                  historialFiltrado.map((h) => (

                    <tr
                      key={h.id_carga}
                      className="hover:bg-slate-50/50 transition-colors"
                    >

                      {/* =================================================
                          ARCHIVO
                      ================================================== */}

                      <td className="p-3 font-medium text-slate-800 align-middle">

                        <div className="flex items-center gap-2 min-w-0">

                          <div className="p-2 bg-blue-50 text-[#006cb7] rounded-lg shrink-0">

                            <FileSpreadsheet size={15} />

                          </div>

                          <span
                            className="truncate"
                            title={
                              h.nombre_archivo ||
                              "Archivo sin nombre"
                            }
                          >
                            {h.nombre_archivo ||
                              "Archivo sin nombre"}
                          </span>

                        </div>

                      </td>


                      {/* =================================================
                          ESTADO
                      ================================================== */}

                      <td className="p-3 align-middle">

                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${
                            String(h.estado || "")
                              .toLowerCase()
                              .includes("error")
                              ? "bg-rose-100 text-rose-700"
                              : String(h.estado || "")
                                  .toLowerCase()
                                  .includes("revert")
                                ? "bg-slate-100 text-slate-600"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >

                          {h.estado || "Procesado"}

                        </span>

                      </td>


                      {/* =================================================
                          INSERTADOS
                      ================================================== */}

                      <td className="p-3 text-center align-middle">

                        <span className="font-bold text-[#006cb7]">

                          {h.registros_insertados ?? 0}

                        </span>

                      </td>


                      {/* =================================================
                          ERRORES
                      ================================================== */}

                      <td className="p-3 text-center align-middle">

                        {Number(
                          h.registros_error || 0
                        ) > 0 ? (

                          <span className="inline-flex px-2 py-1 rounded-full bg-rose-50 text-rose-600 font-bold">

                            {h.registros_error ?? 0}

                          </span>

                        ) : (

                          <span className="text-slate-500">
                            0
                          </span>

                        )}

                      </td>


                      {/* =================================================
                          FECHA
                      ================================================== */}

                      <td className="p-3 text-slate-600 whitespace-nowrap align-middle">

                        {h.fecha_carga
                          ? new Date(
                              h.fecha_carga
                            ).toLocaleString(
                              "es-PE"
                            )
                          : "Fecha no registrada"}

                      </td>


                      {/* =================================================
                          ACCIÓN
                      ================================================== */}

                      <td className="p-3 text-center align-middle">

                        <button
                          type="button"
                          onClick={() =>
                            handleRevertirCarga(
                              h.id_carga
                            )
                          }
                          disabled={
                            revirtiendo !== null ||
                            subiendo
                          }
                          title="Revertir carga"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                        >

                          {revirtiendo ===
                          h.id_carga ? (

                            <>
                              <Loader2
                                size={13}
                                className="animate-spin"
                              />

                              Revirtiendo...
                            </>

                          ) : (

                            <>
                              <RotateCcw size={13} />

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