import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

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
      console.error(
        "Error al cargar historial de cortes:",
        error
      );

      let mensaje =
        "No se pudo obtener el historial de cargas de cortes.";

      if (error?.response?.data?.detail) {
        const detalle = error.response.data.detail;

        if (typeof detalle === "string") {
          mensaje = detalle;
        } else if (Array.isArray(detalle)) {
          mensaje = detalle
            .map(
              (item) =>
                item?.msg || JSON.stringify(item)
            )
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
  // POST /api/cortes/upload-excel
  // ============================================================

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!archivo || subiendo) return;

    setSubiendo(true);

    setStatus({
      type: "info",
      message:
        "Procesando archivo de cortes...",
    });

    try {
      console.log(
        "ENVIANDO ARCHIVO:",
        archivo.name
      );

      console.log(
        "PROCESO ENVIADO:",
        PROCESO_TIPO
      );

      const result =
        await uploadService.uploadArchivo(
          archivo,
          PROCESO_TIPO
        );

      console.log(
        "RESPUESTA API CORTES:",
        result
      );

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
      console.error(
        "Error de subida de cortes:",
        error
      );

      let mensaje =
        "No se pudo procesar el archivo.";

      if (error?.response?.data?.detail) {
        const detalle =
          error.response.data.detail;

        if (typeof detalle === "string") {
          mensaje = detalle;
        } else if (Array.isArray(detalle)) {
          mensaje = detalle
            .map(
              (item) =>
                item?.msg ||
                JSON.stringify(item)
            )
            .join(" | ");
        } else {
          mensaje =
            JSON.stringify(detalle);
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

      console.log(
        "REVERTIR CARGA:",
        idCarga
      );

      await uploadService.revertirCarga(
        idCarga
      );

      setStatus({
        type: "success",
        message:
          "La carga fue revertida correctamente.",
      });

      // Actualizar historial
      await cargarHistorial();

      if (onSincronizacionExitosa) {
        onSincronizacionExitosa();
      }
    } catch (error) {
      console.error(
        "Error al revertir carga:",
        error
      );

      let mensaje =
        "No se pudo revertir la carga.";

      if (error?.response?.data?.detail) {
        const detalle =
          error.response.data.detail;

        if (typeof detalle === "string") {
          mensaje = detalle;
        } else if (Array.isArray(detalle)) {
          mensaje = detalle
            .map(
              (item) =>
                item?.msg ||
                JSON.stringify(item)
            )
            .join(" | ");
        } else {
          mensaje =
            JSON.stringify(detalle);
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

  const historialFiltrado =
    historial.filter(
      (h) =>
        String(h.proceso || "")
          .trim()
          .toLowerCase() ===
        PROCESO_TIPO.toLowerCase()
    );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6 text-left">

      {/* ======================================================
          1. CARGA DE ARCHIVO
      ====================================================== */}

      <div className="
        bg-white
        border border-slate-200
        rounded-2xl
        p-6
        shadow-sm
      ">

        <h3 className="
          text-sm
          font-bold
          text-slate-700
          uppercase
          mb-4
          flex
          items-center
          gap-2
        ">

          <Database
            size={16}
            className="text-[#006cb7]"
          />

          Carga de Cortes

        </h3>

        <p className="
          text-xs
          text-slate-500
          mb-4
        ">
          Seleccione el archivo Excel con la
          información de cortes para realizar
          la carga.
        </p>

        <form
          onSubmit={handleUpload}
          className="space-y-4"
        >

          {/* ==================================================
              SELECTOR DE ARCHIVO
          ================================================== */}

          <div
            className="
              border-2
              border-dashed
              border-slate-200
              rounded-xl
              p-8
              text-center
              cursor-pointer
              hover:border-[#006cb7]
              transition-colors
              bg-slate-50/50
            "
            onClick={() =>
              fileInputRef.current?.click()
            }
          >

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={
                handleSeleccionArchivo
              }
            />

            {archivo ? (

              <div className="
                flex
                items-center
                justify-center
                gap-3
              ">

                <FileSpreadsheet
                  size={22}
                  className="
                    text-[#006cb7]
                    shrink-0
                  "
                />

                <div className="
                  text-left
                  min-w-0
                ">

                  <p className="
                    text-xs
                    font-semibold
                    text-slate-700
                    truncate
                  ">
                    {archivo.name}
                  </p>

                  <p className="
                    text-[10px]
                    text-slate-400
                    mt-0.5
                  ">
                    Archivo seleccionado
                  </p>

                </div>

              </div>

            ) : (

              <div className="space-y-2">

                <UploadCloud
                  className="
                    w-10
                    h-10
                    text-slate-300
                    mx-auto
                  "
                />

                <p className="
                  text-xs
                  text-slate-600
                  font-medium
                ">
                  Haga clic aquí para seleccionar
                  el archivo Excel
                </p>

                <p className="
                  text-[10px]
                  text-slate-400
                ">
                  Formatos permitidos: .xlsx y .xls
                </p>

              </div>

            )}

          </div>

          {/* ==================================================
              BOTÓN DE CARGA
          ================================================== */}

          <button
            type="submit"
            disabled={!archivo || subiendo}
            className="
              w-full
              bg-[#006cb7]
              hover:bg-[#005a9c]
              text-white
              py-2.5
              rounded-xl
              font-bold
              text-xs
              disabled:bg-slate-300
              disabled:cursor-not-allowed
              transition-colors
              flex
              items-center
              justify-center
              gap-2
            "
          >

            {subiendo ? (

              <>
                <Loader2
                  className="animate-spin"
                  size={16}
                />

                Procesando datos...
              </>

            ) : (

              <>
                <UploadCloud size={16} />

                Iniciar Carga de Cortes
              </>

            )}

          </button>

        </form>

        {/* ====================================================
            MENSAJE DE ESTADO
        ==================================================== */}

        {status.message && (

          <div className={`
            mt-4
            p-4
            rounded-xl
            border
            text-xs
            flex
            items-start
            gap-3
            shadow-sm

            ${
              status.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : status.type === "error"
                ? "bg-rose-50 text-rose-900 border-rose-200"
                : "bg-blue-50 text-blue-900 border-blue-200"
            }
          `}>

            <div className="
              mt-0.5
              shrink-0
            ">

              {status.type === "error" ? (

                <AlertCircle
                  size={18}
                  className="text-rose-600"
                />

              ) : status.type === "success" ? (

                <CheckCircle2
                  size={18}
                  className="text-emerald-600"
                />

              ) : (

                <Loader2
                  size={18}
                  className="
                    animate-spin
                    text-blue-600
                  "
                />

              )}

            </div>

            <div className="
              flex-1
              leading-relaxed
            ">

              <span className="
                font-bold
                block
                mb-0.5
              ">

                {status.type === "error"
                  ? "Error:"
                  : status.type === "success"
                  ? "Proceso completado:"
                  : "Estado:"}

              </span>

              {status.message}

            </div>

          </div>

        )}

      </div>

      {/* ======================================================
          2. HISTORIAL
      ====================================================== */}

      <div className="
        bg-white
        border border-slate-200
        rounded-2xl
        p-6
        shadow-sm
      ">

        <div className="
          flex
          flex-col
          sm:flex-row
          sm:items-center
          sm:justify-between
          gap-3
          mb-4
        ">

          <div>

            <h3 className="
              text-sm
              font-bold
              text-slate-700
              uppercase
              flex
              items-center
              gap-2
            ">

              <History
                size={16}
                className="text-[#006cb7]"
              />

              Historial de Cargas

            </h3>

            <p className="
              text-[10px]
              text-slate-400
              mt-1
            ">
              Registro de cargas de cortes
              obtenidas desde el API.
            </p>

          </div>

          <span className="
            text-[10px]
            font-bold
            text-slate-400
            uppercase
          ">
            {historialFiltrado.length} registros
          </span>

        </div>

        {/* ====================================================
            TABLA
        ==================================================== */}

        <div className="
          border
          border-slate-200
          rounded-xl
          overflow-auto
        ">

          <table className="
            w-full
            min-w-[950px]
            text-left
            text-xs
          ">

            <thead className="
              bg-slate-50
              text-slate-500
              uppercase
            ">

              <tr className="
                border-b
                border-slate-200
              ">

                <th className="p-3 font-bold">
                  ID carga
                </th>

                <th className="p-3 font-bold">
                  Archivo
                </th>

                <th className="p-3 font-bold">
                  Tipo de archivo
                </th>

                <th className="p-3 font-bold">
                  Estado
                </th>

                <th className="
                  p-3
                  font-bold
                  text-center
                ">
                  Insertados
                </th>

                <th className="
                  p-3
                  font-bold
                  text-center
                ">
                  Errores
                </th>

                <th className="p-3 font-bold">

                  <span className="
                    flex
                    items-center
                    gap-1
                  ">

                    <Clock size={12} />

                    Fecha y hora

                  </span>

                </th>

                <th className="
                  p-3
                  font-bold
                  text-center
                ">
                  Acción
                </th>

              </tr>

            </thead>

            <tbody className="
              divide-y
              divide-slate-100
            ">

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

                    <div className="
                      flex
                      flex-col
                      items-center
                      gap-2
                    ">

                      <div className="
                        p-3
                        bg-slate-50
                        rounded-xl
                      ">

                        <Database size={22} />

                      </div>

                      <p className="
                        text-xs
                        font-medium
                      ">
                        No se registran cargas
                        de cortes.
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

                    <td className="
                      p-3
                      font-mono
                      font-bold
                      text-slate-600
                    ">
                      {h.id_carga}
                    </td>

                    {/* ======================================
                        ARCHIVO
                    ====================================== */}

                    <td className="p-3">

                      <div className="
                        flex
                        items-center
                        gap-2
                        min-w-[180px]
                      ">

                        <div className="
                          p-2
                          rounded-lg
                          bg-blue-50
                          text-[#006cb7]
                          shrink-0
                        ">

                          <FileSpreadsheet
                            size={15}
                          />

                        </div>

                        <p className="
                          font-semibold
                          text-slate-800
                          truncate
                        ">
                          {h.nombre_archivo ||
                            "Sin nombre"}
                        </p>

                      </div>

                    </td>

                    {/* ======================================
                        TIPO ARCHIVO
                    ====================================== */}

                    <td className="p-3">

                      <span className="
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
                      ">
                        {h.tipo_archivo ||
                          "No disponible"}
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
                            String(
                              h.estado || ""
                            )
                              .toLowerCase()
                              .includes("error")
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : String(
                                  h.estado || ""
                                )
                                  .toLowerCase()
                                  .includes(
                                    "revert"
                                  )
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }
                        `}
                      >
                        {h.estado ||
                          "Sin estado"}
                      </span>

                    </td>

                    {/* ======================================
                        REGISTROS INSERTADOS
                    ====================================== */}

                    <td className="
                      p-3
                      text-center
                      font-bold
                      text-[#006cb7]
                    ">
                      {h.registros_insertados ??
                        0}
                    </td>

                    {/* ======================================
                        REGISTROS CON ERROR
                    ====================================== */}

                    <td className="
                      p-3
                      text-center
                      font-bold
                      text-slate-600
                    ">
                      {h.registros_error ?? 0}
                    </td>

                    {/* ======================================
                        FECHA Y HORA
                    ====================================== */}

                    <td className="
                      p-3
                      text-slate-600
                      whitespace-nowrap
                    ">

                      {h.fecha_carga
                        ? new Date(
                            h.fecha_carga
                          ).toLocaleString()
                        : "Fecha no registrada"}

                    </td>

                    {/* ======================================
                        ACCIÓN
                    ====================================== */}

                    <td className="p-3">

                      <div className="
                        flex
                        justify-center
                      ">

                        <button
                          type="button"
                          onClick={() =>
                            handleRevertir(
                              h.id_carga
                            )
                          }
                          disabled={
                            revirtiendo !== null
                          }
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

                          {revirtiendo ===
                          h.id_carga ? (

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
                              <RotateCcw
                                size={14}
                              />

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