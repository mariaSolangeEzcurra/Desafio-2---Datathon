import React from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Dashboard from "../pages/Dashboard";
import Usuarios from "../pages/Usuarios";
import CargaExcel from "../pages/upload";

export default function DashboardLayout({
  usuario,
  onLogout,
  seccionActiva,
  setSeccionActiva
}) {

  // Función encargada de decidir qué componente renderizar
  const renderVista = () => {
    // 1. Manejo específico de las vistas de Carga (según los IDs de navigation.js)
    if (seccionActiva === "lecturas_carga") {
      return <CargaExcel proceso="lecturas" />;
    }
    if (seccionActiva === "cortes_carga") {
      return <CargaExcel proceso="cortes" />;
    }

    // 2. Manejo de vistas generales
    switch (seccionActiva) {
      case "gestion_usuarios":
        return <Usuarios />;
      
      case "dashboard_general":
        return <Dashboard idSeleccionado="lecturas_resumen" usuario={usuario} />;
      
      default:
        // 3. Manejo dinámico para Dashboard (Lecturas/Cortes)
        // Todos los otros IDs (personal, mapa, alertas, resumen) empiezan con el prefijo
        if (seccionActiva.startsWith("lecturas_") || seccionActiva.startsWith("cortes_")) {
          return <Dashboard idSeleccionado={seccionActiva} usuario={usuario} />;
        }
        
        // Fallback por seguridad
        return <Dashboard idSeleccionado="lecturas_resumen" usuario={usuario} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Barra Lateral: recibe el estado y el setter para la navegación */}
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