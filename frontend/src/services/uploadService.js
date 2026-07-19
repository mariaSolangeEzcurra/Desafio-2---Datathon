import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 15000,
});

export const uploadService = {
  uploadArchivo: async (file, proceso) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('proceso', proceso);
    console.log("Enviando archivo:", file.name, "al proceso:", proceso);
    const response = await api.post('/upload-excel', formData, {
      timeout: 120000, // 2 min
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getHistorial: async () => {
    const response = await api.get('/historial');
    return response.data;
  }
};