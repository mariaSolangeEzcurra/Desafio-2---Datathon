const API_URL = "http://localhost:8000";

export async function obtenerAlertas(filtros = {}) {

    const params = new URLSearchParams();

    if (filtros.estado)
        params.append("estado", filtros.estado);

    if (filtros.zona_id)
        params.append("zona_id", filtros.zona_id);

    if (filtros.ccodprs)
        params.append("ccodprs", filtros.ccodprs);

    if (filtros.fecha)
        params.append("fecha", filtros.fecha);


    const response = await fetch(
        `${API_URL}/alertas/?${params.toString()}`
    );


    if (!response.ok) {

        throw new Error(
            "No se pudieron obtener las alertas."
        );

    }


    return await response.json();

}


export async function evaluarAlertas(fecha = null) {

    const url =
        fecha
            ? `${API_URL}/alertas/evaluar?fecha=${fecha}`
            : `${API_URL}/alertas/evaluar`;


    const response = await fetch(
        url,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        }
    );


    if (!response.ok) {

        throw new Error(
            "No se pudo ejecutar la evaluación de alertas."
        );

    }


    return await response.json();

}


export async function obtenerDetalleAlerta(
    alerta_id
) {

    const response = await fetch(
        `${API_URL}/alertas/${alerta_id}`
    );


    if (!response.ok) {

        throw new Error(
            "No se pudo obtener el detalle de la alerta."
        );

    }


    return await response.json();

}


export async function cambiarEstadoAlerta(
    alerta_id,
    datos
) {

    const response = await fetch(
        `${API_URL}/alertas/${alerta_id}/estado`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        }
    );


    if (!response.ok) {

        throw new Error(
            "No se pudo actualizar el estado."
        );

    }


    return await response.json();

}