import {

    Bell,

    CalendarDays,

    LogOut,

} from "lucide-react";

const TITULOS = {

    dashboard: "Dashboard",

    usuarios: "Administración de Usuarios",

    procesos: "Procesos",

    kpis: "KPIs Estratégicos",

    alertas: "Alertas",

    incidencias: "Incidencias",

    redistribucion: "Redistribución",

    mapa: "Mapa GIS",

    reportes: "Reportes",

    configuracion: "Configuración",

};

export default function Header({

    usuario,

    vista,

    onLogout,

}) {

    const fecha = new Date().toLocaleDateString(

        "es-PE",

        {

            weekday: "long",

            day: "numeric",

            month: "long",

            year: "numeric",

        }

    );

    return (

        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">

            <div>

                <h1 className="text-2xl font-bold text-slate-800">

                    {

                        TITULOS[vista] ||

                        "Sistema"

                    }

                </h1>

                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">

                    <CalendarDays size={15} />

                    {fecha}

                </p>

            </div>

            <div className="flex items-center gap-5">

                <button

                    className="relative rounded-xl p-3 hover:bg-slate-100"

                >

                    <Bell size={20} />

                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>

                </button>

                <div className="text-right">

                    <p className="font-semibold">

                        {usuario.nombre}

                    </p>

                    <p className="text-sm text-slate-500">

                        {usuario.rol}

                    </p>

                </div>

                <button

                    onClick={onLogout}

                    className="rounded-xl bg-[#006cb7] p-3 text-white transition hover:bg-[#00589b]"

                >

                    <LogOut size={18} />

                </button>

            </div>

        </header>

    );

}