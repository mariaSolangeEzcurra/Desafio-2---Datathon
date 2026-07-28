import React, { useState, useEffect } from "react";
import MapaRutas from "../pages/MapaRutas";

export default function Dashboard({ idSeleccionado }) {
  const [dashboard, setDashboard] = useState({
    resumen_general: {},
    ranking_lectores: [],
  });

  const [listaActividades, setListaActividades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [zona, setZona] = useState("");

  const [prefijo, vistaActiva] = idSeleccionado
    ? idSeleccionado.split("_")
    : ["lecturas", "resumen"];

  const procesoActivo =
    prefijo === "cortes"
      ? "Corte y Reapertura"
      : "Lectura Comercial";

  const cargarDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (fechaInicio) params.append("fecha_inicio", fechaInicio);
      if (fechaFin) params.append("fecha_fin", fechaFin);
      if (zona) params.append("zona_id", zona);

      const response = await fetch(
        `http://localhost:8000/lectura/kpis/dashboard?${params}`
      );

      if (!response.ok) {
        throw new Error("Error obteniendo dashboard");
      }

      const data = await response.json();

      setDashboard(data);

      // Si tu mapa utiliza actividades individuales,
      // cuando exista ese endpoint reemplázalo.
      setListaActividades([]);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, [fechaInicio, fechaFin, zona]);

  const resumen = dashboard.resumen_general || {};

  const metrics = {
    cumplimiento: `${resumen.cumplimiento_lectura ?? 0}%`,
    productividad: `${resumen.productividad_lectura ?? 0}/h`,
    impedimentos: `${resumen.impedimentos_lectura ?? 0}%`,
    observaciones: `${resumen.observaciones_lectura ?? 0}%`,
    coberturaGps: `${resumen.cobertura_georreferenciada ?? 0}%`,
    fueraDeRadio: resumen.actividades_fuera_de_punto ?? 0,
  };

  return (
    <div className="space-y-6 text-left">

      <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">
          Proceso:
          <span className="text-[#006cb7] ml-2">
            {procesoActivo}
          </span>
        </h1>

        {loading && (
          <span className="text-xs text-slate-400 animate-pulse">
            Actualizando...
          </span>
        )}
      </div>

      <div className="flex gap-3">
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm"
        />

        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm"
        />

        <input
          placeholder="Zona"
          value={zona}
          onChange={(e) => setZona(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border">
          {error}
        </div>
      )}

      {vistaActiva === "resumen" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {Object.entries(metrics).map(([key, value]) => (
              <div
                key={key}
                className="bg-white p-5 border rounded-2xl shadow-sm"
              >
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {key}
                </span>

                <span className="block text-xl font-bold text-slate-800">
                  {value}
                </span>
              </div>
            ))}

          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6 mt-6">
            <h2 className="font-bold mb-4">
              Ranking de Lectores
            </h2>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Código</th>
                  <th className="text-left p-3">Nombre</th>
                  <th className="text-center p-3">Lecturas</th>
                  <th className="text-center p-3">Eficiencia</th>
                  <th className="text-center p-3">Min/Lectura</th>
                </tr>
              </thead>

              <tbody>
                {dashboard.ranking_lectores?.map((r) => (
                  <tr key={r.ccodprs} className="border-b">
                    <td className="p-3">{r.ccodprs}</td>
                    <td className="p-3">{r.nombre}</td>
                    <td className="text-center p-3">
                      {r.total_lecturas}
                    </td>
                    <td className="text-center p-3">
                      {r.eficiencia_promedio}%
                    </td>
                    <td className="text-center p-3">
                      {r.promedio_min_por_lectura}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {vistaActiva === "mapa" && (
        <MapaRutas actividadesTotales={listaActividades} />
      )}
    </div>
  );
}