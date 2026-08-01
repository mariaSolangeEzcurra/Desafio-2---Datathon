import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/reportes`;

// =====================================================
// OBTENER RESUMEN DE KPIs
// GET /api/reportes/kpis-resumen
// =====================================================

export const obtenerResumenKpis = async ({
  fecha_inicio = null,
  fecha_fin = null,
  zona_id = null,
  periodo = null,
} = {}) => {
  const params = {};

  if (periodo) params.periodo = periodo;
  if (fecha_inicio) params.fecha_inicio = fecha_inicio;
  if (fecha_fin) params.fecha_fin = fecha_fin;
  if (zona_id) params.zona_id = zona_id;

  const response = await axios.get(`${API_URL}/kpis-resumen`, {
    params,
  });

  return response.data;
};

// =====================================================
// OBTENER ALERTAS POR ESTADO
// GET /api/reportes/alertas-estado
// =====================================================

export const obtenerAlertasEstado = async ({
  fecha_inicio = null,
  fecha_fin = null,
  periodo = null,
} = {}) => {
  const params = {};

  if (periodo) params.periodo = periodo;
  if (fecha_inicio) params.fecha_inicio = fecha_inicio;
  if (fecha_fin) params.fecha_fin = fecha_fin;

  const response = await axios.get(`${API_URL}/alertas-estado`, {
    params,
  });

  return response.data;
};

// =====================================================
// OBTENER RANKING DE TRABAJADORES
// GET /api/reportes/trabajadores-ranking
// =====================================================

export const obtenerRankingTrabajadores = async ({
  fecha = null,
} = {}) => {
  const params = {};

  if (fecha) params.fecha = fecha;

  const response = await axios.get(
    `${API_URL}/trabajadores-ranking`,
    {
      params,
    }
  );

  return response.data;
};

// =====================================================
// EXPORTAR RESUMEN KPIs
// GET /api/reportes/kpis-resumen/exportar
// =====================================================

export const exportarResumenKpis = async ({
  fecha_inicio = null,
  fecha_fin = null,
  zona_id = null,
  periodo = null,
} = {}) => {
  const params = {};

  if (periodo) params.periodo = periodo;
  if (fecha_inicio) params.fecha_inicio = fecha_inicio;
  if (fecha_fin) params.fecha_fin = fecha_fin;
  if (zona_id) params.zona_id = zona_id;

  return axios.get(
    `${API_URL}/kpis-resumen/exportar`,
    {
      params,
      responseType: "blob",
      headers: {
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    }
  );
};

// =====================================================
// EXPORTAR ALERTAS POR ESTADO
// GET /api/reportes/alertas-estado/exportar
// =====================================================

export const exportarAlertasEstado = async ({
  fecha_inicio = null,
  fecha_fin = null,
  periodo = null,
} = {}) => {
  const params = {};

  if (periodo) params.periodo = periodo;
  if (fecha_inicio) params.fecha_inicio = fecha_inicio;
  if (fecha_fin) params.fecha_fin = fecha_fin;

  return axios.get(
    `${API_URL}/alertas-estado/exportar`,
    {
      params,
      responseType: "blob",
      headers: {
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    }
  );
};

// =====================================================
// EXPORTAR DESEMPEÑO DE TRABAJADORES
// GET /api/reportes/trabajadores-desempeno/exportar
// =====================================================

export const exportarTrabajadoresDesempeno = async ({
  fecha = null,
} = {}) => {
  const params = {};

  if (fecha) params.fecha = fecha;

  return axios.get(
    `${API_URL}/trabajadores-desempeno/exportar`,
    {
      params,
      responseType: "blob",
      headers: {
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    }
  );
};

export default {
  obtenerResumenKpis,
  obtenerAlertasEstado,
  obtenerRankingTrabajadores,
  exportarResumenKpis,
  exportarAlertasEstado,
  exportarTrabajadoresDesempeno,
};