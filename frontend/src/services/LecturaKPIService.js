import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/lectura/kpis`;
/**
 * Dashboard completo de KPIs + Ranking
 * GET /lectura/kpis/dashboard
 */
export const obtenerDashboardLectura = async (
  fechaInicio = "",
  fechaFin = "",
  zonaId = ""
) => {
  const params = {};

  if (fechaInicio) params.fecha_inicio = fechaInicio;
  if (fechaFin) params.fecha_fin = fechaFin;
  if (zonaId) params.zona_id = zonaId;

  try {
    const { data } = await axios.get(`${API}/dashboard`, { params });
    return data;
  } catch (error) {
    console.error("Error obteniendo dashboard:", error);
    throw error;
  }
};

/**
 * Resumen general de KPIs
 * GET /lectura/kpis/resumen
 */
export const obtenerResumenLectura = async (
  fechaInicio = "",
  fechaFin = "",
  zonaId = ""
) => {
  const params = {};

  if (fechaInicio) params.fecha_inicio = fechaInicio;
  if (fechaFin) params.fecha_fin = fechaFin;

  try {
    const { data } = await axios.get(`${API}/resumen`, { params });
    return data;
  } catch (error) {
    console.error("Error obteniendo resumen:", error);
    throw error;
  }
};