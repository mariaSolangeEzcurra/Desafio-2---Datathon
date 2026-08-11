import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const cortesPersonalService = {
  // ==========================================================
  // OBTENER RENDIMIENTO DEL PERSONAL
  // GET /api/v1/cortes/personal/rendimiento
  // ==========================================================
  getRendimientoPersonal: async ({
    fecha_inicio,
    fecha_fin,
    periodo,
    distrito,
  } = {}) => {
    const response = await axios.get(
      `${API_URL}/api/v1/cortes/personal/rendimiento`,
      {
        params: {
          fecha_inicio,
          fecha_fin,
          periodo,
          distrito,
        },
        headers: {
          Accept: "application/json",
        },
      }
    );

    return response.data;
  },

  // ==========================================================
  // OBTENER DETALLE DE UN TRABAJADOR
  // GET /api/v1/cortes/personal/trabajador/{ccodprs}
  // ==========================================================
  getDetalleTrabajador: async (
    ccodprs,
    {
      fecha_inicio,
      fecha_fin,
      periodo,
      pagina = 1,
      limite = 50,
    } = {}
  ) => {
    const response = await axios.get(
      `${API_URL}/api/v1/cortes/personal/trabajador/${ccodprs}`,
      {
        params: {
          fecha_inicio,
          fecha_fin,
          periodo,
          pagina,
          limite,
        },
        headers: {
          Accept: "application/json",
        },
      }
    );

    return response.data;
  },
};
