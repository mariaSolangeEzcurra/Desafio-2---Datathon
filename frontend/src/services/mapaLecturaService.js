const API = "http://localhost:8000";


export async function obtenerPersonal() {
    const response = await fetch(
        `${API}/lectura/personal/?skip=0&limit=200`
    );

    if (!response.ok)
        throw new Error("Error obteniendo personal");

    return await response.json();
}



export async function obtenerRecorridoTrabajador(
    ccodprs,
    fecha
) {

    const response = await fetch(
        `${API}/api/maps/recorrido/${ccodprs}?fecha=${fecha}`
    );


    if (!response.ok)
        throw new Error(
            `Error recorrido trabajador ${ccodprs}`
        );


    return await response.json();
}



export async function obtenerHeatmapImpedimentos(filtros={}){

    const params = new URLSearchParams();


    Object.entries(filtros).forEach(([key,value])=>{
        if(value)
            params.append(key,value);
    });


    const response = await fetch(
        `${API}/api/maps/heatmap-impedimentos?${params}`
    );


    if(!response.ok)
        throw new Error(
            "Error heatmap"
        );


    return await response.json();

}



export async function obtenerDiscrepancias(filtros={}){

    const params = new URLSearchParams();


    Object.entries(filtros).forEach(([key,value])=>{
        if(value)
            params.append(key,value);
    });



    const response = await fetch(
        `${API}/api/maps/discrepancias?${params}`
    );


    if(!response.ok)
        throw new Error(
            "Error discrepancias"
        );


    return await response.json();

}