const API_URL = import.meta.env.VITE_API_URL;


/**
 * Obtener listado de personal
 */
export async function obtenerPersonal() {

    const response = await fetch(
        `${API_URL}/lectura/personal/?skip=0&limit=200`
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
// // OBTENER GRUPOS DE FACTURACIÓN // 
// ============================================================ 
export async function obtenerGruposFacturacion() { 
    const response = await fetch( 
        `${API_URL}/api/catalogos/grupos` 
    );
    
    if (!response.ok) {
        let mensaje = "Error obteniendo grupos de facturación"; 
        
        try { 
            const errorData = await response.json(); 
            if (errorData?.detail)
                 { mensaje = typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail);

                  } } 
                  catch {
                    // Mantener mensaje por defecto
                     } 
                     
                throw new Error(mensaje); 
            } const data = await response.json(); 
            // Aseguramos que siempre devolvamos un arreglo 
            return Array.isArray(data) ? data : []; }
