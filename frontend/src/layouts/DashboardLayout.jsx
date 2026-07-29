import React from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Dashboard from "../pages/Dashboard";
import Usuarios from "../pages/Usuarios";
import LecturaKPI from "../pages/LecturaKPI"; // <--- Corregido al nombre y ruta real
//TI
import UploadLectura from "../pages/TI/UploadLectura";  
import UploadCortes from "../pages/TI/UploadCortes";    
import MapaLectura from "../pages/MapaLectura";
import Trabajadores from "../pages/TI/Trabajadores";
import CatalogosView from "../pages/TI/CatalogosDashboard";
import UploadLecturaDiario from "../pages/TI/UploadLecturaDiario";
//SUPERVISOR
import TrabajadoresLecturas from "../pages/supervisor/TrabajadoresLecturas";
import Alertas from "../pages/supervisor/Alertas";

export default function DashboardLayout({
  usuario,
  onLogout,
  seccionActiva,
  setSeccionActiva
}) {

  const renderVista = () => {
    // 1. Prioridad: Vistas especiales específicas
    if (seccionActiva === "lecturas_kpis") return <Dashboard />; // <--- Sin props innecesarias
    if (seccionActiva === "lecturas_personal") return <TrabajadoresLecturas />;
    if (seccionActiva === "lecturas_alertas") return <Alertas />;

    // 2. Vistas de carga separadas con sus respectivos componentes
    if (seccionActiva === "lecturas_carga") return <UploadLectura />; 
    if (seccionActiva === "cortes_carga") return <UploadCortes />; 
    if (seccionActiva === "upload_Diario") return <UploadLecturaDiario />;

    // 3. VISTA DE MAPA
    if (seccionActiva === "lecturas_mapa") return <MapaLectura tipoProceso="lectura" />;
    
    // 4. Caso Usuarios y Trabajadores
    if (seccionActiva === "gestion_usuarios") return <Usuarios />;
    if (seccionActiva === "trabajadores") return <Trabajadores />;

    // 5. Catálogos del Sistema (¡DEBE IR ANTES DEL DASHBOARD GENERAL!)
    if (seccionActiva === "gestion_catalogos") return <CatalogosView />;  
    
      // 6. Dashboard General SOLO para Supervisor
  if (usuario?.rol === "SUPERVISOR") {
    return (
      <Dashboard
        idSeleccionado={seccionActiva}
        usuario={usuario}
      />
    );
  }

  // Si TI llega aquí, mostrar una vista por defecto
  return (
     <div className="pt-2">
    <h1 className="text-2xl font-bold text-slate-800">
        Bienvenido, {usuario?.nombre || "Usuario"} 👋
      </h1>

      <p className="mt-2 text-sm text-slate-500">
        Seleccione una opción del menú para comenzar.
      </p>
    </div>
  );
    
  };

  return (
      <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        usuario={usuario} 
        vista={seccionActiva} 
        setVista={setSeccionActiva} 
      />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          usuario={usuario} 
          vista={seccionActiva} 
          onLogout={onLogout} 
        />
        
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {renderVista()}
          </div>
        </main>
      </div>
    </div>
  );
}