import { useEffect, useState } from "react";

import {
    Calendar,
    User,
    Filter,
    Map as MapIcon,
    Play
} from "lucide-react";


import MapaRutas from "./MapaRutas";



export default function MapaLecturas(){



// ==========================
// FILTROS
// ==========================


const [filtros,setFiltros]=useState({

    fecha:"2026-06-30",

    trabajador:"TODOS",

    distrito:"TODOS",

    grupo_facturacion:"TODOS"

});





const [filtrosAplicados,setFiltrosAplicados]=useState({

    fecha:"2026-06-30",

    trabajador:"TODOS",

    distrito:"TODOS",

    grupo_facturacion:"TODOS"

});




// ==========================
// LISTAS
// ==========================


const [trabajadores,setTrabajadores]=useState([]);



const distritos=[

    "TODOS",
    "AREQUIPA",
    "CAYMA",
    "CERRO COLORADO",
    "YANAHUARA"

];



const gruposFacturacion=[

    "TODOS",
    "1001",
    "1002",
    "1003"

];






// ==========================
// CARGAR PERSONAL
// ==========================


useEffect(()=>{


const cargarPersonal=async()=>{


try{


const response=

await fetch(

"http://localhost:8000/lectura/personal/?skip=0&limit=200"

);



const data=

await response.json();



setTrabajadores(data);



}

catch(error){


console.error(

"Error cargando trabajadores",

error

);


}


};



cargarPersonal();



},[]);








// ==========================
// APLICAR FILTROS
// ==========================


const procesarDatos=()=>{


setFiltrosAplicados({

    ...filtros

});


};






return (

<div className="p-6 space-y-6">






{/* TITULO */}

<div>


<h1

className="
text-2xl
font-bold
text-slate-800
flex
items-center
gap-2
"

>


<MapIcon

className="text-blue-600"

/>


Módulo GIS - Lectura Comercial


</h1>



<p className="text-sm text-slate-400">


Supervisión de rutas, personal y ocurrencias


</p>


</div>









{/* FILTROS */}


<div className="bg-white rounded-2xl border shadow-sm p-5">



<div className="flex items-center gap-2 mb-5">


<Filter size={18}/>


<h3 className="font-bold">

Filtros de supervisión

</h3>


</div>






<div className="
grid
grid-cols-1
md:grid-cols-5
gap-4
">








{/* FECHA */}


<div>


<label className="text-xs font-bold text-slate-400">

Fecha

</label>


<div className="border rounded-lg flex items-center px-2">


<Calendar size={16}/>



<input

type="date"

value={filtros.fecha}

onChange={e=>

setFiltros({

...filtros,

fecha:e.target.value

})

}

className="
p-2
outline-none
w-full
"

/>



</div>


</div>








{/* TRABAJADOR */}


<div>


<label className="text-xs font-bold text-slate-400">

Trabajador

</label>



<div className="border rounded-lg flex items-center px-2">


<User size={16}/>



<select


value={filtros.trabajador}


onChange={e=>

setFiltros({

...filtros,

trabajador:e.target.value

})

}


className="
p-2
outline-none
w-full
"

>


<option value="TODOS">

Todos

</option>



{

trabajadores.map(t=>(


<option

key={t.ccodprs}

value={t.ccodprs}

>


{t.nombre}


</option>


))


}



</select>


</div>


</div>









{/* DISTRITO */}


<div>


<label className="text-xs font-bold text-slate-400">

Distrito

</label>



<select


value={filtros.distrito}


onChange={e=>

setFiltros({

...filtros,

distrito:e.target.value

})

}


className="
border
rounded-lg
p-2
w-full
"


>


{

distritos.map(d=>(


<option

key={d}

value={d}

>


{d}

</option>


))


}


</select>



</div>









{/* GRUPO FACTURACION */}



<div>


<label className="text-xs font-bold text-slate-400">

Grupo Facturación

</label>



<select


value={filtros.grupo_facturacion}


onChange={e=>

setFiltros({

...filtros,

grupo_facturacion:e.target.value

})

}


className="
border
rounded-lg
p-2
w-full
"


>


{

gruposFacturacion.map(g=>(


<option

key={g}

value={g}

>


{g}

</option>


))


}



</select>


</div>









{/* BOTON */}


<div className="flex items-end">


<button


onClick={procesarDatos}


className="
bg-blue-600
text-white
rounded-xl
px-5
py-2
font-bold
flex
items-center
gap-2
hover:bg-blue-700
"


>


<Play size={16}/>


Procesar datos


</button>


</div>





</div>


</div>









{/* MAPA */}


<MapaRutas


fecha={filtrosAplicados.fecha}


trabajadorSeleccionado={
filtrosAplicados.trabajador
}


/>




</div>


);


}