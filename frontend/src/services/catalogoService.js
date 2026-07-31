import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/catalogos`;

export const catalogoService = {
  // ============================================================
  // OBTENER CATÁLOGO
  // ============================================================
  obtenerCatalogo: async (tipo) => {
    try {
      const response = await axios.get(`${API_URL}/${tipo}`);

      return Array.isArray(response.data)
        ? response.data
        : [];
    } catch (error) {
      console.error(`Error al obtener catálogo ${tipo}:`, error);
      throw error;
    }
  },

  // ============================================================
  // CREAR
  // ============================================================
  crearCatalogo: async (tipo, data) => {
    try {
      const response = await axios.post(
        `${API_URL}/${tipo}`,
        data
      );

      return response.data;
    } catch (error) {
      console.error(`Error al crear ${tipo}:`, error);
      throw error;
    }
  },

  // ============================================================
  // ACTUALIZAR
  // ============================================================
  actualizarCatalogo: async (tipo, idItem, data) => {
    try {
      const response = await axios.put(
        `${API_URL}/${tipo}/${encodeURIComponent(idItem)}`,
        data
      );

      return response.data;
    } catch (error) {
      console.error(`Error al actualizar ${tipo}:`, error);
      throw error;
    }
  },

  // ============================================================
  // ELIMINAR
  // ============================================================
  eliminarCatalogo: async (tipo, idItem) => {
    try {
      const response = await axios.delete(
        `${API_URL}/${tipo}/${encodeURIComponent(idItem)}`
      );

      return response.data;
    } catch (error) {
      console.error(`Error al eliminar ${tipo}:`, error);
      throw error;
    }
  },
};