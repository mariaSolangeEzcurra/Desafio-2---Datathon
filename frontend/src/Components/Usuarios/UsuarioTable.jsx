import {
  PencilIcon,
  Trash2Icon,
  UserCircleIcon,
} from "lucide-react";

export default function UsuarioTable({

  usuarios,

  loading,

}) {

  if (loading) {

    return (

      <div className="flex h-72 items-center justify-center">

        <p className="text-slate-500">

          Cargando usuarios...

        </p>

      </div>

    );

  }

  if (usuarios.length === 0) {

    return (

      <div className="flex h-72 items-center justify-center">

        <p className="text-slate-500">

          No existen usuarios registrados.

        </p>

      </div>

    );

  }

  return (

    <table className="min-w-full">

      <thead className="border-b bg-slate-50">

        <tr>

          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">

            Código

          </th>

          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">

            Usuario

          </th>

          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">

            Correo

          </th>

          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">

            Rol

          </th>

          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">

            Estado

          </th>

          <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">

            Acciones

          </th>

        </tr>

      </thead>

      <tbody>

        {

          usuarios.map((usuario) => (

            <tr

              key={usuario.id_usuario}

              className="border-b hover:bg-slate-50 transition"

            >

              <td className="px-6 py-4 font-semibold">

                {usuario.id_usuario}

              </td>

              <td className="px-6 py-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f4fc]">

                    <UserCircleIcon

                      size={22}

                      className="text-[#006cb7]"

                    />

                  </div>

                  <span className="font-medium">

                    {usuario.nombre}

                  </span>

                </div>

              </td>

              <td className="px-6 py-4 text-slate-600">

                {usuario.correo}

              </td>

              <td className="px-6 py-4">

                {usuario.rol}

              </td>

              <td className="px-6 py-4">

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    usuario.estado === "Activo"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >

                  {usuario.estado}

                </span>

              </td>

              <td className="px-6 py-4">

                <div className="flex justify-center gap-3">

                  <button
                    className="rounded-lg p-2 text-blue-600 hover:bg-blue-100"
                  >

                    <PencilIcon size={18} />

                  </button>

                  <button
                    className="rounded-lg p-2 text-red-600 hover:bg-red-100"
                  >

                    <Trash2Icon size={18} />

                  </button>

                </div>

              </td>

            </tr>

          ))

        }

      </tbody>

    </table>

  );

}