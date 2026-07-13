import { useState } from "react";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

import Dashboard from "../pages/Dashboard";
import Usuarios from "../pages/Usuarios";

export default function DashboardLayout({

    usuario,

    onLogout,

}) {

    const [vista, setVista] = useState("dashboard");

    const renderVista = () => {

        switch (vista) {

            case "usuarios":

                return <Usuarios />;

            case "dashboard":

            default:

                return <Dashboard usuario={usuario} />;

        }

    };

    return (

        <div className="flex min-h-screen bg-slate-100">

            <Sidebar

                usuario={usuario}

                vista={vista}

                setVista={setVista}

            />

            <div className="flex flex-1 flex-col">

                <Header

    usuario={usuario}

    vista={vista}

    onLogout={onLogout}

/>

                <main className="flex-1 p-8">

                    {renderVista()}

                </main>

            </div>

        </div>

    );

}