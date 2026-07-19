import React, { useState, useEffect } from "react";
import { uploadService } from "../services/uploadService";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  History, 
  User, 
  Calendar,
  Database
} from "lucide-react";

export default function CargaExcel({ proceso, onSincronizacionExitosa }) {
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const nombreProcesoFormateado = proceso === "cortes" ? "Corte y Reapertura" : "Lectura Comercial";

  const cargarHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const data = await uploadService.getHistorial();
      setHistorial(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar historial:", err);
      setHistorial([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
    setArchivo(null);
    setStatus({ type: "", message: "" });
    setProgreso(0);
  }, [proceso]);

  const handleDrop = (e) => {
    e.preventDefault();
    if (subiendo) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setArchivo(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  const handleUploadExcel = async (e) => {
    e.preventDefault();
    if (!archivo) return;

    setSubiendo(true);
    setProgreso(40);
    setStatus({ type: "info", message: "Procesando archivo en el motor de carga..." });

    try {
      const result = await uploadService.uploadArchivo(archivo, proceso);
      
      if (result.status === "success") {
        setProgreso(100);
        setStatus({
          type: "success",
          message: `¡Carga exitosa! Se han procesado ${result.registros_insertados} registros.`
        });
        setArchivo(null);
        await cargarHistorial(); // Refrescamos tabla tras carga exitosa
        if (onSincronizacionExitosa) onSincronizacionExitosa();
      }
    } catch (error) {
      setStatus({ 
        type: "error", 
        message: error.message || "Error al procesar el archivo." 
      });
    } finally {
      setSubiendo(false);
      setProgreso(0);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      
      {/* 📥 SECCIÓN DE CARGA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
          <Database size={16} className="text-[#006cb7]" />
          Ingesta de Datos: {nombreProcesoFormateado}
        </h3>

        <form onSubmit={handleUploadExcel} className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              archivo ? "border-emerald-300 bg-emerald-50/20" : "border-slate-200 hover:border-[#006cb7]"
            }`}
            onClick={() => !subiendo && document.getElementById("fileInput").click()}
          >
            <input id="fileInput" type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" />
            {archivo ? (
              <div className="flex flex-col items-center">
                <FileSpreadsheet className="w-12 h-12 text-emerald-500 mb-2" />
                <p className="text-sm font-semibold">{archivo.name}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <UploadCloud className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-sm font-medium">Arrastra el archivo o haz clic para subir</p>
              </div>
            )}
          </div>

          {status.message && (
            <div className={`p-4 rounded-xl border flex gap-3 text-xs ${
              status.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
            }`}>
              {status.type === "success" ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={!archivo || subiendo}
            className="w-full bg-[#006cb7] text-white py-2.5 rounded-xl font-bold text-xs hover:bg-[#005ba1] disabled:bg-slate-300"
          >
            {subiendo ? "Procesando..." : "Iniciar Carga Masiva"}
          </button>
        </form>
      </div>

      {/* 📜 TABLA DE AUDITORÍA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
          <History size={16} className="text-slate-400" />
          Libro de Auditoría
        </h3>

        {loadingHistorial ? (
          <div className="text-center py-8 text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Cargando...</div>
        ) : (
          <div className="overflow-x-auto border border-slate-150 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold">
                <tr>
                  <th className="p-3">ID Log</th>
                  <th className="p-3">Archivo</th>
                  <th className="p-3">Registros</th>
                  <th className="p-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {historial.map((log) => (
                  <tr key={log.id_carga} className="hover:bg-slate-50">
                    <td className="p-3 font-mono">#{log.id_carga}</td>
                    <td className="p-3 flex items-center gap-2">
                      <FileSpreadsheet size={14} className="text-emerald-500" />
                      {log.nombre_archivo}
                    </td>
                    <td className="p-3 font-bold">{log.registros_insertados}</td>
                    <td className="p-3">{new Date(log.fecha_carga).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}