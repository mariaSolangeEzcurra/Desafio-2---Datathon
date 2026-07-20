const API = "http://localhost:8000/api/mapas";

export async function obtenerDatosMapa(tipo_vista, filtros = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filtros).forEach(([key, value]) => {
        // Solo añadimos si el valor existe y no es una cadena vacía
        if (value !== null && value !== undefined && value !== "") {
            params.append(key, value);
        }
    });

    const url = `${API}/${tipo_vista}?${params.toString()}`;
    console.log("Consultando URL:", url); // <--- MIRA ESTO EN LA CONSOLA DEL NAVEGADOR
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Error en el servidor");
    return await response.json();
}