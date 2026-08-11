import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const uploadService = {
  // ==========================================================
  // SUBIR EXCEL DE CORTES
  // POST /api/cortes/cargas/upload
  // ==========================================================
  uploadArchivo: async (archivo, proceso = "Corte") => {
    const formData = new FormData();

    formData.append("file", archivo);
    formData.append("proceso", proceso);

    const response = await axios.post(
      `${API_URL}/api/cortes/cargas/upload`,
      formData,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    return response.data;
  },

  // ==========================================================
  // OBTENER HISTORIAL DE CARGAS
  // GET /api/cortes/cargas/historial
  // ==========================================================
  getHistorial: async (limit = 50) => {
    const response = await axios.get(
      `${API_URL}/api/cortes/cargas/historial`,
      {
        params: {
          limit,
        },
        headers: {
          Accept: "application/json",
        },
      }
    );

    return response.data;
  },

  // ==========================================================
  // REVERTIR CARGA
  // DELETE /api/cortes/cargas/historial/{id_carga}
  // ==========================================================
  revertirCarga: async (idCarga) => {
    const response = await axios.delete(
      `${API_URL}/api/cortes/cargas/historial/${idCarga}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    return response.data;
  },
};
