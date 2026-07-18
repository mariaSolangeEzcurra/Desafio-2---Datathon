import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

import Dashboard from "../pages/Dashboard";
import Usuarios from "../pages/Usuarios";

export default function DashboardLayout({
    usuario,
    onLogout,
    seccionActiva,      // 👈 Recibimos de App.jsx
    setSeccionActiva    // 👈 Recibimos de App.jsx
}) {

    const renderVista = () => {
        // Evaluamos directamente el ID del menú que está seleccionado
        switch (seccionActiva) {
            case "gestion_usuarios":
                return <Usuarios />;
                
            case "dashboard_general":
                // Aquí pones tu panel general cuando lo tengas listo
                return <Dashboard idSeleccionado={seccionActiva} usuario={usuario} />;
                
            default:
                // ⚡ CUALQUIER SUB-PROCESO (Lecturas o Cortes) caerá aquí automáticamente
                // Le pasamos el ID activo al Dashboard para que sepa si abrir Resumen o Personal
                if (seccionActiva.startsWith("lecturas_") || seccionActiva.startsWith("cortes_")) {
                    return <Dashboard idSeleccionado={seccionActiva} usuario={usuario} />;
                }
                
                // Vista por defecto por seguridad
                return <Dashboard idSeleccionado="lecturas_resumen" usuario={usuario} />;
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            {/* El Sidebar ahora controla e ilumina los IDs reales de tu menú */}
            <Sidebar
                usuario={usuario}
                vista={seccionActiva}           // 👈 Cambiado
                setVista={setSeccionActiva}     // 👈 Cambiado
            />
            <div className="flex flex-1 flex-col">
                <Header
                    usuario={usuario}
                    vista={seccionActiva}       // 👈 Cambiado
                    onLogout={onLogout}
                />
                <main className="flex-1 p-8">
                    {renderVista()}
                </main>
            </div>
        </div>
    );
}