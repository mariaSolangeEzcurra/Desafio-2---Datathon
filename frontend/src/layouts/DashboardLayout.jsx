import React from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Dashboard from "../pages/Dashboard";
import Usuarios from "../pages/Usuarios";

export default function DashboardLayout({
  usuario,
  onLogout,
  seccionActiva,
  setSeccionActiva
}) {

  // Función simplificada: Todo lo que no sea Usuarios va al Dashboard.
  // El Dashboard se encarga internamente de renderizar "Carga", "Mapa", etc.
  const renderVista = () => {
    switch (seccionActiva) {
      case "gestion_usuarios":
        return <Usuarios />;
      
      default:
        // Si es una vista de lecturas_... o cortes_..., el Dashboard la maneja.
        // Si no se encuentra, por seguridad enviamos al resumen de lecturas.
        if (seccionActiva.startsWith("lecturas_") || seccionActiva.startsWith("cortes_")) {
          return <Dashboard idSeleccionado={seccionActiva} usuario={usuario} />;
        }
        
        return <Dashboard idSeleccionado="lecturas_resumen" usuario={usuario} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar: navega a través de setSeccionActiva */}
      <Sidebar 
        usuario={usuario} 
        vista={seccionActiva} 
        setVista={setSeccionActiva} 
      />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Cabecera */}
        <Header 
          usuario={usuario} 
          vista={seccionActiva} 
          onLogout={onLogout} 
        />
        
        {/* Contenido Principal */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {renderVista()}
          </div>
        </main>
      </div>
    </div>
  );
}