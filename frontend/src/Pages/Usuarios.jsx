import { useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";

import { obtenerUsuarios } from "../services/usuarioService";

import UsuarioTable from "../components/usuarios/UsuarioTable";
import UsuarioModal from "../components/usuarios/UsuarioModal";

export default function Usuarios() {

    const [usuarios, setUsuarios] = useState([]);

    const [loading, setLoading] = useState(true);

    const [openModal, setOpenModal] = useState(false);

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

    return (

        <div className="p-8">

            {/* Encabezado */}

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

                    onClick={() => setOpenModal(true)}

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

                />

            </div>

            <UsuarioModal

                open={openModal}

                onClose={() => setOpenModal(false)}

                onSuccess={cargarUsuarios}

            />

        </div>

    );

}