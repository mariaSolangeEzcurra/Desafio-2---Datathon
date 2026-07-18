import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function SidebarItem({ item, vista, setVista, collapsed }) {
  const IconoPadre = item.icon;
  const tieneHijos = item.children && item.children.length > 0;
  
  // 1. Verifica si alguna de las subpantallas de este proceso está activa actualmente
  const esActivo = tieneHijos 
    ? item.children.some(hijo => hijo.id === vista)
    : vista === item.id;

  // 2. MODIFICACIÓN AQUÍ: Si una subpantalla de este menú está activa, 
  // forzamos a que el menú se mantenga expandido visualmente.
  const [isOpen, setIsOpen] = useState(false);
  const desplegado = isOpen || esActivo;

  const manejarClick = () => {
    if (tieneHijos) {
      setIsOpen(!isOpen);
    } else {
      setVista(item.id);
    }
  };

  return (
    <div className="w-full space-y-1">
      {/* Botón Principal / Proceso Padre */}
      <button
        onClick={manejarClick}
        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 transition-all duration-200
          ${esActivo ? "bg-blue-50 text-[#006cb7] font-semibold" : "text-slate-600 hover:bg-slate-50"}`}
      >
        <div className="flex items-center gap-3">
          <IconoPadre size={20} className={esActivo ? "text-[#006cb7]" : "text-slate-400"} />
          {!collapsed && <span className="text-sm">{item.label}</span>}
        </div>

        {!collapsed && tieneHijos && (
          <span className="text-slate-400">
            {desplegado ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        )}
      </button>

      {/* Sub-Items Desplegables (Mapeo de Subpantallas) */}
      {!collapsed && tieneHijos && desplegado && (
        <div className="ml-6 border-l border-slate-100 pl-2 space-y-1 animate-fadeIn">
          {item.children.map((subItem) => {
            const SubIcono = subItem.icon;
            const subActivo = vista === subItem.id;

            return (
              <button
                key={subItem.id}
                onClick={() => setVista(subItem.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs transition-all
                  ${subActivo ? "bg-[#006cb7]/10 text-[#006cb7] font-bold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
              >
                <SubIcono size={14} className={subActivo ? "text-[#006cb7]" : "text-slate-400"} />
                <span>{subItem.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}