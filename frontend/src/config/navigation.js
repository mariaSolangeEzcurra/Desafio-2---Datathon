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
      // Al hacer clic aquí, pasará el id "lecturas_carga" al Dashboard
      { id: "lecturas_carga", label: "Carga de Datos (Excel)", icon: UploadCloud },
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
      // Habilitado e indexado de forma simétrica para el proceso de Cortes
      { id: "cortes_carga", label: "Carga de Datos (Excel)", icon: UploadCloud },
      { id: "cortes_resumen", label: "Resumen Ejecutivo", icon: FileText },
      { id: "cortes_personal", label: "Personal Asignado", icon: Users },
      { id: "cortes_mapa", label: "Mapa GIS", icon: Map },
      { id: "cortes_alertas", label: "Alertas e Impedimentos", icon: Bell },
    ]
  },
  {
    id: "gestion_usuarios",
    label: "Usuarios del Sistema",
    icon: Users,
    roles: ["Gerencia", "Supervisor"],
  }
];

export default navigation;