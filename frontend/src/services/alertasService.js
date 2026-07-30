const API_URL = import.meta.env.VITE_API_URL;
/**
 * ============================================================
 * OBTENER ALERTAS
 * GET /alertas/
 * ============================================================
 */
export async function obtenerAlertas(filtros = {}) {
    const params = new URLSearchParams();

    if (filtros.estado) {
        params.append("estado", filtros.estado);
    }

    if (filtros.zona_id) {
        params.append("zona_id", filtros.zona_id);
    }

    if (filtros.ccodprs) {
        params.append("ccodprs", filtros.ccodprs);
    }

    if (filtros.fecha) {
        params.append("fecha", filtros.fecha);
    }

    const query = params.toString();

    const response = await fetch(
        `${API_URL}/alertas/${query ? `?${query}` : ""}`
    );

    if (!response.ok) {
        let detalle = "";

        try {
            const errorData = await response.json();

            detalle =
                typeof errorData?.detail === "string"
                    ? errorData.detail
                    : JSON.stringify(errorData);
        } catch {
            detalle = "";
        }

        throw new Error(
            detalle ||
            "No se pudieron obtener las alertas."
        );
    }

    return await response.json();
}


/**
 * ============================================================
 * EVALUAR ALERTAS
 * POST /alertas/evaluar
 * ============================================================
 */
export async function evaluarAlertas(fecha = null) {
    const url = fecha
        ? `${API_URL}/alertas/evaluar?fecha=${fecha}`
        : `${API_URL}/alertas/evaluar`;

    const response = await fetch(
        url,
        {
            method: "POST",
            headers: {
                Accept: "application/json"
            }
        }
    );

    if (!response.ok) {
        let detalle = "";

        try {
            const errorData = await response.json();

            detalle =
                typeof errorData?.detail === "string"
                    ? errorData.detail
                    : JSON.stringify(errorData);
        } catch {
            detalle = "";
        }

        throw new Error(
            detalle ||
            "No se pudo ejecutar la evaluación de alertas."
        );
    }

    return await response.json();
}


/**
 * ============================================================
 * OBTENER DETALLE DE ALERTA
 * GET /alertas/{alerta_id}
 * ============================================================
 */
export async function obtenerDetalleAlerta(
    alerta_id
) {
    const response = await fetch(
        `${API_URL}/alertas/${alerta_id}`,
        {
            headers: {
                Accept: "application/json"
            }
        }
    );

    if (!response.ok) {
        let detalle = "";

        try {
            const errorData = await response.json();

            detalle =
                typeof errorData?.detail === "string"
                    ? errorData.detail
                    : JSON.stringify(errorData);
        } catch {
            detalle = "";
        }

        throw new Error(
            detalle ||
            "No se pudo obtener el detalle de la alerta."
        );
    }

    return await response.json();
}


/**
 * ============================================================
 * CAMBIAR ESTADO DE ALERTA
 *
 * PATCH /alertas/{alerta_id}/estado
 *
 * Body esperado por el backend:
 *
 * {
 *   "estado_alerta": "En Revisión",
 *   "comentario": "Comentario...",
 *   "supervisor_id": "..."
 * }
 *
 * ============================================================
 */
export async function cambiarEstadoAlerta(
    alerta_id,
    datos
) {
    const response = await fetch(
        `${API_URL}/alertas/${alerta_id}/estado`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify(datos),
        }
    );

    if (!response.ok) {
        const errorTexto = await response.text();

        console.error(
            "Error del backend al actualizar alerta:",
            response.status,
            errorTexto
        );

        throw new Error(
            `Error ${response.status}: ${errorTexto}`
        );
    }

    return await response.json();
}
