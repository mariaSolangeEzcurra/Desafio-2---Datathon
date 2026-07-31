import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/lectura/kpis`;

export const obtenerDashboardLectura = async ({
  fechaInicio = "",
  fechaFin = "",
  periodo = "",
  zonaId = "",
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

  if (zonaId) {
    params.zona_id = zonaId;
  }

  try {
    const { data } = await axios.get(`${API}/dashboard`, {
      params,
    });

    return data;
  } catch (error) {
    console.error(
      "Error obteniendo dashboard de lectura:",
      error
    );

    throw error;
  }
};

/**
 * ============================================================
 * RESUMEN GENERAL DE KPIs
 * GET /lectura/kpis/resumen
 *
 * Parámetros disponibles:
 * - fechaInicio → YYYY-MM-DD
 * - fechaFin    → YYYY-MM-DD
 * - periodo     → hoy | semana | mes | 3meses
 * - zonaId      → ID de Zona o CMETFAC
 * ============================================================
 */
export const obtenerResumenLectura = async ({
  fechaInicio = "",
  fechaFin = "",
  periodo = "",
  zonaId = "",
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

  if (zonaId) {
    params.zona_id = zonaId;
  }

  try {
    const { data } = await axios.get(`${API}/resumen`, {
      params,
    });

    return data;
  } catch (error) {
    console.error(
      "Error obteniendo resumen de lectura:",
      error
    );

    throw error;
  }
};
