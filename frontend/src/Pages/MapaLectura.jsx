import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Layers,
  Filter,
  MapPin,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import Mapa from "./Mapa";

// =========================================================
// TEXTOS DE EXPLICACIÓN POR CAPA
// =========================================================
const EXPLICACION_CAPA = {
  discrepancias:
    "Devuelve las lecturas cuya distancia entre la ubicación teórica y la ubicación real supera los 50 metros. El total que aparece en el mapa corresponde directamente a total_discrepancias del API.",
  heatmap:
    "El API agrupa las zonas con mayor concentración de anomalías. El total mostrado corresponde directamente a total_puntos_calor del API.",
};

// =========================================================
// SECTORES DE FACTURACIÓN
// =========================================================
/*
 * IMPORTANTE:
 *
 * Estos valores son solamente opciones visuales del Frontend.
 * El API recibe zona_id y cmetfac como strings.
 *
 * Si posteriormente tienes un endpoint de catálogos para zonas
 * o sectores, podemos reemplazar estas listas por datos del API.
 */
const SECTORES = [
  { value: "", label: "Todos los sectores" },
  { value: "1001", label: "1001" },
  { value: "1002", label: "1002" },
  { value: "1003", label: "1003" },
  { value: "1004", label: "1004" },
  { value: "1005", label: "1005" },
  { value: "1006", label: "1006" },
  { value: "1007", label: "1007" },
  { value: "1008", label: "1008" },
  { value: "1009", label: "1009" },
  { value: "1010", label: "1010" },
];

// =========================================================
// OPCIONES DE PERIODO
// =========================================================
/*
 * IMPORTANTE:
 *
 * Estos valores deben coincidir EXACTAMENTE con lo que acepta el API:
 * hoy, semana, mes, 3meses
 *
 * "" (vacío) significa "sin periodo rápido" -> se usan fecha_inicio/fecha_fin
 * (son excluyentes según la lógica de mapaLecturaService.js).
 */
const OPCIONES_PERIODO = [
  { value: "", label: "Personalizado" },
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
  { value: "3meses", label: "Últimos 3 meses" },
];

// =========================================================
// TOOLTIP (vía portal, no se corta por overflow)
// =========================================================
function TooltipCapa({ texto, children }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const ANCHO = 300;

  const calcularPosicion = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - ANCHO / 2;
    if (left < 10) left = 10;
    if (left + ANCHO > window.innerWidth - 10) {
      left = window.innerWidth - ANCHO - 10;
    }
    setCoords({ top: rect.bottom + 8, left });
  };

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={() => {
        calcularPosicion();
        setVisible(true);
      }}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: ANCHO,
              zIndex: 9999,
            }}
            className="pointer-events-none rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xl"
          >
            <p className="text-[11px] leading-relaxed text-slate-600">{texto}</p>
          </div>,
          document.body
        )}
    </div>
  );
}

// =========================================================
// COMPONENTE PRINCIPAL
// =========================================================
export default function MapaLecturas() {
  // =====================================================
  // FECHA ACTUAL
  // =====================================================
  const obtenerFechaHoy = () => {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const hoy = obtenerFechaHoy();

  const filtrosPorDefecto = {
    fecha_inicio: hoy,
    fecha_fin: hoy,
    periodo: "",
    zona_id: "",
    cmetfac: "",
    capa: "discrepancias",
  };

  // =====================================================
  // FILTROS QUE EL USUARIO ESTÁ EDITANDO
  // Por defecto muestran el mapa del día en curso.
  // =====================================================
  const [filtros, setFiltros] = useState(filtrosPorDefecto);

  // =====================================================
  // FILTROS QUE REALMENTE SE ENVÍAN AL MAPA
  // Solo se actualizan cuando el rango de fechas es válido.
  // =====================================================
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosPorDefecto);

  // =====================================================
  // ESTADO DE CARGA
  // Lo reporta Mapa.jsx hacia arriba para poder deshabilitar
  // los controles del filtro mientras se está consultando el API,
  // igual que en MapasCortes.jsx.
  // =====================================================
  const [loading, setLoading] = useState(false);

  // =====================================================
  // VALIDACIÓN DE FECHAS
  // Solo aplica cuando NO hay periodo rápido seleccionado,
  // ya que periodo y fechas son excluyentes (y las fechas
  // quedan deshabilitadas en la UI cuando hay periodo).
  // =====================================================
  const fechasInvalidas =
    !filtros.periodo &&
    Boolean(filtros.fecha_inicio) &&
    Boolean(filtros.fecha_fin) &&
    filtros.fecha_fin < filtros.fecha_inicio;

  // =====================================================
  // ACTUALIZAR FILTRO
  // =====================================================
  const actualizarFiltro = (campo, valor) => {
    setFiltros((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  // =====================================================
  // ACTUALIZAR MAPA
  // Se dispara sola cada vez que cambia cualquier filtro,
  // sin depender de un botón "Procesar".
  // =====================================================
  useEffect(() => {
    if (fechasInvalidas) return;
    setFiltrosAplicados({ ...filtros });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filtros.fecha_inicio,
    filtros.fecha_fin,
    filtros.periodo,
    filtros.zona_id,
    filtros.cmetfac,
    filtros.capa,
  ]);

  // =====================================================
  // LIMPIAR FILTROS
  // =====================================================
  const limpiarFiltros = () => {
    setFiltros(filtrosPorDefecto);
    // La actualización se dispara sola vía useEffect
  };

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="space-y-6 text-left">
      {/* =================================================
          FILTROS
      ================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-end gap-4 flex-wrap">
          {/* =========================================
              PERIODO
          ========================================= */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Periodo
            </label>
            <div className="relative">
              <Filter
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7] pointer-events-none"
              />
              <select
                value={filtros.periodo}
                onChange={(e) => actualizarFiltro("periodo", e.target.value)}
                disabled={loading}
                className="
                  h-10
                  pl-10
                  pr-8
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  text-xs
                  text-slate-700
                  outline-none
                  focus:border-[#006cb7]
                  focus:ring-2
                  focus:ring-blue-100
                  transition
                  appearance-none
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  min-w-[170px]
                "
              >
                {OPCIONES_PERIODO.map((opcion) => (
                  <option key={opcion.value || "personalizado"} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* =========================================
              FECHA INICIO
          ========================================= */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Fecha inicio
            </label>
            <div className="relative">
              <Calendar
                size={15}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  filtros.periodo ? "text-slate-300" : "text-[#006cb7]"
                }`}
              />
              <input
                type="date"
                value={filtros.fecha_inicio}
                onChange={(e) => actualizarFiltro("fecha_inicio", e.target.value)}
                disabled={Boolean(filtros.periodo)}
                className="
                  h-10
                  pl-10
                  pr-3
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  text-xs
                  text-slate-700
                  outline-none
                  focus:border-[#006cb7]
                  focus:ring-2
                  focus:ring-blue-100
                  transition
                  disabled:opacity-50
                  disabled:bg-slate-50
                  disabled:cursor-not-allowed
                "
              />
            </div>
          </div>

          {/* =========================================
              FECHA FIN
          ========================================= */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Fecha fin
            </label>
            <div className="relative">
              <Calendar
                size={15}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  fechasInvalidas
                    ? "text-red-500"
                    : filtros.periodo
                    ? "text-slate-300"
                    : "text-[#006cb7]"
                }`}
              />
              <input
                type="date"
                value={filtros.fecha_fin}
                min={filtros.fecha_inicio || undefined}
                onChange={(e) => actualizarFiltro("fecha_fin", e.target.value)}
                disabled={Boolean(filtros.periodo)}
                className={`
                  h-10
                  pl-10
                  pr-3
                  rounded-lg
                  border
                  bg-white
                  text-xs
                  text-slate-700
                  outline-none
                  transition
                  disabled:opacity-50
                  disabled:bg-slate-50
                  disabled:cursor-not-allowed
                  ${
                    fechasInvalidas
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200 focus:border-[#006cb7] focus:ring-2 focus:ring-blue-100"
                  }
                `}
              />
            </div>
          </div>

          {/* =========================================
              SECTOR DE FACTURACIÓN
          ========================================= */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Sector de facturación
            </label>
            <div className="relative">
              <MapPin
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7] pointer-events-none"
              />
              <select
                value={filtros.cmetfac}
                onChange={(e) => actualizarFiltro("cmetfac", e.target.value)}
                disabled={loading}
                className="
                  h-10
                  pl-10
                  pr-8
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  text-xs
                  text-slate-700
                  outline-none
                  focus:border-[#006cb7]
                  focus:ring-2
                  focus:ring-blue-100
                  transition
                  appearance-none
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  min-w-[170px]
                "
              >
                {SECTORES.map((sector) => (
                  <option key={sector.value || "todos"} value={sector.value}>
                    {sector.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* =========================================
              CAPA DEL MAPA
          ========================================= */}
          <div className="flex flex-col gap-1.5">
            <TooltipCapa texto={EXPLICACION_CAPA[filtros.capa]}>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 cursor-help">
                Capa del mapa
              </label>
              <div className="relative cursor-help mt-1.5">
                <Layers
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7] pointer-events-none"
                />
                <select
                  value={filtros.capa}
                  onChange={(e) => actualizarFiltro("capa", e.target.value)}
                  disabled={loading}
                  className="
                    h-10
                    pl-10
                    pr-8
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    text-xs
                    text-slate-700
                    outline-none
                    focus:border-[#006cb7]
                    focus:ring-2
                    focus:ring-blue-100
                    transition
                    appearance-none
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                    min-w-[190px]
                  "
                >
                  <option value="discrepancias">Discrepancias espaciales</option>
                  <option value="heatmap">Mapa de calor</option>
                </select>
              </div>
            </TooltipCapa>
          </div>

          {/* =========================================
              BOTÓN LIMPIAR
          ========================================= */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={limpiarFiltros}
              disabled={loading}
              className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <RefreshCw size={14} />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
          ERROR FECHAS
      ================================================= */}
      {fechasInvalidas && (
        <div className="bg-white border border-red-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <AlertTriangle size={17} />
            </div>
            <div>
              <p className="text-xs font-bold text-red-700">
                Rango de fechas inválido
              </p>
              <p className="text-[11px] text-red-600 mt-1">
                La fecha fin no puede ser anterior a la fecha de inicio.
              </p>
            </div>
          </div>
        </div>
      )}

      <Mapa filtros={filtrosAplicados} onLoadingChange={setLoading} />
    </div>
  );
}