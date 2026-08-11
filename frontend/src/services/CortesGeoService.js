import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/cortes/geo`;

export const cortesGeoService = {
  obtenerHeatmap: async ({
    fechaInicio = "",
    fechaFin = "",
    periodo = "",
    distrito = "",
    ccodprs = "",
    limite = 2000,
  } = {}) => {
    const params = {};

    if (fechaInicio) {
      params.fecha_inicio = fechaInicio;
    }

    if (fechaFin) {
      params.fecha_fin = fechaFin;
    }

    if (periodo) {
      params.periodo = periodo;
    }

    if (distrito) {
      params.distrito = distrito;
    }

    if (ccodprs) {
      params.ccodprs = ccodprs;
    }

    if (limite) {
      params.limite = limite;
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
  // - fecha_inicio: YYYY-MM-DD
  // - fecha_fin: YYYY-MM-DD
  // - periodo: hoy, semana, mes, 3meses
  // - distrito
  // - ccodprs
  // - limite: máximo de puntos a retornar
  // ==========================================================
  obtenerImpedimentos: async ({
    fechaInicio = "",
    fechaFin = "",
    periodo = "",
    distrito = "",
    ccodprs = "",
    limite = 2000,
  } = {}) => {
    const params = {};

    if (fechaInicio) {
      params.fecha_inicio = fechaInicio;
    }

    if (fechaFin) {
      params.fecha_fin = fechaFin;
    }

    if (periodo) {
      params.periodo = periodo;
    }

    if (distrito) {
      params.distrito = distrito;
    }

    if (ccodprs) {
      params.ccodprs = ccodprs;
    }

    if (limite) {
      params.limite = limite;
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
