import { useEffect, useState } from "react";
import { obtenerKPIsLectura, obtenerGruposFacturacion } from "../services/LecturaKPIService";
import { Activity, X, Info } from "lucide-react";


export default function LecturaKPI() {
    const [data, setData] = useState({
        indicadores: []
    });
    const [periodo, setPeriodo] = useState("dia");
    const [grupoFacturacion, setGrupoFacturacion] = useState("");
    const [grupos, setGrupos] = useState([]);
    const [cargando, setCargando] = useState(true);

    // KPI seleccionado para modal
    const [kpiSeleccionado, setKpiSeleccionado] = useState(null);
    const cargarKPIs = async()=>{
        setCargando(true);
        try{
            const resultado = await obtenerKPIsLectura(
                periodo,
                grupoFacturacion
            );
            console.log(
                "KPIs recibidos:",
                resultado
            );
            setData(
                resultado || {indicadores:[]}
            );
        }
        catch(error){
            console.error(
                "Error cargando KPIs",
                error
            );
            setData({
                indicadores:[]
            });
        }
        finally{
            setCargando(false);
        }
    };

    const cargarGrupos = async()=>{
        try{
            const resultado =
                await obtenerGruposFacturacion();
            setGrupos(
                Array.isArray(resultado)
                ? resultado
                : []
            );
        }
        catch(error){
            console.error(
                "Error grupos",
                error
            );
        }
    };

    useEffect(()=>{
        cargarGrupos();
    },[]);

    useEffect(()=>{
        cargarKPIs();
    },[
        periodo,
        grupoFacturacion
    ]);

    const getStatusStyles=(nivel)=>{
        if(nivel==="Crítico")
            return "bg-rose-100 text-rose-800 border-rose-300";
        if(nivel==="Alto")
            return "bg-amber-100 text-amber-800 border-amber-300";
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    };

    const explicaciones = {
        "Cumplimiento de lectura":{
            descripcion:
            "Indica qué porcentaje de lecturas programadas fueron completadas.",
            formula:
            "(Lecturas realizadas / Lecturas programadas) × 100",
            datos:
            "Campos utilizados: lecturas_realizadas y lecturas_programadas de la tabla Actividad."
        },
        "Productividad":{
            descripcion:
            "Mide la cantidad de lecturas realizadas por hora efectiva de trabajo.",
            formula:
            "Lecturas realizadas / horas trabajadas",
            datos:
            "Utiliza lecturas realizadas y duración registrada de las actividades."
        },
        "Tiempo promedio":{
            descripcion:
            "Muestra el tiempo promedio utilizado para completar cada actividad de lectura.",
            formula:
            "Tiempo total empleado / número de actividades",
            datos:
            "Se calcula utilizando la duración acumulada de todas las actividades filtradas."
        },
        "Índice de impedimentos":{
            descripcion:
            "Representa qué porcentaje de actividades presentan impedimentos.",
            formula:
            "(Actividades con impedimentos / lecturas realizadas) × 100",
            datos:
            "Información obtenida desde ActividadLectura."
        },
        "Índice de observaciones":{
            descripcion:
            "Muestra la cantidad porcentual de actividades con observaciones.",
            formula:
            "(Actividades con observaciones / lecturas realizadas) × 100",
            datos:
            "Información obtenida desde ActividadLectura."
        },
        "Cobertura geográfica":{
            descripcion:
            "Mide las actividades que cuentan con coordenadas GPS válidas.",
            formula:
            "(Actividades con GPS / total actividades) × 100",
            datos:
            "Usa latitud y longitud registradas."
        },
        "Actividades fuera de punto":{
            descripcion:
            "Muestra actividades ejecutadas fuera del radio permitido.",
            formula:
            "(Actividades fuera de punto / total actividades) × 100",
            datos:
            "Usa el resultado de validación geográfica."
        },
        "Eficiencia":{
            descripcion:
            "Representa la eficiencia reportada del trabajador.",
            formula:
            "Promedio de eficiencia registrada",
            datos:
            "Campo eficiencia almacenado en Actividad."
        }
    };
    return (

<div className="p-6 space-y-8">
    {/* HEADER */}
    <div className="flex flex-col md:flex-row justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-[#006cb7]" />
            Indicadores KPI - Lectura
        </h2>
        <div className="flex gap-3">
            <select
            value={periodo}
            onChange={
                e=>setPeriodo(e.target.value)
            }
            className="border rounded-xl px-4 py-2"
            >
                <option value="dia">
                    Hoy
                </option>
                <option value="semana">
                    Última semana
                </option>
                <option value="mes">
                    Último mes
                </option>
            </select>
            <select
            value={grupoFacturacion}
            onChange={
                e=>setGrupoFacturacion(e.target.value)
            }
            className="border rounded-xl px-4 py-2"
            >
                <option value="">
                    Todos los grupos
                </option>
                {
                    grupos.map(g=>(
                        <option key={g} value={g}>
                            Grupo {g}
                        </option>
                    ))
                }
            </select>
        </div>
    </div>
{
cargando ?
<div className="p-10 text-center">
Calculando indicadores...
</div>
:
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
{
data.indicadores?.map((kpi)=>(
<div
key={kpi.nombre}
onClick={()=>{
    console.log(
        "KPI seleccionado:",
        kpi
    );
    setKpiSeleccionado(kpi);
}}

className="
cursor-pointer
bg-white
rounded-2xl
p-6
shadow-sm
hover:shadow-lg
transition
">

<p className="text-xs uppercase font-bold text-slate-400">
{kpi.nombre}
</p>
<div className="flex items-baseline gap-2 mt-3">
<h3 className="text-3xl font-bold">
{kpi.valor}
</h3>
<span>
{kpi.unidad}
</span>
</div>
<span
className={
`inline-block mt-4 px-3 py-1 rounded-full text-xs border
${getStatusStyles(kpi.nivel_alerta)}`
}
>
{kpi.nivel_alerta}
</span>
</div>
))
}
</div>
}


{/* MODAL */}
{
kpiSeleccionado && (
<div
className="
fixed
inset-0
bg-black/40
flex
items-center
justify-center
z-[9999]
"
>
<div
className="
bg-white
rounded-2xl
p-8
w-[90%]
max-w-lg
shadow-xl
"
>

<div className="flex justify-between items-center">
<h2 className="text-xl font-bold">
{kpiSeleccionado.nombre}
</h2>
<button
onClick={()=>
setKpiSeleccionado(null)
}
>
<X/>
</button>
</div>
<div className="mt-5 space-y-4 text-sm">
<p>
<b>Valor calculado:</b>
<br/>
{kpiSeleccionado.valor}
{" "}
{kpiSeleccionado.unidad}
</p>
<p>
<b>¿Qué significa?</b>
<br/>
{
explicaciones[
kpiSeleccionado.nombre.trim()
]
?.descripcion
||
"No existe explicación configurada."
}
</p>
<p>
<b>Fórmula:</b>
<br/>
{
explicaciones[
kpiSeleccionado.nombre.trim()
]
?.formula
}
</p>
<p>
<b>Datos utilizados:</b>
<br/>
{
explicaciones[
kpiSeleccionado.nombre.trim()
]
?.datos
}
</p>
</div>
</div>
</div>
)
}
</div>
);
}