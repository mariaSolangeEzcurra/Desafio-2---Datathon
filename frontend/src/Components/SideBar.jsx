import { useState } from "react";
import { ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import navigation from "../config/navigation.js";
import SidebarItem from "./SidebarItem";

export default function Sidebar({ usuario, vista, setVista }) {
  const [collapsed, setCollapsed] = useState(false);
  
  // Filtra los menús basándose en el rol del usuario conectado
  const menu = navigation.filter((item) =>
    item.roles.includes(usuario.rol)
  );

  return (
    <aside
      className={`flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300
      ${collapsed ? "w-20" : "w-72"}`}
    >
      {/* Encabezado Logo SEDAPAR */}
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#006cb7] text-white shrink-0">
          <Building2 size={22} />
        </div>
        {!collapsed && (
          <div>
            <h2 className="font-bold text-slate-800 tracking-wide">SEDAPAR</h2>
            <p className="text-xs text-slate-500">Supervisión Operativa</p>
          </div>
        )}
      </div>

      {/* Menú de Procesos y Subpantallas */}
      <div className="flex-1 space-y-1 overflow-y-auto p-4">
        {menu.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            vista={vista}
            setVista={setVista}
            collapsed={collapsed}
          />
        ))}
      </div>

      {/* Sección Inferior de Usuario */}
      <div className="border-t border-slate-200 p-4 bg-slate-50/50">
        {!collapsed && (
          <div className="mb-2">
            <p className="text-xs font-bold text-slate-700 truncate">{usuario.nombre}</p>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{usuario.rol}</p>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white py-2 shadow-sm transition hover:bg-slate-50"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}