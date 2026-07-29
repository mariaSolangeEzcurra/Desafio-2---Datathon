const API = "http://localhost:8000";


/**
 * Obtener listado de personal
 */
export async function obtenerPersonal() {

    const response = await fetch(
        `${API}/lectura/personal/?skip=0&limit=200`
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

    const filtrosPermitidos = [
        "fecha_inicio",
        "fecha_fin",
        "zona_id",
        "cmetfac"
    ];

    filtrosPermitidos.forEach((campo) => {

        if (
            filtros[campo] !== undefined &&
            filtros[campo] !== null &&
            filtros[campo] !== "" &&
            filtros[campo] !== "TODOS"
        ) {

            params.append(
                campo,
                filtros[campo]
            );

        }

    });

    const url =
        `${API}/api/maps/discrepancias${
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

    const filtrosPermitidos = [
        "fecha_inicio",
        "fecha_fin",
        "zona_id",
        "cmetfac"
    ];

    filtrosPermitidos.forEach((campo) => {

        if (
            filtros[campo] !== undefined &&
            filtros[campo] !== null &&
            filtros[campo] !== "" &&
            filtros[campo] !== "TODOS"
        ) {

            params.append(
                campo,
                filtros[campo]
            );

        }

    });

    const url =
        `${API}/api/maps/heatmap-impedimentos${
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
        `${API}/api/catalogos/${tipo}`
    );

    if (!response.ok) {
        throw new Error(
            `Error obteniendo catálogo: ${tipo}`
        );
    }

    return await response.json();
}