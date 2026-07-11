import { useState } from "react";

import Login from "./pages/Login";
import Supervisor from "./pages/Supervisor";
import Coordinador from "./pages/Coordinador";
import Gerencia from "./pages/Gerencia";

export default function App() {

  const [rol, setRol] = useState(null);

  const logout = () => {
    setRol(null);
  };

  if (rol === null) {
    return <Login onLogin={setRol} />;
  }

  if (rol === "Supervisor") {
    return <Supervisor onLogout={logout} />;
  }

  if (rol === "Coordinador") {
    return <Coordinador onLogout={logout} />;
  }

  if (rol === "Gerencia") {
    return <Gerencia onLogout={logout} />;
  }

  return <Login onLogin={setRol} />;
}