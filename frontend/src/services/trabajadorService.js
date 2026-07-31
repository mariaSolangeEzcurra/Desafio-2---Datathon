import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/lectura`;

/**
 * ============================================================
 * OBTENER PERSONAL
 * GET /lectura/personal/
 *
 * Parámetros:
 * - skip
 * - limit
 * - fecha     -> YYYY-MM-DD
 * - periodo   -> hoy | semana | mes | 3meses
 *
 * IMPORTANTE:
 * Si se envía fecha, NO se envía periodo.
 * Si se envía periodo, NO se envía fecha.
 * ============================================================
 */
export const obtenerPersonal = async ({
    skip = 0,
    limit = 50,
    fecha = "",
    periodo = "",
} = {}) => {
    try {
        const params = {
            skip,
            limit,
        };

        // Filtro por fecha exacta
        if (fecha) {
            params.fecha = fecha;
        }
        // Filtro rápido por periodo
        else if (periodo) {
            params.periodo = periodo;
        }

        console.log(
            "GET /lectura/personal/ - parámetros:",
            params
        );

        const response = await axios.get(
            `${API_URL}/personal/`,
            {
                params,
            }
        );

        console.log(
            "PERSONAL RECIBIDO:",
            response.data
        );

        return response.data;
    } catch (error) {
        console.error(
            "Error al obtener personal:",
            error
        );

        console.error(
            "Respuesta del servidor:",
            error?.response?.data
        );

        throw error;
    }
};


/**
 * ============================================================
 * OBTENER FICHA INDIVIDUAL
 *
 * GET /lectura/personal/{ccodprs}/ficha
 *
 * La ficha NO recibe fecha ni periodo según el API actual.
 * ============================================================
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

        console.error(
            "Respuesta del servidor:",
            error?.response?.data
        );

        throw error;
    }
};


/**
 * ============================================================
 * CALCULAR DESEMPEÑO
 *
 * POST /lectura/personal/calcular-desempeno
 *
 * Parámetros:
 * - ccodprs
 * - fecha_eval
 * - periodo
 *
 * Igual que en obtenerPersonal:
 * fecha_eval y periodo son excluyentes.
 * ============================================================
 */
export const calcularDesempeno = async ({
    ccodprs = "",
    fecha_eval = "",
    periodo = "",
} = {}) => {
    try {
        const params = {};

        // Trabajador específico
        if (ccodprs) {
            params.ccodprs = ccodprs;
        }

        // Fecha específica
        if (fecha_eval) {
            params.fecha_eval = fecha_eval;
        }
        // Periodo rápido
        else if (periodo) {
            params.periodo = periodo;
        }

        console.log(
            "POST /lectura/personal/calcular-desempeno - parámetros:",
            params
        );

        const response = await axios.post(
            `${API_URL}/personal/calcular-desempeno`,
            null,
            {
                params,
            }
        );

        console.log(
            "RESULTADO CÁLCULO DESEMPEÑO:",
            response.data
        );

        return response.data;
    } catch (error) {
        console.error(
            "Error al calcular desempeño:",
            error
        );

        console.error(
            "Respuesta del servidor:",
            error?.response?.data
        );

        throw error;
    }
};
