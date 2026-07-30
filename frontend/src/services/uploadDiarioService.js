const API_URL = `${import.meta.env.VITE_API_URL}/api/reporte-diario`;
/**
 * Subir Reporte Diario
 *
 * POST /api/reporte-diario/upload
 *
 * Body:
 * multipart/form-data
 * file
 */
export const subirReporteDiario = async (archivo) => {
  const formData = new FormData();

  formData.append("file", archivo);

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    let mensaje = "Error al subir el reporte diario";

    if (typeof errorData.detail === "string") {
      mensaje = errorData.detail;
    } else if (Array.isArray(errorData.detail)) {
      mensaje = errorData.detail
        .map((item) => item.msg || JSON.stringify(item))
        .join(" | ");
    } else if (errorData.message) {
      mensaje = errorData.message;
    }

    throw new Error(mensaje);
  }

  return await response.json();
};


/**
 * Obtener Resúmenes Diarios
 *
 * GET /api/reporte-diario/
 *
 * Parámetros opcionales:
 * - fecha: YYYY-MM-DD
 * - ccodprs: código del lector
 * - limit: cantidad máxima de registros
 */
export const obtenerHistorialReportes = async ({
  fecha = "",
  ccodprs = "",
  limit = 100,
} = {}) => {
  const params = new URLSearchParams();

  if (fecha) {
    params.append("fecha", fecha);
  }

  if (ccodprs) {
    params.append("ccodprs", ccodprs);
  }

  if (limit) {
    params.append("limit", limit);
  }

  const queryString = params.toString();

  const url = queryString
    ? `${API_URL}/?${queryString}`
    : `${API_URL}/`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    let mensaje = "No se pudo obtener el historial de reportes";

    if (typeof errorData.detail === "string") {
      mensaje = errorData.detail;
    } else if (Array.isArray(errorData.detail)) {
      mensaje = errorData.detail
        .map((item) => item.msg || JSON.stringify(item))
        .join(" | ");
    } else if (errorData.message) {
      mensaje = errorData.message;
    }

    throw new Error(mensaje);
  }

  return await response.json();
};


/**
 * Revertir Carga de Reporte Diario
 *
 * DELETE /api/reporte-diario/historial/{id_carga}
 */
export const revertirCargaReporteDiario = async (idCarga) => {
  if (!idCarga) {
    throw new Error("No se proporcionó el ID de la carga.");
  }

  const response = await fetch(
    `${API_URL}/historial/${idCarga}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    let mensaje = "No se pudo revertir la carga";

    if (typeof errorData.detail === "string") {
      mensaje = errorData.detail;
    } else if (Array.isArray(errorData.detail)) {
      mensaje = errorData.detail
        .map((item) => item.msg || JSON.stringify(item))
        .join(" | ");
    } else if (errorData.message) {
      mensaje = errorData.message;
    }

    throw new Error(mensaje);
  }

  return await response.json();
};