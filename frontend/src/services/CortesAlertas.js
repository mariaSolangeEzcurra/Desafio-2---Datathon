import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const cortesAlertasService = {
  // ==========================================================
  // OBTENER ALERTAS OPERATIVAS DE CORTE
  // GET /api/v1/cortes/alertas
  // ==========================================================
  getAlertas: async ({
    fecha_inicio,
    fecha_fin,
    periodo = "hoy",
    distrito,
  } = {}) => {
    const response = await axios.get(
      `${API_URL}/api/v1/cortes/alertas`,
      {
        params: {
          fecha_inicio,
          fecha_fin,
          periodo,
          distrito,
        },
        headers: {
          Accept: "application/json",
        },
      }
    );

    return response.data;
  },
};
