import axios from "axios";

const API_URL = "http://localhost:8000/lectura";

/**
 * Obtener listado general del personal
 * GET /lectura/personal/?skip=0&limit=50
 */
export const obtenerPersonal = async (skip = 0, limit = 50) => {
    try {
        const response = await axios.get(
            `${API_URL}/personal/`,
            {
                params: {
                    skip,
                    limit,
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error al obtener personal:", error);
        throw error;
    }
};


/**
 * Obtener ficha individual del trabajador
 * GET /lectura/personal/{ccodprs}/ficha
 */
export const obtenerFichaPersonal = async (ccodprs) => {
    try {
        const response = await axios.get(
            `${API_URL}/personal/${ccodprs}/ficha`
        );

        return response.data;
    } catch (error) {
        console.error(
            "Error al obtener ficha del trabajador:",
            error
        );
        throw error;
    }
};


/**
 * Calcular desempeño
 * POST /lectura/personal/calcular-desempeno
 *
 * Sin ccodprs:
 * calcula todos los trabajadores.
 *
 * Con ccodprs:
 * calcula solamente ese trabajador.
 */
export const calcularDesempeno = async (ccodprs = null) => {
    try {
        const params = {};

        if (ccodprs) {
            params.ccodprs = ccodprs;
        }

        const response = await axios.post(
            `${API_URL}/personal/calcular-desempeno`,
            null,
            {
                params,
            }
        );

        return response.data;
    } catch (error) {
        console.error(
            "Error al calcular desempeño:",
            error
        );
        throw error;
    }
};