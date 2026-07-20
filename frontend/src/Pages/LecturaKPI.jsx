import { useEffect, useState } from "react";
import { obtenerKPIsLectura, obtenerGruposFacturacion } from "../services/LecturaKPIService";
import { Activity, Filter } from "lucide-react"; // Asumiendo que usas lucide-react

export default function LecturaKPI() {
    const [data, setData] = useState(null);
    const [periodo, setPeriodo] = useState("dia");
    const [grupoFacturacion, setGrupoFacturacion] = useState("");
    const [grupos, setGrupos] = useState([]);

    // Función auxiliar para colores de alerta
    const getStatusStyles = (nivel) => {
        return nivel === "Normal" 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
            : "bg-rose-50 text-rose-700 border-rose-200";
    };

    const cargarKPIs = async () => {
        try {
            const resultado = await obtenerKPIsLectura(periodo, grupoFacturacion);
            setData(resultado);
        } catch (error) {
            console.error(error);
        }
    };

    const cargarGrupos = async () => {
        try {
            const datos = await obtenerGruposFacturacion();
            setGrupos(datos);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => { cargarGrupos(); }, []);
    useEffect(() => { cargarKPIs(); }, [periodo, grupoFacturacion]);

    if (!data) return <div className="p-6 text-slate-400">Cargando indicadores...</div>;

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="text-[#006cb7]" /> Indicadores KPI - Lectura
                </h2>
                
                {/* Filtros */}
                <div className="flex gap-3">
                    <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} 
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#006cb7]/20">
                        <option value="dia">Hoy</option>
                        <option value="semana">Últimos 7 días</option>
                        <option value="mes">Últimos 30 días</option>
                    </select>

                    <select value={grupoFacturacion} onChange={(e) => setGrupoFacturacion(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#006cb7]/20">
                        <option value="">Todos los grupos</option>
                        {grupos.map((grupo) => <option key={grupo} value={grupo}>{grupo}</option>)}
                    </select>
                </div>
            </div>

            {/* Grid de KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {data.indicadores.map((kpi) => (
                    <div key={kpi.nombre} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            {kpi.nombre}
                        </p>
                        
                        <div className="flex items-baseline gap-1 mb-4">
                            <h2 className="text-3xl font-extrabold text-slate-800">
                                {kpi.valor}
                            </h2>
                            <span className="text-sm font-medium text-slate-400">{kpi.unidad}</span>
                        </div>

                        <div className={`px-3 py-1 rounded-full text-xs font-bold inline-flex border ${getStatusStyles(kpi.nivel_alerta)}`}>
                            {kpi.nivel_alerta}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}