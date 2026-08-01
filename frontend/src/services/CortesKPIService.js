import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const cortesKPIService = {
  // ==========================================================
  // DASHBOARD KPIs
  // GET /api/cortes/kpis/dashboard
  // Filtros:
  // - fecha_inicio
  // - fecha_fin
  // - periodo (hoy, semana, mes, 3meses)
  // ==========================================================
  obtenerDashboardKpis: async (
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
  // Filtros:
  // - fecha_inicio
  // - fecha_fin
  // - periodo (hoy, semana, mes, 3meses)
  // ==========================================================
  obtenerResumen: async (
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