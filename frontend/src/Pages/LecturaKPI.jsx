import { useEffect, useState } from "react";
import { obtenerKPIsLectura, obtenerGruposFacturacion } from "../services/LecturaKPIService";
import { Activity } from "lucide-react";

export default function LecturaKPI() {
    const [data, setData] = useState({ indicadores: [] });
    const [periodo, setPeriodo] = useState("dia");
    const [grupoFacturacion, setGrupoFacturacion] = useState("");
    const [grupos, setGrupos] = useState([]);
    const [cargando, setCargando] = useState(true);

    const getStatusStyles = (nivel) => {
        if (nivel === "Crítico") return "bg-rose-100 text-rose-800 border-rose-300";
        if (nivel === "Alto") return "bg-amber-100 text-amber-800 border-amber-300";
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    };

    const cargarKPIs = async () => {
        setCargando(true);
        try {
            const resultado = await obtenerKPIsLectura(periodo, grupoFacturacion);
            setData(resultado || { indicadores: [] });
        } catch (error) {
            console.error("Error al cargar KPIs:", error);
            setData({ indicadores: [] });
        } finally {
            setCargando(false);
        }
    };

    const cargarGrupos = async () => {
        try {
            const datos = await obtenerGruposFacturacion();
            setGrupos(Array.isArray(datos) ? datos : []);
        } catch (error) {
            console.error("Error al cargar grupos:", error);
            setGrupos([]);
        }
    };

    useEffect(() => { 
        cargarGrupos(); 
    }, []);

    useEffect(() => { 
        cargarKPIs(); 
    }, [periodo, grupoFacturacion]);

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="text-[#006cb7]" /> Indicadores KPI - Lectura
                </h2>
                
                {/* Filtros Limpios y Directos */}
                <div className="flex flex-wrap gap-3 items-center">
                    <select 
                        value={periodo} 
                        onChange={(e) => setPeriodo(e.target.value)} 
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#006cb7]/20 font-medium text-slate-700"
                    >
                        <option value="dia">Hoy</option>
                        <option value="semana">Última semana</option>
                        <option value="mes">Último mes</option>
                    </select>

                    <select 
                        value={grupoFacturacion} 
                        onChange={(e) => setGrupoFacturacion(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#006cb7]/20 font-medium text-slate-700"
                    >
                        <option value="">Todos los grupos de facturación</option>
                        {grupos.map((grupo) => (
                            <option key={grupo} value={grupo}>
                                Grupo {grupo}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Estado de Carga */}
            {cargando ? (
                <div className="p-12 text-center text-slate-400 font-medium">Calculando indicadores...</div>
            ) : (
                /* Grid de KPIs */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {data.indicadores && data.indicadores.length > 0 ? (
                        data.indicadores.map((kpi) => (
                            <div key={kpi.nombre} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        {kpi.nombre}
                                    </p>
                                    
                                    <div className="flex items-baseline gap-1 mb-4">
                                        <h3 className="text-3xl font-extrabold text-slate-800">
                                            {kpi.valor}
                                        </h3>
                                        <span className="text-sm font-medium text-slate-400">{kpi.unidad}</span>
                                    </div>
                                </div>

                                <div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex border ${getStatusStyles(kpi.nivel_alerta)}`}>
                                        {kpi.nivel_alerta}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-100 text-slate-400">
                            No se encontraron registros para los filtros seleccionados.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}