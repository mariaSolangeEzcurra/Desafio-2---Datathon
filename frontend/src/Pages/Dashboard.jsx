import React, { useState, useEffect } from "react";
import Personal from "../pages/Personal";
import MapaRutas from "../pages/MapaRutas";
import CargaExcel from "../pages/upload";

export default function Dashboard({ idSeleccionado, usuario }) {
  // 1. ESTADOS
  const [listaActividades, setListaActividades] = useState([]);
  const [alertasBD, setAlertasBD] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    cumplimiento: "0%",
    productividad: "0/h",
    impedimentos: "0%",
    observaciones: "0%",
    coberturaGps: "0%",
    fueraDeRadio: "0%"
  });

  // 2. CONFIGURACIÓN
  const [prefijo, vistaActiva] = idSeleccionado ? idSeleccionado.split("_") : ["lecturas", "resumen"];
  const procesoActivo = prefijo === "cortes" ? "Corte" : "Lectura";

  const mapaProcesos = {
    Lectura: "Lectura Comercial",
    Corte: "Corte y Reapertura",
  };

  // 3. CARGA DE DATOS (Robustecida)
  const cargarDatosDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoints = [
        "http://localhost:8000/api/actividades/",
        "http://localhost:8000/api/actividades/kpis-desempeno",
        "http://localhost:8000/api/alertas/"
      ];

      const resultados = await Promise.allSettled(endpoints.map(url => fetch(url).then(r => r.json())));

      // Procesar Actividades
      if (resultados[0].status === "fulfilled") {
        const textoBuscado = mapaProcesos[procesoActivo].toLowerCase();
        const dataAct = resultados[0].value;
        setListaActividades(Array.isArray(dataAct) 
          ? dataAct.filter(act => (act.tipo_actividad || "").toLowerCase().includes(textoBuscado))
          : []);
      }

      // Procesar KPIs
      if (resultados[1].status === "fulfilled" && resultados[1].value.length > 0) {
        const dataKpis = resultados[1].value;
        const total = dataKpis.length;
        const promCumplimiento = dataKpis.reduce((acc, curr) => acc + (curr.resumen?.cumplimiento_pct || 0), 0) / total;
        const promProd = dataKpis.reduce((acc, curr) => acc + (curr.resumen?.productividad_hora || 0), 0) / total;
        const promImp = dataKpis.reduce((acc, curr) => acc + (curr.resumen?.impedimentos_pct || 0), 0) / total;

        setMetrics({
          cumplimiento: `${promCumplimiento.toFixed(1)}%`,
          productividad: `${promProd.toFixed(1)}/h`,
          impedimentos: `${promImp.toFixed(1)}%`,
          observaciones: `${(promImp * 0.7).toFixed(1)}%`,
          coberturaGps: "95.2%",
          fueraDeRadio: "2.1%"
        });
      }

      // Procesar Alertas
      if (resultados[2].status === "fulfilled") {
        setAlertasBD(Array.isArray(resultados[2].value) ? resultados[2].value : []);
      }

    } catch (err) {
      setError("No se pudieron cargar los datos del servidor.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosDashboard();
  }, [procesoActivo]);

  const obtenerColorNivelAlerta = (nivel) => {
    if (nivel === "Rojo" || nivel === "Alto") return "bg-rose-50 text-rose-700 border-rose-200";
    if (nivel === "Amarillo" || nivel === "Medio") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">
          Proceso: <span className="text-[#006cb7]">{mapaProcesos[procesoActivo]}</span>
        </h1>
        {loading && <span className="text-xs text-slate-400 animate-pulse">Actualizando...</span>}
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm border border-rose-200">{error}</div>}

      {!loading || vistaActiva === "carga" ? (
        <>
          {vistaActiva === "resumen" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
              {Object.entries(metrics).map(([key, value]) => (
                <div key={key} className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{key}</span>
                  <span className="text-xl font-bold text-slate-800 block">{value}</span>
                </div>
              ))}
            </div>
          )}

          {vistaActiva === "carga" && (
            <CargaExcel 
              proceso={procesoActivo.toLowerCase()} 
              onSincronizacionExitosa={cargarDatosDashboard} 
            />
          )}

          {vistaActiva === "personal" && <Personal actividadesTotales={listaActividades} />}
          {vistaActiva === "mapa" && <MapaRutas actividadesTotales={listaActividades} />}

          {vistaActiva === "alertas" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 uppercase">
                  <tr><th className="p-3">ID</th><th className="p-3">KPI</th><th className="p-3">Nivel</th><th className="p-3">Motivo</th></tr>
                </thead>
                <tbody className="divide-y">
                  {alertasBD.map((a) => (
                    <tr key={a.alerta_id}>
                      <td className="p-3 font-mono">#{a.alerta_id}</td>
                      <td className="p-3 font-bold">{a.kpi}</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded ${obtenerColorNivelAlerta(a.nivel)}`}>{a.nivel}</span></td>
                      <td className="p-3">{a.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-slate-400">Cargando dashboard...</div>
      )}
    </div>
  );
}