import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import {
    crearUsuario,
    actualizarUsuario,
} from "../../services/usuarioService";

export default function UsuarioModal({
    open,
    usuario,
    onClose,
    onSuccess,
}) {

    const [nombre, setNombre] = useState("");
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [rol, setRol] = useState("Supervisor");
    const [estado, setEstado] = useState("Activo");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const limpiarFormulario = () => {
        setNombre("");
        setCorreo("");
        setPassword("");
        setRol("Supervisor");
        setEstado("Activo");
        setError("");
    };

    useEffect(() => {

        if (usuario) {

            setNombre(usuario.nombre);
            setCorreo(usuario.correo);
            setRol(usuario.rol);
            setEstado(usuario.estado);
            setPassword("");

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

        try {

            if (usuario) {

                await actualizarUsuario(
                    usuario.id_usuario,
                    {
                        nombre,
                        correo,
                        rol,
                        estado,
                    }
                );

            } else {

                await crearUsuario({
                    nombre,
                    correo,
                    password,
                    rol,
                    estado,
                });

            }


            limpiarFormulario();
            onClose();
            onSuccess();


        } catch (err) {

            setError(err.message);

        } finally {

            setLoading(false);

        }

    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

            <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">

                <div className="flex items-center justify-between border-b px-6 py-5">

                    <div>

                        <h2 className="text-2xl font-bold">
                            {
                                usuario
                                    ? "Editar Usuario"
                                    : "Nuevo Usuario"
                            }
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {
                                usuario
                                    ? "Actualice la información del usuario."
                                    : "Complete la información del usuario."
                            }
                        </p>

                    </div>


                    <button
                        onClick={cerrar}
                        className="rounded-lg p-2 hover:bg-slate-100"
                    >
                        <XIcon size={20} />
                    </button>

                </div>


                <form
                    onSubmit={guardar}
                    className="space-y-5 p-6"
                >

                    {
                        error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </div>
                        )
                    }


                    <div>

                        <label className="text-sm font-semibold">
                            Nombre completo
                        </label>

                        <input
                            value={nombre}
                            onChange={(e)=>setNombre(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#006cb7] focus:ring-4 focus:ring-blue-100"
                            required
                        />

                    </div>


                    <div>

                        <label className="text-sm font-semibold">
                            Correo institucional
                        </label>

                        <input
                            type="email"
                            value={correo}
                            onChange={(e)=>setCorreo(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#006cb7] focus:ring-4 focus:ring-blue-100"
                            required
                        />

                    </div>


                    {
                        !usuario && (

                            <div>

                                <label className="text-sm font-semibold">
                                    Contraseña
                                </label>

                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e)=>setPassword(e.target.value)}
                                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#006cb7] focus:ring-4 focus:ring-blue-100"
                                    required
                                />

                            </div>

                        )
                    }


                    <div className="grid grid-cols-2 gap-5">

                        <div>

                            <label className="text-sm font-semibold">
                                Rol
                            </label>

                            <select
                                value={rol}
                                onChange={(e)=>setRol(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                            >
                                <option>Supervisor</option>
                                <option>Coordinador</option>
                                <option>Gerencia</option>
                                <option>TI</option>
                            </select>

                        </div>


                        <div>

                            <label className="text-sm font-semibold">
                                Estado
                            </label>

                            <select
                                value={estado}
                                onChange={(e)=>setEstado(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                            >
                                <option>Activo</option>
                                <option>Inactivo</option>
                            </select>

                        </div>

                    </div>


                    <div className="flex justify-end gap-3 pt-2">

                        <button
                            type="button"
                            onClick={cerrar}
                            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold"
                        >
                            Cancelar
                        </button>


                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl bg-[#006cb7] px-6 py-3 font-semibold text-white hover:bg-[#00589b] disabled:opacity-50"
                        >
                            {
                                loading
                                    ? "Guardando..."
                                    : usuario
                                        ? "Actualizar Usuario"
                                        : "Guardar Usuario"
                            }
                        </button>

                    </div>


                </form>

            </div>

        </div>
    );
}