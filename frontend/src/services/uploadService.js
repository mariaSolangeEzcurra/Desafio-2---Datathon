import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/lecturas",
  timeout: 15000,
});

export const uploadService = {
  uploadArchivo: async (file, proceso, usuarioId) => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("proceso", proceso);
    formData.append("usuario_id", usuarioId);

    console.log("Archivo:", file.name);
    console.log("Proceso:", proceso);
    console.log("Usuario:", usuarioId);

    const response = await api.post("/upload-excel", formData, {
      timeout: 120000,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  getHistorial: async () => {
    const response = await api.get("/historial");
    return response.data;
  },
};