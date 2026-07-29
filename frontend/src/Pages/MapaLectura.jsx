import {
    useRef,
    useState
} from "react";
import { createPortal } from "react-dom";
import {
    Calendar,
    Layers
} from "lucide-react";
import Mapa from "./Mapa";
// =========================================================
// TEXTOS DE EXPLICACIÓN POR CAPA
// =========================================================
const EXPLICACION_CAPA = {
    discrepancias:
        "Devuelve las lecturas cuya distancia entre la ubicación teórica y la ubicación real supera los 50 metros. El total que aparece en el mapa corresponde directamente a total_discrepancias del API.",
    heatmap:
        "El API agrupa las zonas con mayor concentración de anomalías. El total mostrado corresponde directamente a total_puntos_calor del API."
};
// =========================================================
// TOOLTIP (vía portal, no se corta por overflow)
// =========================================================
function TooltipCapa({
    texto,
    children
}) {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({
        top: 0,
        left: 0
    });
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
        setCoords({
            top: rect.bottom + 8,
            left
        });
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
                            zIndex: 9999
                        }}
                        className="pointer-events-none rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xl"
                    >
                        <p className="text-[11px] leading-relaxed text-slate-600">
                            {texto}
                        </p>
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
    // FILTROS QUE EL USUARIO ESTÁ EDITANDO
    // =====================================================
    const [filtros, setFiltros] = useState({
        fecha_inicio: "2026-06-30",
        fecha_fin: "2026-06-30",
        zona_id: "",
        cmetfac: "",
        capa: "discrepancias"
    });
    // =====================================================
    // FILTROS QUE REALMENTE SE ENVÍAN AL MAPA
    // =====================================================
    const [filtrosAplicados, setFiltrosAplicados] = useState({
        fecha_inicio: "2026-06-30",
        fecha_fin: "2026-06-30",
        zona_id: "",
        cmetfac: "",
        capa: "discrepancias"
    });
    // =====================================================
    // DATOS DE LOS SELECTORES
    // =====================================================
    /*
     * IMPORTANTE:
     *
     * Estos valores son solamente opciones visuales del Frontend.
     * El API recibe zona_id y cmetfac como strings.
     *
     * Si posteriormente tienes un endpoint de catálogos para zonas
     * o sectores, podemos reemplazar estas listas por datos del API.
     */
    const sectores = [
        {
            value: "",
            label: "Todos los sectores"
        },
        {
            value: "1001",
            label: "1001"
        },
        {
            value: "1002",
            label: "1002"
        },
        {
            value: "1003",
            label: "1003"
        },
        {
            value: "1004",
            label: "1004"
        },
        {
            value: "1005",
            label: "1005"
        },
                {
            value: "1006",
            label: "1006"
        },
                {
            value: "1007",
            label: "1007"
        },
                {
            value: "1008",
            label: "1008"
        },
                {
            value: "1009",
            label: "1009"
        },
                {
            value: "1010",
            label: "1010"
        },
    ];
    // =====================================================
    // ACTUALIZAR FILTRO
    // =====================================================
    const actualizarFiltro = (
        campo,
        valor
    ) => {
        setFiltros(
            anterior => ({
                ...anterior,
                [campo]: valor
            })
        );
    };
    // =====================================================
    // APLICAR FILTROS
    // =====================================================
    const procesarMapa = () => {
        setFiltrosAplicados({
            ...filtros
        });
    };
    // =====================================================
    // RENDER
    // =====================================================
    return (
        <div className="space-y-6 text-left">
            {/* =================================================
                FILTROS
            ================================================= */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    {/* =========================================
                        FECHA INICIO
                    ========================================= */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                            Fecha inicio
                        </label>
                        <div className="relative">
                            <Calendar
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7]"
                            />
                            <input
                                type="date"
                                value={
                                    filtros.fecha_inicio
                                }
                                onChange={e =>
                                    actualizarFiltro(
                                        "fecha_inicio",
                                        e.target.value
                                    )
                                }
                                className="
                                    w-full
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
                                "
                            />
                        </div>
                    </div>
                    {/* =========================================
                        FECHA FIN
                    ========================================= */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                            Fecha fin
                        </label>
                        <div className="relative">
                            <Calendar
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7]"
                            />
                            <input
                                type="date"
                                value={
                                    filtros.fecha_fin
                                }
                                onChange={e =>
                                    actualizarFiltro(
                                        "fecha_fin",
                                        e.target.value
                                    )
                                }
                                className="
                                    w-full
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
                                "
                            />
                        </div>
                    </div>
                    {/* =========================================
                        CMETFAC
                    ========================================= */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                            Sector de facturación
                        </label>
                        <select
                            value={
                                filtros.cmetfac
                            }
                            onChange={e =>
                                actualizarFiltro(
                                    "cmetfac",
                                    e.target.value
                                )
                            }
                            className="
                                w-full
                                h-10
                                px-3
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
                            "
                        >
                            {
                                sectores.map(sector => (
                                    <option
                                        key={sector.value}
                                        value={sector.value}
                                    >
                                        {
                                            sector.label
                                        }
                                    </option>
                                ))
                            }
                        </select>
                    </div>
                    {/* =========================================
                        CAPA
                    ========================================= */}
                    <TooltipCapa
                        texto={
                            EXPLICACION_CAPA[filtros.capa]
                        }
                    >
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                            Capa del mapa
                        </label>
                        <div className="relative cursor-help">
                            <Layers
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006cb7]"
                            />
                            <select
                                value={
                                    filtros.capa
                                }
                                onChange={e =>
                                    actualizarFiltro(
                                        "capa",
                                        e.target.value
                                    )
                                }
                                className="
                                    w-full
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
                                "
                            >
                                <option
                                    value="discrepancias"
                                >
                                    Discrepancias espaciales
                                </option>
                                <option
                                    value="heatmap"
                                >
                                    Mapa de calor
                                </option>
                            </select>
                        </div>
                    </TooltipCapa>
                    {/* =========================================
                        BOTON PROCESAR
                    ========================================= */}
                    <div>
                        <button
                            onClick={
                                procesarMapa
                            }
                            className="
                                w-full
                                h-10
                                flex
                                items-center
                                justify-center
                                gap-2
                                rounded-lg
                                bg-[#006cb7]
                                hover:bg-[#005a9c]
                                text-white
                                text-xs
                                font-bold
                                transition
                                shadow-sm
                            "
                        >
                            Procesar mapa
                        </button>
                    </div>
                </div>
            </div>
            <Mapa
                filtros={
                    filtrosAplicados
                }
            />
        </div>
    );
}