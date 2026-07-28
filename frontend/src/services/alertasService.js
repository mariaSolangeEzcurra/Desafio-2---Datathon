import axios from "axios";


const API_URL = "http://localhost:8000/alertas";


// =====================================
// LISTAR ALERTAS
// GET /alertas/
// =====================================

export const obtenerAlertas = async (filtros = {}) => {

    const response = await axios.get(
        `${API_URL}/`,
        {
            params: filtros
        }
    );


    return response.data;

};



// =====================================
// EVALUAR ALERTAS POR FECHA
// POST /alertas/evaluar
// =====================================

export const evaluarAlertas = async (fecha) => {


    const response = await axios.post(
        `${API_URL}/evaluar`,
        null,
        {
            params:{
                fecha
            }
        }
    );


    return response.data;

};



// =====================================
// OBTENER DETALLE ALERTA
// GET /alertas/{alerta_id}
// =====================================

export const obtenerDetalleAlerta = async(alerta_id)=>{


    const response = await axios.get(

        `${API_URL}/${alerta_id}`

    );


    return response.data;

};



// =====================================
// CAMBIAR ESTADO ALERTA
// PATCH /alertas/{alerta_id}/estado
// =====================================

export const cambiarEstadoAlerta = async(
    alerta_id,
    datos
)=>{


    const response = await axios.patch(

        `${API_URL}/${alerta_id}/estado`,

        datos

    );


    return response.data;

};