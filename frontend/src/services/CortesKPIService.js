import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const cortesKPIService = {
  // ==========================================================
  // DASHBOARD KPIs
  // GET /api/cortes/kpis/dashboard
  //
  // Filtros:
  // - periodo: hoy, semana, mes, 3meses
  // - fecha_inicio: YYYY-MM-DD
  // - fecha_fin: YYYY-MM-DD
  // - distrito
  // - ccodprs
  // ==========================================================
  obtenerDashboardKpis: async ({
    periodo = "",
    fechaInicio = "",
    fechaFin = "",
    distrito = "",
    ccodprs = "",
  } = {}) => {
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

    if (distrito) {
      params.distrito = distrito;
    }

    if (ccodprs) {
      params.ccodprs = ccodprs;
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
  //
  // Filtros:
  // - periodo: hoy, semana, mes, 3meses
  // - fecha_inicio: YYYY-MM-DD
  // - fecha_fin: YYYY-MM-DD
  // ==========================================================
  obtenerResumen: async ({
    periodo = "",
    fechaInicio = "",
    fechaFin = "",
  } = {}) => {
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
