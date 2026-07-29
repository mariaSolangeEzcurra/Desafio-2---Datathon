import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { uploadService } from "../../services/UploadCortesService";
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
  Info,
} from "lucide-react";

// ============================================================
// TOOLTIP GLOBAL (renderizado en un portal)
//
// Mismo componente usado en los otros módulos del proyecto: se
// dibuja con un React Portal directo sobre <body>, con posición
// "fixed" calculada desde la posición real del elemento en pantalla
// (getBoundingClientRect). Así nunca se corta por el overflow de
// la tabla con scroll, y se ajusta solo si conviene mostrarse
// arriba o abajo.
// ============================================================
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

export default function UploadCortes({ onSincronizacionExitosa }) {
  // ============================================================
  // ESTADOS
  // ============================================================
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
  // PROCESO EXACTO QUE ESPERA EL API
  // POST /api/cortes/upload-excel
  // proceso=Corte
  // ============================================================
  const PROCESO_TIPO = "Corte";
  // ============================================================
  // CARGAR HISTORIAL
  // GET /api/cortes/historial
  // ============================================================
  const cargarHistorial = async () => {
    try {
      const data = await uploadService.getHistorial();
      console.log("HISTORIAL CORTES:", data);
      setHistorial(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar historial de cortes:", error);
      let mensaje = "No se pudo obtener el historial de cargas de cortes.";
      if (error?.response?.data?.detail) {
        const detalle = error.response.data.detail;
        if (typeof detalle === "string") {
          mensaje = detalle;
        } else if (Array.isArray(detalle)) {
          mensaje = detalle
            .map((item) => item?.msg || JSON.stringify(item))
            .join(" | ");
        }
      }
      setStatus({
        type: "error",
        message: mensaje,
      });
    }
  };
  // ============================================================
  // CARGA INICIAL
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
    const nombreValido = /\.(xlsx|xls)$/i.test(file.name);
    if (!nombreValido) {
      setStatus({
        type: "error",
        message: "Formato no válido. El archivo debe ser .xlsx o .xls.",
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
  // POST /api/cortes/upload-excel
  // ============================================================
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!archivo || subiendo) return;
    setSubiendo(true);
    setStatus({
      type: "info",
      message: "Procesando archivo de cortes...",
    });
    try {
      console.log("ENVIANDO ARCHIVO:", archivo.name);
      console.log("PROCESO ENVIADO:", PROCESO_TIPO);
      const result = await uploadService.uploadArchivo(archivo, PROCESO_TIPO);
      console.log("RESPUESTA API CORTES:", result);
      setStatus({
        type: "success",
        message: result?.message
          ? `${result.message} (${result.registros_insertados ?? 0} de ${
              result.total_filas_excel ?? 0
            } filas)`
          : `Carga exitosa. Se insertaron ${
              result?.registros_insertados ?? 0
            } registros.`,
      });
      // Limpiar archivo seleccionado
      resetInputArchivo();
      // Actualizar historial
      await cargarHistorial();
      if (onSincronizacionExitosa) {
        onSincronizacionExitosa();
      }
    } catch (error) {
      console.error("Error de subida de cortes:", error);
      let mensaje = "No se pudo procesar el archivo.";
      if (error?.response?.data?.detail) {
        const detalle = error.response.data.detail;
        if (typeof detalle === "string") {
          mensaje = detalle;
        } else if (Array.isArray(detalle)) {
          mensaje = detalle
            .map((item) => item?.msg || JSON.stringify(item))
            .join(" | ");
        } else {
          mensaje = JSON.stringify(detalle);
        }
      }
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
  // DELETE /api/cortes/historial/{id_carga}
  // ============================================================
  const handleRevertir = async (idCarga) => {
    if (!idCarga || revirtiendo !== null) {
      return;
    }
    const confirmar = window.confirm(
      "¿Está seguro de revertir esta carga?\n\n" +
        "La carga será eliminada y el historial será actualizado."
    );
    if (!confirmar) return;
    try {
      setRevirtiendo(idCarga);
      setStatus({
        type: "info",
        message: "Revirtiendo carga...",
      });
      console.log("REVERTIR CARGA:", idCarga);
      await uploadService.revertirCarga(idCarga);
      setStatus({
        type: "success",
        message: "La carga fue revertida correctamente.",
      });
      // Actualizar historial
      await cargarHistorial();
      if (onSincronizacionExitosa) {
        onSincronizacionExitosa();
      }
    } catch (error) {
      console.error("Error al revertir carga:", error);
      let mensaje = "No se pudo revertir la carga.";
      if (error?.response?.data?.detail) {
        const detalle = error.response.data.detail;
        if (typeof detalle === "string") {
          mensaje = detalle;
        } else if (Array.isArray(detalle)) {
          mensaje = detalle
            .map((item) => item?.msg || JSON.stringify(item))
            .join(" | ");
        } else {
          mensaje = JSON.stringify(detalle);
        }
      }
      setStatus({
        type: "error",
        message: mensaje,
      });
    } finally {
      setRevirtiendo(null);
    }
  };
  // ============================================================
  // FILTRAR SOLO CARGAS DE CORTE
  // El API devuelve proceso: "Corte"
  // ============================================================
  const historialFiltrado = historial.filter(
    (h) =>
      String(h.proceso || "")
        .trim()
        .toLowerCase() === PROCESO_TIPO.toLowerCase()
  );
  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6 text-left">
      {/* ======================================================
          1. CABECERA + IMPORTAR
          (mismo formato que el módulo de Lecturas)
      ====================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
              <Database size={16} className="text-[#006cb7] shrink-0" />
              Gestión de Cortes
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Importa y administra los archivos de cortes.
            </p>
          </div>
          {/* BOTÓN IMPORTAR */}
          <button
            type="button"
            onClick={() => !subiendo && fileInputRef.current?.click()}
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
              <FileSpreadsheet size={15} className="text-[#006cb7] shrink-0" />
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
        <form onSubmit={handleUpload} className="mt-4">
          <button
            type="submit"
            disabled={!archivo || subiendo}
            className="w-full bg-[#006cb7] text-white py-2.5 rounded-xl font-bold text-xs disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {subiendo ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <UploadCloud size={16} />
                Procesar Cortes
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
                <Loader2 size={16} className="animate-spin" />
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
          2. HISTORIAL
      ====================================================== */}
      <div
        className="
        bg-white
        border border-slate-200
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
          <div>
            <h3
              className="
              text-sm
              font-bold
              text-slate-700
              uppercase
              flex
              items-center
              gap-2
            "
            >
              <History size={16} className="text-[#006cb7]" />
              Historial de Cargas
            </h3>
            <p
              className="
              text-[10px]
              text-slate-400
              mt-1
            "
            >
              Registro de cargas de cortes obtenidas desde el API.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span
              className="
              text-[10px]
              font-bold
              text-slate-400
              uppercase
            "
            >
              {historialFiltrado.length} registros
            </span>
            <button
              type="button"
              onClick={cargarHistorial}
              disabled={subiendo || revirtiendo !== null}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-[#006cb7] bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                size={14}
                className={
                  subiendo || revirtiendo !== null ? "animate-spin" : ""
                }
              />
              Actualizar
            </button>
          </div>
        </div>
        {/* ====================================================
            TABLA
        ==================================================== */}
        <div
          className="
          border
          border-slate-200
          rounded-xl
          overflow-auto
        "
        >
          <table
            className="
            w-full
            min-w-[950px]
            text-left
            text-xs
          "
          >
            <thead
              className="
              bg-slate-50
              text-slate-500
              uppercase
            "
            >
              <tr
                className="
                border-b
                border-slate-200
              "
              >
                <th className="p-3 font-bold">
                  <Tooltip
                    title="ID carga"
                    text="Identificador único que el sistema le asigna a cada archivo procesado. Se usa como referencia para revertir una carga específica."
                    width="w-72"
                  >
                    <span className="cursor-help">ID carga</span>
                  </Tooltip>
                </th>
                <th className="p-3 font-bold">
                  <Tooltip
                    title="Archivo"
                    text="Nombre del archivo Excel que fue subido al sistema para procesar la información de cortes."
                    width="w-72"
                  >
                    <span className="cursor-help">Archivo</span>
                  </Tooltip>
                </th>
                <th className="p-3 font-bold">
                  <Tooltip
                    title="Tipo de archivo"
                    text="Formato del archivo que se cargó (por ejemplo .xlsx o .xls), tal como lo devuelve el backend."
                    width="w-72"
                  >
                    <span className="cursor-help">Tipo de archivo</span>
                  </Tooltip>
                </th>
                <th className="p-3 font-bold">
                  <Tooltip
                    title="Estado"
                    text="Situación actual de la carga: si se procesó correctamente, si presentó errores o si fue revertida posteriormente."
                    width="w-80"
                  >
                    <span className="cursor-help">Estado</span>
                  </Tooltip>
                </th>
                <th
                  className="
                  p-3
                  font-bold
                  text-center
                "
                >
                  <Tooltip
                    title="Insertados"
                    text="Cantidad de filas del Excel que se guardaron correctamente en el sistema como registros de corte válidos."
                    width="w-80"
                  >
                    <span className="cursor-help">Insertados</span>
                  </Tooltip>
                </th>
                <th
                  className="
                  p-3
                  font-bold
                  text-center
                "
                >
                  <Tooltip
                    title="Errores"
                    text="Cantidad de filas del Excel que no pudieron insertarse, generalmente por datos faltantes, mal formateados o inconsistentes."
                    width="w-80"
                  >
                    <span className="cursor-help">Errores</span>
                  </Tooltip>
                </th>
                <th className="p-3 font-bold">
                  <Tooltip
                    title="Fecha y hora"
                    text="Fecha y hora exactas en que se procesó esta carga en el sistema."
                    width="w-72"
                  >
                    <span
                      className="
                    flex
                    items-center
                    gap-1
                    cursor-help
                  "
                    >
                      <Clock size={12} />
                      Fecha y hora
                    </span>
                  </Tooltip>
                </th>
                <th
                  className="
                  p-3
                  font-bold
                  text-center
                "
                >
                  <Tooltip
                    title="Acción"
                    text="Permite revertir la carga: elimina de forma definitiva esta carga y todos los registros de corte que se insertaron a partir de ella."
                    width="w-80"
                  >
                    <span className="cursor-help">Acción</span>
                  </Tooltip>
                </th>
              </tr>
            </thead>
            <tbody
              className="
              divide-y
              divide-slate-100
            "
            >
              {historialFiltrado.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="
                      p-10
                      text-center
                      text-slate-400
                    "
                  >
                    <div
                      className="
                      flex
                      flex-col
                      items-center
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
                        <Database size={22} />
                      </div>
                      <p
                        className="
                        text-xs
                        font-medium
                      "
                      >
                        No se registran cargas de cortes.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                historialFiltrado.map((h) => (
                  <tr
                    key={h.id_carga}
                    className="
                      hover:bg-slate-50/70
                      transition-colors
                    "
                  >
                    {/* ======================================
                        ID CARGA
                    ====================================== */}
                    <td
                      className="
                      p-3
                      font-mono
                      font-bold
                      text-slate-600
                    "
                    >
                      {h.id_carga}
                    </td>
                    {/* ======================================
                        ARCHIVO
                    ====================================== */}
                    <td className="p-3">
                      <div
                        className="
                        flex
                        items-center
                        gap-2
                        min-w-[180px]
                      "
                      >
                        <div
                          className="
                          p-2
                          rounded-lg
                          bg-blue-50
                          text-[#006cb7]
                          shrink-0
                        "
                        >
                          <FileSpreadsheet size={15} />
                        </div>
                        <p
                          className="
                          font-semibold
                          text-slate-800
                          truncate
                        "
                        >
                          {h.nombre_archivo || "Sin nombre"}
                        </p>
                      </div>
                    </td>
                    {/* ======================================
                        TIPO ARCHIVO
                    ====================================== */}
                    <td className="p-3">
                      <span
                        className="
                        inline-flex
                        rounded-full
                        border
                        border-blue-200
                        bg-blue-50
                        text-[#006cb7]
                        px-2.5
                        py-1
                        text-[10px]
                        font-bold
                      "
                      >
                        {h.tipo_archivo || "No disponible"}
                      </span>
                    </td>
                    {/* ======================================
                        ESTADO
                    ====================================== */}
                    <td className="p-3">
                      <span
                        className={`
                          inline-flex
                          rounded-full
                          border
                          px-2.5
                          py-1
                          text-[10px]
                          font-bold
                          ${
                            String(h.estado || "")
                              .toLowerCase()
                              .includes("error")
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : String(h.estado || "")
                                  .toLowerCase()
                                  .includes("revert")
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }
                        `}
                      >
                        {h.estado || "Sin estado"}
                      </span>
                    </td>
                    {/* ======================================
                        REGISTROS INSERTADOS
                    ====================================== */}
                    <td
                      className="
                      p-3
                      text-center
                      font-bold
                      text-[#006cb7]
                    "
                    >
                      {h.registros_insertados ?? 0}
                    </td>
                    {/* ======================================
                        REGISTROS CON ERROR
                    ====================================== */}
                    <td
                      className="
                      p-3
                      text-center
                      font-bold
                      text-slate-600
                    "
                    >
                      {h.registros_error ?? 0}
                    </td>
                    {/* ======================================
                        FECHA Y HORA
                    ====================================== */}
                    <td
                      className="
                      p-3
                      text-slate-600
                      whitespace-nowrap
                    "
                    >
                      {h.fecha_carga
                        ? new Date(h.fecha_carga).toLocaleString()
                        : "Fecha no registrada"}
                    </td>
                    {/* ======================================
                        ACCIÓN
                    ====================================== */}
                    <td className="p-3">
                      <div
                        className="
                        flex
                        justify-center
                      "
                      >
                        <button
                          type="button"
                          onClick={() => handleRevertir(h.id_carga)}
                          disabled={revirtiendo !== null}
                          title="Revertir carga"
                          className="
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            min-w-[105px]
                            px-3
                            py-2
                            rounded-lg
                            bg-rose-50
                            text-rose-600
                            hover:bg-rose-600
                            hover:text-white
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                            transition
                            text-[10px]
                            font-bold
                          "
                        >
                          {revirtiendo === h.id_carga ? (
                            <>
                              <Loader2
                                size={14}
                                className="
                                  animate-spin
                                "
                              />
                              Revirtiendo...
                            </>
                          ) : (
                            <>
                              <RotateCcw size={14} />
                              Revertir
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}