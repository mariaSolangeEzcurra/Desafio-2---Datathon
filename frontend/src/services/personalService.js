const API_URL = "http://localhost:8000/api/personal";

// Obtener el desempeño general de todo el personal
export const obtenerPersonal = async () => {
  const response = await fetch(`${API_URL}/desempeno`);
  if (!response.ok) {
    throw new Error("Error al obtener el desempeño del personal.");
  }
  return await response.json();
};

// Obtener el personal filtrado por proceso
export const obtenerPersonalPorProceso = async (proceso) => {
  // Se envía el proceso como Query Param (?proceso=...)
  // Nota: Asegúrate de que tu FastAPI acepte este parámetro opcional en el futuro
  const response = await fetch(`${API_URL}/desempeno?proceso=${encodeURIComponent(proceso)}`);
  if (!response.ok) {
    throw new Error("Error al obtener el personal filtrado por proceso.");
  }
  return await response.json();
};