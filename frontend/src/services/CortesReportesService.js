import axios from "axios";

// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_URL = "http://localhost:8000/api/cortes/reportes";

// =====================================================
// DESCARGAR REPORTE FINANCIERO EXCEL
// GET /api/cortes/reportes/financiero/excel
// =====================================================

export const descargarReporteFinanciero = async ({
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

  const response = await axios.get(
    `${API_URL}/financiero/excel`,
    {
      params,
      responseType: "blob",
      headers: {
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    }
  );

  return response;
};

// =====================================================
// DESCARGAR REPORTE DE INEFICIENCIA EXCEL
// GET /api/cortes/reportes/ineficiencia/excel
// =====================================================

export const descargarReporteIneficiencia = async ({
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

  const response = await axios.get(
    `${API_URL}/ineficiencia/excel`,
    {
      params,
      responseType: "blob",
      headers: {
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    }
  );

  return response;
};

// =====================================================
// EXPORTACIÓN POR DEFECTO
// =====================================================

export default {
  descargarReporteFinanciero,
  descargarReporteIneficiencia,
};
