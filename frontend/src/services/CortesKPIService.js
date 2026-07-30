import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const cortesKPIService = {

  obtenerDashboardKpis: async (fechaInicio = "", fechaFin = "") => {
    const params = {};

    if (fechaInicio) {
      params.fecha_inicio = fechaInicio;
    }

    if (fechaFin) {
      params.fecha_fin = fechaFin;
    }

    const response = await axios.get(
      `${API_URL}/api/cortes/kpis/dashboard`,
      {
        params,
        headers: {
          Accept: "application/json",
        },
      }
    );

    return response.data;
  },

  // ==========================================================
  // RESUMEN ANALÍTICO
  // GET /api/cortes/kpis/resumen
  // ==========================================================
  obtenerResumen: async (fechaInicio = "", fechaFin = "") => {
    const params = {};

    if (fechaInicio) {
      params.fecha_inicio = fechaInicio;
    }

    if (fechaFin) {
      params.fecha_fin = fechaFin;
    }

    const response = await axios.get(
      `${API_URL}/api/cortes/kpis/resumen`,
      {
        params,
        headers: {
          Accept: "application/json",
        },
      }
    );

    return response.data;
  },

};
