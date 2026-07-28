import axios from "axios";

const API_URL = "http://localhost:8000/lectura";

/**
 * Obtener listado de personal
 */
export const obtenerPersonal = async (skip = 0, limit = 50) => {
    const response = await axios.get(
        `${API_URL}/personal/`,
        {
            params: {
                skip,
                limit
            }
        }
    );

    return response.data;
};

/**
 * Obtener ficha completa de un trabajador
 */
export const obtenerFichaPersonal = async (ccodprs) => {
    const response = await axios.get(
        `${API_URL}/personal/${ccodprs}/ficha`
    );

    return response.data;
};

/**
 * Recalcular desempeño del personal
 */
export const calcularDesempeno = async () => {
    const response = await axios.post(
        `${API_URL}/personal/calcular-desempeno`
    );

    return response.data;
};