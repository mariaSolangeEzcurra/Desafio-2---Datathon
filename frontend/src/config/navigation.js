import {
  LayoutDashboard,
  Workflow,
  Users,
  Gauge,
  Bell,
  Map,
  ClipboardList,
  Settings,
  BarChart3,
  Shuffle,
  MessagesSquare,
} from "lucide-react";

const navigation = [

  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["Supervisor", "Coordinador", "Gerencia"],
  },

  {
    id: "procesos",
    label: "Procesos",
    icon: Workflow,
    roles: ["Supervisor", "Coordinador", "Gerencia"],
  },

  {
    id: "usuarios",
    label: "Usuarios",
    icon: Users,
    roles: ["Gerencia"],
  },

  {
    id: "kpis",
    label: "KPIs",
    icon: Gauge,
    roles: ["Coordinador", "Gerencia"],
  },

  {
    id: "alertas",
    label: "Alertas",
    icon: Bell,
    roles: ["Supervisor", "Coordinador", "Gerencia"],
  },

  {
    id: "incidencias",
    label: "Incidencias",
    icon: ClipboardList,
    roles: ["Coordinador"],
  },

  {
    id: "redistribucion",
    label: "Redistribución",
    icon: Shuffle,
    roles: ["Coordinador"],
  },

  {
    id: "mensajes",
    label: "Mensajes",
    icon: MessagesSquare,
    roles: ["Supervisor"],
  },

  {
    id: "mapa",
    label: "Mapa GIS",
    icon: Map,
    roles: ["Supervisor", "Coordinador", "Gerencia"],
  },

  {
    id: "reportes",
    label: "Reportes",
    icon: BarChart3,
    roles: ["Supervisor", "Coordinador", "Gerencia"],
  },

  {
    id: "configuracion",
    label: "Configuración",
    icon: Settings,
    roles: ["Gerencia"],
  },

];

export default navigation;