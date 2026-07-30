import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/reportes`;

// =====================================================
// EXPORTAR RESUMEN DE KPIs
// GET /api/reportes/kpis-resumen/exportar
// =====================================================

export const exportarResumenKpis = async ({
  fecha_inicio = null,
  fecha_fin = null,
  zona_id = null,
}) => {
  const response = await axios.get(
    `${API_URL}/kpis-resumen/exportar`,
    {
      params: {
        fecha_inicio,
        fecha_fin,
        zona_id,
      },
      responseType: "blob",
    }
  );

  return response;
};

// =====================================================
// EXPORTAR ALERTAS POR ESTADO
// GET /api/reportes/alertas-estado/exportar
// =====================================================

export const exportarAlertasEstado = async ({
  fecha_inicio = null,
  fecha_fin = null,
}) => {
  const response = await axios.get(
    `${API_URL}/alertas-estado/exportar`,
    {
      params: {
        fecha_inicio,
        fecha_fin,
      },
      responseType: "blob",
    }
  );

  return response;
};

// =====================================================
// EXPORTAR DESEMPEÑO DE TRABAJADORES
// GET /api/reportes/trabajadores-desempeno/exportar
// =====================================================

export const exportarTrabajadoresDesempeno = async ({
  fecha = null,
}) => {
  const response = await axios.get(
    `${API_URL}/trabajadores-desempeno/exportar`,
    {
      params: {
        fecha,
      },
      responseType: "blob",
    }
  );

  return response;
};