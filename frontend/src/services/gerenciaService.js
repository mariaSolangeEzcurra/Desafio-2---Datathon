import axios from "axios";

const API_URL = "http://localhost:8000/api/gerencia";

// =========================================
// RESUMEN POR GRUPO DE FACTURACIÓN
// GET /api/gerencia/grupos-facturacion/resumen
// =========================================

export const obtenerResumenGrupoFacturacion = async ({
  fecha_inicio,
  fecha_fin = null,
  cmetfac = null
}) => {

  const response = await axios.get(
    `${API_URL}/grupos-facturacion/resumen`,
    {
      params: {
        fecha_inicio,
        fecha_fin,
        cmetfac
      }
    }
  );

  return response.data;
};

// =========================================
// RANKING DE PERSONAL
// GET /api/gerencia/rankings/personal
// =========================================

export const obtenerRankingPersonal = async ({
  fecha_inicio,
  fecha_fin = null,
  cmetfac = null,
  limit = 10
}) => {

  const response = await axios.get(
    `${API_URL}/rankings/personal`,
    {
      params: {
        fecha_inicio,
        fecha_fin,
        cmetfac,
        limit
      }
    }
  );

  return response.data;
};

// =========================================
// ALERTAS DE RIESGO OPERATIVO
// GET /api/gerencia/alertas/riesgo-operativo
// =========================================

export const obtenerRiesgoOperativo = async ({
  fecha_inicio,
  fecha_fin = null
}) => {

  const response = await axios.get(
    `${API_URL}/alertas/riesgo-operativo`,
    {
      params: {
        fecha_inicio,
        fecha_fin
      }
    }
  );

  return response.data;
};