import axios from "axios";

const API_URL = "http://localhost:8000/api/trabajadores";

export const obtenerTrabajadores = async () => {
  const res = await axios.get(`${API_URL}/`);
  return res.data;
};

export const obtenerTrabajadorPorCodigo = async (ccodprs) => {
  const res = await axios.get(`${API_URL}/${ccodprs}`);
  return res.data;
};

export const crearTrabajador = async (datos) => {
  const res = await axios.post(`${API_URL}/`, datos);
  return res.data;
};

export const actualizarTrabajador = async (ccodprs, datos) => {
  const res = await axios.put(`${API_URL}/${ccodprs}`, datos);
  return res.data;
};

export const eliminarTrabajador = async (ccodprs) => {
  const res = await axios.delete(`${API_URL}/${ccodprs}`);
  return res.data;
};

export const cargarTrabajadoresExcel = async (archivo) => {
  const formData = new FormData();
  formData.append("archivo", archivo);

  const res = await axios.post(`${API_URL}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};