export const uploadService = {
  /**
   * Envía el archivo Excel al backend según el proceso (Lectura o Corte)
   */
  uploadArchivo: async (file, proceso) => { 
    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("proceso", proceso);

    const url = `http://localhost:8000/api/upload/l`;

    const respuesta = await fetch(url, {
      method: "POST",
      body: formData, 
    });

    if (!respuesta.ok) {
      const errorData = await respuesta.json().catch(() => ({}));
      throw new Error(errorData.detail || "Error al procesar el archivo en el servidor");
    }

    return await respuesta.json();
  },

  /**
   * Obtiene el historial de cargas desde el backend
   */
  getHistorial: async () => {
    const url = `http://localhost:8000/api/historial`;
    
    const respuesta = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!respuesta.ok) {
      throw new Error("No se pudo obtener el historial de carga");
    }

    return await respuesta.json(); // Esto devolverá la lista de RegistroCarga
  }
};