import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function Supervisor({ usuario, onLogout }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* 1. Renderizamos el Header arriba */}
      <Header usuario={usuario} />

      <div style={{ display: "flex", flex: 1 }}>
        {/* 2. Renderizamos el Sidebar al costado izquierdo */}
        <Sidebar usuario={usuario} />

        {/* 3. Contenido principal del panel */}
        <main style={{ padding: "20px", flex: 1 }}>
          <h2>Bienvenido, {usuario.nombre}</h2>
          <p><strong>Correo:</strong> {usuario.correo}</p>
          <p><strong>Rol:</strong> {usuario.rol}</p>
          
          <button 
            onClick={onLogout}
            style={{ marginTop: "20px", padding: "8px 16px", cursor: "pointer" }}
          >
            Cerrar sesión
          </button>
        </main>
      </div>
    </div>
  );
}