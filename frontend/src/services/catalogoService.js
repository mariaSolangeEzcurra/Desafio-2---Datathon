import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/catalogos`;


export const catalogoService = {
  obtenerCatalogo: async (tipo) => {
    try {
      const response = await axios.get(`${API_URL}/${tipo}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(`Error al obtener el catálogo ${tipo}:`, error);
      return [];
    }
  },
};