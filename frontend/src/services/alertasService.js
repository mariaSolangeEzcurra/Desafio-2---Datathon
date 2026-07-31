const API_URL = import.meta.env.VITE_API_URL;

const ALERTAS_URL = `${API_URL}/api/alertas`;


/**
 * ============================================================
 * OBTENER ALERTAS
 *
 * GET /api/alertas/
 *
 * Filtros:
 * estado
 * zona_id
 * ccodprs
 * fecha
 * fecha_inicio
 * fecha_fin
 * periodo
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

    if (filtros.fecha_inicio) {
        params.append(
            "fecha_inicio",
            filtros.fecha_inicio
        );
    }

    if (filtros.fecha_fin) {
        params.append(
            "fecha_fin",
            filtros.fecha_fin
        );
    }

    if (filtros.periodo) {
        params.append(
            "periodo",
            filtros.periodo
        );
    }

    const query = params.toString();

    const url =
        `${ALERTAS_URL}/` +
        `${query ? `?${query}` : ""}`;

    console.log(
        "GET ALERTAS:",
        url
    );

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        let detalle = "";

        try {
            const errorData =
                await response.json();

            detalle =
                typeof errorData?.detail === "string"
                    ? errorData.detail
                    : JSON.stringify(errorData);

        } catch {
            detalle = "";
        }

        throw new Error(
            detalle ||
                `No se pudieron obtener las alertas. Código ${response.status}.`
        );
    }

    return await response.json();
}


/**
 * ============================================================
 * EVALUAR ALERTAS
 *
 * POST /api/alertas/evaluar
 *
 * fecha opcional:
 * ?fecha=YYYY-MM-DD
 * ============================================================
 */
export async function evaluarAlertas(
    fecha = null
) {
    const params = new URLSearchParams();

    if (fecha) {
        params.append(
            "fecha",
            fecha
        );
    }

    const query = params.toString();

    const url =
        `${ALERTAS_URL}/evaluar` +
        `${query ? `?${query}` : ""}`;

    console.log(
        "POST EVALUAR ALERTAS:",
        url
    );

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        let detalle = "";

        try {
            const errorData =
                await response.json();

            detalle =
                typeof errorData?.detail === "string"
                    ? errorData.detail
                    : JSON.stringify(errorData);

        } catch {
            detalle = "";
        }

        throw new Error(
            detalle ||
                `No se pudo ejecutar la evaluación de alertas. Código ${response.status}.`
        );
    }

    return await response.json();
}


/**
 * ============================================================
 * OBTENER DETALLE DE ALERTA
 *
 * GET /api/alertas/{alerta_id}
 * ============================================================
 */
export async function obtenerDetalleAlerta(
    alerta_id
) {
    const response = await fetch(
        `${ALERTAS_URL}/${alerta_id}`,
        {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        }
    );

    if (!response.ok) {
        let detalle = "";

        try {
            const errorData =
                await response.json();

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
 * PATCH /api/alertas/{alerta_id}/estado
 * ============================================================
 */
export async function cambiarEstadoAlerta(
    alerta_id,
    datos
) {
    const response = await fetch(
        `${ALERTAS_URL}/${alerta_id}/estado`,
        {
            method: "PATCH",
            headers: {
                "Content-Type":
                    "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(datos),
        }
    );

    if (!response.ok) {
        const errorTexto =
            await response.text();

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