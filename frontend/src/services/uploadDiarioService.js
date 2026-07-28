const API_URL = "http://localhost:8000/api/reporte-diario";


export const subirReporteDiario = async (archivo) => {

  const formData = new FormData();

  formData.append("file", archivo);


  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  });


  if (!response.ok) {

    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.detail || "Error al subir el reporte diario"
    );

  }


  return await response.json();

};



export const obtenerHistorialReportes = async () => {


  const response = await fetch(`${API_URL}/`);



  if (!response.ok) {

    throw new Error(
      "No se pudo obtener el historial de reportes"
    );

  }


  return await response.json();


};