export default function Dashboard({ usuario }) {

    return (

        <div>

            <h1 className="text-3xl font-bold text-slate-800">

                Bienvenido, {usuario.nombre}

            </h1>

            <p className="mt-3 text-slate-500">

                Panel principal del Sistema Inteligente de Supervisión.

            </p>

        </div>

    );

}