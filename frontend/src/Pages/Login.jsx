import React, { useState } from "react";
import { ShieldCheckIcon } from "lucide-react";

export default function Login({ onLogin }) { 
  const [showPassword, setShowPassword] = useState(false);
  const [usuario, setUsuario] = useState("gerencia");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onLogin(data.rol); 
      } else {
        setError(data.message || "Credenciales incorrectas.");
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full bg-[#f5f8fa]">

      {/* Panel izquierdo */}
      <section className="hidden lg:flex w-[46%] bg-[#003f6d] p-12 flex-col justify-between">

        <div className="flex items-center gap-3 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#006cb7] font-black text-lg">
            S
          </div>

          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[#8fc8ed]">
              SEDAPAR
            </p>

            <p className="text-sm">
              Supervisión Operativa
            </p>
          </div>
        </div>

        <div className="max-w-md">

          <p className="mb-4 text-sm font-semibold tracking-wide text-[#8fc8ed]">
            INTELIGENCIA OPERATIVA
          </p>

          <h1 className="text-5xl font-bold leading-tight text-white">
            Decisiones oportunas
            <br />
            para una operación
            <br />
            eficiente.
          </h1>

          <p className="mt-6 text-blue-100 text-lg">
            Supervise procesos, equipos y cobertura territorial
            desde una única plataforma de análisis.
          </p>

        </div>

        <p className="text-xs text-blue-200">
          © 2026 SEDAPAR · Uso institucional autorizado
        </p>

      </section>

      {/* Login */}
      <section className="flex flex-1 items-center justify-center p-6 lg:p-12">

        <div className="w-full max-w-[420px]">

          <div className="mb-8">

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f4fc] text-[#006cb7]">
              <ShieldCheckIcon size={24} />
            </div>

            <h2 className="text-4xl font-bold text-slate-900">
              Bienvenido de nuevo
            </h2>

            <p className="mt-2 text-slate-500">
              Ingrese sus credenciales institucionales para continuar.
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>

              <label className="text-sm font-semibold text-slate-700">
                Correo institucional
              </label>

              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#006cb7] focus:ring-4 focus:ring-blue-100"
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
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-20 outline-none focus:border-[#006cb7] focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3 text-[#006cb7] font-semibold"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>

              </div>

            </div>

            <div className="flex items-center justify-between">

              <label className="flex items-center gap-2 text-sm text-slate-600">

                <input type="checkbox" />

                Mantener sesión

              </label>

              <button
                type="button"
                className="text-[#006cb7] font-semibold text-sm"
              >
                ¿Olvidó su contraseña?
              </button>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#006cb7] py-4 text-white font-bold hover:bg-[#005a95] transition disabled:opacity-50"
            >
              {loading ? "Validando..." : "Iniciar sesión"}
            </button>

          </form>

        </div>

      </section>

    </main>
  );
}