import React, { useState, useEffect } from "react";
import MapaRutas from "../pages/MapaRutas";

export default function Dashboard({ idSeleccionado }) {

  // ============================================================
  // FECHA ACTUAL
  // ============================================================
  const obtenerFechaHoy = () => {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const hoy = obtenerFechaHoy();


  // ============================================================
  // ESTADOS
  // ============================================================
  const [dashboard, setDashboard] = useState({
    resumen_general: {},
    ranking_lectores: [],
  });

  const [listaActividades, setListaActividades] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  // Carga inicial: HOY
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);

  const [kpiHover, setKpiHover] = useState(null);


  // ============================================================
  // VISTA ACTIVA
  // ============================================================
  const [prefijo, vistaActiva] = idSeleccionado
    ? idSeleccionado.split("_")
    : ["lecturas", "resumen"];


  // ============================================================
  // CARGAR DASHBOARD
  // ============================================================
  const cargarDashboard = async () => {

    // Validar rango de fechas
    if (
      fechaInicio &&
      fechaFin &&
      fechaFin < fechaInicio
    ) {
      setError(
        "La fecha fin no puede ser anterior a la fecha de inicio."
      );

      return;
    }

    setLoading(true);
    setError(null);

    try {

      const params = new URLSearchParams();

      if (fechaInicio) {
        params.append(
          "fecha_inicio",
          fechaInicio
        );
      }

      if (fechaFin) {
        params.append(
          "fecha_fin",
          fechaFin
        );
      }


      const response = await fetch(
        `http://localhost:8000/lectura/kpis/dashboard?${params.toString()}`
      );


      if (!response.ok) {
        throw new Error(
          "Error obteniendo dashboard"
        );
      }


      const data = await response.json();


      console.log(
        "Dashboard recibido:",
        data
      );


      setDashboard(data);

      // Actualmente no existe endpoint
      // para obtener actividades individuales.
      setListaActividades([]);


    } catch (err) {

      console.error(err);

      setError(
        "No se pudo cargar el dashboard."
      );

    } finally {

      setLoading(false);

    }
  };


  // ============================================================
  // ACTUALIZAR DASHBOARD AL CAMBIAR FECHAS
  // ============================================================
  useEffect(() => {

    cargarDashboard();

  }, [fechaInicio, fechaFin]);


  // ============================================================
  // RESUMEN
  // ============================================================
  const resumen =
    dashboard.resumen_general || {};


  // ============================================================
  // DEFINICIÓN DE KPIs
  // ============================================================
  const metrics = {

    cumplimiento: {
      nombre: "Cumplimiento",
      valor: `${resumen.cumplimiento_lectura ?? 0}%`,
      descripcion:
        "Porcentaje de lecturas realizadas respecto a las lecturas programadas.",
      formula:
        "(Lecturas realizadas / Lecturas programadas) × 100",
      datos:
        "total_lecturas_realizadas y total_lecturas_programadas",
    },


    productividad: {
      nombre: "Productividad",
      valor: `${resumen.productividad_lectura ?? 0}/h`,
      descripcion:
        "Cantidad promedio de lecturas realizadas por cada hora trabajada.",
      formula:
        "Lecturas realizadas / horas trabajadas",
      datos:
        "productividad_lectura",
    },


    impedimentos: {
      nombre: "Impedimentos",
      valor: `${resumen.impedimentos_lectura ?? 0}%`,
      descripcion:
        "Porcentaje de lecturas que presentaron algún impedimento.",
      formula:
        "(Impedimentos / Lecturas realizadas) × 100",
      datos:
        "impedimentos_lectura",
    },


    observaciones: {
      nombre: "Observaciones",
      valor: `${resumen.observaciones_lectura ?? 0}%`,
      descripcion:
        "Porcentaje de lecturas que registraron observaciones.",
      formula:
        "(Observaciones / Lecturas realizadas) × 100",
      datos:
        "observaciones_lectura",
    },


    coberturaGps: {
      nombre: "Cobertura geográfica",
      valor: `${resumen.cobertura_georreferenciada ?? 0}%`,
      descripcion:
        "Porcentaje de actividades que cuentan con georreferenciación válida.",
      formula:
        "(Actividades georreferenciadas / Total actividades) × 100",
      datos:
        "cobertura_georreferenciada",
    },


    fueraDeRadio: {
      nombre: "Fuera de punto",
      valor:
        resumen.actividades_fuera_de_punto ?? 0,
      descripcion:
        "Cantidad de actividades realizadas fuera del radio geográfico permitido.",
      formula:
        "Conteo de actividades fuera del punto permitido",
      datos:
        "actividades_fuera_de_punto",
    },

  };


  // ============================================================
  // RENDER
  // ============================================================
  return (

    <div className="space-y-7 text-left">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {loading && (

          <div className="flex items-center gap-2 text-xs text-slate-400">

            <span className="w-2 h-2 rounded-full bg-[#006cb7] animate-pulse" />

            Actualizando indicadores...

          </div>

        )}

      </div>



      {/* ======================================================
          FILTROS
      ======================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">

        <div className="flex flex-col md:flex-row md:items-end gap-4">


          {/* FECHA INICIO */}
          <div className="flex flex-col gap-1.5">

            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">

              Fecha inicio

            </label>

            <input
              type="date"
              value={fechaInicio}
              onChange={(e) =>
                setFechaInicio(e.target.value)
              }
              className="h-10 border border-slate-200 rounded-xl px-3 text-sm text-slate-700 outline-none focus:border-[#006cb7] focus:ring-2 focus:ring-[#006cb7]/10 transition"
            />

          </div>



          {/* FECHA FIN */}
          <div className="flex flex-col gap-1.5">

            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">

              Fecha fin

            </label>

            <input
              type="date"
              value={fechaFin}
              min={fechaInicio || undefined}
              onChange={(e) =>
                setFechaFin(e.target.value)
              }
              className={`h-10 border rounded-xl px-3 text-sm text-slate-700 outline-none transition ${
                fechaInicio &&
                fechaFin &&
                fechaFin < fechaInicio
                  ? "border-rose-400 bg-rose-50"
                  : "border-slate-200 focus:border-[#006cb7] focus:ring-2 focus:ring-[#006cb7]/10"
              }`}
            />

          </div>

        </div>

      </div>



      {/* ======================================================
          ERROR DE FECHAS
      ======================================================= */}
      {fechaInicio &&
        fechaFin &&
        fechaFin < fechaInicio && (

          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">

            <p className="text-sm font-semibold text-rose-700">

              Rango de fechas inválido

            </p>

            <p className="text-xs text-rose-600 mt-1">

              La fecha fin no puede ser anterior a la
              fecha de inicio.

            </p>

          </div>

        )}



      {/* ======================================================
          ERROR API
      ======================================================= */}
      {error &&
        !(
          fechaInicio &&
          fechaFin &&
          fechaFin < fechaInicio
        ) && (

          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">

            <p className="text-sm text-rose-700">

              {error}

            </p>

          </div>

        )}



      {/* ======================================================
          KPIs
      ======================================================= */}
      {vistaActiva === "resumen" && (
        <>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-700">
                  Indicadores principales
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Resumen del rendimiento de lecturas
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.entries(metrics).map(
                ([key, kpi]) => (
                  <div
                    key={key}
                    onMouseEnter={() =>
                      setKpiHover(key)
                    }
                    onMouseLeave={() =>
                      setKpiHover(null)
                    }
                    className="relative bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-help"
                  >
                    {/* PEQUEÑO INDICADOR */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {kpi.nombre}
                      </span>
                    </div>

                    {/* VALOR */}
                    <div className="mt-3">
                      <span className="text-2xl font-bold tracking-tight text-slate-800">
                        {kpi.valor}
                      </span>

                    </div>


                    {/* LÍNEA INFERIOR */}
                    {kpiHover === key && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-2">
                        <div className="bg-slate-800 rounded-xl p-4 shadow-2xl">
                          <p className="text-xs font-bold text-white mb-2">
                            {kpi.nombre}
                          </p>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {kpi.descripcion}
                          </p>
                          <div className="border-t border-slate-700 mt-3 pt-3">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              Fórmula
                            </p>
                            <p className="text-[10px] text-white mt-1 leading-relaxed">
                              {kpi.formula}
                            </p>
                          </div>

                          <div className="border-t border-slate-700 mt-3 pt-3">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              Datos utilizados
                            </p>
                            <p className="text-[10px] text-white mt-1 leading-relaxed">
                              {kpi.datos}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                )
              )}

            </div>

          </div>



          {/* ====================================================
              RANKING
          ===================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            <div className="p-5 border-b border-slate-100">

              <h2 className="text-sm font-bold text-slate-700">

                Ranking de Lectores

              </h2>

              <p className="text-xs text-slate-400 mt-1">

                Rendimiento de los lectores durante el período seleccionado

              </p>

            </div>


            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>

                  <tr className="bg-slate-50 border-b border-slate-100">

                    <th className="text-left p-3 text-[10px] uppercase tracking-wide font-bold text-slate-400">

                      Código

                    </th>

                    <th className="text-left p-3 text-[10px] uppercase tracking-wide font-bold text-slate-400">

                      Nombre

                    </th>

                    <th className="text-center p-3 text-[10px] uppercase tracking-wide font-bold text-slate-400">

                      Lecturas

                    </th>

                    <th className="text-center p-3 text-[10px] uppercase tracking-wide font-bold text-slate-400">

                      Eficiencia

                    </th>

                    <th className="text-center p-3 text-[10px] uppercase tracking-wide font-bold text-slate-400">

                      Min/Lectura

                    </th>

                  </tr>

                </thead>


                <tbody>

                  {dashboard.ranking_lectores?.length > 0 ? (

                    dashboard.ranking_lectores.map(
                      (r) => (

                        <tr
                          key={r.ccodprs}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition"
                        >

                          <td className="p-3 font-semibold text-[#006cb7]">

                            {r.ccodprs}

                          </td>

                          <td className="p-3 text-slate-700">

                            {r.nombre}

                          </td>

                          <td className="text-center p-3 font-medium text-slate-700">

                            {r.total_lecturas}

                          </td>

                          <td className="text-center p-3 font-medium text-slate-700">

                            {r.eficiencia_promedio}%

                          </td>

                          <td className="text-center p-3 text-slate-600">

                            {r.promedio_min_por_lectura}

                          </td>

                        </tr>

                      )
                    )

                  ) : (

                    <tr>

                      <td
                        colSpan="5"
                        className="p-8 text-center text-slate-400 text-xs"
                      >

                        No hay datos de lectores para
                        el período seleccionado.

                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </>

      )}



      {/* ======================================================
          MAPA
      ======================================================= */}
      {vistaActiva === "mapa" && (

        <MapaRutas
          actividadesTotales={
            listaActividades
          }
        />

      )}

    </div>

  );
}