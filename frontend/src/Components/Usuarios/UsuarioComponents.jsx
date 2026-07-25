import { useEffect, useState } from "react";
import {
  PencilIcon,
  Trash2Icon,
  UserCircleIcon,
  XIcon,
  AlertTriangleIcon,
} from "lucide-react";
import {
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from "../../services/usuarioService";

// tabla
export function UsuarioTable({ usuarios, loading, onEditar, onEliminar }) {
  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <p className="text-slate-500 font-medium">Cargando usuarios...</p>
      </div>
    );
  }

  if (!usuarios || usuarios.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center">
        <p className="text-slate-500 font-medium">No existen usuarios registrados.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Código</th>
            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Usuario</th>
            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Correo</th>
            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Rol</th>
            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Estado</th>
            <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {usuarios.map((usr) => (
            <tr key={usr.id_usuario} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-semibold text-slate-700">{usr.id_usuario}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f4fc]">
                    <UserCircleIcon size={22} className="text-[#006cb7]" />
                  </div>
                  <span className="font-medium text-slate-800">{usr.nombre}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-slate-600">{usr.correo}</td>
              <td className="px-6 py-4 text-slate-700 font-medium">{usr.rol}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    usr.estado === "Activo"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {usr.estado}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => onEditar(usr)}
                    className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition"
                    title="Editar"
                  >
                    <PencilIcon size={18} />
                  </button>
                  <button
                    onClick={() => onEliminar(usr)}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition"
                    title="Eliminar"
                  >
                    <Trash2Icon size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// crear y editar
export function UsuarioModal({ open, usuario, onClose, onSuccess }) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [rol, setRol] = useState("Supervisor");
  const [estado, setEstado] = useState("Activo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const limpiarFormulario = () => {
    setNombre("");
    setCorreo("");
    setRol("Supervisor");
    setEstado("Activo");
    setError("");
  };

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre || "");
      setCorreo(usuario.correo || "");
      setRol(usuario.rol || "Supervisor");
      setEstado(usuario.estado || "Activo");
    } else {
      limpiarFormulario();
    }
  }, [usuario, open]);

  if (!open) return null;

  const cerrar = () => {
    limpiarFormulario();
    onClose();
  };

  const guardar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const datosUsuario = { nombre, correo, rol, estado };

    try {
      if (usuario) {
        await actualizarUsuario(usuario.id_usuario, datosUsuario);
      } else {
        await crearUsuario(datosUsuario);
      }
      limpiarFormulario();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Error al procesar la solicitud en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {usuario ? "Editar Usuario" : "Nuevo Usuario"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {usuario
                ? "Actualice la información del usuario en el sistema."
                : "Complete la información para registrar un nuevo usuario."}
            </p>
          </div>
          <button
            onClick={cerrar}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={guardar} className="space-y-5 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-slate-700">Nombre completo</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#006cb7] focus:ring-4 focus:ring-blue-100"
              placeholder="Ej. Juan Pérez"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Correo institucional</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#006cb7] focus:ring-4 focus:ring-blue-100"
              placeholder="ejemplo@empresa.com.pe"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-semibold text-slate-700">Rol</label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#006cb7]"
              >
                <option value="Supervisor">Supervisor</option>
                <option value="Coordinador">Coordinador</option>
                <option value="Gerencia">Gerencia</option>
                <option value="TI">TI</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#006cb7]"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Footer botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={cerrar}
              className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#006cb7] px-6 py-2.5 font-semibold text-white hover:bg-[#00589b] disabled:opacity-50 transition"
            >
              {loading ? "Guardando..." : usuario ? "Actualizar Usuario" : "Guardar Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// confirmar eliminacion
export function ConfirmEliminarModal({ open, usuario, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open || !usuario) return null;

  const handleEliminar = async () => {
    setLoading(true);
    setError("");
    try {
      await eliminarUsuario(usuario.id_usuario);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "No se pudo eliminar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangleIcon size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">¿Eliminar usuario?</h3>
            <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <p className="mt-4 text-sm text-slate-600">
          ¿Estás seguro de que deseas eliminar a <strong className="text-slate-800">{usuario.nombre}</strong>?
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleEliminar}
            disabled={loading}
            className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
          >
            {loading ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}