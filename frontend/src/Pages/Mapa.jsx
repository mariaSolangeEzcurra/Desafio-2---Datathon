import { useEffect, useState } from "react";
import {
  obtenerMapaConexiones,
  obtenerMapaActividades,
  obtenerMapaImpedimentos,
  obtenerMapaAlertas,
  obtenerMapaOverview,
  obtenerMapaImpedimentosHeatmap,
} from "../services/mapaService";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat"; // Plugin nativo de calor
import "leaflet/dist/leaflet.css";

// Fix íconos por defecto
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Íconos personalizados
const iconoRojo = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const iconoVerde = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const iconoAmarillo = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// --- NUEVO COMPONENTE HEATMAP COMPATIBLE CON REACT 19 ---
function HeatmapLayer({
  points,
  longitudeExtractor,
  latitudeExtractor,
  intensityExtractor,
  radius = 25,
  blur = 15,
  max = 10,
}) {
  const map = useMap();

  useEffect(() => {
    // 1. Mensaje de diagnóstico para saber si el componente se activa
    console.log("Cargando HeatmapLayer. ¿Hay puntos?:", points ? points.length : 0);
    console.log("Datos crudos de impedimentosHeatmap:", points);

    if (!map || !points || points.length === 0) return;

    try {
      const heatPoints = points.map((p) => {
        const lat = latitudeExtractor ? latitudeExtractor(p) : p[0];
        const lon = longitudeExtractor ? longitudeExtractor(p) : p[1];
        const intensity = intensityExtractor ? intensityExtractor(p) : (p[2] ?? 1);
        return [lat, lon, intensity];
      });

      console.log("Coordenadas procesadas para el mapa de calor:", heatPoints);

      const heatLayer = L.heatLayer(heatPoints, {
        radius: radius,
        blur: blur,
        maxZoom: 17,
        max: max,
      });

      heatLayer.addTo(map);

      return () => {
        console.log("Removiendo capa de calor...");
        if (map.hasLayer(heatLayer)) {
          map.removeLayer(heatLayer);
        }
      };
    } catch (e) {
      console.error("Error procesando puntos en Heatmap:", e);
    }
  }, [map, points, longitudeExtractor, latitudeExtractor, intensityExtractor, radius, blur, max]);

  return null;
}
// --------------------------------------------------------

export default function Mapa() {
  const [conexiones, setConexiones] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [impedimentos, setImpedimentos] = useState([]);
  const [impedimentosHeatmap, setImpedimentosHeatmap] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [overview, setOverview] = useState({});
  const [modo, setModo] = useState("marcadores"); // "marcadores" o "heatmap"

  useEffect(() => {
    obtenerMapaConexiones().then(setConexiones);
    obtenerMapaActividades().then(setActividades);
    obtenerMapaImpedimentos().then(setImpedimentos);
    obtenerMapaAlertas().then(setAlertas);
    obtenerMapaOverview().then(setOverview);
    obtenerMapaImpedimentosHeatmap().then(setImpedimentosHeatmap);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Mapa GIS</h1>
      <p className="mb-4">Overview: {JSON.stringify(overview)}</p>

      {/* Selector de modo */}
      <div className="mb-4">
        <label className="mr-2 font-semibold">Visualización:</label>
        <select
          value={modo}
          onChange={(e) => setModo(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="marcadores">Marcadores</option>
          <option value="heatmap">Mapa de calor (impedimentos)</option>
        </select>
      </div>

      <MapContainer center={[-16.4, -71.5]} zoom={12} style={{ height: "500px", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {modo === "marcadores" && (
          <>
            {/* Conexiones */}
            {conexiones.map(c => (
              <Marker
                key={c.codigo_suministro}
                position={[c.latitud, c.longitud]}
                icon={c.estado_servicio === "Activo" ? iconoVerde : iconoRojo}
              >
                <Popup>
                  Conexión {c.codigo_suministro} <br />
                  Estado: {c.estado_servicio}
                </Popup>
              </Marker>
            ))}

            {/* Actividades */}
            {actividades.map(a => (
              <Marker
                key={a.actividad_id}
                position={[a.gps_trabajador_lat, a.gps_trabajador_lon]}
                icon={a.estado === "Pendiente" ? iconoAmarillo : iconoVerde}
              >
                <Popup>
                  Actividad {a.actividad_id} <br />
                  Estado: {a.estado}
                </Popup>
              </Marker>
            ))}

            {/* Impedimentos */}
            {impedimentos.map(i => (
              <Marker
                key={i.impedimento_id}
                position={[i.latitud, i.longitud]}
                icon={iconoRojo}
              >
                <Popup>
                  Impedimento {i.impedimento_id} <br />
                  Categoría: {i.categoria} <br />
                  {i.descripcion}
                </Popup>
              </Marker>
            ))}

            {/* Alertas */}
            {alertas.map(al => (
              <Marker
                key={al.alerta_id}
                position={[-16.4, -71.5]} // usar lat/lon real si lo tienes
                icon={iconoAmarillo}
              >
                <Popup>
                  Alerta {al.alerta_id} <br />
                  Nivel: {al.nivel}
                </Popup>
              </Marker>
            ))}
          </>
        )}

        {modo === "heatmap" && (
          <HeatmapLayer
            points={impedimentosHeatmap}
            longitudeExtractor={p => p.lon}
            latitudeExtractor={p => p.lat}
            intensityExtractor={p => p.count}
            max={10}
            radius={25}
            blur={15}
          />
        )}
      </MapContainer>
    </div>
  );
}