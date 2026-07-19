import React, { useEffect, useState } from "react";
import { obtenerPersonalPorProceso } from "../services/personalService";

export default function Personal({ procesoActivo }) {
  const [personalProcesado, setPersonalProcesado] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState(null);

  useEffect(() => {
    const cargarPersonal = async () => {
      try {
        setLoading(true);
        const data = await obtenerPersonalPorProceso(procesoActivo);
        
        // Mapeo seguro adaptado a la estructura anidada (resumen) del backend
        const trabajadores = Array.isArray(data) ? data.map((item) => {
          const resumen = item.resumen || {};

          return {
            codigo: item.trabajador_id || "N/A",
            // Como el servicio de desempeño usa el ID (ccodprs), usamos un fallback si no viene el campo 'nombre'
            nombre: item.nombre || `Operario ${item.trabajador_id || "S/C"}`,
            empresa: "SEDAPAR",
            supervisor: item.supervisor || "No asignado",
            distrito: item.distrito_base || "No asignado",
            proceso: item.proceso_actual || procesoActivo,
            
            // Extracción de datos desde el objeto 'resumen' del backend
            totalLecturas: resumen.total_lecturas ?? 0,
            lecturasExitosas: resumen.lecturas_exitosas ?? 0,
            cumplimiento: resumen.cumplimiento_pct ?? -1,
            productividad: resumen.productividad_hora ?? 0,
            tiempoPromedio: resumen.tiempo_promedio_min ?? 0,
            impedimentos: resumen.impedimentos_pct ?? 0,
            coberturaGps: resumen.cobertura_gps_pct ?? 0,
            fueraRadio: resumen.fuera_radio_pct ?? 0,
            
            // Atributos de la raíz del objeto
            critico: item.estado_critico ?? false,
            detallesImpedimentos: item.alertas_activas || []
          };
        }) : [];

        setPersonalProcesado(trabajadores);
      } catch (error) {
        console.error("Error al cargar personal:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarPersonal();
  }, [procesoActivo]);

  if (loading) {
    return (
      <div className="text-center py-10 text-slate-500 text-sm">
        Cargando personal...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left">
      <div className="flex justify-between mb-6 items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            👷 Personal Asignado
          </h2>
          <p className="text-sm text-slate-500">
            Proceso: <b className="text-[#006cb7]">{procesoActivo}</b>
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">
            {personalProcesado.length}
          </div>
          <div className="text-xs text-slate-400">Operarios</div>
        </div>
      </div>

      {personalProcesado.length === 0 ? (
        <div className="text-center py-10 text-slate-400 italic">
          No existe personal asignado para este proceso.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-150 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold">
                <th className="p-3">Operario</th>
                <th className="p-3">Distrito</th>
                <th className="p-3">Supervisor</th>
                <th className="p-3 text-center">Total</th>
                <th className="p-3 text-center">Productividad</th>
                <th className="p-3 text-center">GPS</th>
                <th className="p-3 text-center">Impedimentos</th>
                <th className="p-3 text-center">Cumplimiento</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {personalProcesado.map((p) => (
                <tr
                  key={p.codigo}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setTecnicoSeleccionado(p)}
                >
                  <td className="p-3 font-medium text-slate-900">{p.nombre}</td>
                  <td className="p-3">{p.distrito}</td>
                  <td className="p-3">{p.supervisor}</td>
                  <td className="p-3 text-center font-semibold">{p.totalLecturas}</td>
                  <td className="p-3 text-center">{p.productividad.toFixed(2)}/h</td>
                  <td className="p-3 text-center">{p.coberturaGps.toFixed(1)}%</td>
                  <td className="p-3 text-center text-amber-600">{p.impedimentos.toFixed(1)}%</td>
                  <td className="p-3 text-center font-medium">
                    {p.cumplimiento === -1 ? "N/D" : `${p.cumplimiento.toFixed(1)}%`}
                  </td>
                  <td className="p-3 text-center">
                    {p.critico ? (
                      <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-md text-[11px]">
                        🚨 Crítico
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-[11px]">
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DETALLE OPERARIO */}
      {tecnicoSeleccionado && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl border border-slate-100 mx-4">
            <h3 className="font-bold text-lg text-slate-800 mb-4 pb-2 border-b">
              🔎 Detalle del Operario: <span className="text-blue-600">{tecnicoSeleccionado.nombre}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-slate-400 block font-medium">Código</span>
                <span className="text-slate-800 font-mono font-bold text-sm">{tecnicoSeleccionado.codigo}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-slate-400 block font-medium">Distrito Base</span>
                <span className="text-slate-800 font-semibold">{tecnicoSeleccionado.distrito}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-slate-400 block font-medium">Supervisor</span>
                <span className="text-slate-800 font-semibold">{tecnicoSeleccionado.supervisor}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-slate-400 block font-medium">Proceso</span>
                <span className="text-slate-800 font-semibold">{tecnicoSeleccionado.proceso}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-slate-400 block font-medium">Total Asignado</span>
                <span className="text-slate-800 font-bold text-sm">{tecnicoSeleccionado.totalLecturas}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-slate-400 block font-medium">Productividad</span>
                <span className="text-slate-800 font-bold text-sm">{tecnicoSeleccionado.productividad.toFixed(2)}/h</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-slate-400 block font-medium">Cobertura GPS</span>
                <span className="text-slate-800 font-semibold">{tecnicoSeleccionado.coberturaGps.toFixed(1)}%</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-slate-400 block font-medium">Fuera de Radio</span>
                <span className="text-slate-800 font-semibold text-rose-600">{tecnicoSeleccionado.fueraRadio.toFixed(1)}%</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-slate-400 block font-medium">Tiempo Promedio</span>
                <span className="text-slate-800 font-semibold">{tecnicoSeleccionado.tiempoPromedio.toFixed(1)} min</span>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
                🚨 Incidencias / Alertas Activas
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {tecnicoSeleccionado.detallesImpedimentos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">El operario no registra incidencias críticas en el sistema.</p>
                ) : (
                  tecnicoSeleccionado.detallesImpedimentos.map((a, i) => (
                    <div key={i} className="border border-slate-150 rounded-xl p-3 bg-rose-50/30 text-xs">
                      <b className="text-rose-700 block text-[13px]">{a.kpi}</b>
                      <p className="text-slate-600 mt-1">{a.motivo}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 text-right border-t pt-4">
              <button
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                onClick={() => setTecnicoSeleccionado(null)}
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}