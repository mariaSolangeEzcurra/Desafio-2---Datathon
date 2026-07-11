import { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function Coordinador({ onLogout }) {

  const [activeView, setActiveView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

 return (
  <div className="flex h-screen">

    <Sidebar
      role="Coordinador"
      activeView={activeView}
      onNavigate={setActiveView}
      collapsed={collapsed}
      onToggle={() => setCollapsed(!collapsed)}
      mobileOpen={mobileOpen}
      onCloseMobile={() => setMobileOpen(false)}
    />

    <div className="flex-1 flex flex-col">

      <Header
        usuario="Coordinador"
        rol="Coordinador"
        onLogout={onLogout}
      />

      <main className="flex-1 p-6">

        {activeView === "dashboard" && <h1>Dashboard</h1>}

      </main>

    </div>

  </div>
);}