import React, {
    useEffect,
    useMemo,
    useState
} from "react";


import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline
} from "react-leaflet";


import L from "leaflet";

import "leaflet/dist/leaflet.css";



const API = "http://localhost:8000";





// ===========================
// ICONOS
// ===========================


const iconNormal = new L.Icon({

    iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",

    shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",

    iconSize:[25,41],

    iconAnchor:[12,41]

});





const iconError = new L.Icon({

    iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",

    shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",

    iconSize:[25,41],

    iconAnchor:[12,41]

});








export default function MapaRutas({

    fecha="2026-06-30",

    trabajadorSeleccionado="TODOS"

}){



const [trabajadores,setTrabajadores]=useState([]);

const [rutas,setRutas]=useState([]);

const [discrepancias,setDiscrepancias]=useState([]);


const [loading,setLoading]=useState(true);








// ===========================
// CARGAR DATOS
// ===========================


useEffect(()=>{


const cargarMapa=async()=>{


try{


setLoading(true);



// PERSONAL

const personal = await fetch(

`${API}/lectura/personal/?skip=0&limit=200`

)
.then(r=>r.json());



setTrabajadores(personal);



let rutasTemp=[];






// RECORRIDO POR TRABAJADOR

for(const trabajador of personal){



// si existe filtro

if(

trabajadorSeleccionado !== "TODOS"

&&

trabajador.ccodprs !== trabajadorSeleccionado

){

continue;

}




try{


const recorrido = await fetch(

`${API}/api/maps/recorrido/${trabajador.ccodprs}?fecha=${fecha}`

)

.then(r=>r.json());





if(

recorrido.coordenadas

&&

recorrido.coordenadas.length>0

){



// =============================
// LIMPIAR COORDENADAS INVALIDAS
// =============================


const coordenadasValidas =

recorrido.coordenadas.filter(p=>


p.lat !== null &&

p.lng !== null &&


p.lat !== 9999999999 &&

p.lng !== 9999999999 &&


p.lat >= -90 &&

p.lat <= 90 &&


p.lng >= -180 &&

p.lng <= 180


);






if(coordenadasValidas.length>0){



rutasTemp.push({


id:trabajador.ccodprs,


nombre:trabajador.nombre,



puntos:

coordenadasValidas.map(p=>[

p.lat,

p.lng

]),




detalle:

coordenadasValidas



});



}



}



}

catch(error){


console.log(

"Sin recorrido",

trabajador.ccodprs

);


}



}




setRutas(rutasTemp);








// ===========================
// DISCREPANCIAS
// ===========================



const disc = await fetch(

`${API}/api/maps/discrepancias?fecha_inicio=${fecha}&fecha_fin=${fecha}`

)

.then(r=>r.json());



setDiscrepancias(

disc.elementos || []

);






}

catch(error){


console.error(

"Error cargando mapa",

error

);



}

finally{


setLoading(false);


}



};




cargarMapa();



},[fecha,trabajadorSeleccionado]);










// ===========================
// FILTRO RUTAS
// ===========================


const rutasMostrar = useMemo(()=>{


if(trabajadorSeleccionado==="TODOS")

return rutas;



return rutas.filter(r=>

r.id===trabajadorSeleccionado

);



},[

rutas,

trabajadorSeleccionado

]);










// ===========================
// CENTRO MAPA
// ===========================


const centro =

rutasMostrar.length &&

rutasMostrar[0].puntos.length

?

rutasMostrar[0].puntos[0]

:

[-16.409,-71.537];









// ===========================
// METRICAS
// ===========================


const totalPuntos =

rutasMostrar.reduce(

(total,r)=>

total+r.puntos.length,

0

);





const problemas =

discrepancias.filter(d=>

trabajadorSeleccionado==="TODOS"

||

d.trabajador_id===trabajadorSeleccionado

);









return (


<div className="bg-white rounded-xl shadow p-5">





<h2 className="font-bold text-xl mb-4">

🗺️ Supervisión GIS de Lectores

</h2>







<div className="flex gap-4 mb-4">



<div className="bg-blue-50 p-3 rounded">

📍 Puntos:

<b>

{totalPuntos}

</b>


</div>




<div className="bg-red-50 p-3 rounded">


⚠️ Discrepancias:

<b>

{problemas.length}

</b>


</div>



</div>









{

loading ?



<p>

Cargando rutas...

</p>



:



<div className="h-[600px]">



<MapContainer


center={centro}


zoom={16}


className="h-full w-full"



>




<TileLayer

url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"

/>








{/* RUTAS */}



{

rutasMostrar.map(r=>(


<React.Fragment

key={r.id}

>




<Polyline


positions={r.puntos}


pathOptions={{

color:"#2563eb",

weight:5,

opacity:0.8

}}


/>







{

r.detalle.map((p,i)=>(


<Marker


key={i}


position={[

p.lat,

p.lng

]}



icon={iconNormal}



>


<Popup>


<b>

{r.nombre}

</b>


<br/>


Conexión:

{p.ccodcnx}



<br/>


Resultado:

{p.resultado}



<br/>


Hora:

{p.timestamp}



</Popup>



</Marker>



))


}






</React.Fragment>



))


}









{/* DISCREPANCIAS */}



{

problemas.map((d,i)=>(


<Marker


key={i}


position={[

d.real.lat,

d.real.lng

]}



icon={iconError}



>


<Popup>


<b>

⚠️ Discrepancia

</b>



<br/>


Conexión:

{d.ccodcnx}



<br/>


Distancia:

{d.distancia_metros} m



<br/>


Trabajador:

{d.trabajador_id}



</Popup>



</Marker>



))


}







</MapContainer>



</div>


}



</div>


);



}