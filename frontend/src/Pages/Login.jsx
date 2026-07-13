import { useState } from "react";
import { ShieldCheckIcon } from "lucide-react";
import { login } from "../services/authService";

export default function Login({ onLogin }) {

  const [correo, setCorreo] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);

    setError("");

    try {

      const usuario = await login(
        correo,
        password
      );

      onLogin(usuario);

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }

  };

  return (

    <main className="flex min-h-screen bg-slate-100">

      {/* Panel Izquierdo */}

      <section className="hidden lg:flex w-[46%] flex-col justify-between bg-[#003f6d] p-12">

        <div>

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white font-black text-[#006cb7]">

              S

            </div>

            <div>

              <p className="text-xs font-bold tracking-[0.25em] text-sky-200">

                SEDAPAR

              </p>

              <p className="text-white">

                Supervisión Operativa

              </p>

            </div>

          </div>

        </div>

        <div className="max-w-md">

          <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-sky-200">

            INTELIGENCIA OPERATIVA

          </p>

          <h1 className="text-5xl font-bold leading-tight text-white">

            Decisiones oportunas

            <br />

            para una operación

            <br />

            eficiente.

          </h1>

          <p className="mt-6 text-lg text-blue-100">

            Supervise procesos, equipos y cobertura territorial
            desde una única plataforma de análisis.

          </p>

        </div>

        <p className="text-sm text-blue-200">

          © 2026 SEDAPAR · Uso institucional autorizado

        </p>

      </section>

      {/* Login */}

      <section className="flex flex-1 items-center justify-center p-6">

        <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-xl">

          <div className="mb-8">

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#e8f4fc] text-[#006cb7]">

              <ShieldCheckIcon size={28} />

            </div>

            <h2 className="text-3xl font-bold text-slate-900">

              Bienvenido

            </h2>

            <p className="mt-2 text-slate-500">

              Ingrese sus credenciales institucionales.

            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {error && (

              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">

                {error}

              </div>

            )}

            <div>

              <label className="text-sm font-semibold text-slate-700">

                Correo institucional

              </label>

              <input

                type="email"

                value={correo}

                onChange={(e) => setCorreo(e.target.value)}

                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#006cb7] focus:ring-4 focus:ring-blue-100"

                placeholder="usuario@sedapar.com.pe"

                required

              />

            </div>

            <div>

              <label className="text-sm font-semibold text-slate-700">

                Contraseña

              </label>

              <div className="relative mt-2">

                <input

                  type={showPassword ? "text" : "password"}

                  value={password}

                  onChange={(e) => setPassword(e.target.value)}

                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-24 outline-none transition focus:border-[#006cb7] focus:ring-4 focus:ring-blue-100"

                  required

                />

                <button

                  type="button"

                  onClick={() =>
                    setShowPassword(!showPassword)
                  }

                  className="absolute right-4 top-3 text-sm font-semibold text-[#006cb7]"

                >

                  {showPassword ? "Ocultar" : "Mostrar"}

                </button>

              </div>

            </div>

            <button

              disabled={loading}

              type="submit"

              className="w-full rounded-xl bg-[#006cb7] py-3 font-bold text-white transition hover:bg-[#005895] disabled:opacity-60"

            >

              {loading
                ? "Validando..."
                : "Iniciar sesión"}

            </button>

          </form>

        </div>

      </section>

    </main>

  );

}