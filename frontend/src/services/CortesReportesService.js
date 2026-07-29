import axios from "axios";

// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_URL = "http://localhost:8000/api/cortes/reportes";

// =====================================================
// REPORTE FINANCIERO
// POST /api/cortes/reportes/financiero
// =====================================================

export const exportarReporteFinanciero = async ({
  fecha_inicio = null,
  fecha_fin = null,
} = {}) => {
  const params = {};

  if (fecha_inicio) {
    params.fecha_inicio = fecha_inicio;
  }

  if (fecha_fin) {
    params.fecha_fin = fecha_fin;
  }

  const response = await axios.post(
    `${API_URL}/financiero`,
    null,
    {
      params,
      headers: {
        Accept: "application/json",
      },
    }
  );

  return response;
};

// =====================================================
// REPORTE DE INEFICIENCIA
// POST /api/cortes/reportes/ineficiencia
// =====================================================

export const exportarReporteIneficiencia = async ({
  fecha_inicio = null,
  fecha_fin = null,
} = {}) => {
  const params = {};

  if (fecha_inicio) {
    params.fecha_inicio = fecha_inicio;
  }

  if (fecha_fin) {
    params.fecha_fin = fecha_fin;
  }

  const response = await axios.post(
    `${API_URL}/ineficiencia`,
    null,
    {
      params,
      headers: {
        Accept: "application/json",
      },
    }
  );

  return response;
};

// =====================================================
// EXPORTACIÓN POR DEFECTO
// =====================================================

export default {
  exportarReporteFinanciero,
  exportarReporteIneficiencia,
};
