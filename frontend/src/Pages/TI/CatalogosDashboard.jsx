import React, { useState, useEffect } from "react";
import { FileText, Printer, ArrowLeft, Database, Loader2, Search } from "lucide-react";
import axios from "axios";

export default function CatalogosDashboard() {
  const [catalogoSeleccionado, setCatalogoSeleccionado] = useState(null);
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const catalogosDisponibles = [
    { id: "impedimentos", label: "Impedimentos" },
    { id: "observaciones", label: "Observaciones" },
    { id: "grupos", label: "Grupos de Facturación" },
  ];

  useEffect(() => {
    if (!catalogoSeleccionado) return;

    const fetchDatos = async () => {
      setCargando(true);
      try {
        const response = await axios.get(`http://localhost:8000/api/catalogos/${catalogoSeleccionado}`);
        setDatos(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Error al cargar el catálogo:", err);
        setDatos([]);
      } finally {
        setCargando(false);
      }
    };

    fetchDatos();
  }, [catalogoSeleccionado]);

  if (!catalogoSeleccionado) {
    return (
      <div className="space-y-6 text-left">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide">
              Gestión de Catálogos
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Selecciona un catálogo del sistema para visualizar su ficha detallada, consultar registros fijos o exportarlos en PDF.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {catalogosDisponibles.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCatalogoSeleccionado(cat.id)}
                className="flex items-center gap-3 p-5 bg-white border border-slate-200 hover:border-[#006cb7] hover:shadow-md rounded-2xl transition-all text-left group"
              >
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-blue-50 group-hover:text-[#006cb7] transition-colors">
                  <FileText size={22} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#006cb7] transition-colors">
                    {cat.label}
                  </h4>
                  <span className="text-[10px] text-slate-400">Ver registros</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const infoActual = catalogosDisponibles.find((c) => c.id === catalogoSeleccionado);
  const datosFiltrados = datos.filter((item) =>
    Object.values(item).some((val) =>
      String(val ?? "").toLowerCase().includes(busqueda.toLowerCase())
    )
  );

  return (
    <div className="space-y-6 text-left print:m-0 print:p-0">
      {/* Estilos inyectados solo para la impresión */}
      <style>{`
        @media print {
          /* Oculta Sidebar, Header global y controles web */
          aside, header, nav, .print-hide-all {
            display: none !important;
          }
          /* Ajusta el contenedor de la página */
          main, body, #root {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          /* Asegura bordes limpios para la tabla en papel */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border-bottom: 1px solid #cbd5e1 !important;
            padding: 8px 12px !important;
          }
        }
      `}</style>

      {/* Cabecera Web (Se oculta al imprimir) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 print-hide-all print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCatalogoSeleccionado(null);
              setBusqueda("");
            }}
            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
            title="Volver al panel"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
              <Database size={16} className="text-[#006cb7]" /> Catálogo: {infoActual?.label}
            </h3>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-[#006cb7] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#005a9c] transition-colors shadow-sm"
        >
          <Printer size={16} /> Imprimir / Guardar PDF
        </button>
      </div>

      {/* Buscador Web (Se oculta al imprimir) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3 print-hide-all print:hidden">
        <Search size={18} className="text-slate-400 ml-2" />
        <input
          type="text"
          placeholder={`Buscar en ${infoActual?.label}...`}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-none text-slate-700 placeholder-slate-400"
        />
      </div>

      {/* Título Oficial Exclusivo para PDF / Impresión */}
      <div className="hidden print:block mb-4 border-b border-slate-300 pb-3">
        <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
          SEDAPAR — CATÁLOGO DE {infoActual?.label}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Fecha de emisión: {new Date().toLocaleDateString("es-PE")}
        </p>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm print:border-none print:p-0 print:shadow-none">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2 print-hide-all print:hidden">
            <Loader2 className="animate-spin text-[#006cb7]" size={24} />
            <p className="text-xs">Cargando registros del catálogo...</p>
          </div>
        ) : datosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No se encontraron registros o la tabla está vacía en este catálogo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="text-slate-700 uppercase bg-slate-50 border-b print:bg-slate-100">
                <tr>
                  {Object.keys(datos[0] || {}).map((key) => (
                    <th key={key} className="p-3 font-bold border-b border-slate-300">
                      {key.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {datosFiltrados.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors print:break-inside-avoid">
                    {Object.values(item).map((val, i) => (
                      <td key={i} className="p-3 text-slate-800 font-medium border-b border-slate-100">
                        {String(val ?? "-")}
                      </td>
                    ))}
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