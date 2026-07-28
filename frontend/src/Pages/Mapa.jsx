import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    CircleMarker,
    useMap
} from "react-leaflet";


import {
    useEffect,
    useState
} from "react";


import L from "leaflet";


import {
    obtenerRecorrido,
    obtenerDiscrepancias,
    obtenerHeatmapImpedimentos
}
from "../services/mapaService";


import {
    obtenerPersonal
}
from "../services/trabajadorService";


import "leaflet/dist/leaflet.css";
import "leaflet.heat";



// ICONO DEFAULT

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({

    iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

    iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

    shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

});





// =============================
// HEATMAP
// =============================


function Heatmap({puntos}){


const map = useMap();


useEffect(()=>{


if(!puntos.length)
return;


const data = puntos.map(p=>[
    p.lat,
    p.lng,
    p.peso
]);


const layer=L.heatLayer(
    data,
    {
        radius:35,
        blur:20
    }
);


layer.addTo(map);


return ()=>{

map.removeLayer(layer);

}


},[puntos,map]);



return null;


}






export default function Mapa(){


const [personal,setPersonal]=useState([]);


const [trabajador,setTrabajador]=useState("");

const [fecha,setFecha]=useState(
    "2026-06-30"
);


const [recorrido,setRecorrido]=useState([]);

const [discrepancias,setDiscrepancias]=useState([]);

const [heatmap,setHeatmap]=useState([]);


const [modo,setModo]=useState("recorrido");





// cargar trabajadores

useEffect(()=>{


obtenerPersonal()
.then(data=>setPersonal(data));


},[]);





// cargar recorrido

const buscarRecorrido=async()=>{


if(!trabajador)
return;


const data =
await obtenerRecorrido(
    trabajador,
    fecha
);


setRecorrido(
    data.coordenadas || []
);


};






// filtros mapa

const cargarCapas=async()=>{


const filtros={

fecha_inicio:fecha,
fecha_fin:fecha

};


const d=
await obtenerDiscrepancias(
    filtros
);


setDiscrepancias(
    d.elementos || []
);



const h=
await obtenerHeatmapImpedimentos(
    filtros
);


setHeatmap(
    h.puntos || []
);


};







return (

<div className="space-y-5">


<h1 className="text-2xl font-bold">
Mapa Geoespacial de Lecturas
</h1>





{/* FILTROS */}


<div className="
bg-white 
rounded-xl 
p-5
shadow
grid
grid-cols-1
md:grid-cols-4
gap-4
">


<select
className="border rounded-lg p-2"

value={trabajador}

onChange={
e=>setTrabajador(e.target.value)
}

>

<option value="">
Seleccione trabajador
</option>


{
personal.map(p=>(

<option
key={p.ccodprs}
value={p.ccodprs}
>

{p.nombre}

</option>

))

}


</select>



<input

type="date"

className="border rounded-lg p-2"

value={fecha}

onChange={
e=>setFecha(e.target.value)
}

/>



<button

onClick={buscarRecorrido}

className="
bg-blue-600
text-white
rounded-lg
px-4
"

>

Ver recorrido

</button>




<button

onClick={cargarCapas}

className="
bg-red-600
text-white
rounded-lg
px-4
"

>

Cargar anomalías

</button>



</div>





<div>


<select

className="
border
rounded
p-2
"

value={modo}

onChange={
e=>setModo(e.target.value)
}

>


<option value="recorrido">
Recorrido GPS
</option>


<option value="heatmap">
Mapa calor impedimentos
</option>


<option value="discrepancias">
Discrepancias
</option>


</select>


</div>





<MapContainer

center={
[-16.4,-71.53]
}

zoom={14}

style={{
height:"650px",
width:"100%"
}}

>



<TileLayer

url="
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
"

/>






{
modo==="recorrido" && recorrido.length>0 &&

<>


<Polyline

positions={
recorrido.map(
p=>[
p.lat,
p.lng
]
)
}

color="blue"

/>



{
recorrido.map((p,index)=>(


<Marker

key={index}

position={[
p.lat,
p.lng
]}

>


<Popup>

<b>Punto GPS</b>
<br/>

Conexión:
{p.ccodcnx}

<br/>

Hora:
{p.timestamp}

<br/>

Resultado:
{p.resultado}

</Popup>


</Marker>


))

}


</>

}







{
modo==="heatmap" &&

<Heatmap

puntos={heatmap}

/>

}








{
modo==="discrepancias" &&

discrepancias.map((d,index)=>(

<CircleMarker

key={index}

center={[
d.real.lat,
d.real.lng
]}

radius={8}

color="red"

>

<Popup>

<b>
Discrepancia espacial
</b>

<br/>

Trabajador:
{d.trabajador_id}

<br/>

Distancia:
{d.distancia_metros} metros


</Popup>


</CircleMarker>


))


}





</MapContainer>




</div>


)

}