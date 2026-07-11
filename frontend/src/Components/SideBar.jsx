import {
  BellRing,
  ChartNoAxesCombined,
  ChevronLeft,
  ClipboardList,
  FileBarChart,
  Gauge,
  MapPinned,
  MessageSquare,
  Settings,
  Shuffle,
  Users,
  Workflow,
  X,
} from "lucide-react";

const navigation = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: ChartNoAxesCombined,
    roles: ["Supervisor", "Coordinador", "Gerencia"],
  },
  {
    id: "procesos",
    label: "Procesos",
    icon: Workflow,
    roles: ["Supervisor", "Coordinador", "Gerencia"],
  },
  {
    id: "personal",
    label: "Mi equipo",
    icon: Users,
    roles: ["Supervisor", "Coordinador"],
  },
  {
    id: "mensajes",
    label: "Mensajes",
    icon: MessageSquare,
    roles: ["Supervisor"],
  },
  {
    id: "kpis",
    label: "KPIs Estratégicos",
    icon: Gauge,
    roles: ["Coordinador", "Gerencia"],
  },
  {
    id: "alertas",
    label: "Alertas",
    icon: BellRing,
    roles: ["Supervisor", "Coordinador", "Gerencia"],
    badge: "12",
  },
  {
    id: "incidencias",
    label: "Incidencias",
    icon: ClipboardList,
    roles: ["Coordinador"],
    badge: "7",
  },
  {
    id: "redistribucion",
    label: "Redistribución",
    icon: Shuffle,
    roles: ["Coordinador"],
  },
  {
    id: "mapa",
    label: "Mapa GIS",
    icon: MapPinned,
    roles: ["Supervisor", "Coordinador", "Gerencia"],
  },
  {
    id: "comparativas",
    label: "Comparativas",
    icon: ChartNoAxesCombined,
    roles: ["Coordinador", "Gerencia"],
  },
  {
    id: "planes",
    label: "Planes de acción",
    icon: ClipboardList,
    roles: ["Gerencia"],
  },
  {
    id: "reportes",
    label: "Reportes",
    icon: FileBarChart,
    roles: ["Supervisor", "Coordinador", "Gerencia"],
  },
];

export default function Sidebar({
  role,
  activeView,
  onNavigate,
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}) {
  const visibleItems = navigation.filter((item) =>
    item.roles.includes(role)
  );

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-20 px-5 border-b">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold">
            S
          </div>

          {!collapsed && (
            <div>
              <h2 className="font-bold text-blue-700">SEDAPAR</h2>
              <p className="text-xs text-gray-500">
                Supervisión Operativa
              </p>
            </div>
          )}
        </div>

        <button
          className="lg:hidden"
          onClick={onCloseMobile}
        >
          <X size={20} />
        </button>
      </div>

      {/* Título */}
      {!collapsed && (
        <div className="px-4 pt-6 pb-2 text-xs uppercase text-gray-400 font-bold">

          {role === "Supervisor" && "Mi operación"}

          {role === "Coordinador" && "Gestión operativa"}

          {role === "Gerencia" && "Estrategia"}

        </div>
      )}

      {/* Menú */}
      <nav className="flex-1 px-3 space-y-1">

        {visibleItems.map((item) => {

          const Icon = item.icon;

          const active = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 transition
              ${
                active
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              <Icon size={19} />

              {!collapsed && (
                <>
                  <span className="flex-1 text-left">
                    {item.label}
                  </span>

                  {item.badge && (
                    <span className="bg-red-100 text-red-600 text-xs px-2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}

        {/* Solo Coordinador */}
        {role === "Coordinador" && (
          <>
            <hr className="my-5" />

            {!collapsed && (
              <p className="text-xs uppercase text-gray-400 font-bold px-3 mb-2">
                Administración
              </p>
            )}

            <button
              onClick={() => onNavigate("configuracion")}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 ${
                activeView === "configuracion"
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              <Settings size={19} />

              {!collapsed && "Configuración"}
            </button>
          </>
        )}
      </nav>

      {/* Contraer */}
      <div className="border-t p-3">

        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-2 hover:bg-slate-100 rounded-lg"
        >
          <ChevronLeft
            size={18}
            className={collapsed ? "rotate-180" : ""}
          />

          {!collapsed && "Contraer menú"}

        </button>

      </div>
    </aside>
  );
}