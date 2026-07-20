import React from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Dashboard from "../pages/Dashboard";
import Usuarios from "../pages/Usuarios";
import KPIView from "../Pages/LecturaKPI";
import Upload from "../pages/Upload";
import MapaLectura from "../Pages/MapaLectura";
export default function DashboardLayout({
  usuario,
  onLogout,
  seccionActiva,
  setSeccionActiva
}) {

  // Función simplificada: Todo lo que no sea Usuarios va al Dashboard.
  // El Dashboard se encarga internamente de renderizar "Carga", "Mapa", etc.
 const renderVista = () => {
    // 1. Prioridad: Vistas especiales específicas
    if (seccionActiva === "lecturas_kpis") return <KPIView tipo="lectura" />;
    if (seccionActiva === "cortes_kpis") return <KPIView tipo="corte" />;
    
    // 2. Si es carga, manejarlo aparte (puedes crear el componente UploadPage)
    if (seccionActiva === "lecturas_carga" || seccionActiva === "cortes_carga") {
       return <Upload />; 
    }
    // 3. VISTA DE MAPA (La que acabamos de crear)
    if (seccionActiva === "lecturas_mapa") return <MapaLectura tipoProceso="lectura" />;
    // 3. Caso Usuarios
    if (seccionActiva === "gestion_usuarios") return <Usuarios />;

    // 4. Dashboard General (Aquí entra todo lo demás: mapa, personal, etc.)
    return <Dashboard idSeleccionado={seccionActiva} usuario={usuario} />;
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