import { useEffect, useState } from "react";
import { obtenerDatosMapa } from "../services/MapaLecturaService";
import { MapPin, Filter, User, Calendar, Map as MapIcon } from "lucide-react";
import MapaRutas from "./MapaRutas"; // El componente que creamos con Leaflet

export default function MapaLecturas() {
    const [tipoVista, setTipoVista] = useState("rutas"); // 'rutas', 'gps', 'impedimentos'
    const [actividades, setActividades] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Estados para filtros
    const [filtros, setFiltros] = useState({
        trabajador: "",
        fecha: "",
        distrito: "",
        grupo_facturacion: ""
    });

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const resultado = await obtenerDatosMapa(tipoVista, filtros);
            setActividades(resultado.data);
        } catch (error) {
            console.error("Error al cargar mapa:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [tipoVista, filtros]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <MapIcon className="text-[#006cb7]" /> Módulo GIS - {tipoVista.toUpperCase()}
                </h2>
                
                {/* Selector de tipo de mapa */}
                <select 
                    value={tipoVista} 
                    onChange={(e) => setTipoVista(e.target.value)}
                    className="bg-[#006cb7] text-white rounded-xl px-4 py-2 font-bold shadow-sm"
                >
                    <option value="rutas">Ver Rutas</option>
                    <option value="gps">Ver GPS</option>
                    <option value="impedimentos">Ver Impedimentos</option>
                </select>
            </div>

            {/* Panel de Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Trabajador</label>
                    <input type="text" placeholder="Código/Nombre" 
                        className="border rounded-lg p-2 text-sm"
                        onChange={(e) => setFiltros({...filtros, trabajador: e.target.value})} />
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha</label>
                    <input type="date" 
                        className="border rounded-lg p-2 text-sm"
                        onChange={(e) => setFiltros({...filtros, fecha: e.target.value})} />
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Distrito</label>
                    <input type="text" placeholder="Ej: Hunter" 
                        className="border rounded-lg p-2 text-sm"
                        onChange={(e) => setFiltros({...filtros, distrito: e.target.value})} />
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Grupo Fact.</label>
                    <input type="text" placeholder="Ej: 1001" 
                        className="border rounded-lg p-2 text-sm"
                        onChange={(e) => setFiltros({...filtros, grupo_facturacion: e.target.value})} />
                </div>
            </div>

            {/* Mapa */}
            {loading ? (
                <div className="h-[500px] flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400">
                    Cargando coordenadas del mapa...
                </div>
            ) : (
                <MapaRutas actividadesTotales={actividades} />
            )}
        </div>
    );
}