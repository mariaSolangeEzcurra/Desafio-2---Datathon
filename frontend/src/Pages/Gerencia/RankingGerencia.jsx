import React, { useEffect, useRef, useState } from "react";
import {
  Trophy,
  Medal,
  Award,
  Users,
  BookOpen,
  TrendingUp,
  Clock3,
  CalendarDays,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  User,
} from "lucide-react";
import { obtenerRankingPersonal } from "../../services/gerenciaService";

// =====================================================
// GERENCIA - RANKING DE PERSONAL
// =====================================================
export default function Ranking() {
  // ===================================================
  // FECHA ACTUAL
  // ===================================================
  const hoy = new Date().toISOString().split("T")[0];

  // ===================================================
  // FILTROS
  // ===================================================
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [cmetfac, setCmetfac] = useState("");
  const [limit, setLimit] = useState(10);

  // ===================================================
  // DATOS
  // ===================================================
  const [ranking, setRanking] = useState([]);
  const [periodo, setPeriodo] = useState(null);
  const [grupoFiltrado, setGrupoFiltrado] = useState("Todos");

  // ===================================================
  // ESTADOS
  // ===================================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Evita que el debounce dispare una carga extra en el
  // primer render (ya se hace la carga inicial aparte).
  const primerRenderRef = useRef(true);

  // ===================================================
  // FORMATEAR NÚMEROS
  // ===================================================
  const formatearNumero = (valor) => {
    if (valor === null || valor === undefined) return "0";
    const numero = Number(valor);
    if (Number.isNaN(numero)) return "0";
    return numero.toLocaleString("es-PE");
  };

  // ===================================================
  // FORMATEAR EFICIENCIA
  // ===================================================
  const formatearEficiencia = (valor) => {
    if (valor === null || valor === undefined) return "0%";
    const numero = Number(valor);
    if (Number.isNaN(numero)) return "0%";
    if (numero > 0 && numero <= 1) {
      return `${(numero * 100).toFixed(1)}%`;
    }
    return `${numero.toFixed(1)}%`;
  };

  // ===================================================
  // FORMATEAR DURACIÓN
  // ===================================================
  const formatearDuracion = (valor) => {
    if (valor === null || valor === undefined) return "0 min";
    const numero = Number(valor);
    if (Number.isNaN(numero)) return `${valor}`;
    if (numero < 60) {
      return `${numero.toFixed(1)} min`;
    }
    const horas = Math.floor(numero / 60);
    const minutos = Math.round(numero % 60);
    return `${horas} h ${minutos} min`;
  };

  // ===================================================
  // VALIDAR FILTROS
  // ===================================================
  const filtrosValidos = () => {
    if (!fechaInicio) {
      setError("Debes seleccionar una fecha de inicio.");
      return false;
    }
    if (fechaFin && fechaFin < fechaInicio) {
      setError(
        "La fecha final no puede ser anterior a la fecha de inicio."
      );
      return false;
    }
    if (limit < 1 || limit > 100) {
      setError("La cantidad del ranking debe estar entre 1 y 100.");
      return false;
    }
    return true;
  };

  // ===================================================
  // CARGAR RANKING
  // ===================================================
  const cargarRanking = async () => {
    if (!filtrosValidos()) return;
    try {
      setLoading(true);
      setError("");
      const response = await obtenerRankingPersonal({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin || null,
        cmetfac: cmetfac || null,
        limit: Number(limit),
      });
      setRanking(response?.ranking || []);
      setPeriodo(response?.periodo || null);
      setGrupoFiltrado(response?.cmetfac_filtrado || "Todos");
    } catch (err) {
      console.error("Error cargando ranking de personal:", err);
      setRanking([]);
      if (err.response?.status === 422) {
        setError(
          "Los parámetros enviados no son válidos. Revisa las fechas y filtros seleccionados."
        );
      } else if (err.response?.status === 404) {
        setError("No se encontró el servicio de ranking de personal.");
      } else {
        setError("No se pudo obtener el ranking de personal.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // CARGA INICIAL (al entrar a la sección)
  // ===================================================
  useEffect(() => {
    cargarRanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===================================================
  // CARGA AUTOMÁTICA AL CAMBIAR FILTROS
  //
  // Cada vez que el usuario modifica fecha inicio, fecha
  // fin, grupo de facturación o cantidad, se vuelve a
  // consultar el ranking solo. No depende del botón
  // "Aplicar filtros" (ese botón queda como refresco manual
  // opcional, no como requisito).
  //
  // Se usa un pequeño debounce (400ms) para no disparar una
  // petición por cada tecla/click mientras el usuario todavía
  // está ajustando los filtros.
  // ===================================================
  useEffect(() => {
    if (primerRenderRef.current) {
      // La carga inicial ya la hace el efecto de arriba.
      primerRenderRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      cargarRanking();
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin, cmetfac, limit]);

  // ===================================================
  // LIMPIAR FILTROS
  // ===================================================
  const limpiarFiltros = () => {
    setFechaInicio(hoy);
    setFechaFin(hoy);
    setCmetfac("");
    setLimit(10);
  };

  // ===================================================
  // OBTENER ICONO DEL PODIO
  // ===================================================
  const obtenerIconoPosicion = (posicion) => {
    if (posicion === 1) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
          <Trophy size={20} />
        </div>
      );
    }
    if (posicion === 2) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Medal size={20} />
        </div>
      );
    }
    if (posicion === 3) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
          <Award size={20} />
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#006cb7]">
        <span className="text-sm font-bold">{posicion}</span>
      </div>
    );
  };

  // ===================================================
  // RENDER
  // ===================================================
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* =================================================
            FILTROS
        ================================================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* FECHA INICIO */}
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Fecha inicio
              </label>
              <div className="relative">
                <CalendarDays
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7]"
                />
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs text-slate-700 outline-none transition focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            {/* FECHA FIN */}
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Fecha fin
              </label>
              <div className="relative">
                <CalendarDays
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7]"
                />
                <input
                  type="date"
                  value={fechaFin}
                  min={fechaInicio}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs text-slate-700 outline-none transition focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            {/* CANTIDAD */}
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Cantidad de resultados
              </label>
              <div className="relative">
                <Users
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7]"
                />
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs text-slate-700 outline-none transition focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100"
                >
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={15}>Top 15</option>
                  <option value={20}>Top 20</option>
                  <option value={25}>Top 25</option>
                  <option value={50}>Top 50</option>
                  <option value={100}>Top 100</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold">No se pudo cargar el ranking</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* =================================================
            LOADING (skeleton solo cuando no hay datos previos)
        ================================================= */}
        {loading && ranking.length === 0 ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="space-y-4 p-5">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          </div>
        ) : ranking.length === 0 ? (
          /* =================================================
              SIN DATOS
          ================================================= */
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users size={28} />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-700">
              No hay personal disponible
            </h3>
            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400">
              No se encontraron registros de personal para el periodo y
              grupo de facturación seleccionados.
            </p>
          </div>
        ) : (
          /* =================================================
              RANKING
          ================================================= */
          <div
            className={`rounded-2xl border border-slate-200 bg-white shadow-sm transition-opacity ${
              loading ? "opacity-60" : "opacity-100"
            }`}
          >
            {/* ENCABEZADO */}
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-50 p-2.5 text-amber-500">
                  <Trophy size={19} />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                    Ranking de personal
                  </h2>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Top {ranking.length} trabajadores según eficiencia.
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-bold text-slate-500">
                  {ranking.length} resultados
                </p>
              </div>
            </div>
            {/* TABLA */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Pos.
                    </th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Personal
                    </th>
                    <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Eficiencia
                    </th>
                    <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Lecturas
                    </th>
                    <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Tiempo total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((persona, index) => {
                    const posicion = index + 1;
                    return (
                      <tr
                        key={`${persona.ccodprs || "persona"}-${index}`}
                        className="border-b border-slate-100 last:border-b-0 transition hover:bg-slate-50"
                      >
                        {/* POSICIÓN */}
                        <td className="px-5 py-4">
                          {obtenerIconoPosicion(posicion)}
                        </td>
                        {/* PERSONAL */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#006cb7]">
                              <User size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-800">
                                {persona.nombre_trabajador || "Sin nombre"}
                              </p>
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Código: {persona.ccodprs || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* EFICIENCIA */}
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
                            <TrendingUp size={13} />
                            {formatearEficiencia(persona.eficiencia)}
                          </span>
                        </td>
                        {/* LECTURAS */}
                        <td className="px-5 py-4 text-center">
                          <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-700">
                            <BookOpen size={14} className="text-[#006cb7]" />
                            {formatearNumero(persona.lecturas_realizadas)}
                          </div>
                        </td>
                        {/* DURACIÓN */}
                        <td className="px-5 py-4 text-center">
                          <div className="inline-flex items-center gap-2 text-xs text-slate-600">
                            <Clock3 size={14} className="text-indigo-500" />
                            {formatearDuracion(persona.duracion_total_min)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}