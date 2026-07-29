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
    XCircle,
    Map as MapIcon
} from "lucide-react";
import {
    obtenerPersonal,
    obtenerDiscrepancias,
    obtenerHeatmapImpedimentos,
    obtenerGruposFacturacion,
} from "../services/mapaLecturaService";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
// =========================================================
// ICONOS
// =========================================================
const iconReal = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
const iconTeorica = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
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
// BUSCAR TRABAJADOR
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
            String(persona.ccodprs) ===
            String(trabajadorId)
    );
    return trabajador?.nombre ||
        "Nombre no disponible";
}
// =========================================================
// INTERPRETAR MOTIVO
// =========================================================
function interpretarMotivo(motivo) {
    if (!motivo) {
        return {
            tipo: "Incidencia",
            codigo: null,
            descripcion: "Sin motivo informado por el API."
        };
    }
    const texto = String(motivo).trim();
    // Ejemplo:
    // Observación 54: CAMBIAR MEDIDOR
    const observacion =
        texto.match(
            /^Observación\s+(\d+)\s*:\s*(.*)$/i
        );
    if (observacion) {
        return {
            tipo: "Observación",
            codigo: observacion[1],
            descripcion: observacion[2].trim()
        };
    }
    // Cualquier impedimento que llegue desde el API
    // se muestra como impedimento.
    //
    // NO se limita solamente a "Lote Cerrado".
    const impedimentos = [
        "lote cerrado",
        "casa cerrada",
        "predio cerrado",
        "puerta cerrada",
        "medidor inaccesible",
        "acceso restringido",
        "no se pudo acceder",
        "sin acceso"
    ];
    const esImpedimento =
        impedimentos.some(
            palabra =>
                texto.toLowerCase().includes(palabra)
        );
    if (esImpedimento) {
        return {
            tipo: "Impedimento",
            codigo: null,
            descripcion: texto
        };
    }
    return {
        tipo: "Incidencia",
        codigo: null,
        descripcion: texto
    };
}
// =========================================================
// AJUSTAR MAPA
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
        if (coordenadas.length === 0) {
            return;
        }
        const bounds =
            L.latLngBounds(coordenadas);
        map.fitBounds(
            bounds,
            {
                padding: [40, 40],
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
        if (datos.length === 0) {
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
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
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
export default function MapaRutas({
    fecha_inicio = "2026-06-30",
    fecha_fin = "2026-06-30",
    trabajadorSeleccionado = "TODOS",
    zona_id = "",
    cmetfac = "",
    modo = "discrepancias"
}) {
    // =====================================================
    // ESTADOS
    // =====================================================
    const [
        personal,
        setPersonal
    ] = useState([]);
    const [
        discrepancias,
        setDiscrepancias
    ] = useState([]);
    const [
        heatmap,
        setHeatmap
    ] = useState([]);
    const [
        loading,
        setLoading
    ] = useState(false);
    const [
        error,
        setError
    ] = useState("");
    const [
        totalDiscrepancias,
        setTotalDiscrepancias
    ] = useState(0);
    const [
        totalHeatmap,
        setTotalHeatmap
    ] = useState(0);
    // =====================================================
    // CARGAR PERSONAL
    // =====================================================
    useEffect(() => {
        let activo = true;
        const cargarPersonal = async () => {
            try {
                const data =
                    await obtenerPersonal();
                if (!activo) {
                    return;
                }
                setPersonal(
                    Array.isArray(data)
                        ? data
                        : []
                );
            }
            catch (err) {
                console.error(
                    "Error cargando personal:",
                    err
                );
            }
        };
        cargarPersonal();
        return () => {
            activo = false;
        };
    }, []);
    // =====================================================
    // CARGAR MAPA
    // =====================================================
    useEffect(() => {
        let activo = true;
        const cargarDatos = async () => {
            try {
                setLoading(true);
                setError("");
                const filtrosAPI = {
                    fecha_inicio,
                    fecha_fin,
                    zona_id:
                        zona_id === "TODOS"
                            ? ""
                            : zona_id,
                    cmetfac:
                        cmetfac === "TODOS"
                            ? ""
                            : cmetfac
                };
                // =================================================
                // DISCREPANCIAS
                // =================================================
                if (
                    modo === "discrepancias"
                ) {
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
                            ? data.elementos
                            : [];
                    /*
                     * IMPORTANTE:
                     *
                     * El total NO se calcula en Frontend.
                     *
                     * Se utiliza directamente:
                     *
                     * data.total_discrepancias
                     *
                     * que viene calculado por el API.
                     */
                    setTotalDiscrepancias(
                        Number(
                            data?.total_discrepancias
                        ) || 0
                    );
                    setDiscrepancias(
                        elementos
                    );
                    setHeatmap([]);
                    setTotalHeatmap(0);
                }
                // =================================================
                // HEATMAP
                // =================================================
                if (
                    modo === "heatmap"
                ) {
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
                            ? data.puntos
                            : [];
                    /*
                     * El total también viene directamente
                     * calculado por el API.
                     */
                    setTotalHeatmap(
                        Number(
                            data?.total_puntos_calor
                        ) || 0
                    );
                    setHeatmap(
                        puntos
                    );
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
                }
            }
            finally {
                if (activo) {
                    setLoading(false);
                }
            }
        };
        cargarDatos();
        return () => {
            activo = false;
        };
    }, [
        fecha_inicio,
        fecha_fin,
        zona_id,
        cmetfac,
        modo
    ]);
    // =====================================================
    // FILTRAR DISCREPANCIAS POR TRABAJADOR
    // =====================================================
    const discrepanciasMostrar =
        useMemo(() => {
            if (
                trabajadorSeleccionado === "TODOS" ||
                !trabajadorSeleccionado
            ) {
                return discrepancias;
            }
            return discrepancias.filter(
                d =>
                    String(d.trabajador_id) ===
                    String(trabajadorSeleccionado)
            );
        }, [
            discrepancias,
            trabajadorSeleccionado
        ]);
    // =====================================================
    // PUNTOS PARA CENTRAR MAPA
    // =====================================================
    const puntosMapa =
        useMemo(() => {
            if (
                modo === "discrepancias"
            ) {
                return discrepanciasMostrar
                    .flatMap(d => [
                        d.real,
                        d.teorica
                    ])
                    .filter(
                        coordenadasValidas
                    );
            }
            return heatmap
                .filter(
                    coordenadasValidas
                );
        }, [
            modo,
            discrepanciasMostrar,
            heatmap
        ]);
    // =====================================================
    // CANTIDAD DE REGISTROS SIN TEÓRICA
    // =====================================================
    const sinTeorica =
        discrepanciasMostrar.filter(
            d =>
                !coordenadasValidas(
                    d.teorica
                )
        ).length;
    // =====================================================
    // RENDER
    // =====================================================
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-left">
            {/* =================================================
                ENCABEZADO
            ================================================= */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-blue-50 text-[#006cb7] rounded-xl shrink-0">
                        <MapIcon size={18} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                            Supervisión GIS
                        </h2>
                        <p className="text-[10px] text-slate-400 mt-1">
                            {
                                modo === "discrepancias"
                                    ? "Auditoría de ubicaciones fuera de punto"
                                    : "Mapa de calor de impedimentos e incidencias"
                            }
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {
                        modo === "discrepancias" && (
                            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 text-red-700 px-3 py-1.5 text-[10px] font-bold whitespace-nowrap">
                                {totalDiscrepancias} discrepancias detectadas por API
                            </span>
                        )
                    }
                    {
                        modo === "heatmap" && (
                            <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 text-orange-700 px-3 py-1.5 text-[10px] font-bold whitespace-nowrap">
                                {totalHeatmap} puntos de calor calculados por API
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
                EXPLICACIÓN DISCREPANCIAS
            ================================================= */}
            {
                modo === "discrepancias" && (
                    <div className="mb-5 bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-white text-[#006cb7] shrink-0 mt-0.5">
                                <Info size={15} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-700">
                                    ¿Qué significa "Fuera de Punto"?
                                </p>
                                <p className="text-[11px] text-slate-600 leading-relaxed mt-1.5">
                                    El endpoint <strong className="text-slate-700">/api/maps/discrepancias</strong> devuelve las lecturas que el Backend ha identificado como discrepancias espaciales, utilizando su propia validación de distancia. El Frontend solamente representa los resultados entregados por el API y no vuelve a calcular el total.
                                </p>
                                {
                                    sinTeorica > 0 && (
                                        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5">
                                            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                            <p className="text-[11px] text-amber-700 leading-relaxed">
                                                Hay <strong className="text-amber-800">{sinTeorica}</strong> registro(s) sin coordenada teórica disponible.
                                                En estos casos el Frontend muestra únicamente la ubicación real porque el API devuelve{" "}
                                                <code className="text-[10px] bg-amber-100 px-1 py-0.5 rounded">lat: null, lng: null</code>.
                                                No se inventa ni se estima una ubicación teórica.
                                            </p>
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                )
            }
            {/* =================================================
                EXPLICACIÓN HEATMAP
            ================================================= */}
            {
                modo === "heatmap" && (
                    <div className="mb-5 bg-orange-50 border border-orange-100 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-white text-orange-600 shrink-0 mt-0.5">
                                <Flame size={15} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-700">
                                    ¿Qué representa este mapa?
                                </p>
                                <p className="text-[11px] text-slate-600 leading-relaxed mt-1.5">
                                    El endpoint <strong className="text-slate-700">/api/maps/heatmap-impedimentos</strong> devuelve los puntos que el Backend agrupó como zonas con anomalías. El campo <strong className="text-slate-700">peso</strong> es utilizado por el Frontend para determinar la intensidad visual de la capa de calor.
                                </p>
                                <p className="text-[11px] text-slate-600 leading-relaxed mt-2">
                                    El total mostrado arriba corresponde directamente a <strong className="text-slate-700">total_puntos_calor</strong> entregado por el API.
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
                    modo === "discrepancias" && (
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
                                <span className="font-medium">Desfase entre puntos</span>
                            </div>
                        </>
                    )
                }
                {
                    modo === "heatmap" && (
                        <>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-orange-500" />
                                <span className="font-medium">Incidencia / impedimento</span>
                            </div>
                            <span className="text-slate-400">
                                Mayor intensidad = mayor concentración de puntos según el peso recibido.
                            </span>
                        </>
                    )
                }
            </div>
            {/* =================================================
                MAPA
            ================================================= */}
            <div className="h-[650px] rounded-xl overflow-hidden border border-slate-200">
                <MapContainer
                    center={[
                        -16.409,
                        -71.537
                    ]}
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
                        DISCREPANCIAS
                    ================================================= */}
                    {
                        modo === "discrepancias" &&
                        discrepanciasMostrar.map(
                            (d, index) => {
                                const realValida =
                                    coordenadasValidas(
                                        d.real
                                    );
                                const teoricaValida =
                                    coordenadasValidas(
                                        d.teorica
                                    );
                                const nombre =
                                    obtenerNombreTrabajador(
                                        d.trabajador_id,
                                        personal
                                    );
                                return (
                                    <div
                                        key={`${d.ccodcnx}-${d.trabajador_id}-${index}`}
                                    >
                                        {/* =================================
                                            MARCADOR REAL
                                        ================================= */}
                                        {
                                            realValida && (
                                                <Marker
                                                    position={[
                                                        Number(d.real.lat),
                                                        Number(d.real.lng)
                                                    ]}
                                                    icon={iconReal}
                                                >
                                                    <Tooltip
                                                        direction="top"
                                                        offset={[0, -35]}
                                                    >
                                                        <div className="text-[11px] min-w-[200px] leading-relaxed">
                                                            <p className="text-[11px] font-bold text-red-700 mb-1.5 flex items-center gap-1.5">
                                                                <MapPin size={12} /> Punto real
                                                            </p>
                                                            <p className="text-[10px] text-slate-500">Suministro</p>
                                                            <p className="font-semibold text-slate-700 mb-1">{d.ccodcnx}</p>
                                                            <p className="text-[10px] text-slate-500">Trabajador</p>
                                                            <p className="font-semibold text-slate-700 mb-1">{nombre}</p>
                                                            <p className="text-[10px] text-slate-500">Desfase</p>
                                                            <p className="font-semibold text-slate-700">
                                                                {formatearDistancia(d.distancia_metros)}
                                                            </p>
                                                        </div>
                                                    </Tooltip>
                                                    <Popup>
                                                        <div className="w-[280px] text-[11px] leading-relaxed">
                                                            <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5">
                                                                <MapPin size={13} /> Ubicación real
                                                            </p>
                                                            <div className="bg-blue-50 rounded-lg p-3 mb-3 text-slate-600">
                                                                Este punto representa la coordenada real registrada por el lector durante la lectura.
                                                            </div>
                                                            <div className="space-y-2.5">
                                                                <div>
                                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">ID suministro</p>
                                                                    <p className="font-semibold text-slate-700 mt-0.5">{d.ccodcnx}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Código trabajador</p>
                                                                    <p className="font-semibold text-slate-700 mt-0.5">{d.trabajador_id}</p>
                                                                    <p className="text-slate-500">{nombre}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Distancia</p>
                                                                    <p className="font-bold text-red-700 mt-0.5">
                                                                        {formatearDistancia(d.distancia_metros)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Resultado</p>
                                                                    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 text-red-700 px-2.5 py-1 text-[10px] font-bold">
                                                                        {d.resultado || "Fuera de Punto"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="mt-3 pt-3 border-t border-slate-200">
                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                                                                    ¿Por qué aparece?
                                                                </p>
                                                                <p className="text-slate-600">
                                                                    El Backend clasificó esta lectura como{" "}
                                                                    <strong className="text-slate-700">Fuera de Punto</strong> y proporcionó una distancia de{" "}
                                                                    <strong className="text-slate-700">
                                                                        {formatearDistancia(d.distancia_metros)}
                                                                    </strong>.
                                                                </p>
                                                                <p className="mt-2 text-[10px] text-slate-400">
                                                                    El Frontend no recalcula esta distancia: utiliza el valor entregado por el endpoint.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </Popup>
                                                </Marker>
                                            )
                                        }
                                        {/* =================================
                                            MARCADOR TEÓRICO
                                        ================================= */}
                                        {
                                            teoricaValida && (
                                                <Marker
                                                    position={[
                                                        Number(d.teorica.lat),
                                                        Number(d.teorica.lng)
                                                    ]}
                                                    icon={iconTeorica}
                                                >
                                                    <Tooltip
                                                        direction="top"
                                                        offset={[0, -35]}
                                                    >
                                                        <div className="text-[11px] min-w-[200px] leading-relaxed">
                                                            <p className="text-[11px] font-bold text-blue-700 mb-1.5 flex items-center gap-1.5">
                                                                <MapPin size={12} /> Punto teórico
                                                            </p>
                                                            <p className="text-[10px] text-slate-500">Suministro</p>
                                                            <p className="font-semibold text-slate-700 mb-1">{d.ccodcnx}</p>
                                                            <p className="text-slate-500">Ubicación esperada</p>
                                                        </div>
                                                    </Tooltip>
                                                    <Popup>
                                                        <div className="w-[260px] text-[11px] leading-relaxed">
                                                            <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1.5">
                                                                <MapPin size={13} /> Ubicación teórica
                                                            </p>
                                                            <div className="bg-blue-50 rounded-lg p-3 mb-3 text-slate-600">
                                                                Este punto representa la ubicación teórica asociada al suministro, siempre que el API haya proporcionado coordenadas.
                                                            </div>
                                                            <div className="space-y-2.5">
                                                                <div>
                                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">ID suministro</p>
                                                                    <p className="font-semibold text-slate-700 mt-0.5">{d.ccodcnx}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Latitud</p>
                                                                    <p className="font-semibold text-slate-700 mt-0.5">{d.teorica.lat}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Longitud</p>
                                                                    <p className="font-semibold text-slate-700 mt-0.5">{d.teorica.lng}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Distancia al punto real</p>
                                                                    <p className="font-semibold text-slate-700 mt-0.5">
                                                                        {formatearDistancia(d.distancia_metros)}
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
                                        {/* =================================
                                            LÍNEA
                                        ================================= */}
                                        {
                                            realValida &&
                                            teoricaValida && (
                                                <Polyline
                                                    positions={[
                                                        [
                                                            Number(d.teorica.lat),
                                                            Number(d.teorica.lng)
                                                        ],
                                                        [
                                                            Number(d.real.lat),
                                                            Number(d.real.lng)
                                                        ]
                                                    ]}
                                                    pathOptions={{
                                                        color: "#dc2626",
                                                        weight: 3,
                                                        dashArray: "10,10",
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
                    {/* =================================================
                        HEATMAP
                    ================================================= */}
                    {
                        modo === "heatmap" && (
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
                                                        p.motivo
                                                    );
                                                return (
                                                    <CircleMarker
                                                        key={`${p.ccodcnx}-${index}`}
                                                        center={[
                                                            Number(p.lat),
                                                            Number(p.lng)
                                                        ]}
                                                        radius={8}
                                                        pathOptions={{
                                                            color: "#c2410c",
                                                            fillColor: "#f97316",
                                                            fillOpacity: 0.85,
                                                            weight: 2
                                                        }}
                                                    >
                                                        <Tooltip
                                                            direction="top"
                                                            offset={[0, -8]}
                                                        >
                                                            <div className="text-[11px] min-w-[220px] leading-relaxed">
                                                                <p className="text-[11px] font-bold text-orange-700 mb-1.5 flex items-center gap-1.5">
                                                                    <AlertTriangle size={12} /> {info.tipo}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500">Suministro</p>
                                                                <p className="font-semibold text-slate-700 mb-1">{p.ccodcnx}</p>
                                                                <p className="text-[10px] text-slate-500">
                                                                    {info.codigo ? `Código ${info.codigo}` : "Motivo"}
                                                                </p>
                                                                <p className="font-semibold text-slate-700">{info.descripcion}</p>
                                                            </div>
                                                        </Tooltip>
                                                        <Popup>
                                                            <div className="w-[280px] text-[11px] leading-relaxed">
                                                                <p className="text-xs font-bold text-orange-700 mb-2 flex items-center gap-1.5">
                                                                    <AlertTriangle size={13} /> Detalle de incidencia
                                                                </p>
                                                                <div className="bg-orange-50 rounded-lg p-3 mb-3 text-slate-600">
                                                                    Este punto fue proporcionado directamente por el endpoint de heatmap.
                                                                </div>
                                                                <div className="space-y-2.5">
                                                                    <div>
                                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">ID suministro</p>
                                                                        <p className="font-semibold text-slate-700 mt-0.5">{p.ccodcnx}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Tipo</p>
                                                                        <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 text-orange-700 px-2.5 py-1 text-[10px] font-bold">
                                                                            {info.tipo}
                                                                        </span>
                                                                    </div>
                                                                    {
                                                                        info.codigo && (
                                                                            <div>
                                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Código</p>
                                                                                <p className="font-semibold text-slate-700 mt-0.5">{info.codigo}</p>
                                                                            </div>
                                                                        )
                                                                    }
                                                                    <div>
                                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Motivo exacto</p>
                                                                        <p className="text-slate-700 mt-0.5">{p.motivo || "No disponible"}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Sector de facturación</p>
                                                                        <p className="font-semibold text-slate-700 mt-0.5">{p.cmetfac || "No informado"}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Peso</p>
                                                                        <p className="font-semibold text-slate-700 mt-0.5">{p.peso ?? 1}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-3 pt-3 border-t border-slate-200">
                                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                                                                        ¿Qué significa?
                                                                    </p>
                                                                    <p className="text-slate-600">
                                                                        {
                                                                            info.tipo === "Observación"
                                                                                ? (
                                                                                    <>
                                                                                        El API reportó una observación del medidor. En este caso, el código{" "}
                                                                                        <strong className="text-slate-700">{info.codigo}</strong> corresponde a:{" "}
                                                                                        <strong className="text-slate-700">{info.descripcion}</strong>.
                                                                                    </>
                                                                                )
                                                                                : info.tipo === "Impedimento"
                                                                                    ? (
                                                                                        <>
                                                                                            El API reportó un impedimento operativo. El motivo recibido es:{" "}
                                                                                            <strong className="text-slate-700">{info.descripcion}</strong>.
                                                                                        </>
                                                                                    )
                                                                                    : (
                                                                                        <>
                                                                                            El API reportó la incidencia:{" "}
                                                                                            <strong className="text-slate-700">{info.descripcion}</strong>.
                                                                                        </>
                                                                                    )
                                                                        }
                                                                    </p>
                                                                    <p className="mt-2 text-[10px] text-slate-400">
                                                                        El Frontend muestra únicamente los datos entregados por el API. No inventa información adicional.
                                                                    </p>
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