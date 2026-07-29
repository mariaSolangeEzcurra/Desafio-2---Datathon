import axios from "axios";

const API_URL = "http://localhost:8000/api/cortes/geo";

// ============================================================
// SERVICE: GEOLOCALIZACIÓN DE CORTES
// ============================================================

export const cortesGeoService = {

  // ==========================================================
  // HEATMAP
  // GET /api/cortes/geo/heatmap
  // ==========================================================
  obtenerHeatmap: async (fechaInicio, fechaFin) => {
    const params = {};

    if (fechaInicio) {
      params.fecha_inicio = fechaInicio;
    }

    if (fechaFin) {
      params.fecha_fin = fechaFin;
    }

    const response = await axios.get(
      `${API_URL}/heatmap`,
      {
        params,
      }
    );

    return response.data;
  },

  // ==========================================================
  // IMPEDIMENTOS
  // GET /api/cortes/geo/impedimentos
  // ==========================================================
  obtenerImpedimentos: async (
    fechaInicio,
    fechaFin
  ) => {
    const params = {};

    if (fechaInicio) {
      params.fecha_inicio = fechaInicio;
    }

    if (fechaFin) {
      params.fecha_fin = fechaFin;
    }

    const response = await axios.get(
      `${API_URL}/impedimentos`,
      {
        params,
      }
    );

    return response.data;
  },
};
