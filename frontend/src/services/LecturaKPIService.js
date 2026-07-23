import axios from "axios";

const API = "http://localhost:8000/lectura";

export async function obtenerKPIsLectura(
    periodo,
    grupoFacturacion = "",
    trabajador = ""
) {
    const params = new URLSearchParams({ periodo });

    if (grupoFacturacion)
        params.append("grupo_facturacion", grupoFacturacion);

    if (trabajador)
        params.append("trabajador", trabajador);

    const response = await axios.get(`${API}/kpis?${params}`);
    return response.data;
}

export async function obtenerGruposFacturacion() {
    try {
        // Consumiendo directamente el endpoint de lectura
        const response = await axios.get(`${API}/grupos-facturacion`);
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error("Error al obtener grupos de facturación:", error);
        return [];
    }
}