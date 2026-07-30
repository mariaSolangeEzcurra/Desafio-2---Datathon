import axios from "axios";

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/lecturas`,
  timeout: 1140000,
});

export const uploadService = {
  // Subir archivo Excel
  uploadArchivo: async (file, proceso) => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("proceso", proceso);

    const response = await api.post("/upload-excel", formData, {
      timeout: 1140000,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  // Obtener historial de cargas
  getHistorial: async () => {
    const response = await api.get("/historial");
    return response.data;
  },

  // Revertir una carga
  revertirCarga: async (idCarga) => {
    const response = await api.delete(`/historial/${idCarga}`);
    return response.data;
  },
};
