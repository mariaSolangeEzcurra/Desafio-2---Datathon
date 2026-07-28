import { useEffect, useState } from "react";
import {
  Users,
  Eye,
  AlertTriangle,
  CheckCircle,
  X,
  Info,
  Trophy,
  AlertCircle,
  RefreshCw,
  Calendar,
  Activity
} from "lucide-react";
import {
  obtenerPersonal,
  obtenerFichaPersonal,
  calcularDesempeno
} from "../../services/trabajadorService";

export default function TrabajadoresDesempeno() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculando, setCalculando] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [resumen, setResumen] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await obtenerPersonal(0, 100);

      if (!Array.isArray(data) || data.length === 0) {
        setTrabajadores([]);
        setResumen(null);
        return;
      }

      // Orden de prioridad por clasificación / puntaje
      const prioridad = {
        "Crítico": 1,
        "Regular": 2,
        "Bueno": 3,
        "Excelente": 4
      };

      const ordenados = [...data].sort((a, b) => {
        const pA = prioridad[a.ultima_clasificacion] || 99;
        const pB = prioridad[b.ultima_clasificacion] || 99;
        if (pA !== pB) return pA - pB;
        return (a.ultimo_puntaje || 0) - (b.ultimo_puntaje || 0);
      });

      setTrabajadores(ordenados);

      // Obtención segura de métricas destacadas
      const conPuntaje = data.filter((t) => t.ultimo_puntaje !== null);
      const mejorPuntaje = [...conPuntaje].sort(
        (a, b) => (b.ultimo_puntaje || 0) - (a.ultimo_puntaje || 0)
      )[0];
      const menorPuntaje = [...conPuntaje].sort(
        (a, b) => (a.ultimo_puntaje || 0) - (b.ultimo_puntaje || 0)
      )[0];

      setResumen({
        total: data.length,
        criticos: data.filter((t) => t.ultima_clasificacion === "Crítico").length,
        regulares: data.filter((t) => t.ultima_clasificacion === "Regular").length,
        buenos: data.filter((t) => t.ultima_clasificacion === "Bueno").length,
        excelentes: data.filter((t) => t.ultima_clasificacion === "Excelente").length,
        mejorPuntaje,
        menorPuntaje
      });
    } catch (error) {
      console.error("Error cargando trabajadores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEjecutarCalculo = async () => {
    try {
      setCalculando(true);
      await calcularDesempeno();
      await cargarDatos();
    } catch (error) {
      console.error("Error calculando desempeño:", error);
    } finally {
      setCalculando(false);
    }
  };

  const verDetalle = async (trabajador) => {
    const ccodprs = trabajador?.ccodprs || trabajador?.codigo;
    if (!ccodprs) return;

    try {
      setLoadingDetalle(true);
      setMostrarDetalle(true);
      const fichaData = await obtenerFichaPersonal(ccodprs);
      setDetalle(fichaData);
    } catch (error) {
      console.error("Error obteniendo ficha del trabajador:", error);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const colorEstado = (estado) => {
    switch (estado) {
      case "Crítico":
        return "bg-red-100 text-red-700";
      case "Regular":
        return "bg-yellow-100 text-yellow-700";
      case "Bueno":
        return "bg-blue-100 text-blue-700";
      case "Excelente":
        return "bg-green-100 text-green-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* CABECERA CON ACCIÓN DE RECÁLCULO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Gestión de Personal y Asistencia
          </h1>
          <p className="text-sm text-slate-500">
            Supervisión de desempeño general, evaluación operativa y registro de asistencia.
          </p>
        </div>
        <button
          onClick={handleEjecutarCalculo}
          disabled={calculando}
          className="bg-[#006cb7] hover:bg-[#005799] disabled:opacity-50 transition text-white px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm shadow-sm"
        >
          <RefreshCw size={16} className={calculando ? "animate-spin" : ""} />
          {calculando ? "Calculando..." : "Recalcular Desempeño"}
        </button>
      </div>

      {/* ============================
          RESUMEN GENERAL
      ============================= */}
      {resumen && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm text-gray-500">Total personal registrado</p>
              <p className="text-3xl font-bold">{resumen.total}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm font-medium">Críticos</p>
              <p className="text-3xl font-bold text-red-700">{resumen.criticos}</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-700 text-sm font-medium">Regulares</p>
              <p className="text-3xl font-bold">{resumen.regulares}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-700 text-sm font-medium">Buenos / Excelentes</p>
              <p className="text-3xl font-bold">
                {resumen.buenos + resumen.excelentes}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumen.mejorPuntaje && (
              <button
                onClick={() => verDetalle(resumen.mejorPuntaje)}
                className="bg-white border rounded-xl p-4 text-left hover:shadow-lg transition"
              >
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Trophy size={18} className="text-yellow-500" />
                  Mejor desempeño
                </div>
                <p className="mt-2 truncate font-semibold text-slate-700">
                  {resumen.mejorPuntaje.nombre}
                </p>
                <p className="font-bold text-green-600">
                  {resumen.mejorPuntaje.ultimo_puntaje !== null
                    ? `${resumen.mejorPuntaje.ultimo_puntaje} pts`
                    : "Sin puntaje"}
                </p>
              </button>
            )}

            {resumen.menorPuntaje && (
              <button
                onClick={() => verDetalle(resumen.menorPuntaje)}
                className="bg-white border rounded-xl p-4 text-left hover:shadow-lg transition"
              >
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <AlertCircle size={18} className="text-red-500" />
                  Mayor atención requerida
                </div>
                <p className="mt-2 truncate font-semibold text-slate-700">
                  {resumen.menorPuntaje.nombre}
                </p>
                <p className="font-bold text-red-600">
                  {resumen.menorPuntaje.ultimo_puntaje !== null
                    ? `${resumen.menorPuntaje.ultimo_puntaje} pts`
                    : "Sin puntaje"}
                </p>
              </button>
            )}
          </div>
        </>
      )}

      {/* ============================
          TABLA DE TRABAJADORES
      ============================= */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="text-[#006cb7]" />
            <div>
              <h2 className="font-bold text-slate-800">Personal Registrado</h2>
              <p className="text-xs text-gray-500">
                Listado general y estado actual de evaluación operativa SEDAPAR.
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Mostrando {trabajadores.length} registros
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Código</th>
                <th className="p-3">Nombre</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3">Puntaje</th>
                <th className="p-3">Clasificación</th>
                <th className="p-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-500">
                    Cargando lista de personal...
                  </td>
                </tr>
              ) : trabajadores.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-500">
                    No se encontraron registros de personal.
                  </td>
                </tr>
              ) : (
                trabajadores.map((t, index) => (
                  <tr
                    key={t.ccodprs}
                    className={`border-t hover:bg-slate-50 transition ${
                      t.ultima_clasificacion === "Crítico" ? "bg-red-50/40" : ""
                    }`}
                  >
                    <td className="p-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          t.ultima_clasificacion === "Crítico"
                            ? "bg-red-600 text-white"
                            : t.ultima_clasificacion === "Regular"
                            ? "bg-yellow-500 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {index + 1}
                      </div>
                    </td>

                    <td className="p-3 font-mono text-xs font-bold text-slate-600">
                      {t.ccodprs}
                    </td>

                    <td className="p-3 font-semibold text-slate-800">
                      {t.nombre}
                    </td>

                    <td className="p-3 text-gray-500">
                      {t.telefono || "Sin registro"}
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-800">
                        {t.ultimo_puntaje !== null ? `${t.ultimo_puntaje} pts` : "--"}
                      </div>
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${colorEstado(
                          t.ultima_clasificacion
                        )}`}
                      >
                        {t.ultima_clasificacion || "Sin evaluar"}
                      </span>
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => verDetalle(t)}
                        className="bg-[#006cb7] hover:bg-[#005799] transition text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold"
                      >
                        <Eye size={16} />
                        Ficha
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================
          MODAL FICHA EMPLEADO
      ============================= */}
      {mostrarDetalle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[900px] max-h-[90vh] overflow-auto shadow-2xl">
            {/* CABECERA MODAL */}
            <div className="flex justify-between items-start p-6 border-b sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {detalle?.nombre || "Cargando ficha..."}
                </h2>
                <p className="text-gray-500 mt-1 text-sm font-mono">
                  Código: {detalle?.ccodprs || "--"}
                </p>
                <p className="text-gray-500 text-sm">
                  Teléfono: {detalle?.telefono || "No registrado"}
                </p>
              </div>

              <div className="text-right flex items-center gap-4">
                {detalle && (
                  <div>
                    <span
                      className={`px-4 py-1.5 rounded-full font-semibold text-sm ${colorEstado(
                        detalle.ultima_clasificacion
                      )}`}
                    >
                      {detalle.ultima_clasificacion || "Sin evaluar"}
                    </span>
                    <p className="text-3xl font-bold mt-2 text-slate-800">
                      {detalle.ultimo_puntaje !== null ? detalle.ultimo_puntaje : "--"}
                    </p>
                    <p className="text-xs text-gray-500">Último puntaje</p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setMostrarDetalle(false);
                    setDetalle(null);
                  }}
                  className="p-1 hover:bg-slate-100 rounded-lg text-gray-500 transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* CUERPO DEL MODAL */}
            <div className="p-6">
              {loadingDetalle ? (
                <div className="py-12 text-center text-gray-500">
                  Cargando información detallada del trabajador...
                </div>
              ) : detalle ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 border rounded-xl p-4 flex items-center gap-3">
                      <Calendar className="text-[#006cb7]" size={20} />
                      <div>
                        <p className="text-xs text-gray-500">Última evaluación</p>
                        <p className="font-semibold text-slate-700">
                          {detalle.fecha_ultima_evaluacion || "Sin registro"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border rounded-xl p-4 flex items-center gap-3">
                      <AlertTriangle className="text-amber-500" size={20} />
                      <div>
                        <p className="text-xs text-gray-500">Alertas pendientes</p>
                        <p className="font-semibold text-slate-700">
                          {detalle.total_alertas_pendientes ?? 0} alertas
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* HISTORIAL DE ASISTENCIA Y LECTURAS */}
                  <h3 className="font-bold text-lg mb-3 text-slate-800 flex items-center gap-2">
                    <Activity size={18} className="text-[#006cb7]" />
                    Historial de Asistencia y Rendimiento
                  </h3>

                  {!detalle.historial_asistencia ||
                  detalle.historial_asistencia.length === 0 ? (
                    <div className="bg-slate-50 rounded-xl p-4 text-sm text-gray-500 border text-center">
                      No hay registros de asistencia en el historial.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border rounded-xl">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="p-3">Fecha</th>
                            <th className="p-3">Ruta ID</th>
                            <th className="p-3">Lecturas Prog.</th>
                            <th className="p-3">Realizadas</th>
                            <th className="p-3">Eficiencia</th>
                            <th className="p-3">Duración (min)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detalle.historial_asistencia.map((h, i) => (
                            <tr key={i} className="border-t hover:bg-slate-50">
                              <td className="p-3 font-medium">{h.fecha}</td>
                              <td className="p-3 font-mono text-xs">{h.ruta_id || "--"}</td>
                              <td className="p-3">{h.cantidad_lecturas}</td>
                              <td className="p-3">{h.lecturas_realizadas}</td>
                              <td className="p-3 font-bold text-blue-600">
                                {h.eficiencia ? `${(h.eficiencia * 100).toFixed(0)}%` : "--"}
                              </td>
                              <td className="p-3">{h.duracion_total_min || "--"} min</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setMostrarDetalle(false);
                      setDetalle(null);
                    }}
                    className="mt-8 w-full bg-green-600 hover:bg-green-700 transition text-white rounded-xl py-3 font-semibold flex justify-center items-center gap-2 shadow-sm"
                  >
                    <CheckCircle size={18} />
                    Cerrar Ficha
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}