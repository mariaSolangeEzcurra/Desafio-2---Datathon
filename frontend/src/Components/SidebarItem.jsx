import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function SidebarItem({ item, vista, setVista, collapsed }) {
  const [isOpen, setIsOpen] = useState(true); // Controla el despliegue del submenú
  
  const Icono = item.icon;
  const tieneHijos = !!item.children;
  
  // Verifica si el item actual o alguno de sus hijos está seleccionado
  const estaActivo = vista === item.id || (tieneHijos && item.children.some(h => h.id === vista));

  return (
    <div className="space-y-1">
      {/* Botón Principal o Padre */}
      <button
        onClick={() => {
          if (tieneHijos) {
            setIsOpen(!isOpen);
          } else {
            setVista(item.id);
          }
        }}
        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold transition-all ${
          estaActivo
            ? "bg-[#006cb7] text-white shadow-md shadow-blue-100"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <Icono size={18} className={estaActivo ? "text-white" : "text-slate-400"} />
          {!collapsed && <span>{item.label}</span>}
        </div>
        
        {tieneHijos && !collapsed && (
          isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />
        )}
      </button>

      {/* Renderizado de los hijos (Carga Excel, Resumen, etc.) */}
      {tieneHijos && isOpen && !collapsed && (
        <div className="ml-6 border-l border-slate-100 pl-3 space-y-1">
          {item.children.map((hijo) => {
            const IconoHijo = hijo.icon;
            const subActivo = vista === hijo.id;

            return (
              <button
                key={hijo.id}
                onClick={() => setVista(hijo.id)} // 👈 ⚡ ESTO despacha "lecturas_carga" o "cortes_carga"
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[11px] font-medium transition-all ${
                  subActivo
                    ? "bg-slate-100 text-[#006cb7] font-bold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <IconoHijo size={14} className={subActivo ? "text-[#006cb7]" : "text-slate-400"} />
                <span>{hijo.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}