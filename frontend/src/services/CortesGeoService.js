import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/cortes/geo`;

// ============================================================
// SERVICE: GEOLOCALIZACIÓN DE CORTES
// ============================================================

export const cortesGeoService = {
  // ==========================================================
  // HEATMAP
  // GET /api/cortes/geo/heatmap
  //
  // Filtros:
  // - fecha_inicio
  // - fecha_fin
  // - periodo (hoy, semana, mes, 3meses)
  // ==========================================================
  obtenerHeatmap: async (
    fechaInicio = "",
    fechaFin = "",
    periodo = ""
  ) => {
    const params = {};

    if (periodo) {
      params.periodo = periodo;
    }

    if (fechaInicio) {
      params.fecha_inicio = fechaInicio;
    }

    if (fechaFin) {
      params.fecha_fin = fechaFin;
    }

    const response = await axios.get(`${API_URL}/heatmap`, {
      params,
      headers: {
        Accept: "application/json",
      },
    });

    return response.data;
  },

  // ==========================================================
  // IMPEDIMENTOS
  // GET /api/cortes/geo/impedimentos
  //
  // Filtros:
  // - fecha_inicio
  // - fecha_fin
  // - periodo (hoy, semana, mes, 3meses)
  // ==========================================================
  obtenerImpedimentos: async (
    fechaInicio = "",
    fechaFin = "",
    periodo = ""
  ) => {
    const params = {};

    if (periodo) {
      params.periodo = periodo;
    }

    if (fechaInicio) {
      params.fecha_inicio = fechaInicio;
    }

    if (fechaFin) {
      params.fecha_fin = fechaFin;
    }

    const response = await axios.get(`${API_URL}/impedimentos`, {
      params,
      headers: {
        Accept: "application/json",
      },
    });

    return response.data;
  },
};