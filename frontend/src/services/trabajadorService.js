import axios from "axios";

const API_URL = "http://localhost:8000/lectura";


// Obtener listado de personal
export const obtenerPersonal = async (skip = 0, limit = 50) => {
  const res = await axios.get(
    `${API_URL}/personal/?skip=${skip}&limit=${limit}`
  );

  return res.data;
};


// Obtener personal por código de lector
export const obtenerPersonalPorCodigo = async (ccodprs) => {
  const res = await axios.get(
    `${API_URL}/personal/${ccodprs}`
  );

  return res.data;
};