import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Loader2,
  AlertTriangle,
  MapPin,
  Flame,
  AlertCircle,
  RefreshCw,
  Database,
  DollarSign,
  X,
  Info,
  Filter,
  CheckCircle2,
  Clock3,
  Hash,
  FileWarning,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip as LeafletTooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { cortesGeoService } from "../services/CortesGeoService";

// ============================================================
// TOOLTIP GLOBAL (renderizado en un portal)
//
// Mismo componente usado en los otros módulos: se dibuja con un
// React Portal directo sobre <body>, con posición "fixed" calculada
// desde la posición real del elemento en pantalla
// (getBoundingClientRect). Así nunca se corta por el overflow de
// ningún contenedor padre y se ajusta automáticamente si conviene
// mostrarse arriba o abajo.
// ============================================================
function Tooltip({ children, title, text, width = "w-80" }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: "top" });
  const triggerRef = useRef(null);
  const hideTimer = useRef(null);
  const calcularPosicion = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const espacioArriba = rect.top;
    const espacioAbajo = window.innerHeight - rect.bottom;
    const placement =
      espacioArriba > 170 || espacioArriba > espacioAbajo ? "top" : "bottom";
    let left = rect.left + rect.width / 2;
    const margen = 150;
    left = Math.min(Math.max(left, margen), window.innerWidth - margen);
    setCoords({
      top: placement === "top" ? rect.top - 10 : rect.bottom + 10,
      left,
      placement,
    });
  }, []);
  const mostrar = () => {
    clearTimeout(hideTimer.current);
    calcularPosicion();
    setVisible(true);
  };
  const ocultar = () => {
    hideTimer.current = setTimeout(() => setVisible(false), 60);
  };
  return (
    <span
      ref={triggerRef}
      onMouseEnter={mostrar}
      onMouseLeave={ocultar}
      onFocus={mostrar}
      onBlur={ocultar}
      className="inline-block"
    >
      {children}
      {visible &&
        text &&
        createPortal(
          <div
            onMouseEnter={mostrar}
            onMouseLeave={ocultar}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform: `translate(-50%, ${
                coords.placement === "top" ? "-100%" : "0"
              })`,
              zIndex: 9999,
            }}
            className={`
              ${width}
              pointer-events-none
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              shadow-xl
              whitespace-normal
              break-words
            `}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5 p-1.5 rounded-lg bg-blue-50 text-[#006cb7] shrink-0">
                <Info size={13} />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-800 mb-1">
                  {title}
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {text}
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </span>
  );
}

// ============================================================
// CENTRO DE AREQUIPA
// ============================================================
const CENTRO_AREQUIPA = [-16.3989, -71.5369];

// ============================================================
// OPCIONES DE PERIODO
// ============================================================
const OPCIONES_PERIODO = [
  { value: "", label: "Personalizado" },
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
  { value: "3meses", label: "Últimos 3 meses" },
];

// ============================================================
// FORMATO MONEDA
// ============================================================
const formatearMonto = (valor) =>
  Number(valor ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ============================================================
// CONVERSIÓN UTM -> LAT/LNG
// Zona 19S - WGS84
// ============================================================
function utmToLatLng(
  easting,
  northing,
  zoneNumber = 19,
  southernHemisphere = true
) {
  const a = 6378137.0;
  const eccSquared = 0.00669438;
  const k0 = 0.9996;
  let x = Number(easting) - 500000.0;
  let y = Number(northing);
  if (southernHemisphere) {
    y -= 10000000.0;
  }
  const eccPrimeSquared = eccSquared / (1 - eccSquared);
  const e1 =
    (1 - Math.sqrt(1 - eccSquared)) / (1 + Math.sqrt(1 - eccSquared));
  const M = y / k0;
  const mu =
    M /
    (a *
      (1 -
        eccSquared / 4 -
        (3 * eccSquared * eccSquared) / 64 -
        (5 * eccSquared * eccSquared * eccSquared) / 256));
  const phi1Rad =
    mu +
    ((3 * e1) / 2 - (27 * Math.pow(e1, 3)) / 32) * Math.sin(2 * mu) +
    ((21 * e1 * e1) / 16 - (55 * Math.pow(e1, 4)) / 32) * Math.sin(4 * mu) +
    ((151 * Math.pow(e1, 3)) / 96) * Math.sin(6 * mu) +
    ((1097 * Math.pow(e1, 4)) / 512) * Math.sin(8 * mu);
  const N1 =
    a / Math.sqrt(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad));
  const T1 = Math.tan(phi1Rad) * Math.tan(phi1Rad);
  const C1 = eccPrimeSquared * Math.cos(phi1Rad) * Math.cos(phi1Rad);
  const R1 =
    (a * (1 - eccSquared)) /
    Math.pow(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad), 1.5);
  const D = x / (N1 * k0);
  const lat =
    phi1Rad -
    ((N1 * Math.tan(phi1Rad)) / R1) *
      ((D * D) / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * eccPrimeSquared) *
          Math.pow(D, 4)) /
          24 +
        ((61 +
          90 * T1 +
          298 * C1 +
          45 * T1 * T1 -
          252 * eccPrimeSquared -
          3 * C1 * C1) *
          Math.pow(D, 6)) /
          720);
  const lng =
    (D -
      ((1 + 2 * T1 + C1) * Math.pow(D, 3)) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * eccPrimeSquared + 24 * T1 * T1) *
        Math.pow(D, 5)) /
        120) /
    Math.cos(phi1Rad);
  const latitude = (lat * 180) / Math.PI;
  const longitude = (zoneNumber - 1) * 6 - 180 + 3 + (lng * 180) / Math.PI;
  return {
    lat: latitude,
    lng: longitude,
  };
}

// ============================================================
// NORMALIZAR COORDENADAS
// ============================================================
function convertirCoordenada(item) {
  const lat = Number(item?.lat);
  const lng = Number(item?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  // Si el API ya devolviera coordenadas GPS normales
  if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    return {
      ...item,
      latMapa: lat,
      lngMapa: lng,
    };
  }
  // Coordenadas proyectadas del API
  const convertida = utmToLatLng(lng, lat, 19, true);
  return {
    ...item,
    latMapa: convertida.lat,
    lngMapa: convertida.lng,
  };
}

// ============================================================
// COMPONENTE HEATMAP
// ============================================================
function HeatmapLayer({ puntos, activo }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !activo) {
      return;
    }
    const puntosValidos = puntos
      .map((item) => {
        const deuda = Number(item?.deuda ?? 0);
        if (
          !Number.isFinite(item?.latMapa) ||
          !Number.isFinite(item?.lngMapa)
        ) {
          return null;
        }
        return [item.latMapa, item.lngMapa, Math.max(deuda, 1)];
      })
      .filter(Boolean);
    if (!puntosValidos.length) {
      return;
    }
    const maxDeuda = Math.max(...puntosValidos.map((item) => item[2]));
    const normalizados = puntosValidos.map(([lat, lng, deuda]) => [
      lat,
      lng,
      Math.max(0.15, deuda / maxDeuda),
    ]);
    const heat = L.heatLayer(normalizados, {
      radius: 25,
      blur: 20,
      maxZoom: 17,
      minOpacity: 0.35,
      max: 1,
    });
    heat.addTo(map);
    return () => {
      map.removeLayer(heat);
    };
  }, [map, puntos, activo]);
  return null;
}

// ============================================================
// AJUSTAR MAPA A PUNTOS
// ============================================================
function AjustarMapa({ puntos, activo }) {
  const map = useMap();
  useEffect(() => {
    if (!activo || !puntos.length) {
      return;
    }
    const coordenadas = puntos
      .map((item) => [item.latMapa, item.lngMapa])
      .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
    if (!coordenadas.length) {
      return;
    }
    const bounds = L.latLngBounds(coordenadas);
    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 14,
    });
  }, [map, puntos, activo]);
  return null;
}

// ============================================================
// GLOSARIO DE CAMPOS
// Explicación de cada campo que devuelve el API, para mostrarla
// en la cartilla de detalle del punto/impedimento seleccionado.
// ============================================================
const GLOSARIO_CAMPOS = {
  ccodcnx:
    "Código único que identifica la conexión de agua potable en el sistema.",
  distrito: "Distrito donde se ubica físicamente la conexión.",
  direccion: "Dirección registrada de la conexión (referencia catastral).",
  deuda:
    "Monto de deuda pendiente asociado a la conexión, expresado en soles (S/).",
  ejecutada:
    "Indica si la orden de corte de esta conexión ya fue ejecutada en campo, o si todavía está pendiente de ejecución.",
  csitreg:
    "Situación de registro del impedimento. El valor 'S' indica que la conexión presenta un impedimento activo que impide ejecutar el corte en este momento.",
  ccodacc:
    "Código interno del motivo específico por el que no se puede ejecutar el corte.",
  cdesacc:
    "Descripción del motivo por el que no se pudo o no se puede ejecutar el corte (por ejemplo, acceso restringido, cliente con amparo, etc.).",
};

// ============================================================
// CARTILLA FLOTANTE (hover sobre el mapa)
// En vez de un panel fijo debajo del mapa, el detalle aparece
// como una tarjeta flotante justo sobre el punto/impedimento al
// pasar el mouse, usando el Tooltip nativo de Leaflet con un
// diseño propio (blanco, redondeado, con glosario incluido).
// ============================================================
function ContenidoImpedimento({ item }) {
  return (
    <div className="cartilla-mapa">
      <div className="cartilla-header cartilla-header--rojo">
        <span className="cartilla-header-icon cartilla-header-icon--rojo">
          <AlertCircle size={14} />
        </span>
        <div>
          <p className="cartilla-titulo">Impedimento de corte</p>
          <p className="cartilla-subtitulo">Conexión {item.ccodcnx || "--"}</p>
        </div>
      </div>

      <div className="cartilla-body">
        <div className="cartilla-fila">
          <MapPin size={12} className="cartilla-fila-icon" />
          <div>
            <p className="cartilla-label">Distrito</p>
            <p className="cartilla-valor">{item.distrito || "--"}</p>
          </div>
        </div>

        <div className="cartilla-fila">
          <DollarSign size={12} className="cartilla-fila-icon" />
          <div>
            <p className="cartilla-label">Deuda</p>
            <p className="cartilla-valor">S/ {formatearMonto(item.deuda)}</p>
          </div>
        </div>

        <div className="cartilla-fila">
          <FileWarning size={12} className="cartilla-fila-icon" />
          <div>
            <p className="cartilla-label">Motivo del impedimento</p>
            <p className="cartilla-valor">{item.cdesacc || "--"}</p>
            <p className="cartilla-hint">
              Código {item.ccodacc || "--"} · {GLOSARIO_CAMPOS.cdesacc}
            </p>
          </div>
        </div>

        <div className="cartilla-fila">
          <AlertTriangle size={12} className="cartilla-fila-icon" />
          <div>
            <p className="cartilla-label">Situación de registro (csitreg)</p>
            <p className="cartilla-valor">
              {item.csitreg === "S" ? "S — Impedimento activo" : item.csitreg || "--"}
            </p>
            <p className="cartilla-hint">{GLOSARIO_CAMPOS.csitreg}</p>
          </div>
        </div>

        <div className="cartilla-fila cartilla-fila--direccion">
          <Hash size={12} className="cartilla-fila-icon" />
          <div>
            <p className="cartilla-label">Dirección</p>
            <p className="cartilla-valor cartilla-valor--direccion">
              {item.direccion || "--"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContenidoPunto({ item }) {
  const ejecutada = item.ejecutada === true;
  return (
    <div className="cartilla-mapa">
      <div className="cartilla-header cartilla-header--azul">
        <span className="cartilla-header-icon cartilla-header-icon--azul">
          <MapPin size={14} />
        </span>
        <div>
          <p className="cartilla-titulo">Punto de deuda</p>
          <p className="cartilla-subtitulo">Conexión {item.ccodcnx || "--"}</p>
        </div>
        <span
          className={`cartilla-badge ${
            ejecutada ? "cartilla-badge--verde" : "cartilla-badge--ambar"
          }`}
        >
          {ejecutada ? <CheckCircle2 size={11} /> : <Clock3 size={11} />}
          {ejecutada ? "Ejecutada" : "Pendiente"}
        </span>
      </div>

      <div className="cartilla-body">
        <div className="cartilla-fila">
          <MapPin size={12} className="cartilla-fila-icon" />
          <div>
            <p className="cartilla-label">Distrito</p>
            <p className="cartilla-valor">{item.distrito || "--"}</p>
          </div>
        </div>

        <div className="cartilla-fila">
          <DollarSign size={12} className="cartilla-fila-icon" />
          <div>
            <p className="cartilla-label">Deuda</p>
            <p className="cartilla-valor">S/ {formatearMonto(item.deuda)}</p>
            <p className="cartilla-hint">{GLOSARIO_CAMPOS.deuda}</p>
          </div>
        </div>

        <div className="cartilla-fila">
          {ejecutada ? (
            <CheckCircle2 size={12} className="cartilla-fila-icon" />
          ) : (
            <Clock3 size={12} className="cartilla-fila-icon" />
          )}
          <div>
            <p className="cartilla-label">Estado de ejecución</p>
            <p className="cartilla-valor">
              {ejecutada ? "Ejecutada" : "Pendiente"}
            </p>
            <p className="cartilla-hint">{GLOSARIO_CAMPOS.ejecutada}</p>
          </div>
        </div>

        <div className="cartilla-fila cartilla-fila--direccion">
          <Hash size={12} className="cartilla-fila-icon" />
          <div>
            <p className="cartilla-label">Dirección</p>
            <p className="cartilla-valor cartilla-valor--direccion">
              {item.direccion || "--"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ESTILOS DE LA CARTILLA FLOTANTE
// Sobrescribe el look por defecto del tooltip de Leaflet (caja
// blanca simple con flecha) para que se vea como una tarjeta
// propia del diseño del dashboard.
// ============================================================
function EstilosCartillaMapa() {
  return (
    <style>{`
      .leaflet-tooltip.cartilla-tooltip {
        background: transparent;
        border: none;
        box-shadow: none;
        padding: 0;
        opacity: 1 !important;
        pointer-events: none;
      }
      .leaflet-tooltip.cartilla-tooltip::before {
        display: none;
      }
      .cartilla-mapa {
        width: 958px;
        background: #ffffff;
        border-radius: 14px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 12px 30px -8px rgba(15, 23, 42, 0.25);
        overflow: hidden;
        font-family: inherit;
      }
      .cartilla-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-bottom: 1px solid #f1f5f9;
      }
      .cartilla-header--azul { background: #eff8ff; }
      .cartilla-header--rojo { background: #fef2f2; }
      .cartilla-header-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 9px;
        flex-shrink: 0;
      }
      .cartilla-header-icon--azul { background: #dbeefe; color: #006cb7; }
      .cartilla-header-icon--rojo { background: #fee2e2; color: #dc2626; }
      .cartilla-titulo {
        font-size: 11px;
        font-weight: 800;
        color: #1e293b;
        line-height: 1.1;
      }
      .cartilla-subtitulo {
        font-size: 9px;
        color: #94a3b8;
        margin-top: 2px;
      }
      .cartilla-badge {
        margin-left: auto;
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-size: 8.5px;
        font-weight: 800;
        padding: 3px 6px;
        border-radius: 999px;
        white-space: nowrap;
      }
      .cartilla-badge--verde { background: #dcfce7; color: #15803d; }
      .cartilla-badge--ambar { background: #fef3c7; color: #b45309; }
      .cartilla-body {
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 9px;
      }
      .cartilla-fila {
        display: flex;
        align-items: flex-start;
        gap: 7px;
      }
      .cartilla-fila-icon {
        color: #006cb7;
        margin-top: 2px;
        flex-shrink: 0;
      }
      .cartilla-label {
        font-size: 8.5px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: #94a3b8;
      }
      .cartilla-valor {
        font-size: 11px;
        font-weight: 700;
        color: #1e293b;
        margin-top: 1px;
        line-height: 1.3;
      }
      .cartilla-valor--direccion {
        font-weight: 600;
        font-size: 10px;
        color: #475569;
      }
      .cartilla-hint {
        font-size: 9px;
        color: #94a3b8;
        margin-top: 2px;
        line-height: 1.35;
      }
    `}</style>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function MapasCortes() {
  // ==========================================================
  // FECHA ACTUAL
  // ==========================================================
  const obtenerFechaHoy = () => {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const hoy = obtenerFechaHoy();

  // ==========================================================
  // ESTADOS
  // ==========================================================
  const [fechaInicio, setFechaInicio] = useState("2026-03-30");
  const [fechaFin, setFechaFin] = useState(hoy);
  const [periodo, setPeriodo] = useState("");
  const [distritoInput, setDistritoInput] = useState("");
  const [distritoFiltro, setDistritoFiltro] = useState("");
  const [heatmap, setHeatmap] = useState({
    total_puntos: 0,
    puntos: [],
  });
  const [impedimentos, setImpedimentos] = useState({
    total_impedimentos: 0,
    monto_total_impedimentos: 0,
    impedimentos: [],
  });
  const [modoMapa, setModoMapa] = useState("heatmap");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================================
  // VALIDACIÓN
  // Solo aplica cuando NO hay un periodo predefinido seleccionado,
  // ya que en ese caso las fechas quedan deshabilitadas.
  // ==========================================================
  const fechasInvalidas =
    !periodo && fechaInicio && fechaFin && fechaFin < fechaInicio;

  // ==========================================================
  // DEBOUNCE DISTRITO
  // Evita disparar un fetch por cada letra escrita.
  // ==========================================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDistritoFiltro(distritoInput.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [distritoInput]);

  // ==========================================================
  // CARGAR DATOS
  // Si hay un periodo seleccionado, tiene prioridad sobre las
  // fechas (que además quedan deshabilitadas en la UI).
  // Solo se filtra por distrito (a propósito no se expone el
  // filtro por trabajador/ccodprs en esta vista).
  // ==========================================================
  const cargarDatos = async (inicio, fin, periodoActual, distrito) => {
    if (fechasInvalidas) {
      setError("La fecha fin no puede ser anterior a la fecha de inicio.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const inicioConsulta = periodoActual ? "" : inicio;
      const finConsulta = periodoActual ? "" : fin;

      const [heatmapData, impedimentosData] = await Promise.all([
        cortesGeoService.obtenerHeatmap({
          fechaInicio: inicioConsulta,
          fechaFin: finConsulta,
          periodo: periodoActual,
          distrito,
        }),
        cortesGeoService.obtenerImpedimentos({
          fechaInicio: inicioConsulta,
          fechaFin: finConsulta,
          periodo: periodoActual,
          distrito,
        }),
      ]);
      console.log("Heatmap cortes:", heatmapData);
      console.log("Impedimentos cortes:", impedimentosData);
      const puntos = Array.isArray(heatmapData?.puntos)
        ? heatmapData.puntos.map(convertirCoordenada).filter(Boolean)
        : [];
      const listaImpedimentos = Array.isArray(
        impedimentosData?.impedimentos
      )
        ? impedimentosData.impedimentos.map(convertirCoordenada).filter(Boolean)
        : [];
      setHeatmap({
        total_puntos: heatmapData?.total_puntos ?? puntos.length,
        puntos,
      });
      setImpedimentos({
        total_impedimentos:
          impedimentosData?.total_impedimentos ?? listaImpedimentos.length,
        monto_total_impedimentos:
          impedimentosData?.monto_total_impedimentos ?? 0,
        impedimentos: listaImpedimentos,
      });
    } catch (err) {
      console.error("Error cargando geolocalización de cortes:", err);
      let mensaje = "No se pudieron cargar los datos geográficos de cortes.";
      if (err?.response?.data?.detail) {
        const detalle = err.response.data.detail;
        if (typeof detalle === "string") {
          mensaje = detalle;
        }
        if (Array.isArray(detalle)) {
          mensaje = detalle
            .map((item) => item?.msg || JSON.stringify(item))
            .join(" | ");
        }
      }
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // CARGAR AL CAMBIAR FECHAS, PERIODO O DISTRITO
  // ==========================================================
  useEffect(() => {
    if (!fechasInvalidas) {
      cargarDatos(fechaInicio, fechaFin, periodo, distritoFiltro);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin, periodo, distritoFiltro]);

  // ==========================================================
  // CAMBIO DE PERIODO
  // Al elegir un periodo predefinido, las fechas quedan
  // deshabilitadas (se ignoran en la consulta).
  // ==========================================================
  const manejarCambioPeriodo = (e) => {
    setError(null);
    setPeriodo(e.target.value);
  };

  // ==========================================================
  // LIMPIAR FILTROS
  // ==========================================================
  const limpiarFiltros = () => {
    setError(null);
    setFechaInicio("2026-03-30");
    setFechaFin(hoy);
    setPeriodo("");
    setDistritoInput("");
    setDistritoFiltro("");
    // La carga se dispara sola vía useEffect al cambiar los filtros
  };

  // ==========================================================
  // DATOS NORMALIZADOS
  // ==========================================================
  const puntosMapa = useMemo(
    () =>
      heatmap.puntos.filter(
        (item) => Number.isFinite(item.latMapa) && Number.isFinite(item.lngMapa)
      ),
    [heatmap.puntos]
  );
  const impedimentosMapa = useMemo(
    () =>
      impedimentos.impedimentos.filter(
        (item) => Number.isFinite(item.latMapa) && Number.isFinite(item.lngMapa)
      ),
    [impedimentos.impedimentos]
  );

  // ==========================================================
  // TOTAL DEUDA (puntos del mapa de calor)
  // ==========================================================
  const deudaTotal = useMemo(
    () => puntosMapa.reduce((total, item) => total + Number(item?.deuda ?? 0), 0),
    [puntosMapa]
  );

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="space-y-5 text-left">
      <EstilosCartillaMapa />

      {/* ====================================================
          FILTROS
      ==================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-end gap-4 flex-wrap">
          {/* PERIODO */}
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
                value={periodo}
                onChange={manejarCambioPeriodo}
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

          {/* FECHA INICIO */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Fecha inicio
            </label>
            <div className="relative">
              <Calendar
                size={15}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  periodo ? "text-slate-300" : "text-[#006cb7]"
                }`}
              />
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                disabled={Boolean(periodo)}
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

          {/* FECHA FIN */}
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
                    : periodo
                    ? "text-slate-300"
                    : "text-[#006cb7]"
                }`}
              />
              <input
                type="date"
                value={fechaFin}
                min={fechaInicio || undefined}
                onChange={(e) => setFechaFin(e.target.value)}
                disabled={Boolean(periodo)}
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

          {/* DISTRITO */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Distrito
            </label>
            <div className="relative">
              <MapPin
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Todos"
                value={distritoInput}
                onChange={(e) => setDistritoInput(e.target.value)}
                disabled={loading}
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
                  disabled:cursor-not-allowed
                  min-w-[170px]
                "
              />
            </div>
          </div>

          {/* BOTÓN LIMPIAR */}
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

        {distritoFiltro && (
          <p className="text-[10px] text-[#006cb7] font-semibold mt-3">
            Distrito: {distritoFiltro} — el mapa, los indicadores y la lista
            de impedimentos muestran solo este distrito.
          </p>
        )}
      </div>

      {/* ====================================================
          ERROR FECHAS
      ==================================================== */}
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

      {/* ====================================================
          ERROR API
      ==================================================== */}
      {error && !fechasInvalidas && (
        <div className="bg-white border border-red-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <AlertCircle size={17} />
            </div>
            <div>
              <p className="text-xs font-bold text-red-700">
                Error al cargar el mapa
              </p>
              <p className="text-[11px] text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          KPIs DEL MAPA
      ==================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* PUNTOS */}
        <Tooltip
          title="Puntos georreferenciados"
          text="Cantidad de conexiones con deuda que cuentan con coordenadas válidas dentro del período (y distrito, si aplica) seleccionado, y que por lo tanto se muestran en el mapa de calor."
          width="w-80"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm cursor-help">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Puntos georreferenciados
                </p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {heatmap.total_puntos.toLocaleString("en-US")}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 text-[#006cb7]">
                <MapPin size={20} />
              </div>
            </div>
          </div>
        </Tooltip>
        {/* IMPEDIMENTOS */}
        <Tooltip
          title="Impedimentos"
          text="Cantidad de conexiones georreferenciadas que presentan una situación especial o impedimento (csitreg = 'S') que evita realizar el corte, dentro del período y distrito seleccionados."
          width="w-80"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm cursor-help">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Impedimentos
                </p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {impedimentos.total_impedimentos.toLocaleString("en-US")}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 text-red-600">
                <AlertCircle size={20} />
              </div>
            </div>
          </div>
        </Tooltip>
        {/* MONTO EN IMPEDIMENTOS */}
        <Tooltip
          title="Deuda en impedimentos"
          text="Suma de la deuda de todas las conexiones que presentan un impedimento activo para el corte, dentro del período y distrito seleccionados. Es deuda que hoy no se puede recuperar mediante corte porque hay una situación que lo impide."
          width="w-80"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm cursor-help">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Deuda en impedimentos
                </p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {formatearMonto(impedimentos.monto_total_impedimentos)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                <FileWarning size={20} />
              </div>
            </div>
          </div>
        </Tooltip>
        {/* DEUDA */}
        <Tooltip
          title="Deuda georreferenciada"
          text="Suma de la deuda de todas las conexiones que cuentan con coordenadas válidas y se muestran en el mapa de calor, dentro del período y distrito seleccionados."
          width="w-80"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm cursor-help">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Deuda georreferenciada
                </p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {formatearMonto(deudaTotal)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <DollarSign size={20} />
              </div>
            </div>
          </div>
        </Tooltip>
      </div>

      {/* ====================================================
          SELECTOR DE MAPA
      ==================================================== */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => setModoMapa("heatmap")}
          className={`
            flex-1
            flex
            items-center
            justify-center
            gap-2
            h-10
            rounded-lg
            border
            text-xs
            font-bold
            transition
            ${
              modoMapa === "heatmap"
                ? "bg-[#006cb7] text-white border-[#006cb7]"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }
          `}
        >
          <Flame size={15} />
          Mapa de calor de deuda
        </button>
        <button
          onClick={() => setModoMapa("impedimentos")}
          className={`
            flex-1
            flex
            items-center
            justify-center
            gap-2
            h-10
            rounded-lg
            border
            text-xs
            font-bold
            transition
            ${
              modoMapa === "impedimentos"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }
          `}
        >
          <AlertCircle size={15} />
          Impedimentos
        </button>
      </div>

      {/* ====================================================
          MAPA
      ==================================================== */}
      <div className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-lg">
              <Loader2 size={14} className="animate-spin text-[#006cb7]" />
              <span className="text-xs font-semibold text-slate-600">
                Cargando información...
              </span>
            </div>
          </div>
        )}
        <div className="h-[620px]">
          <MapContainer
            center={CENTRO_AREQUIPA}
            zoom={12}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* ============================================
                HEATMAP
            ============================================ */}
            <HeatmapLayer puntos={puntosMapa} activo={modoMapa === "heatmap"} />
            {/* ============================================
                AJUSTAR MAPA
            ============================================ */}
            <AjustarMapa
              puntos={modoMapa === "heatmap" ? puntosMapa : impedimentosMapa}
              activo={true}
            />
            {/* ============================================
                MARCADORES IMPEDIMENTOS
            ============================================ */}
            {modoMapa === "impedimentos" &&
              impedimentosMapa.map((item, index) => (
                <CircleMarker
                  key={`impedimento-${item.ccodcnx}-${index}`}
                  center={[item.latMapa, item.lngMapa]}
                  radius={7}
                  pathOptions={{
                    color: "#dc2626",
                    fillColor: "#ef4444",
                    fillOpacity: 0.75,
                    weight: 2,
                  }}
                >
                  <LeafletTooltip
                    direction="top"
                    offset={[0, -8]}
                    opacity={1}
                    className="cartilla-tooltip"
                  >
                    <ContenidoImpedimento item={item} />
                  </LeafletTooltip>
                </CircleMarker>
              ))}
            {/* ============================================
                PUNTOS INDIVIDUALES SOBRE HEATMAP
            ============================================ */}
            {modoMapa === "heatmap" &&
              puntosMapa.map((item, index) => (
                <CircleMarker
                  key={`punto-${item.ccodcnx}-${index}`}
                  center={[item.latMapa, item.lngMapa]}
                  radius={4}
                  pathOptions={{
                    color: item.ejecutada ? "#16a34a" : "#2563eb",
                    fillColor: item.ejecutada ? "#22c55e" : "#3b82f6",
                    fillOpacity: 0.3,
                    weight: 1,
                  }}
                >
                  <LeafletTooltip
                    direction="top"
                    offset={[0, -6]}
                    opacity={1}
                    className="cartilla-tooltip"
                  >
                    <ContenidoPunto item={item} />
                  </LeafletTooltip>
                </CircleMarker>
              ))}
          </MapContainer>
        </div>
        {/* ==================================================
            LEYENDA
        ================================================== */}
        <div className="absolute bottom-5 left-5 z-[900] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-3">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 mb-2">
            Leyenda
          </p>
          {modoMapa === "heatmap" ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-400" />
                <span className="text-[10px] text-slate-600">
                  Menor concentración
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="text-[10px] text-slate-600">
                  Concentración media
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-[10px] text-slate-600">
                  Mayor concentración
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 mt-1">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-[10px] text-slate-600">
                  Punto ya ejecutado
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-red-200" />
              <span className="text-[10px] text-slate-600">Impedimento</span>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================
          INFORMACIÓN DEL MAPA
      ==================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#006cb7]">
              <Flame size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Mapa de calor
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Representa espacialmente la concentración de deuda de las
                conexiones georreferenciadas durante el período (y distrito,
                si se aplicó) seleccionados. Las zonas en rojo concentran
                mayor deuda; los puntos en verde ya fueron ejecutados. Pasa
                el mouse sobre cualquier punto para ver su detalle completo.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
              <AlertCircle size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Impedimentos
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Permite identificar espacialmente las conexiones donde existe
                una situación especial o impedimento (csitreg = 'S') para
                realizar el corte, junto con el motivo específico. Pasa el
                mouse sobre cualquier marcador para ver el detalle completo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}