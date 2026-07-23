import {
  LayoutDashboard,
  Eye,
  Boxes,
  ZapOff,
  SearchCode,
  Users,
  Map,
  Bell,
  FileText,
  UploadCloud 
} from "lucide-react";

const navigation = [
  {
    id: "dashboard_general",
    label: "Panel de Control General",
    icon: LayoutDashboard,
    roles: ["Supervisor", "Coordinador", "Gerencia"],
  },
  {
    id: "proceso_lecturas",
    label: "Proceso: Lecturas",
    icon: Eye,
    roles: ["Supervisor", "Coordinador", "Gerencia"],
    children: [
      { id: "lecturas_kpis", label: "KPI's de Lectura", icon: FileText }, 
      { id: "lecturas_personal", label: "Personal Asignado", icon: Users },
      { id: "lecturas_mapa", label: "Mapa GIS", icon: Map },
      { id: "lecturas_alertas", label: "Alertas e Impedimentos", icon: Bell },
    ]
  },
  {
    id: "proceso_cortes",
    label: "Proceso: Cortes y Reap.",
    icon: ZapOff,
    roles: ["Supervisor", "Coordinador", "Gerencia"],
    children: [
      { id: "cortes_resumen", label: "Resumen Ejecutivo", icon: FileText },
      { id: "cortes_personal", label: "Personal Asignado", icon: Users },
      { id: "cortes_mapa", label: "Mapa GIS", icon: Map },
      { id: "cortes_alertas", label: "Alertas e Impedimentos", icon: Bell },
    ]
  },
  {
    id: "gestion_datos",
    label: "Gestión de Datos",
    icon: UploadCloud,
    roles: ["TI"],
    children: [
      {
        id: "trabajadores",
        label: "Carga de Trabajadores",
        icon: Users,
        roles: ["TI"]
      },
      {
        id: "lecturas_carga",
        label: "Carga de Lecturas",
        icon: UploadCloud,
        roles: ["TI"]
      },
      {
        id: "cortes_carga",
        label: "Carga de Cortes",
        icon: UploadCloud,
        roles: ["TI"]
      }
    ]
  },
  {
    id: "gestion_catalogos",
    label: "Catálogos del Sistema",
    icon: FileText, 
    roles: ["TI"],
  }, 
  {
    id: "gestion_usuarios",
    label: "Usuarios del Sistema",
    icon: Users,
    roles: ["Gerencia", "Supervisor", "TI"]
  }
];

export default navigation;