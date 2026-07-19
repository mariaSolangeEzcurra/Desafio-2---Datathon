const API_URL = "http://localhost:8000/api/mapa";

// Conexiones
export async function obtenerMapaConexiones() {
  const res = await fetch(`${API_URL}/conexiones`);
  return await res.json();
}

// Actividades
export async function obtenerMapaActividades() {
  const res = await fetch(`${API_URL}/actividades`);
  return await res.json();
}

// Impedimentos
export async function obtenerMapaImpedimentos() {
  const res = await fetch(`${API_URL}/impedimentos`);
  return await res.json();
}

// Alertas
export async function obtenerMapaAlertas() {
  const res = await fetch(`${API_URL}/alertas`);
  return await res.json();
}

// Overview general
export async function obtenerMapaOverview() {
  const res = await fetch(`${API_URL}/overview`);
  return await res.json();
}

// Impedimentos Heatmap
export async function obtenerMapaImpedimentosHeatmap() {
  const res = await fetch(`${API_URL}/impedimentos_heatmap`);
  return await res.json();
}
