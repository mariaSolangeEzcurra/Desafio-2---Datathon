import React, { useState, useEffect, useRef } from "react";
import { uploadService } from "../services/uploadService";
import {
  UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle,
  History, Database, Loader2
} from "lucide-react";

export default function UploadPage({ onSincronizacionExitosa }) {
  const [archivo, setArchivo] = useState(null);
  const [proceso, setProceso] = useState("Lectura");
  const [subiendo, setSubiendo] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [historial, setHistorial] = useState([]);
  const fileInputRef = useRef(null);

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
      setStatus({ type: "error", message: "El archivo debe ser .xlsx o .xls" });
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
    setStatus({ type: "info", message: "Procesando archivo en el servidor..." });

    try {
      const result = await uploadService.uploadArchivo(archivo, proceso);

      setStatus({
        type: "success",
        message: result.message
          ? `${result.message} (${result.registros_insertados}/${result.total_filas_excel} filas)`
          : `¡Carga exitosa! Se procesaron ${result.registros_insertados} registros.`,
      });

      resetInputArchivo();
      await cargarHistorial();
      if (onSincronizacionExitosa) onSincronizacionExitosa();

    } catch (error) {
      console.error("Error de subida:", error);

      let mensaje = "Error al conectar con el servidor.";
      if (error.code === "ECONNABORTED") {
        mensaje = "El servidor tardó demasiado en responder. El archivo puede ser muy grande.";
      } else if (error.response?.data?.detail) {
        mensaje = typeof error.response.data.detail === "string"
          ? error.response.data.detail
          : JSON.stringify(error.response.data.detail);
      }

      setStatus({ type: "error", message: `Error: ${mensaje}` });
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. SECCIÓN DE INGESTA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
          <Database size={16} className="text-[#006cb7]" /> Ingesta de Datos
        </h3>

        <form onSubmit={handleUpload} className="space-y-4">
          <select
            className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
            value={proceso}
            onChange={(e) => setProceso(e.target.value)}
            disabled={subiendo}
          >
            <option value="Lectura">Lectura Comercial</option>
            <option value="Corte">Corte y Reapertura</option>
          </select>

          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#006cb7] transition-colors"
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
                <FileSpreadsheet size={18} className="text-[#006cb7]" />
                <p className="text-xs font-semibold text-slate-700 truncate">{archivo.name}</p>
              </div>
            ) : (
              <UploadCloud className="w-10 h-10 text-slate-300 mx-auto" />
            )}
          </div>

          <button
            type="submit"
            disabled={!archivo || subiendo}
            className="w-full bg-[#006cb7] text-white py-2.5 rounded-xl font-bold text-xs disabled:bg-slate-300 transition-colors"
          >
            {subiendo ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Iniciar Carga Masiva"}
          </button>
        </form>

        {/* Notificaciones de estado */}
        {status.message && (
          <div className={`mt-4 p-3 rounded-xl border text-xs flex gap-2 ${
            status.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
            status.type === "error" ? "bg-rose-50 text-rose-800 border-rose-200" :
            "bg-blue-50 text-blue-800 border-blue-200"
          }`}>
            {status.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {status.message}
          </div>
        )}
      </div>

      {/* 2. TABLA DE AUDITORÍA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
          <History size={16} /> Auditoría: {proceso}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 uppercase">
              <tr className="border-b">
                <th className="p-3">Archivo</th>
                <th className="p-3">Registros</th>
                <th className="p-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {historial.filter(h => h.proceso === proceso).length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-3 text-center text-slate-400">
                    Sin cargas registradas para este proceso
                  </td>
                </tr>
              ) : (
                historial.filter(h => h.proceso === proceso).map((h) => (
                  <tr key={h.id_carga}>
                    <td className="p-3 font-medium">{h.nombre_archivo}</td>
                    <td className="p-3 font-bold">{h.registros_insertados}</td>
                    <td className="p-3">{new Date(h.fecha_carga).toLocaleDateString()}</td>
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