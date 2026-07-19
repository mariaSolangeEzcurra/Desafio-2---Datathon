import { useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";

import {
    obtenerUsuarios,
    eliminarUsuario,
} from "../services/usuarioService";

import UsuarioTable from "../components/usuarios/UsuarioTable";
import UsuarioModal from "../components/usuarios/UsuarioModal";

export default function Usuarios() {

    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [usuarioEditar, setUsuarioEditar] = useState(null);

    const cargarUsuarios = async () => {
        try {
            const data = await obtenerUsuarios();
            setUsuarios(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const nuevoUsuario = () => {
        setUsuarioEditar(null);
        setOpenModal(true);
    };

    const editarUsuario = (usuario) => {
        setUsuarioEditar(usuario);
        setOpenModal(true);
    };
    const borrarUsuario = async (usuario) => {
        const confirmar = window.confirm(
            `¿Está seguro de eliminar al usuario ${usuario.nombre}?`
        );
        if (!confirmar) return;
        try {
            await eliminarUsuario(usuario.id_usuario);
            cargarUsuarios();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    const cerrarModal = () => {
        setOpenModal(false);
        setUsuarioEditar(null);
    };
    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">
                        Administración de Usuarios
                    </h1>
                    <p className="mt-2 text-slate-500">
                        Gestione los usuarios institucionales del sistema.
                    </p>
                </div>
                <button
                    onClick={nuevoUsuario}
                    className="flex items-center gap-2 rounded-xl bg-[#006cb7] px-5 py-3 font-semibold text-white transition hover:bg-[#00589b]"
                >
                    <PlusIcon size={18} />
                    Nuevo Usuario
                </button>
            </div>
            <div className="rounded-2xl bg-white shadow-sm">
                <UsuarioTable
                    usuarios={usuarios}
                    loading={loading}
                    onEditar={editarUsuario}
                    onEliminar={borrarUsuario}
                />
            </div>
            <UsuarioModal
                open={openModal}
                usuario={usuarioEditar}
                onClose={cerrarModal}
                onSuccess={cargarUsuarios}
            />
        </div>
    );
}