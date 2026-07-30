import { useState } from "react";

import Login from "./Pages/Login";
import DashboardLayout from "./layouts/DashboardLayout";
import Usuarios from "./Pages/Usuarios";

import {
  getUsuario,
  logout,
} from "./services/authService";

export default function App() {

  const [usuario, setUsuario] = useState(getUsuario());

  const handleLogout = () => {

    logout();

    setUsuario(null);

  };

const [seccionActiva, setSeccionActiva] = useState("lecturas_resumen");

  if (!usuario) {

    return (

      <Login
        onLogin={setUsuario}
      />

    );

  }

  return (

    <DashboardLayout
      usuario={usuario}
      onLogout={handleLogout}
      seccionActiva={seccionActiva}       
      setSeccionActiva={setSeccionActiva} 
    />

  );

}