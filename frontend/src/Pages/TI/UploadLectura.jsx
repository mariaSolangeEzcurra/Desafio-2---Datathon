import React, { useState, useEffect, useRef } from "react";
import { uploadService } from "../../services/uploadService";
import {
  UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle,
  History, Database, Loader2, Clock
} from "lucide-react";

export default function UploadLectura({ onSincronizacionExitosa }) {
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [historial, setHistorial] = useState([]);
  const fileInputRef = useRef(null);

  // Proceso fijo para este componente
  const PROCESO_TIPO = "Lectura";

  const cargarHistorial = async () => {
    try {
      const data = await uploadService.getHistorial();
      setHistorial(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar historial:", err);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const resetInputArchivo = () => {
    setArchivo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSeleccionArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const nombreValido = /\.(xlsx|xls)$/i.test(file.name);
    if (!nombreValido) {
      setStatus({ type: "error", message: "Formato no válido. El archivo debe ser .xlsx o .xls" });
      resetInputArchivo();
      return;
    }

    setStatus({ type: "", message: "" });
    setArchivo(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!archivo || subiendo) return;

    setSubiendo(true);
    setStatus({ type: "info", message: "Procesando archivo y validando columnas en el servidor..." });

    try {
      // Enviamos el archivo junto con el proceso fijo "Lectura"
      const result = await uploadService.uploadArchivo(archivo, PROCESO_TIPO);

      setStatus({
        type: "success",
        message: result.message
          ? `${result.message} (${result.registros_insertados} de ${result.total_filas_excel} filas)`
          : `¡Carga exitosa! Se procesaron ${result.registros_insertados} registros correctamente.`,
      });

      resetInputArchivo();
      await cargarHistorial();
      if (onSincronizacionExitosa) onSincronizacionExitosa();

    } catch (error) {
      console.error("Error de subida:", error);

      let mensaje = "No se pudo procesar el archivo. Verifique la conexión o el formato de las columnas.";
      
      if (error.code === "ECONNABORTED") {
        mensaje = "El servidor tardó demasiado en responder. El archivo Excel puede ser muy pesado.";
      } else if (error.response?.data?.detail) {
        const detalle = error.response.data.detail;
        mensaje = typeof detalle === "string" ? detalle : JSON.stringify(detalle);
      }

      setStatus({ type: "error", message: `Error de carga: ${mensaje}` });
    } finally {
      setSubiendo(false);
    }
  };

  const historialFiltrado = historial.filter(h => h.proceso === PROCESO_TIPO);

  return (
    <div className="space-y-6 text-left">
      {/* 1. SECCIÓN DE INGESTA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
          <Database size={16} className="text-[#006cb7]" /> Carga de Lecturas Comerciales
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Seleccione o arrastre el archivo Excel con la data de lecturas para su procesamiento e inserción automática.
        </p>

        <form onSubmit={handleUpload} className="space-y-4">
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#006cb7] transition-colors bg-slate-50/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              id="fileInput"
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleSeleccionArchivo}
            />
            {archivo ? (
              <div className="flex items-center justify-center gap-2">
                <FileSpreadsheet size={20} className="text-[#006cb7]" />
                <p className="text-xs font-semibold text-slate-700 truncate">{archivo.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <UploadCloud className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">Haga clic aquí para seleccionar el archivo Excel (.xlsx, .xls)</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!archivo || subiendo}
            className="w-full bg-[#006cb7] text-white py-2.5 rounded-xl font-bold text-xs disabled:bg-slate-300 transition-colors flex items-center justify-center gap-2"
          >
            {subiendo ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Procesando datos...
              </>
            ) : (
              "Iniciar Carga Masiva de Lecturas"
            )}
          </button>
        </form>

        {/* Notificaciones de estado mejoradas y visibles */}
        {status.message && (
          <div className={`mt-4 p-4 rounded-xl border text-xs flex items-start gap-3 shadow-sm ${
            status.type === "success" ? "bg-emerald-50 text-emerald-900 border-emerald-200" :
            status.type === "error" ? "bg-rose-50 text-rose-900 border-rose-200" :
            "bg-blue-50 text-blue-900 border-blue-200"
          }`}>
            <div className="mt-0.5 shrink-0">
              {status.type === "error" ? <AlertCircle size={18} className="text-rose-600" /> : 
               status.type === "success" ? <CheckCircle2 size={18} className="text-emerald-600" /> : 
               <Loader2 size={18} className="animate-spin text-blue-600" />}
            </div>
            <div className="flex-1 leading-relaxed">
              <span className="font-bold block mb-0.5">
                {status.type === "error" ? "Atención / Error en la validación:" : status.type === "success" ? "Proceso Completado:" : "Estado del Sistema:"}
              </span>
              {status.message}
            </div>
          </div>
        )}
      </div>

      {/* 2. TABLA DE AUDITORÍA CON HORA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
          <History size={16} className="text-[#006cb7]" /> Auditoría de Cargas: Lecturas Comerciales
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 uppercase bg-slate-50/50">
              <tr className="border-b">
                <th className="p-3">Archivo</th>
                <th className="p-3">Registros Insertados</th>
                <th className="p-3 flex items-center gap-1"><Clock size={12} /> Fecha y Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {historialFiltrado.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-slate-400">
                    No se registran cargas previas para el proceso de lecturas.
                  </td>
                </tr>
              ) : (
                historialFiltrado.map((h) => (
                  <tr key={h.id_carga} className="hover:bg-slate-50/50">
                    <td className="p-3 font-medium text-slate-800">{h.nombre_archivo}</td>
                    <td className="p-3 font-bold text-[#006cb7]">{h.registros_insertados}</td>
                    <td className="p-3 text-slate-600">
                      {h.fecha_carga ? new Date(h.fecha_carga).toLocaleString() : "Fecha no registrada"}
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