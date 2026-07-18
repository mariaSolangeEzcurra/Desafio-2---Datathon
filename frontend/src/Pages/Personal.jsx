import React, { useMemo, useState } from "react";

export default function PersonalResponsable({ actividadesTotales, procesoActivo, mapaProcesos }) {
  // Estado local para controlar el modal de auditoría
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState(null);

  // useMemo se encarga de agrupar, calcular la criticidad y ordenar al personal
  const personalProcesado = useMemo(() => {
    if (!Array.isArray(actividadesTotales) || actividadesTotales.length === 0) {
      return [];
    }

    // 1. Obtener el nombre del proceso real en la API (ej: "Lectura Comercial", "Corte")
    const tipoBuscado = mapaProcesos[procesoActivo] || procesoActivo || "Lectura Comercial";
    const tipoBuscadoLimpio = tipoBuscado.trim().toLowerCase();

    // 2. Filtrar actividades SOLO para el proceso que está visualizando el usuario
    const actividadesDelProceso = actividadesTotales.filter((act) => {
      if (!act || !act.tipo_actividad) return false;
      return act.tipo_actividad.trim().toLowerCase() === tipoBuscadoLimpio;
    });

    // 3. Agrupar y calcular las métricas por técnico adaptado a tu Base de Datos
    const resumen = {};

    actividadesDelProceso.forEach((act) => {
      let identificadorTecnico = act.tecnico || act.operario || act.nombre_usuario;
      
      if (!identificadorTecnico && act.cCodPrs) {
        identificadorTecnico = `Operario Código: ${String(act.cCodPrs).trim()}`;
      }
      
      const nombreFinal = identificadorTecnico || "Técnico No Asignado";
      const contratista = act.contratista || act.empresa || "Propio";

      if (!resumen[nombreFinal]) {
        resumen[nombreFinal] = {
          nombre: nombreFinal,
          empresa: contratista,
          total: 0,
          completados: 0,
          impedimentos: 0,
          detallesImpedimentos: []
        };
      }

      resumen[nombreFinal].total += 1;
      
      // Validar si la orden está completada exitosamente
      const estadoLimpio = String(act.estado || "").trim().toLowerCase();
      const resultadoLimpio = String(act.resultado || "").trim().toLowerCase();
      const impLecLimpio = String(act.cImpLec || "").trim();

      if (estadoLimpio === "completado" || estadoLimpio === "ok" || (act.nLecAct && Number(act.nLecAct) > 0)) {
        resumen[nombreFinal].completados += 1;
      }
      
      // 🚨 CONTROL DE ALERTAS CRÍTICAS (Sincronizado con el Mapa)
      const tieneImpedimento = 
        (impLecLimpio !== "" && impLecLimpio !== "00" && impLecLimpio !== "0") || 
        estadoLimpio.includes("inconcluso") || 
        estadoLimpio.includes("impedimento") ||
        estadoLimpio.includes("critico") ||
        resultadoLimpio.includes("fuera de radio") ||
        resultadoLimpio.includes("anomalia") ||
        resultadoLimpio.includes("alerta") ||
        resultadoLimpio.includes("falla");

      if (tieneImpedimento) {
        resumen[nombreFinal].impedimentos += 1;
        
        // Extraer identificador único del suministro afectado
        const idSuministro = act.cCodCnx || act.id_orden || act.orden || act.suministro || "N/A";
        
        // Extraer la descripción exacta del error para mostrarla en el modal
        const motivoFalla = 
          act.txtImpedimento || 
          act.motivo_impedimento || 
          act.resultado || 
          act.estado || 
          `Código de Impedimento: ${impLecLimpio}`;

        resumen[nombreFinal].detallesImpedimentos.push({
          idOrden: idSuministro,
          motivo: motivoFalla
        });
      }
    });

    // 4. Convertir a Array, calcular alertas y ordenar de forma estable
    return Object.values(resumen)
      .map((tecnico) => {
        const porcEficiencia = Math.round((tecnico.completados / tecnico.total) * 100) || 0;
        const porcImpedimentos = Math.round((tecnico.impedimentos / tecnico.total) * 100) || 0;

        // REGLA DE CRITICIDAD AUTOMÁTICA
        const estaCritico = porcEficiencia < 50 || porcImpedimentos > 30 || tecnico.impedimentos > 0;

        return {
          ...tecnico,
          eficiencia: porcEficiencia,
          porcentajeImpedimentos: porcImpedimentos,
          critico: estaCritico
        };
      })
      .sort((a, b) => {
        // Ordenamiento estable: Verdaderos (críticos) van primero
        if (a.critico && !b.critico) return -1;
        if (!a.critico && b.critico) return 1;
        // Si ambos tienen el mismo estado, ordenar por mayor número de impedimentos
        return b.impedimentos - a.impedimentos;
      });

  }, [actividadesTotales, procesoActivo, mapaProcesos]);

  return (
    <div className="space-y-4 mt-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">👷 Personal Asignado (Control de Criticidad)</h3>
            <p className="text-xs text-slate-400">
              Ordenados automáticamente por nivel de alerta operativa en: <span className="font-bold text-blue-600">{procesoActivo}</span>
            </p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-mono">
            {personalProcesado.length} Operarios activos
          </span>
        </div>

        {personalProcesado.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            No hay personal registrado trabajando en {procesoActivo} en este momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="pb-3">Nombre / Código del Técnico</th>
                  <th className="pb-3">Contratista / Empresa</th>
                  <th className="pb-3 text-center">Asignadas</th>
                  <th className="pb-3 text-center">Ejecutadas</th>
                  <th className="pb-3 text-center">Impedimentos</th>
                  <th className="pb-3 text-center">Eficiencia</th>
                  <th className="pb-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {personalProcesado.map((person) => {
                  return (
                    <tr 
                      key={person.nombre} 
                      onClick={() => setTecnicoSeleccionado(person)}
                      className="transition-colors cursor-pointer hover:bg-slate-50/80"
                    >
                      <td className="py-3.5 font-medium text-slate-800 flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0 ${
                          person.critico ? "bg-red-100 text-red-600 animate-pulse" : "bg-blue-50 text-blue-600"
                        }`}>
                          {person.nombre.replace("Operario Código: ", "").substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-blue-600 hover:underline font-semibold">
                          {person.nombre}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500 font-mono text-[11px]">{person.empresa}</td>
                      <td className="py-3.5 text-center font-bold text-slate-700">{person.total}</td>
                      <td className="py-3.5 text-center text-green-600 font-semibold">{person.completados}</td>
                      <td className="py-3.5 text-center text-amber-600 font-semibold">{person.impedimentos}</td>
                      <td className="py-3.5 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          person.eficiencia > 85 ? "bg-green-50 text-green-700" : person.eficiencia > 50 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"
                        }`}>
                          {person.eficiencia}%
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        {person.critico ? (
                          <span className="px-2 py-1 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wide shadow-sm">
                            🚨 Crítico
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 text-[10px] font-medium uppercase tracking-wide">
                            Estable
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🔮 MODAL FLOTANTE DE DETALLE DE CRITICIDAD */}
      {tecnicoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setTecnicoSeleccionado(null)}></div>
          
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl relative z-10 overflow-hidden transform transition-all">
            
            <div className={`p-5 border-b border-slate-100 flex justify-between items-start ${
              tecnicoSeleccionado.critico ? 'bg-gradient-to-r from-red-50/50 to-white' : 'bg-gradient-to-r from-blue-50/50 to-white'
            }`}>
              <div>
                <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                  tecnicoSeleccionado.critico ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  Auditoría de Control Operativo
                </span>
                <h4 className="text-base font-bold text-slate-800 mt-1.5">
                  Análisis: <span className="text-blue-600">{tecnicoSeleccionado.nombre}</span>
                </h4>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Empresa: {tecnicoSeleccionado.empresa}</p>
              </div>
              <button 
                onClick={() => setTecnicoSeleccionado(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 h-7 w-7 rounded-full flex items-center justify-center font-medium transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Asignadas</p>
                  <p className="text-lg font-extrabold text-slate-700 mt-0.5">{tecnicoSeleccionado.total}</p>
                </div>
                <div className="bg-green-50/40 border border-green-100 p-3 rounded-xl text-center">
                  <p className="text-green-600 text-[10px] uppercase font-bold tracking-wider">Eficiencia</p>
                  <p className="text-lg font-extrabold text-green-600 mt-0.5">{tecnicoSeleccionado.eficiencia}%</p>
                </div>
                <div className={`border p-3 rounded-xl text-center ${
                  tecnicoSeleccionado.impedimentos > 0 ? 'bg-red-50/40 border-red-100' : 'bg-amber-50/40 border-amber-100'
                }`}>
                  <p className={`text-[10px] uppercase font-bold tracking-wider ${
                    tecnicoSeleccionado.impedimentos > 0 ? 'text-red-600' : 'text-amber-600'
                  }`}>Impedimentos</p>
                  <p className={`text-lg font-extrabold mt-0.5 ${
                    tecnicoSeleccionado.impedimentos > 0 ? 'text-red-600' : 'text-amber-600'
                  }`}>{tecnicoSeleccionado.impedimentos}</p>
                </div>
              </div>

              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                tecnicoSeleccionado.critico 
                  ? 'bg-red-50/60 border-red-100 text-red-800' 
                  : 'bg-emerald-50/60 border-emerald-100 text-emerald-800'
              }`}>
                <span className="text-sm">{tecnicoSeleccionado.critico ? "⚠️" : "✅"}</span>
                <div>
                  <p className="font-bold">Diagnóstico Automatizado del Sistema</p>
                  <p className="opacity-90 mt-0.5">
                    {tecnicoSeleccionado.critico 
                      ? "Alerta operativa encendida. El operario registra anomalías de campo o un rendimiento inferior al promedio esperado."
                      : "Flujo de actividades estable. El rendimiento se mantiene dentro de los márgenes corporativos aceptables."}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700 mb-2.5">Detalle de Anomalías / Impedimentos Detectados</p>
                {tecnicoSeleccionado.detallesImpedimentos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-4 border border-slate-100 rounded-xl text-center">
                    El operario no presenta incidencias de campo. Su baja efectividad responde netamente a órdenes en cola pendientes por iniciar.
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                    {tecnicoSeleccionado.detallesImpedimentos.map((imp, i) => (
                      <div key={i} className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center text-xs shadow-xs">
                        <span className="font-mono text-blue-600 font-bold">Suministro #{imp.idOrden}</span>
                        <span className="text-red-600 bg-red-50 font-semibold px-2 py-0.5 rounded text-[11px] max-w-[240px] truncate">
                          {imp.motivo}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setTecnicoSeleccionado(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
              >
                Entendido, Cerrar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}