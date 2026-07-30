import { useEffect, useState } from "react";
import {
  Pencil,
  Trash2,
  UserCircle,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import {
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from "../../services/usuarioService";


// ============================================================
// TABLA DE USUARIOS
// ============================================================
export function UsuarioTable({
  usuarios,
  loading,
  onEditar,
  onEliminar,
}) {
  // ----------------------------------------------------------
  // CARGANDO
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
        <Loader2
          size={26}
          className="animate-spin text-[#006cb7]"
        />

        <p className="text-xs">
          Cargando usuarios...
        </p>
      </div>
    );
  }

  // ----------------------------------------------------------
  // SIN USUARIOS
  // ----------------------------------------------------------
  if (!usuarios || usuarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">

        <div className="p-3 bg-slate-50 rounded-xl">
          <UserCircle size={25} />
        </div>

        <p className="text-xs font-medium text-slate-500">
          No existen usuarios registrados.
        </p>

      </div>
    );
  }

  // ----------------------------------------------------------
  // TABLA
  // ----------------------------------------------------------
  return (
    <table className="w-full min-w-[950px] text-xs border-collapse">

      {/* ======================================================
          CABECERA FIJA
      ======================================================= */}
      <thead className="sticky top-0 z-20 bg-slate-50 text-slate-600 uppercase">

        <tr className="border-b border-slate-200">

          <th className="p-3 text-left font-bold whitespace-nowrap bg-slate-50 w-[100px]">
            Código
          </th>

          <th className="p-3 text-left font-bold whitespace-nowrap bg-slate-50 min-w-[220px]">
            Usuario
          </th>

          <th className="p-3 text-left font-bold whitespace-nowrap bg-slate-50 min-w-[260px]">
            Correo
          </th>

          <th className="p-3 text-left font-bold whitespace-nowrap bg-slate-50 w-[160px]">
            Rol
          </th>

          <th className="p-3 text-center font-bold whitespace-nowrap bg-slate-50 w-[130px]">
            Estado
          </th>

          <th className="p-3 text-center font-bold whitespace-nowrap bg-slate-50 w-[150px]">
            Acciones
          </th>

        </tr>

      </thead>


      {/* ======================================================
          FILAS
      ======================================================= */}
      <tbody className="divide-y divide-slate-100">

        {usuarios.map((usr, index) => (

          <tr
            key={
              usr.id_usuario ||
              `usuario-${index}`
            }
            className="hover:bg-slate-50/70 transition-colors"
          >

            {/* ==================================================
                CÓDIGO
            =================================================== */}
            <td className="p-3 whitespace-nowrap">

              <span className="font-bold text-[#006cb7]">
                {usr.id_usuario || "-"}
              </span>

            </td>


            {/* ==================================================
                USUARIO
            =================================================== */}
            <td className="p-3">

              <div className="flex items-center gap-2 min-w-0">

                <span className="font-semibold text-slate-800 truncate">
                  {usr.nombre || "-"}
                </span>

              </div>

            </td>


            {/* ==================================================
                CORREO
            =================================================== */}
            <td className="p-3 text-slate-600">

              <span className="whitespace-nowrap">
                {usr.correo || "-"}
              </span>

            </td>


            {/* ==================================================
                ROL
            =================================================== */}
            <td className="p-3">

              <span className="font-medium text-slate-700 whitespace-nowrap">
                {usr.rol || "-"}
              </span>

            </td>


            {/* ==================================================
                ESTADO
            =================================================== */}
            <td className="p-3 text-center">

              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${
                  String(usr.estado || "")
                    .toLowerCase() === "activo"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {usr.estado || "Sin estado"}
              </span>

            </td>


            {/* ==================================================
                ACCIONES
            =================================================== */}
            <td className="p-3 text-center">

              <div className="flex items-center justify-center gap-1.5">

                {/* EDITAR */}
                <button
                  type="button"
                  onClick={() => onEditar(usr)}
                  title="Editar usuario"
                  className="inline-flex items-center justify-center p-2 rounded-lg text-[#006cb7] bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors"
                >
                  <Pencil size={14} />
                </button>


                {/* ELIMINAR */}
                <button
                  type="button"
                  onClick={() => onEliminar(usr)}
                  title="Eliminar usuario"
                  className="inline-flex items-center justify-center p-2 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition-colors"
                >
                  <Trash2 size={14} />
                </button>

              </div>

            </td>

          </tr>

        ))}

      </tbody>

    </table>
  );
}


// ============================================================
// MODAL CREAR / EDITAR
// ============================================================
export function UsuarioModal({
  open,
  usuario,
  onClose,
  onSuccess,
}) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [rol, setRol] = useState("Supervisor");
  const [estado, setEstado] = useState("Activo");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  // ==========================================================
  // LIMPIAR FORMULARIO
  // ==========================================================
  const limpiarFormulario = () => {
    setNombre("");
    setCorreo("");
    setRol("Supervisor");
    setEstado("Activo");
    setError("");
  };


  // ==========================================================
  // CARGAR DATOS AL EDITAR
  // ==========================================================
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


  // ==========================================================
  // CERRAR
  // ==========================================================
  const cerrar = () => {
    limpiarFormulario();
    onClose();
  };


  // ==========================================================
  // GUARDAR
  // ==========================================================
  const guardar = async (e) => {

    e.preventDefault();

    setLoading(true);
    setError("");

    const datosUsuario = {
      nombre,
      correo,
      rol,
      estado,
    };

    try {

      if (usuario) {

        await actualizarUsuario(
          usuario.id_usuario,
          datosUsuario
        );

      } else {

        await crearUsuario(datosUsuario);

      }

      limpiarFormulario();

      onSuccess();

      onClose();

    } catch (err) {

      console.error(
        "Error procesando usuario:",
        err
      );

      setError(
        err?.message ||
        "Error al procesar la solicitud en el servidor."
      );

    } finally {

      setLoading(false);

    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">

      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* ====================================================
            CABECERA
        ===================================================== */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

          <div>

            <h2 className="text-lg font-bold text-slate-800">
              {usuario
                ? "Editar Usuario"
                : "Nuevo Usuario"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {usuario
                ? "Actualice la información del usuario en el sistema."
                : "Complete la información para registrar un nuevo usuario."}
            </p>

          </div>

          <button
            type="button"
            onClick={cerrar}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={19} />
          </button>

        </div>


        {/* ====================================================
            FORMULARIO
        ===================================================== */}
        <form
          onSubmit={guardar}
          className="space-y-5 p-6"
        >

          {/* ERROR */}
          {error && (

            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">

              <span className="font-bold">
                Error:
              </span>{" "}

              {error}

            </div>

          )}


          {/* NOMBRE */}
          <div>

            <label className="text-xs font-bold text-slate-700">
              Nombre completo
            </label>

            <input
              value={nombre}
              onChange={(e) =>
                setNombre(e.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#006cb7] focus:ring-4 focus:ring-blue-50"
              placeholder="Ej. Juan Pérez"
              required
            />

          </div>


          {/* CORREO */}
          <div>

            <label className="text-xs font-bold text-slate-700">
              Correo institucional
            </label>

            <input
              type="email"
              value={correo}
              onChange={(e) =>
                setCorreo(e.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#006cb7] focus:ring-4 focus:ring-blue-50"
              placeholder="ejemplo@empresa.com.pe"
              required
            />

          </div>


          {/* ROL / ESTADO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <div>

              <label className="text-xs font-bold text-slate-700">
                Rol
              </label>

              <select
                value={rol}
                onChange={(e) =>
                  setRol(e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#006cb7]"
              >

                <option value="Supervisor">
                  Supervisor
                </option>

                <option value="Gerencia">
                  Gerencia
                </option>

                <option value="TI">
                  TI
                </option>

              </select>

            </div>


            <div>

              <label className="text-xs font-bold text-slate-700">
                Estado
              </label>

              <select
                value={estado}
                onChange={(e) =>
                  setEstado(e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#006cb7]"
              >

                <option value="Activo">
                  Activo
                </option>

                <option value="Inactivo">
                  Inactivo
                </option>

              </select>

            </div>

          </div>


          {/* ==================================================
              BOTONES
          =================================================== */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">

            <button
              type="button"
              onClick={cerrar}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#006cb7] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#00589b] disabled:opacity-50 transition flex items-center gap-2"
            >

              {loading && (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              )}

              {loading
                ? "Guardando..."
                : usuario
                  ? "Actualizar Usuario"
                  : "Guardar Usuario"}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


// ============================================================
// MODAL CONFIRMAR ELIMINACIÓN
// ============================================================
export function ConfirmEliminarModal({
  open,
  usuario,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  if (!open || !usuario) return null;


  // ==========================================================
  // ELIMINAR
  // ==========================================================
  const handleEliminar = async () => {

    setLoading(true);
    setError("");

    try {

      await eliminarUsuario(
        usuario.id_usuario
      );

      onSuccess();
      onClose();

    } catch (err) {

      console.error(
        "Error eliminando usuario:",
        err
      );

      setError(
        err?.message ||
        "No se pudo eliminar el usuario."
      );

    } finally {

      setLoading(false);

    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

        {/* ====================================================
            INFORMACIÓN
        ===================================================== */}
        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">

            <AlertTriangle size={23} />

          </div>

          <div>

            <h3 className="text-lg font-bold text-slate-800">
              ¿Eliminar usuario?
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              Esta acción no se puede deshacer.
            </p>

          </div>

        </div>


        {/* ERROR */}
        {error && (

          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">

            {error}

          </div>

        )}


        {/* MENSAJE */}
        <p className="mt-5 text-sm text-slate-600">

          ¿Estás seguro de que deseas eliminar a{" "}

          <strong className="text-slate-800">
            {usuario.nombre}
          </strong>
          ?

        </p>


        {/* ====================================================
            BOTONES
        ===================================================== */}
        <div className="mt-6 flex justify-end gap-3">

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleEliminar}
            disabled={loading}
            className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition flex items-center gap-2"
          >

            {loading && (
              <Loader2
                size={14}
                className="animate-spin"
              />
            )}

            {loading
              ? "Eliminando..."
              : "Sí, eliminar"}

          </button>

        </div>

      </div>

    </div>
  );
}
