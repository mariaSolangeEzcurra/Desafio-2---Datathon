const API_URL = import.meta.env.VITE_API_URL;

/**
 * Obtener listado de personal
 */
export async function obtenerPersonal(filtros = {}) {
    const params = new URLSearchParams();

    params.append("skip", filtros.skip ?? 0);
    params.append("limit", filtros.limit ?? 200);

    if (filtros.periodo) {
        params.append("periodo", filtros.periodo);
    } else if (filtros.fecha) {
        params.append("fecha", filtros.fecha);
    }

    const response = await fetch(
        `${API_URL}/lectura/personal/?${params.toString()}`
    );

    if (!response.ok) {
        throw new Error("Error obteniendo personal");
    }

    return await response.json();
}


/**
 * Obtener discrepancias espaciales
 */
export async function obtenerDiscrepancias(
    filtros = {}
) {

    const params = new URLSearchParams();

    // ========================================================
    // PERIODO Y FECHAS SON EXCLUYENTES
    // ========================================================

    if (
        filtros.periodo &&
        filtros.periodo !== "TODOS"
    ) {
        params.append("periodo", filtros.periodo);
    } else {

        if (
            filtros.fecha_inicio &&
            filtros.fecha_inicio !== "TODOS"
        ) {
            params.append(
                "fecha_inicio",
                filtros.fecha_inicio
            );
        }

        if (
            filtros.fecha_fin &&
            filtros.fecha_fin !== "TODOS"
        ) {
            params.append(
                "fecha_fin",
                filtros.fecha_fin
            );
        }
    }

    // ========================================================
    // RESTO DE FILTROS
    // ========================================================

    ["zona_id", "cmetfac"].forEach((campo) => {

        if (
            filtros[campo] !== undefined &&
            filtros[campo] !== null &&
            filtros[campo] !== "" &&
            filtros[campo] !== "TODOS"
        ) {
            params.append(campo, filtros[campo]);
        }

    });

    const url =
        `${API_URL}/api/maps/discrepancias${
            params.toString()
                ? `?${params.toString()}`
                : ""
        }`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            "Error obteniendo discrepancias espaciales"
        );
    }

    return await response.json();
}


/**
 * Obtener heatmap de impedimentos
 */
export async function obtenerHeatmapImpedimentos(
    filtros = {}
) {

    const params = new URLSearchParams();

    // ========================================================
    // PERIODO Y FECHAS SON EXCLUYENTES
    // ========================================================

    if (
        filtros.periodo &&
        filtros.periodo !== "TODOS"
    ) {
        params.append("periodo", filtros.periodo);
    } else {

        if (
            filtros.fecha_inicio &&
            filtros.fecha_inicio !== "TODOS"
        ) {
            params.append(
                "fecha_inicio",
                filtros.fecha_inicio
            );
        }

        if (
            filtros.fecha_fin &&
            filtros.fecha_fin !== "TODOS"
        ) {
            params.append(
                "fecha_fin",
                filtros.fecha_fin
            );
        }
    }

    // ========================================================
    // RESTO DE FILTROS
    // ========================================================

    ["zona_id", "cmetfac"].forEach((campo) => {

        if (
            filtros[campo] !== undefined &&
            filtros[campo] !== null &&
            filtros[campo] !== "" &&
            filtros[campo] !== "TODOS"
        ) {
            params.append(campo, filtros[campo]);
        }

    });

    const url =
        `${API_URL}/api/maps/heatmap-impedimentos${
            params.toString()
                ? `?${params.toString()}`
                : ""
        }`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            "Error obteniendo heatmap de impedimentos"
        );
    }

    return await response.json();
}


/**
 * Obtener catálogo
 *
 * Ejemplo:
 * /api/catalogos/observaciones
 */
export async function obtenerCatalogo(tipo) {

    const response = await fetch(
        `${API_URL}/api/catalogos/${tipo}`
    );

    if (!response.ok) {
        throw new Error(
            `Error obteniendo catálogo: ${tipo}`
        );
    }

    return await response.json();
}


// ============================================================
// OBTENER GRUPOS DE FACTURACIÓN
// ============================================================
export async function obtenerGruposFacturacion() {

    const response = await fetch(
        `${API_URL}/api/catalogos/grupos`
    );

    if (!response.ok) {

        let mensaje =
            "Error obteniendo grupos de facturación";

        try {

            const errorData =
                await response.json();

            if (errorData?.detail) {

                mensaje =
                    typeof errorData.detail === "string"
                        ? errorData.detail
                        : JSON.stringify(errorData.detail);

            }

        } catch {
            // Mantener mensaje por defecto
        }

        throw new Error(mensaje);

    }

    const data = await response.json();

    return Array.isArray(data) ? data : [];
}