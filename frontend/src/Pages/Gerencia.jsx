import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
export default function Gerencia({ usuario, onLogout }) {

  return (

    <div>

      <h2>Bienvenido {usuario.nombre}</h2>

      <p>{usuario.correo}</p>

      <p>{usuario.rol}</p>

      <button onClick={onLogout}>
        Cerrar sesión
      </button>

    </div>

  );

}