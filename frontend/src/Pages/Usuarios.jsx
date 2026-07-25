import { useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";
import { obtenerUsuarios } from "../services/usuarioService";
import {
  UsuarioTable,
  UsuarioModal,
  ConfirmEliminarModal,
} from "../components/usuarios/UsuarioComponents";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await obtenerUsuarios();
      setUsuarios(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Handlers para Nuevo y Editar
  const handleNuevo = () => {
    setUsuarioSeleccionado(null);
    setModalOpen(true);
  };

  const handleEditar = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setModalOpen(true);
  };

  // Handler para Eliminar
  const handleEliminar = (usuario) => {
    setUsuarioAEliminar(usuario);
    setDeleteModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header de la vista */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
          <p className="text-sm text-slate-500">
            Administra las cuentas y roles del personal institucional.
          </p>
        </div>
        <button
          onClick={handleNuevo}
          className="flex items-center gap-2 rounded-xl bg-[#006cb7] px-4 py-2.5 font-semibold text-white hover:bg-[#00589b] transition"
        >
          <PlusIcon size={20} />
          Nuevo Usuario
        </button>
      </div>

      {/* Card contenedor de la tabla */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <UsuarioTable
          usuarios={usuarios}
          loading={loading}
          onEditar={handleEditar}
          onEliminar={handleEliminar}
        />
      </div>

      {/* Modal único de Crear / Editar */}
      <UsuarioModal
        open={modalOpen}
        usuario={usuarioSeleccionado}
        onClose={() => setModalOpen(false)}
        onSuccess={cargarUsuarios}
      />

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmEliminarModal
        open={deleteModalOpen}
        usuario={usuarioAEliminar}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={cargarUsuarios}
      />
    </div>
  );
}