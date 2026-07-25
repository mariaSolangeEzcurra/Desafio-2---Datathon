const API_URL = "http://localhost:8000/api/desempeno";

export const subirReporteDiario = async (archivo, fechaReporte) => {
  const formData = new FormData();
  formData.append("archivo", archivo);
  formData.append("fecha_reporte", fechaReporte);

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Error al subir el reporte diario");
  }

  return await response.json();
};

export const obtenerHistorialReportes = async () => {
  const response = await fetch(`${API_URL}/historial`);

  if (!response.ok) {
    throw new Error("No se pudo obtener el historial de reportes");
  }

  return await response.json();
};