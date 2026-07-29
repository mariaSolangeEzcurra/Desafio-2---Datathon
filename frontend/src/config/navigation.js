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
    roles: ["Supervisor"],
  },
  {
    id: "proceso_lecturas",
    label: "Proceso: Lecturas",
    icon: Eye,
    roles: ["Supervisor"],
    children: [
      { id: "lecturas_kpis", label: "KPI's de Lectura", icon: FileText }, 
      { id: "lecturas_personal", label: "Personal Asignado", icon: Users },
      { id: "lecturas_mapa", label: "Mapa GIS", icon: Map },
      { id: "lecturas_alertas", label: "Alertas e Impedimentos", icon: Bell },
    ]
  },
    {
    id: "gerencia",
    label: "Analitica",
    icon: Eye,
    roles: ["Gerencia"],
    children: [
      { id: "resumen_gerencia", label: "Resumen", icon: FileText }, 
      { id: "ranking_gerencia", label: " Ranking Personal", icon: Users },
      { id: "riesgo_gerencia", label: "Riesgo Operativo", icon: Map },
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
        id: "upload_Diario",
        label: "Carga de Lecturas Diarias",
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
    roles: ["TI"]
  }
];

export default navigation;