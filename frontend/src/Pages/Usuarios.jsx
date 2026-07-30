import { useEffect, useState } from "react";
import {
  Plus,
  Users,
  RefreshCw,
} from "lucide-react";

import { obtenerUsuarios } from "../services/usuarioService";

import {
  UsuarioTable,
  UsuarioModal,
  ConfirmEliminarModal,
} from "../Components/Usuarios/UsuarioComponents";

export default function Usuarios() {

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState(null);

  const [deleteModalOpen, setDeleteModalOpen] =
    useState(false);

  const [usuarioAEliminar, setUsuarioAEliminar] =
    useState(null);


  // ============================================================
  // CARGAR USUARIOS
  // ============================================================
  const cargarUsuarios = async () => {

    setLoading(true);

    try {

      const data = await obtenerUsuarios();

      setUsuarios(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      console.error(
        "Error al cargar usuarios:",
        err
      );

      setUsuarios([]);

    } finally {

      setLoading(false);

    }
  };


  // ============================================================
  // CARGAR AL INICIAR
  // ============================================================
  useEffect(() => {
    cargarUsuarios();
  }, []);


  // ============================================================
  // NUEVO
  // ============================================================
  const handleNuevo = () => {

    setUsuarioSeleccionado(null);
    setModalOpen(true);

  };


  // ============================================================
  // EDITAR
  // ============================================================
  const handleEditar = (usuario) => {

    setUsuarioSeleccionado(usuario);
    setModalOpen(true);

  };


  // ============================================================
  // ELIMINAR
  // ============================================================
  const handleEliminar = (usuario) => {

    setUsuarioAEliminar(usuario);
    setDeleteModalOpen(true);

  };


  return (
    <div className="space-y-6 text-left">


      {/* ======================================================
          CABECERA PRINCIPAL
      ======================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">


          {/* INFORMACIÓN */}
          <div className="flex items-center gap-3 min-w-0">

            <div className="p-3 bg-blue-50 text-[#006cb7] rounded-xl shrink-0">

              <Users size={22} />

            </div>


            <div className="min-w-0">

              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">

                Gestión de Usuarios

              </h3>

              <p className="text-xs text-slate-500 mt-1">

                Administra las cuentas, accesos y roles
                del personal institucional.

              </p>

            </div>

          </div>


          {/* ACCIONES */}
          <div className="flex items-center gap-2 shrink-0">
            {/* NUEVO */}
            <button
              type="button"
              onClick={handleNuevo}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-[#006cb7] hover:bg-[#00589b] transition-colors shadow-sm"
            >

              <Plus size={15} />

              Nuevo Usuario

            </button>

          </div>

        </div>

      </div>


      {/* ======================================================
          TABLA
      ======================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">


        {/* CABECERA TABLA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

          <div>

            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">

              <Users
                size={16}
                className="text-[#006cb7]"
              />

              Lista de Usuarios

            </h4>

            <p className="text-[10px] text-slate-400 mt-1">

              Usuarios registrados actualmente en el sistema.

            </p>

          </div>


          <span className="text-[10px] font-bold text-slate-400 uppercase">

            {usuarios.length} registros

          </span>

        </div>


        {/* ====================================================
            TABLA ÚNICA

            Todo este contenedor se desplaza:
            - Horizontalmente
            - Verticalmente

            La cabecera permanece visible.
        ===================================================== */}
        <div className="border border-slate-200 rounded-xl overflow-auto max-h-[520px]">

          <UsuarioTable
            usuarios={usuarios}
            loading={loading}
            onEditar={handleEditar}
            onEliminar={handleEliminar}
          />

        </div>

      </div>


      {/* ======================================================
          MODAL CREAR / EDITAR
      ======================================================= */}
      <UsuarioModal
        open={modalOpen}
        usuario={usuarioSeleccionado}
        onClose={() => {

          setModalOpen(false);
          setUsuarioSeleccionado(null);

        }}
        onSuccess={cargarUsuarios}
      />


      {/* ======================================================
          MODAL ELIMINAR
      ======================================================= */}
      <ConfirmEliminarModal
        open={deleteModalOpen}
        usuario={usuarioAEliminar}
        onClose={() => {

          setDeleteModalOpen(false);
          setUsuarioAEliminar(null);

        }}
        onSuccess={cargarUsuarios}
      />

    </div>
  );
}