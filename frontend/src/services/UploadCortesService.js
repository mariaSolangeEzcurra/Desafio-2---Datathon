import axios from "axios";

// ============================================================
// CONFIGURACIÓN BASE
// ============================================================

const API_URL = "http://localhost:8000";

// ============================================================
// SERVICE PARA CARGA DE CORTES
// ============================================================

export const uploadService = {

  // ==========================================================
  // SUBIR EXCEL DE CORTES
  // POST /api/cortes/upload-excel
  // ==========================================================
  uploadArchivo: async (archivo, proceso = "Corte") => {
    const formData = new FormData();

    formData.append("file", archivo);
    formData.append("proceso", proceso);

    const response = await axios.post(
      `${API_URL}/api/cortes/upload-excel`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      }
    );

    return response.data;
  },

  // ==========================================================
  // OBTENER HISTORIAL
  // GET /api/cortes/historial
  // ==========================================================
  getHistorial: async () => {
    const response = await axios.get(
      `${API_URL}/api/cortes/historial`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    return response.data;
  },

  // ==========================================================
  // REVERTIR CARGA
  // DELETE /api/cortes/historial/{id_carga}
  // ==========================================================
  revertirCarga: async (idCarga) => {
    const response = await axios.delete(
      `${API_URL}/api/cortes/historial/${idCarga}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    return response.data;
  },

};