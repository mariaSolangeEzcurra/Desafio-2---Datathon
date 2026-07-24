import { useEffect, useState } from "react";
import {
  Users,
  Eye,
  AlertTriangle,
  CheckCircle,
  X,
  Info,
  Trophy,
  AlertCircle
} from "lucide-react";

export default function TrabajadoresDesempeno() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [resumen, setResumen] = useState(null);

  useEffect(() => {
    cargarAlertas();
    cargarRanking();
  }, []);

  const cargarAlertas = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/alertas/");
      if (response.ok) {
        const data = await response.json();
        setAlertas(data);
      }
    } catch (error) {
      console.error("Error alertas", error);
    }
  };

  const cargarRanking = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:8000/api/desempeno/ranking-detallado"
      );
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        setTrabajadores([]);
        setResumen(null);
        return;
      }

      // Orden de urgencia
      const prioridad = {
        "Crítico": 1,
        "Regular": 2,
        "Bueno": 3,
        "Excelente": 4
      };

      const ordenados = [...data].sort(
        (a, b) =>
          (prioridad[a.clasificacion] || 99) - (prioridad[b.clasificacion] || 99) ||
          a.puntaje - b.puntaje
      );

      setTrabajadores(ordenados);

      // Obtención segura de extremos
      const mejorPuntaje = [...data].sort((a, b) => b.puntaje - a.puntaje)[0];
      const menorPuntaje = [...data].sort((a, b) => a.puntaje - b.puntaje)[0];
      const mayorProductividad = [...data].sort(
        (a, b) => (b.kpis?.productividad || 0) - (a.kpis?.productividad || 0)
      )[0];
      const menorProductividad = [...data].sort(
        (a, b) => (a.kpis?.productividad || 0) - (b.kpis?.productividad || 0)
      )[0];

      setResumen({
        total: data.length,
        criticos: data.filter((t) => t.clasificacion === "Crítico").length,
        regulares: data.filter((t) => t.clasificacion === "Regular").length,
        buenos: data.filter((t) => t.clasificacion === "Bueno").length,
        excelentes: data.filter((t) => t.clasificacion === "Excelente").length,
        mejorPuntaje,
        menorPuntaje,
        mayorProductividad,
        menorProductividad
      });
    } catch (error) {
      console.error("Error cargando desempeño", error);
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = async (trabajador) => {
    if (!trabajador?.codigo) return;
    try {
      const response = await fetch(
        `http://localhost:8000/api/desempeno/${trabajador.codigo}/detalle`
      );
      const data = await response.json();

      setDetalle({
        ...data,
        alertasTrabajador: alertas.filter(
          (a) => a.cCodPrs === trabajador.codigo
        )
      });

      setMostrarDetalle(true);
    } catch (error) {
      console.error("Error detalle", error);
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
      default:
        return "bg-green-100 text-green-700";
    }
  };

  const descripcionKPI = {
    cumplimiento:
      "Porcentaje de lecturas realizadas respecto a las lecturas programadas.",
    productividad:
      "Cantidad de lecturas realizadas por cada hora efectiva de trabajo.",
    eficiencia:
      "Promedio de eficiencia obtenido en los reportes cargados.",
    impedimentos:
      "Porcentaje de actividades afectadas por impedimentos registrados.",
    observaciones:
      "Porcentaje de lecturas con observaciones registradas.",
    cobertura:
      "Porcentaje de lecturas con ubicación GPS válida."
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Supervisión de desempeño - Lecturas
        </h1>
        <p className="text-sm text-slate-500">
          Evaluación basada en cumplimiento, productividad, eficiencia, calidad operativa y cobertura GPS.
        </p>
      </div>

      {/* ============================
          RESUMEN GENERAL
      ============================= */}
      {resumen && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white  rounded-xl p-4">
              <p className="text-sm text-gray-500">Total trabajadores</p>
              <p className="text-3xl font-bold">{resumen.total}</p>
            </div>

            <div className="bg-red-50  -red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm">Críticos</p>
              <p className="text-3xl font-bold text-red-700">{resumen.criticos}</p>
            </div>

            <div className="bg-yellow-50  -yellow-200 rounded-xl p-4">
              <p className="text-yellow-700 text-sm">Regulares</p>
              <p className="text-3xl font-bold">{resumen.regulares}</p>
            </div>

            <div className="bg-green-50  -green-200 rounded-xl p-4">
              <p className="text-green-700 text-sm">Buenos / Excelentes</p>
              <p className="text-3xl font-bold">
                {resumen.buenos + resumen.excelentes}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {resumen.mejorPuntaje && (
              <button
                onClick={() => verDetalle(resumen.mejorPuntaje)}
                className="bg-white  rounded-xl p-4 text-left hover:shadow-lg transition"
              >
                <div className="flex items-center gap-2 font-bold">
                  <Trophy size={18} className="text-yellow-500" />
                  Mejor desempeño
                </div>
                <p className="mt-2 truncate">{resumen.mejorPuntaje.nombre}</p>
                <p className="font-bold text-green-600">
                  {resumen.mejorPuntaje.puntaje} pts
                </p>
              </button>
            )}

            {resumen.menorPuntaje && (
              <button
                onClick={() => verDetalle(resumen.menorPuntaje)}
                className="bg-white  rounded-xl p-4 text-left hover:shadow-lg transition"
              >
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle size={18} className="text-red-500" />
                  Mayor atención
                </div>
                <p className="mt-2 truncate">{resumen.menorPuntaje.nombre}</p>
                <p className="font-bold text-red-600">
                  {resumen.menorPuntaje.puntaje} pts
                </p>
              </button>
            )}

            {resumen.mayorProductividad && (
              <button
                onClick={() => verDetalle(resumen.mayorProductividad)}
                className="bg-white  rounded-xl p-4 text-left hover:shadow-lg transition"
              >
                <div className="font-bold">Mayor productividad</div>
                <p className="truncate">{resumen.mayorProductividad.nombre}</p>
                <p className="font-bold text-blue-600">
                  {resumen.mayorProductividad.kpis?.productividad} lect/h
                </p>
              </button>
            )}

            {resumen.menorProductividad && (
              <button
                onClick={() => verDetalle(resumen.menorProductividad)}
                className="bg-white  rounded-xl p-4 text-left hover:shadow-lg transition"
              >
                <div className="font-bold">Menor productividad</div>
                <p className="truncate">{resumen.menorProductividad.nombre}</p>
                <p className="font-bold text-red-600">
                  {resumen.menorProductividad.kpis?.productividad} lect/h
                </p>
              </button>
            )}
          </div>
        </>
      )}

      {/* ============================
          TABLA
      ============================= */}
      <div className="bg-white rounded-2xl  shadow-sm overflow-hidden">
        <div className="p-5 -b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="text-[#006cb7]" />
            <div>
              <h2 className="font-bold">Trabajadores evaluados</h2>
              <p className="text-xs text-gray-500">
                Ordenados automáticamente desde el trabajador con mayor prioridad de atención hasta el de mejor desempeño.
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Mostrando {trabajadores.length} trabajadores
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Trabajador</th>
                <th className="p-3">Puntaje</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Productividad</th>
                <th className="p-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center">
                    Cargando trabajadores...
                  </td>
                </tr>
              ) : trabajadores.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-500">
                    No existen trabajadores registrados.
                  </td>
                </tr>
              ) : (
                trabajadores.map((t, index) => (
                  <tr
                    key={t.codigo}
                    className={`-t hover:bg-slate-50 transition ${
                      t.clasificacion === "Crítico" ? "bg-red-50/40" : ""
                    }`}
                  >
                    <td className="p-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          t.clasificacion === "Crítico"
                            ? "bg-red-600 text-white"
                            : t.clasificacion === "Regular"
                            ? "bg-yellow-500 text-white"
                            : "bg-slate-200"
                        }`}
                      >
                        {index + 1}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold">{t.nombre}</div>
                      <div className="text-xs text-gray-500">
                        Código: {t.codigo}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="relative group w-fit cursor-help">
                        <div className="font-bold">{t.puntaje} pts</div>
                        <div className="text-xs text-gray-500">Puntaje global</div>

                        <div className="absolute hidden group-hover:block z-50 bg-slate-800 text-white rounded-xl shadow-xl w-80 p-4 left-0 top-12 text-xs">
                          <p className="font-bold">¿Por qué obtuvo este puntaje?</p>
                          <p className="mt-2">
                            El puntaje es el resultado de combinar los indicadores de desempeño calculados automáticamente.
                          </p>
                          <ul className="mt-3 space-y-1">
                            <li>• Cumplimiento de lecturas (30%)</li>
                            <li>• Productividad (25%)</li>
                            <li>• Eficiencia del trabajo (15%)</li>
                            <li>• Calidad operativa (15%)</li>
                            <li>• Cobertura GPS (15%)</li>
                          </ul>
                          <p className="mt-3">
                            Mientras mayor sea el puntaje, mejor ha sido el desempeño general del trabajador.
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="relative group w-fit cursor-help">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${colorEstado(
                            t.clasificacion
                          )}`}
                        >
                          {t.clasificacion}
                        </span>

                        <div className="absolute hidden group-hover:block z-50 bg-slate-800 text-white rounded-xl shadow-xl w-72 p-4 left-0 top-10 text-xs">
                          <p className="font-bold">Clasificación del trabajador</p>
                          <p className="mt-2">
                            {t.clasificacion === "Excelente"
                              ? "El trabajador mantiene un rendimiento sobresaliente en prácticamente todos los indicadores evaluados."
                              : t.clasificacion === "Bueno"
                              ? "Presenta un desempeño adecuado, aunque todavía existen indicadores que pueden optimizarse."
                              : t.clasificacion === "Regular"
                              ? "Se detectaron indicadores por debajo del nivel esperado. Se recomienda realizar seguimiento para evitar que el desempeño continúe disminuyendo."
                              : "El trabajador presenta indicadores críticos que requieren atención inmediata del supervisor."}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="relative group cursor-help w-fit">
                        <div className="font-bold">{t.kpis?.productividad}</div>
                        <div className="text-xs text-gray-500">lecturas/h</div>

                        <div className="absolute hidden group-hover:block z-50 bg-slate-800 text-white rounded-xl shadow-xl w-72 p-4 left-0 top-12 text-xs">
                          <p className="font-bold">Productividad</p>
                          <p className="mt-2">
                            Representa el promedio de lecturas realizadas por hora efectiva de trabajo. Una productividad mayor indica un mejor aprovechamiento del tiempo durante la jornada laboral.
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => verDetalle(t)}
                        className="bg-[#006cb7] hover:bg-[#005799] transition text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold"
                      >
                        <Eye size={16} />
                        Detalle
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
          MODAL DETALLE
      ============================= */}
      {mostrarDetalle && detalle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[900px] max-h-[90vh] overflow-auto shadow-2xl">
            {/* CABECERA */}
            <div className="flex justify-between items-start p-6 -b">
              <div>
                <h2 className="text-2xl font-bold">
                  {detalle.trabajador?.nombre}
                </h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Código: {detalle.trabajador?.codigo}
                </p>
                <p className="text-gray-500 text-sm">
                  Supervisor: {detalle.trabajador?.supervisor || "No asignado"}
                </p>
              </div>

              <div className="text-right flex items-center gap-4">
                <div>
                  <span
                    className={`px-4 py-2 rounded-full font-semibold text-sm ${colorEstado(
                      detalle.evaluacion?.clasificacion
                    )}`}
                  >
                    {detalle.evaluacion?.clasificacion}
                  </span>
                  <p className="text-3xl font-bold mt-2 text-slate-800">
                    {detalle.evaluacion?.puntaje}
                  </p>
                  <p className="text-xs text-gray-500">Puntaje final</p>
                </div>

                <button
                  onClick={() => setMostrarDetalle(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-gray-500 transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* CUERPO DEL MODAL */}
            <div className="p-6">
              <div className="bg-slate-50  rounded-xl p-5 mb-6">
                <h3 className="font-bold mb-2">Resumen del desempeño</h3>
                <p className="text-sm text-gray-600 leading-6">
                  La evaluación corresponde al desempeño registrado en las actividades de lectura. El puntaje final considera el cumplimiento de las lecturas programadas, la productividad alcanzada durante la jornada, la eficiencia operativa, la calidad del trabajo (impedimentos y observaciones) y la cobertura GPS obtenida. Mientras más cercano sea el puntaje a <b>100 puntos</b>, mejor es el desempeño general del trabajador.
                </p>
              </div>

              {/* KPIs */}
              <h3 className="font-bold text-lg mb-4">Indicadores evaluados</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(detalle.evaluacion || {})
                  .filter(([key]) => Object.keys(descripcionKPI).includes(key))
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className=" rounded-xl p-4 hover:shadow-md transition group relative"
                    >
                      <div className="flex justify-between items-center">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          {key}
                        </p>
                        <Info size={15} className="text-gray-400" />
                      </div>
                      <p className="text-2xl font-bold mt-3 text-slate-800">
                        {value}
                      </p>

                      <div className="absolute hidden group-hover:block z-50 bg-slate-800 text-white rounded-xl shadow-xl w-64 p-4 top-full mt-2 left-0 text-xs leading-5">
                        <b className="capitalize">{key}</b>
                        <p className="mt-2">{descripcionKPI[key]}</p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* MOTIVOS */}
              <div className="mt-8">
                <h3 className="font-bold flex items-center gap-2 mb-3">
                  <AlertTriangle className="text-red-500" size={18} />
                  Aspectos identificados durante la evaluación
                </h3>
                {detalle.evaluacion?.problemas?.length > 0 ? (
                  detalle.evaluacion.problemas.map((p, index) => (
                    <div
                      key={index}
                      className="-l-4 -red-500 bg-red-50 rounded-lg p-4 mb-3 text-sm text-red-900"
                    >
                      {p}
                    </div>
                  ))
                ) : (
                  <div className="bg-green-50  -green-200 rounded-lg p-4 text-sm text-green-800">
                    No se detectaron observaciones relevantes.
                  </div>
                )}
              </div>

              {/* ALERTAS */}
              <div className="mt-8">
                <h3 className="font-bold mb-4">Alertas registradas</h3>
                {!detalle.alertasTrabajador || detalle.alertasTrabajador.length === 0 ? (
                  <div className="bg-slate-50 rounded-xl  p-4 text-sm text-gray-500">
                    Este trabajador no presenta alertas registradas.
                  </div>
                ) : (
                  detalle.alertasTrabajador.map((a) => (
                    <div
                      key={a.alerta_id}
                      className=" rounded-xl p-4 mb-3 text-sm space-y-1"
                    >
                      <div className="font-semibold text-slate-800">{a.kpi}</div>
                      <p><b>Nivel:</b> {a.nivel}</p>
                      <p><b>Motivo:</b> {a.motivo}</p>
                      <p><b>Estado:</b> {a.estado_alerta}</p>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setMostrarDetalle(false)}
                className="mt-8 w-full bg-green-600 hover:bg-green-700 transition text-white rounded-xl py-3 font-semibold flex justify-center items-center gap-2"
              >
                <CheckCircle size={18} />
                Cerrar revisión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}