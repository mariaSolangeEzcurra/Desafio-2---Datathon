import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  History,
} from "lucide-react";
import {
  subirReporteDiario,
  obtenerHistorialReportes,
} from "../../services/uploadDiarioService";

export default function CargarReporte() {
  const [archivo, setArchivo] = useState(null);
  const [fechaReporte, setFechaReporte] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const [reportesProcesados, setReportesProcesados] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);

  // 1. Cargar el historial desde el Backend al montar el componente
  const cargarHistorial = async () => {
    try {
      setCargandoHistorial(true);
      const data = await obtenerHistorialReportes();
      setReportesProcesados(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar el historial:", err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        setError("Solo se permiten archivos Excel (.xlsx, .xls)");
        setArchivo(null);
        return;
      }
      setError(null);
      setArchivo(selectedFile);
    }
  };

  const handleProcesar = async (e) => {
    e.preventDefault();
    if (!fechaReporte) {
      setError("Por favor seleccione la fecha del reporte.");
      return;
    }
    if (!archivo) {
      setError("Por favor seleccione un archivo Excel.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await subirReporteDiario(archivo, fechaReporte);
      setResultado(data);

      // Limpiar input y re-consultar el historial actualizado desde el servidor
      setArchivo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await cargarHistorial();
    } catch (err) {
      console.error(err);
      setError(err.message || "Ocurrió un error inesperado al procesar el archivo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. SECCIÓN DE CARGA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase mb-1 flex items-center gap-2">
          <FileSpreadsheet size={16} className="text-[#006cb7]" /> Carga de Reporte Diario de Eficiencia
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Importa los datos de lectura diaria para procesar la eficiencia y evaluaciones de desempeño.
        </p>

        <form onSubmit={handleProcesar} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-2">
                Fecha del reporte
              </label>
              <input
                type="date"
                value={fechaReporte}
                onChange={(e) => setFechaReporte(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-[#006cb7]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-2">
                Archivo Excel
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-2.5 text-center cursor-pointer hover:border-[#006cb7] bg-slate-50/50 flex items-center justify-center min-h-[42px]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {archivo ? (
                  <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold truncate">
                    <FileSpreadsheet size={16} className="text-[#006cb7] shrink-0" />
                    <span className="truncate">{archivo.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <UploadCloud size={16} className="text-slate-400" />
                    <span>Haga clic para seleccionar archivo Excel (.xlsx, .xls)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !archivo || !fechaReporte}
            className="w-full bg-[#006cb7] text-white py-2.5 rounded-xl font-bold text-xs disabled:bg-slate-300 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Procesando reporte...
              </>
            ) : (
              "Procesar Reporte Diario"
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 bg-rose-50 text-rose-900 border-rose-200">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resultado && (
          <div className="mt-4 p-4 rounded-xl border bg-emerald-50 text-emerald-900 border-emerald-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{resultado.mensaje || "Reporte procesado con éxito"}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Registros</p>
                <span className="text-base font-bold text-slate-800">{resultado.registros_insertados}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Trabajadores</p>
                <span className="text-base font-bold text-slate-800">{resultado.trabajadores_procesados}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Evaluaciones</p>
                <span className="text-base font-bold text-slate-800">{resultado.evaluaciones_generadas}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. TABLA DE HISTORIAL (Consumido desde el backend) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
          <History size={16} className="text-[#006cb7]" /> Reportes Procesados ({reportesProcesados.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 uppercase bg-slate-50/50">
              <tr className="border-b">
                <th className="p-3">Fecha Reporte</th>
                <th className="p-3 text-center">Registros</th>
                <th className="p-3 text-center">Trabajadores</th>
                <th className="p-3 text-center">Evaluaciones</th>
                <th className="p-3 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cargandoHistorial ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    <Loader2 size={16} className="animate-spin inline mr-2" />
                    Cargando historial de reportes...
                  </td>
                </tr>
              ) : reportesProcesados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    No hay reportes cargados previamente.
                  </td>
                </tr>
              ) : (
                reportesProcesados.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-50/50">
                    <td className="p-3 font-medium text-slate-800 flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      {item.fecha || item.fecha_reporte}
                    </td>
                    <td className="p-3 text-center font-bold text-[#006cb7]">
                      {item.registros ?? item.registros_insertados}
                    </td>
                    <td className="p-3 text-center text-slate-600">
                      {item.trabajadores ?? item.trabajadores_procesados}
                    </td>
                    <td className="p-3 text-center text-slate-600">
                      {item.evaluaciones ?? item.evaluaciones_generadas}
                    </td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {item.estado || "Procesado"}
                      </span>
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