import { useEffect, useState } from "react";
import { obtenerResumenLectura } from "../services/LecturaKPIService";
import { Activity, X } from "lucide-react";

export default function LecturaKPI() {
    const [data, setData] = useState({
        indicadores: []
    });

    const [cargando, setCargando] = useState(true);
    const [kpiSeleccionado, setKpiSeleccionado] = useState(null);

    const cargarKPIs = async () => {
        setCargando(true);

        try {
            const resumen = await obtenerResumenLectura();

            console.log("Resumen recibido:", resumen);

            setData({
                indicadores: [
                    {
                        nombre: "Cumplimiento de lectura",
                        valor: resumen.cumplimiento_lectura,
                        unidad: "%"
                    },
                    {
                        nombre: "Productividad",
                        valor: resumen.productividad_lectura,
                        unidad: " lecturas/h"
                    },
                    {
                        nombre: "Tiempo promedio",
                        valor: resumen.tiempo_promedio_lectura,
                        unidad: " min"
                    },
                    {
                        nombre: "Índice de impedimentos",
                        valor: resumen.impedimentos_lectura,
                        unidad: "%"
                    },
                    {
                        nombre: "Índice de observaciones",
                        valor: resumen.observaciones_lectura,
                        unidad: "%"
                    },
                    {
                        nombre: "Cobertura geográfica",
                        valor: resumen.cobertura_georreferenciada,
                        unidad: "%"
                    },
                    {
                        nombre: "Actividades fuera de punto",
                        valor: resumen.actividades_fuera_de_punto,
                        unidad: ""
                    },
                    {
                        nombre: "Lecturas programadas",
                        valor: resumen.total_lecturas_programadas,
                        unidad: ""
                    },
                    {
                        nombre: "Lecturas realizadas",
                        valor: resumen.total_lecturas_realizadas,
                        unidad: ""
                    },
                    {
                        nombre: "Total impedimentos",
                        valor: resumen.total_impedimentos,
                        unidad: ""
                    },
                    {
                        nombre: "Total observaciones",
                        valor: resumen.total_observaciones,
                        unidad: ""
                    }
                ]
            });
        } catch (error) {
            console.error("Error cargando KPIs:", error);

            setData({
                indicadores: []
            });
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarKPIs();
    }, []);

    const explicaciones = {
        "Cumplimiento de lectura": {
            descripcion:
                "Porcentaje de lecturas realizadas respecto a las programadas.",
            formula:
                "(Lecturas realizadas / Lecturas programadas) × 100",
            datos:
                "total_lecturas_realizadas y total_lecturas_programadas"
        },

        "Productividad": {
            descripcion:
                "Cantidad promedio de lecturas realizadas por hora.",
            formula:
                "Lecturas realizadas / horas trabajadas",
            datos:
                "productividad_lectura"
        },

        "Tiempo promedio": {
            descripcion:
                "Tiempo promedio empleado para realizar una lectura.",
            formula:
                "Tiempo total / lecturas realizadas",
            datos:
                "tiempo_promedio_lectura"
        },

        "Índice de impedimentos": {
            descripcion:
                "Porcentaje de lecturas con impedimentos.",
            formula:
                "(Impedimentos / Lecturas realizadas) ×100",
            datos:
                "impedimentos_lectura"
        },

        "Índice de observaciones": {
            descripcion:
                "Porcentaje de lecturas con observaciones.",
            formula:
                "(Observaciones / Lecturas realizadas) ×100",
            datos:
                "observaciones_lectura"
        },

        "Cobertura geográfica": {
            descripcion:
                "Porcentaje de actividades con georreferenciación válida.",
            formula:
                "(Actividades georreferenciadas / Total actividades) ×100",
            datos:
                "cobertura_georreferenciada"
        },

        "Actividades fuera de punto": {
            descripcion:
                "Cantidad de actividades realizadas fuera del radio permitido.",
            formula:
                "Conteo de actividades fuera del punto",
            datos:
                "actividades_fuera_de_punto"
        },

        "Lecturas programadas": {
            descripcion:
                "Número total de lecturas planificadas.",
            formula:
                "Conteo",
            datos:
                "total_lecturas_programadas"
        },

        "Lecturas realizadas": {
            descripcion:
                "Número total de lecturas realizadas.",
            formula:
                "Conteo",
            datos:
                "total_lecturas_realizadas"
        },

        "Total impedimentos": {
            descripcion:
                "Cantidad total de impedimentos registrados.",
            formula:
                "Conteo",
            datos:
                "total_impedimentos"
        },

        "Total observaciones": {
            descripcion:
                "Cantidad total de observaciones registradas.",
            formula:
                "Conteo",
            datos:
                "total_observaciones"
        }
    };

    return (
        <div className="p-6 space-y-8">

            {cargando ? (

                <div className="p-10 text-center">
                    Calculando indicadores...
                </div>

            ) : (

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                    {data.indicadores.map((kpi) => (

                        <div
                            key={kpi.nombre}
                            onClick={() => setKpiSeleccionado(kpi)}
                            className="cursor-pointer bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition"
                        >

                            <p className="text-xs uppercase font-bold text-slate-400">
                                {kpi.nombre}
                            </p>

                            <div className="flex items-baseline gap-2 mt-3">

                                <h3 className="text-3xl font-bold">
                                    {kpi.valor}
                                </h3>

                                <span>{kpi.unidad}</span>

                            </div>

                        </div>

                    ))}

                </div>

            )}

            {kpiSeleccionado && (

                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                    <div className="bg-white rounded-2xl p-8 w-[90%] max-w-lg shadow-xl">

                        <div className="flex justify-between items-center">

                            <h2 className="text-xl font-bold">
                                {kpiSeleccionado.nombre}
                            </h2>

                            <button
                                onClick={() => setKpiSeleccionado(null)}
                            >
                                <X />
                            </button>

                        </div>

                        <div className="mt-6 space-y-4 text-sm">

                            <p>
                                <b>Valor:</b>
                                <br />
                                {kpiSeleccionado.valor} {kpiSeleccionado.unidad}
                            </p>

                            <p>
                                <b>Descripción:</b>
                                <br />
                                {explicaciones[kpiSeleccionado.nombre]?.descripcion}
                            </p>

                            <p>
                                <b>Fórmula:</b>
                                <br />
                                {explicaciones[kpiSeleccionado.nombre]?.formula}
                            </p>

                            <p>
                                <b>Datos utilizados:</b>
                                <br />
                                {explicaciones[kpiSeleccionado.nombre]?.datos}
                            </p>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}