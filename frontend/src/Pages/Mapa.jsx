import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    CircleMarker,
    Tooltip,
    useMap
} from "react-leaflet";
import {
    useEffect,
    useMemo,
    useState
} from "react";
import L from "leaflet";
import {
    MapPin,
    Flame,
    AlertTriangle,
    Info,
    Loader2,
    XCircle
} from "lucide-react";
import {
    obtenerPersonal,
    obtenerDiscrepancias,
    obtenerHeatmapImpedimentos
} from "../services/mapaLecturaService";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

// =========================================================
// CONFIGURACIÓN GENERAL
// =========================================================
const CENTRO_AREQUIPA = [-16.409, -71.537];

// =========================================================
// COLOR DE MARCA (mismo utilizado en TrabajadoresDesempeno)
// =========================================================
const COLOR_MARCA = "#006cb7";

// =========================================================
// ICONOS LEAFLET
// =========================================================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

// =========================================================
// ICONO UBICACIÓN REAL
// =========================================================
const iconReal = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [0, -35]
});

// =========================================================
// ICONO UBICACIÓN TEÓRICA
// =========================================================
const iconTeorica = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [0, -35]
});

// =========================================================
// VALIDAR COORDENADAS
// =========================================================
function coordenadasValidas(punto) {
    if (!punto) {
        return false;
    }
    const lat = Number(punto.lat);
    const lng = Number(punto.lng);
    return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
    );
}

// =========================================================
// FORMATEAR DISTANCIA
// =========================================================
function formatearDistancia(valor) {
    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return "No disponible";
    }
    const numero = Number(valor);
    if (!Number.isFinite(numero)) {
        return "No disponible";
    }
    return `${numero.toFixed(2)} m`;
}

// =========================================================
// FORMATEAR COORDENADA
// =========================================================
function formatearCoordenada(valor) {
    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return "No disponible";
    }
    const numero = Number(valor);
    if (!Number.isFinite(numero)) {
        return "No disponible";
    }
    return numero.toFixed(7);
}

// =========================================================
// OBTENER NOMBRE DEL TRABAJADOR
// =========================================================
function obtenerNombreTrabajador(
    trabajadorId,
    personal
) {
    if (!trabajadorId) {
        return "No identificado";
    }
    const trabajador = personal.find(
        persona =>
            String(persona?.ccodprs) ===
            String(trabajadorId)
    );
    if (trabajador?.nombre) {
        return trabajador.nombre;
    }
    return "Nombre no disponible";
}

function interpretarMotivo(motivo) {
    if (
        motivo === null ||
        motivo === undefined ||
        String(motivo).trim() === ""
    ) {
        return {
            tipo: "Incidencia",
            codigo: null,
            descripcion:
                "El API no proporcionó un motivo."
        };
    }
    const texto = String(motivo).trim();
    const observacion =
        texto.match(
            /^Observación\s+(\d+)\s*:\s*(.+)$/i
        );
    if (observacion) {
        return {
            tipo: "Observación",
            codigo: observacion[1],
            descripcion:
                observacion[2].trim(),
            textoOriginal:
                texto
        };
    }
    // =====================================================
    // OBSERVACION SIN TILDE
    // =====================================================
    const observacionSinTilde =
        texto.match(
            /^Observacion\s+(\d+)\s*:\s*(.+)$/i
        );
    if (observacionSinTilde) {
        return {
            tipo: "Observación",
            codigo:
                observacionSinTilde[1],
            descripcion:
                observacionSinTilde[2].trim(),
            textoOriginal:
                texto
        };
    }
    // =====================================================
    // IMPEDIMENTO
    //
    // No se limita a uno solo.
    // Cualquier motivo que no tenga formato de observación
    // se conserva exactamente como lo entrega el API.
    // =====================================================
    return {
        tipo: "Impedimento",
        codigo: null,
        descripcion: texto,
        textoOriginal: texto
    };
}

// =========================================================
// AJUSTAR MAPA AUTOMÁTICAMENTE
// =========================================================
function AjustarMapa({
    puntos
}) {
    const map = useMap();
    useEffect(() => {
        if (
            !puntos ||
            puntos.length === 0
        ) {
            return;
        }
        const coordenadas =
            puntos
                .filter(coordenadasValidas)
                .map(p => [
                    Number(p.lat),
                    Number(p.lng)
                ]);
        if (
            coordenadas.length === 0
        ) {
            return;
        }
        const bounds =
            L.latLngBounds(
                coordenadas
            );
        map.fitBounds(
            bounds,
            {
                padding: [50, 50],
                maxZoom: 17
            }
        );
    }, [
        puntos,
        map
    ]);
    return null;
}

// =========================================================
// HEATMAP
// =========================================================
function HeatmapLayer({
    puntos
}) {
    const map = useMap();
    useEffect(() => {
        if (
            !puntos ||
            puntos.length === 0
        ) {
            return;
        }
        const datos =
            puntos
                .filter(coordenadasValidas)
                .map(p => [
                    Number(p.lat),
                    Number(p.lng),
                    Number(p.peso) || 1
                ]);
        if (
            datos.length === 0
        ) {
            return;
        }
        const layer =
            L.heatLayer(
                datos,
                {
                    radius: 40,
                    blur: 25,
                    maxZoom: 17,
                    minOpacity: 0.35
                }
            );
        layer.addTo(map);
        return () => {
            if (
                map.hasLayer(layer)
            ) {
                map.removeLayer(
                    layer
                );
            }
        };
    }, [
        puntos,
        map
    ]);
    return null;
}

// =========================================================
// COMPONENTE PRINCIPAL
// =========================================================
export default function Mapa({
    filtros,
    onLoadingChange
}) {
    // =====================================================
    // FILTROS
    // =====================================================
    const {
        fecha_inicio = "",
        fecha_fin = "",
        periodo = "",
        zona_id = "",
        cmetfac = "",
        capa = "discrepancias"
    } = filtros || {};
    // =====================================================
    // ESTADOS
    // =====================================================
    const [
        discrepancias,
        setDiscrepancias
    ] = useState([]);
    const [
        heatmap,
        setHeatmap
    ] = useState([]);
    const [
        personal,
        setPersonal
    ] = useState([]);
    // =====================================================
    // ESTOS VALORES SON LOS QUE ENTREGA EL API
    // NO SE CALCULAN CON LENGTH
    // =====================================================
    const [
        totalDiscrepancias,
        setTotalDiscrepancias
    ] = useState(0);
    const [
        totalHeatmap,
        setTotalHeatmap
    ] = useState(0);
    const [
        loading,
        setLoading
    ] = useState(false);
    const [
        error,
        setError
    ] = useState("");
    // =====================================================
    // CARGAR DATOS
    // =====================================================
    useEffect(() => {
        let activo = true;
        async function cargarDatos() {
            try {
                setLoading(true);
                if (onLoadingChange) {
                    onLoadingChange(true);
                }
                setError("");
                // =================================================
                // FILTROS EXACTAMENTE COMO LOS ACEPTA EL API
                //
                // periodo y fecha_inicio/fecha_fin son excluyentes.
                // La lógica de exclusión ya vive en el service
                // (mapaLecturaService.js), así que basta con pasar
                // todos los valores tal cual.
                // =================================================
                const filtrosAPI = {
                    fecha_inicio,
                    fecha_fin,
                    periodo,
                    zona_id,
                    cmetfac
                };
                // =================================================
                // CAPA DISCREPANCIAS
                // =================================================
                if (
                    capa === "discrepancias"
                ) {
                    // ---------------------------------------------
                    // PERSONAL
                    // ---------------------------------------------
                    const personalData =
                        await obtenerPersonal();
                    if (activo) {
                        setPersonal(
                            Array.isArray(
                                personalData
                            )
                                ?
                                personalData
                                :
                                []
                        );
                    }
                    // ---------------------------------------------
                    // DISCREPANCIAS
                    // ---------------------------------------------
                    const data =
                        await obtenerDiscrepancias(
                            filtrosAPI
                        );
                    if (!activo) {
                        return;
                    }
                    const elementos =
                        Array.isArray(
                            data?.elementos
                        )
                            ?
                            data.elementos
                            :
                            [];
                    setDiscrepancias(
                        elementos
                    );
                    // =================================================
                    // IMPORTANTE:
                    // EL TOTAL VIENE DEL API
                    //
                    // NO:
                    // elementos.length
                    //
                    // SÍ:
                    // data.total_discrepancias
                    // =================================================
                    setTotalDiscrepancias(
                        Number(
                            data?.total_discrepancias
                        ) || 0
                    );
                    // Limpiar heatmap anterior
                    setHeatmap([]);
                    setTotalHeatmap(0);
                }
                // =================================================
                // CAPA HEATMAP
                // =================================================
                if (
                    capa === "heatmap"
                ) {
                    // ---------------------------------------------
                    // HEATMAP
                    // ---------------------------------------------
                    const data =
                        await obtenerHeatmapImpedimentos(
                            filtrosAPI
                        );
                    if (!activo) {
                        return;
                    }
                    const puntos =
                        Array.isArray(
                            data?.puntos
                        )
                            ?
                            data.puntos
                            :
                            [];
                    setHeatmap(
                        puntos
                    );
                    // =================================================
                    // IMPORTANTE:
                    // EL TOTAL VIENE DEL API
                    // =================================================
                    setTotalHeatmap(
                        Number(
                            data?.total_puntos_calor
                        ) || 0
                    );
                    // Limpiar discrepancias anteriores
                    setDiscrepancias([]);
                    setTotalDiscrepancias(0);
                }
            }
            catch (err) {
                console.error(
                    "Error cargando mapa:",
                    err
                );
                if (activo) {
                    setError(
                        err?.message ||
                        "No se pudieron cargar los datos del mapa."
                    );
                    setDiscrepancias([]);
                    setHeatmap([]);
                    setTotalDiscrepancias(0);
                    setTotalHeatmap(0);
                }
            }
            finally {
                if (activo) {
                    setLoading(false);
                    if (onLoadingChange) {
                        onLoadingChange(false);
                    }
                }
            }
        }
        cargarDatos();
        return () => {
            activo = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        fecha_inicio,
        fecha_fin,
        periodo,
        zona_id,
        cmetfac,
        capa
    ]);
    // =========================================================
    // PUNTOS PARA CENTRAR EL MAPA
    // =========================================================
    const puntosMapa =
        useMemo(() => {
            // ---------------------------------------------
            // DISCREPANCIAS
            // ---------------------------------------------
            if (
                capa === "discrepancias"
            ) {
                return (
                    discrepancias
                        .flatMap(
                            d => [
                                d?.real,
                                d?.teorica
                            ]
                        )
                        .filter(
                            coordenadasValidas
                        )
                );
            }
            // ---------------------------------------------
            // HEATMAP
            // ---------------------------------------------
            return (
                heatmap
                    .filter(
                        coordenadasValidas
                    )
            );
        }, [
            capa,
            discrepancias,
            heatmap
        ]);
    // =========================================================
    // CANTIDAD DE DISCREPANCIAS SIN TEÓRICA
    //
    // Esto NO modifica el total del API.
    // Solo sirve para explicar la información faltante.
    // =========================================================
    const cantidadSinTeorica =
        useMemo(() => {
            return discrepancias.filter(
                d =>
                    !coordenadasValidas(
                        d?.teorica
                    )
            ).length;
        }, [
            discrepancias
        ]);
    // =========================================================
    // CANTIDAD CON AMBAS COORDENADAS
    // =========================================================
    const cantidadConAmbasCoordenadas =
        useMemo(() => {
            return discrepancias.filter(
                d =>
                    coordenadasValidas(
                        d?.real
                    ) &&
                    coordenadasValidas(
                        d?.teorica
                    )
            ).length;
        }, [
            discrepancias
        ]);
    // =========================================================
    // RENDER
    // =========================================================
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-left">
            {/* =================================================
                CABECERA
            ================================================= */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-blue-50 text-[#006cb7] rounded-xl shrink-0">
                        <MapPin size={18} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                            Mapa Geoespacial
                        </h2>
                        <p className="text-[10px] text-slate-400 mt-1">
                            {
                                capa === "discrepancias"
                                    ? "Auditoría de ubicación real frente a ubicación teórica"
                                    : "Mapa de calor de impedimentos e incidencias"
                            }
                        </p>
                    </div>
                </div>
                {/* =================================================
                    CONTADORES
                ================================================= */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {
                        capa === "discrepancias" && (
                            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 text-red-700 px-3 py-1.5 text-[10px] font-bold whitespace-nowrap">
                                {totalDiscrepancias} discrepancias
                            </span>
                        )
                    }
                    {
                        capa === "heatmap" && (
                            <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 text-orange-700 px-3 py-1.5 text-[10px] font-bold whitespace-nowrap">
                                {totalHeatmap} puntos de calor
                            </span>
                        )
                    }
                    {
                        loading && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 text-[#006cb7] px-3 py-1.5 text-[10px] font-bold whitespace-nowrap">
                                <Loader2 size={12} className="animate-spin" />
                                Cargando...
                            </span>
                        )
                    }
                </div>
            </div>
            {/* =================================================
                ERROR
            ================================================= */}
            {
                error && (
                    <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-white text-red-600 shrink-0">
                                <XCircle size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-red-700">
                                    Error al cargar el mapa
                                </p>
                                <p className="text-[11px] text-red-600 mt-1 leading-relaxed">
                                    {error}
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }           
            {/* =================================================
                LEYENDA
            ================================================= */}
            <div className="flex flex-wrap gap-5 mb-4 text-[11px] text-slate-500">
                {
                    capa === "discrepancias" && (
                        <>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="font-medium">Ubicación real</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="font-medium">Ubicación teórica</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-8 border-t-2 border-dashed border-red-500" />
                                <span className="font-medium">Desfase</span>
                            </div>
                        </>
                    )
                }
                {
                    capa === "heatmap" && (
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-orange-500" />
                            <span className="font-medium">Incidencia / impedimento</span>
                        </div>
                    )
                }
            </div>
            {/* =================================================
                MAPA
            ================================================= */}
            <div className="h-[650px] rounded-xl overflow-hidden border border-slate-200">
                <MapContainer
                    center={
                        CENTRO_AREQUIPA
                    }
                    zoom={14}
                    className="h-full w-full"
                >
                    <TileLayer
                        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap"
                    />
                    <AjustarMapa
                        puntos={puntosMapa}
                    />
                    {/* =================================================
                        CAPA DISCREPANCIAS
                    ================================================= */}
                    {
                        capa === "discrepancias" && (
                            <>
                                {
                                    discrepancias.map(
                                        (d, index) => {
                                            const realValida =
                                                coordenadasValidas(
                                                    d?.real
                                                );
                                            const teoricaValida =
                                                coordenadasValidas(
                                                    d?.teorica
                                                );
                                            const nombreTrabajador =
                                                obtenerNombreTrabajador(
                                                    d?.trabajador_id,
                                                    personal
                                                );
                                            const key =
                                                `${d?.ccodcnx || "sin-id"}-${d?.trabajador_id || "sin-trabajador"}-${index}`;
                                            return (
                                                <div
                                                    key={key}
                                                >
                                                    {/* ============================================
                                                        PUNTO REAL
                                                    ============================================ */}
                                                    {
                                                        realValida && (
                                                            <Marker
                                                                position={[
                                                                    Number(
                                                                        d.real.lat
                                                                    ),
                                                                    Number(
                                                                        d.real.lng
                                                                    )
                                                                ]}
                                                                icon={
                                                                    iconReal
                                                                }
                                                            >
                                                                {/* =================================
                                                                    TOOLTIP AL PASAR MOUSE
                                                                ================================= */}
                                                                <Tooltip
                                                                    direction="top"
                                                                    offset={[
                                                                        0,
                                                                        -35
                                                                    ]}
                                                                >
                                                                    <div className="text-[11px] min-w-[210px] leading-relaxed">
                                                                        <p className="text-[11px] font-bold text-red-700 mb-1.5 flex items-center gap-1.5">
                                                                            <MapPin size={12} /> Punto real
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-500">
                                                                            Suministro
                                                                        </p>
                                                                        <p className="font-semibold text-slate-700 mb-1">
                                                                            {d?.ccodcnx || "No disponible"}
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-500">
                                                                            Trabajador
                                                                        </p>
                                                                        <p className="font-semibold text-slate-700 mb-1">
                                                                            {nombreTrabajador}
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-500">
                                                                            Distancia
                                                                        </p>
                                                                        <p className="font-semibold text-slate-700">
                                                                            {formatearDistancia(
                                                                                d?.distancia_metros
                                                                            )}
                                                                        </p>
                                                                        <p className="mt-1.5 text-red-700 font-bold">
                                                                            {d?.resultado || "Fuera de Punto"}
                                                                        </p>
                                                                    </div>
                                                                </Tooltip>
                                                                {/* =================================
                                                                    POPUP
                                                                ================================= */}
                                                                <Popup>
                                                                    <div className="w-[270px] text-[11px] leading-relaxed">
                                                                        <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5">
                                                                            <MapPin size={13} /> Ubicación real registrada
                                                                        </p>
                                                                        <div className="space-y-2.5">
                                                                            <div>
                                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                                    ID suministro
                                                                                </p>
                                                                                <p className="font-semibold text-slate-700 mt-0.5">
                                                                                    {d?.ccodcnx || "No disponible"}
                                                                                </p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                                    Trabajador
                                                                                </p>
                                                                                <p className="font-semibold text-slate-700 mt-0.5">
                                                                                    {nombreTrabajador}
                                                                                </p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                                    Código trabajador
                                                                                </p>
                                                                                <p className="font-semibold text-slate-700 mt-0.5">
                                                                                    {d?.trabajador_id || "No disponible"}
                                                                                </p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                                    Distancia calculada
                                                                                </p>
                                                                                <p className="font-bold text-red-700 mt-0.5">
                                                                                    {formatearDistancia(
                                                                                        d?.distancia_metros
                                                                                    )}
                                                                                </p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                                                                                    Resultado
                                                                                </p>
                                                                                <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 text-red-700 px-2.5 py-1 text-[10px] font-bold">
                                                                                    {d?.resultado || "Fuera de Punto"}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-3 pt-3 border-t border-slate-200">
                                                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                                                                                ¿Por qué aparece?
                                                                            </p>
                                                                            <p className="text-slate-600">
                                                                                Se clasificó esta lectura como{" "}
                                                                                <strong className="text-slate-700">Fuera de Punto</strong> y entregó una distancia de{" "}
                                                                                <strong className="text-slate-700">
                                                                                    {formatearDistancia(
                                                                                        d?.distancia_metros
                                                                                    )}
                                                                                </strong>.
                                                                            </p>
                                                                            <p className="mt-2 text-slate-600">
                                                                                La coordenada mostrada es la ubicación real recibida.
                                                                            </p>
                                                                        </div>
                                                                        <div className="mt-3 pt-3 border-t border-slate-200 text-[10px] text-slate-400">
                                                                            Coordenadas
                                                                            <br />
                                                                            Lat: {formatearCoordenada(d?.real?.lat)}
                                                                            <br />
                                                                            Lng: {formatearCoordenada(d?.real?.lng)}
                                                                        </div>
                                                                    </div>
                                                                </Popup>
                                                            </Marker>
                                                        )
                                                    }
                                                    {/* ============================================
                                                        PUNTO TEÓRICO
                                                    ============================================ */}
                                                    {
                                                        teoricaValida && (
                                                            <Marker
                                                                position={[
                                                                    Number(
                                                                        d.teorica.lat
                                                                    ),
                                                                    Number(
                                                                        d.teorica.lng
                                                                    )
                                                                ]}
                                                                icon={
                                                                    iconTeorica
                                                                }
                                                            >
                                                                <Tooltip
                                                                    direction="top"
                                                                    offset={[
                                                                        0,
                                                                        -35
                                                                    ]}
                                                                >
                                                                    <div className="text-[11px] min-w-[200px] leading-relaxed">
                                                                        <p className="text-[11px] font-bold text-blue-700 mb-1.5 flex items-center gap-1.5">
                                                                            <MapPin size={12} /> Punto teórico
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-500">
                                                                            Suministro
                                                                        </p>
                                                                        <p className="font-semibold text-slate-700">
                                                                            {d?.ccodcnx || "No disponible"}
                                                                        </p>
                                                                    </div>
                                                                </Tooltip>
                                                                <Popup>
                                                                    <div className="w-[260px] text-[11px] leading-relaxed">
                                                                        <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1.5">
                                                                            <MapPin size={13} /> Ubicación teórica
                                                                        </p>
                                                                        <div className="space-y-2.5">
                                                                            <div>
                                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                                    ID suministro
                                                                                </p>
                                                                                <p className="font-semibold text-slate-700 mt-0.5">
                                                                                    {d?.ccodcnx || "No disponible"}
                                                                                </p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                                    Latitud
                                                                                </p>
                                                                                <p className="font-semibold text-slate-700 mt-0.5">
                                                                                    {formatearCoordenada(d?.teorica?.lat)}
                                                                                </p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                                    Longitud
                                                                                </p>
                                                                                <p className="font-semibold text-slate-700 mt-0.5">
                                                                                    {formatearCoordenada(d?.teorica?.lng)}
                                                                                </p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                                    Distancia reportada
                                                                                </p>
                                                                                <p className="font-semibold text-slate-700 mt-0.5">
                                                                                    {formatearDistancia(d?.distancia_metros)}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-3 pt-3 border-t border-slate-200 text-slate-600">
                                                                            La línea punteada conecta la ubicación teórica con la ubicación real.
                                                                        </div>
                                                                    </div>
                                                                </Popup>
                                                            </Marker>
                                                        )
                                                    }
                                                    {/* ============================================
                                                        LÍNEA DE DESFASE
                                                    ============================================ */}
                                                    {
                                                        realValida &&
                                                        teoricaValida && (
                                                            <Polyline
                                                                positions={[
                                                                    [
                                                                        Number(
                                                                            d.teorica.lat
                                                                        ),
                                                                        Number(
                                                                            d.teorica.lng
                                                                        )
                                                                    ],
                                                                    [
                                                                        Number(
                                                                            d.real.lat
                                                                        ),
                                                                        Number(
                                                                            d.real.lng
                                                                        )
                                                                    ]
                                                                ]}
                                                                pathOptions={{
                                                                    color: "#dc2626",
                                                                    weight: 3,
                                                                    dashArray:
                                                                        "10,10",
                                                                    opacity: 0.8
                                                                }}
                                                            />
                                                        )
                                                    }
                                                </div>
                                            );
                                        }
                                    )
                                }
                            </>
                        )
                    }
                    {/* =================================================
                        CAPA HEATMAP
                    ================================================= */}
                    {
                        capa === "heatmap" && (
                            <>
                                <HeatmapLayer
                                    puntos={heatmap}
                                />
                                {
                                    heatmap
                                        .filter(
                                            coordenadasValidas
                                        )
                                        .map(
                                            (p, index) => {
                                                const info =
                                                    interpretarMotivo(
                                                        p?.motivo
                                                    );
                                                const key =
                                                    `${p?.ccodcnx || "sin-id"}-${index}`;
                                                return (
                                                    <CircleMarker
                                                        key={key}
                                                        center={[
                                                            Number(
                                                                p.lat
                                                            ),
                                                            Number(
                                                                p.lng
                                                            )
                                                        ]}
                                                        radius={8}
                                                        pathOptions={{
                                                            color: "#c2410c",
                                                            fillColor: "#f97316",
                                                            fillOpacity: 0.85,
                                                            weight: 2
                                                        }}
                                                    >
                                                        {/* =================================
                                                            TOOLTIP
                                                        ================================= */}
                                                        <Tooltip
                                                            direction="top"
                                                            offset={[
                                                                0,
                                                                -8
                                                            ]}
                                                        >
                                                            <div className="text-[11px] min-w-[220px] leading-relaxed">
                                                                <p className="text-[11px] font-bold text-orange-700 mb-1.5 flex items-center gap-1.5">
                                                                    <AlertTriangle size={12} /> {info.tipo}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500">
                                                                    Suministro
                                                                </p>
                                                                <p className="font-semibold text-slate-700 mb-1">
                                                                    {p?.ccodcnx || "No disponible"}
                                                                </p>
                                                                {
                                                                    info.codigo && (
                                                                        <>
                                                                            <p className="text-[10px] text-slate-500">
                                                                                Código
                                                                            </p>
                                                                            <p className="font-semibold text-slate-700 mb-1">
                                                                                {info.codigo}
                                                                            </p>
                                                                        </>
                                                                    )
                                                                }
                                                                <p className="text-[10px] text-slate-500">
                                                                    Motivo
                                                                </p>
                                                                <p className="font-semibold text-slate-700">
                                                                    {info.descripcion}
                                                                </p>
                                                            </div>
                                                        </Tooltip>
                                                        {/* =================================
                                                            POPUP
                                                        ================================= */}
                                                        <Popup>
                                                            <div className="w-[280px] text-[11px] leading-relaxed">
                                                                <p className="text-xs font-bold text-orange-700 mb-2 flex items-center gap-1.5">
                                                                    <AlertTriangle size={13} /> Detalle de incidencia
                                                                </p>
                                                                <div className="space-y-2.5">
                                                                    {/* ---------------------------------
                                                                        SUMINISTRO
                                                                    --------------------------------- */}
                                                                    <div>
                                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                            ID suministro
                                                                        </p>
                                                                        <p className="font-semibold text-slate-700 mt-0.5">
                                                                            {p?.ccodcnx || "No disponible"}
                                                                        </p>
                                                                    </div>
                                                                    {/* ---------------------------------
                                                                        TIPO
                                                                    --------------------------------- */}
                                                                    <div>
                                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                                                                            Tipo
                                                                        </p>
                                                                        <span
                                                                            className={`
                                                                                inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold
                                                                                ${
                                                                                    info.tipo === "Observación"
                                                                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                                                                        : "bg-orange-50 text-orange-700 border-orange-200"
                                                                                }
                                                                            `}
                                                                        >
                                                                            {info.tipo}
                                                                        </span>
                                                                    </div>
                                                                    {/* ---------------------------------
                                                                        CÓDIGO
                                                                    --------------------------------- */}
                                                                    {
                                                                        info.codigo && (
                                                                            <div>
                                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                                    Código de observación
                                                                                </p>
                                                                                <p className="font-semibold text-slate-700 mt-0.5">
                                                                                    {info.codigo}
                                                                                </p>
                                                                            </div>
                                                                        )
                                                                    }
                                                                    {/* ---------------------------------
                                                                        MOTIVO
                                                                    --------------------------------- */}
                                                                    <div>
                                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                            Motivo exacto
                                                                        </p>
                                                                        <p className="text-slate-700 mt-0.5">
                                                                            {p?.motivo || "No disponible"}
                                                                        </p>
                                                                    </div>
                                                                    {/* ---------------------------------
                                                                        DESCRIPCIÓN
                                                                    --------------------------------- */}
                                                                    {
                                                                        info.codigo && (
                                                                            <div>
                                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                                    Descripción
                                                                                </p>
                                                                                <p className="text-slate-700 mt-0.5">
                                                                                    {info.descripcion}
                                                                                </p>
                                                                            </div>
                                                                        )
                                                                    }
                                                                    {/* ---------------------------------
                                                                        CMETFAC
                                                                    --------------------------------- */}
                                                                    <div>
                                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                            Sector de facturación
                                                                        </p>
                                                                        <p className="font-semibold text-slate-700 mt-0.5">
                                                                            {p?.cmetfac || "No disponible"}
                                                                        </p>
                                                                    </div>
                                                                    {/* ---------------------------------
                                                                        PESO
                                                                    --------------------------------- */}
                                                                    <div>
                                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                            Peso
                                                                        </p>
                                                                        <p className="font-semibold text-slate-700 mt-0.5">
                                                                            {p?.peso ?? 1}
                                                                        </p>
                                                                    </div>
                                                                    {/* ---------------------------------
                                                                        FECHA
                                                                    --------------------------------- */}
                                                                    <div>
                                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                            Fecha
                                                                        </p>
                                                                        <p className="font-semibold text-slate-700 mt-0.5">
                                                                            {
                                                                                p?.fecha ||
                                                                                p?.fecha_lectura ||
                                                                                p?.fecha_registro ||
                                                                                "No proporcionada por este endpoint"
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                    {/* ---------------------------------
                                                                        TRABAJADOR
                                                                    --------------------------------- */}
                                                                    <div>
                                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                            Lector
                                                                        </p>
                                                                        <p className="font-semibold text-slate-700 mt-0.5">
                                                                            {
                                                                                p?.trabajador_id ||
                                                                                p?.ccodprs ||
                                                                                p?.trabajador ||
                                                                                "No proporcionado por este endpoint"
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {/* ---------------------------------
                                                                    EXPLICACIÓN
                                                                --------------------------------- */}
                                                                <div className="mt-3 pt-3 border-t border-slate-200">
                                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                                                                        ¿Qué significa este punto?
                                                                    </p>
                                                                    {
                                                                        info.tipo === "Observación"
                                                                            ? (
                                                                                <p className="text-slate-600">
                                                                                    El registro corresponde a una{" "}
                                                                                    <strong className="text-slate-700">observación</strong> identificada con el código{" "}
                                                                                    <strong className="text-slate-700">{info.codigo}</strong>.
                                                                                    El motivo registrado es:{" "}
                                                                                    <strong className="text-slate-700">{info.descripcion}</strong>.
                                                                                </p>
                                                                            )
                                                                            : (
                                                                                <p className="text-slate-600">
                                                                                    El registro corresponde a un{" "}
                                                                                    <strong className="text-slate-700">impedimento</strong> o incidencia reportada.
                                                                                    El motivo recibido es:{" "}
                                                                                    <strong className="text-slate-700">{info.descripcion}</strong>.
                                                                                </p>
                                                                            )
                                                                    }
                                                                    <p className="mt-2 text-[10px] text-slate-400">
                                                                        La clasificación mostrada se basa en el campo{" "}
                                                                        <strong className="text-slate-500">motivo</strong> que devuelve el endpoint.
                                                                    </p>
                                                                </div>
                                                                {/* ---------------------------------
                                                                    COORDENADAS
                                                                --------------------------------- */}
                                                                <div className="mt-3 pt-3 border-t border-slate-200 text-[10px] text-slate-400">
                                                                    Coordenadas
                                                                    <br />
                                                                    Lat: {formatearCoordenada(p?.lat)}
                                                                    <br />
                                                                    Lng: {formatearCoordenada(p?.lng)}
                                                                </div>
                                                            </div>
                                                        </Popup>
                                                    </CircleMarker>
                                                );
                                            }
                                        )
                                }
                            </>
                        )
                    }
                </MapContainer>
            </div>
        </div>
    );
}