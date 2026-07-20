const API = "http://localhost:8000/lectura";

export async function obtenerKPIsLectura(
    periodo,
    grupoFacturacion = "",
    trabajador = ""
) {

    const params = new URLSearchParams({
        periodo
    });

    if (grupoFacturacion)
        params.append("grupo_facturacion", grupoFacturacion);

    if (trabajador)
        params.append("trabajador", trabajador);

    const response = await fetch(`${API}/kpis?${params}`);

    if (!response.ok)
        throw new Error("Error al obtener KPIs");

    return await response.json();
}

export async function obtenerGruposFacturacion() {

    const response = await fetch(`${API}/grupos-facturacion`);

    if (!response.ok)
        throw new Error("Error al obtener grupos");

    return await response.json();
}