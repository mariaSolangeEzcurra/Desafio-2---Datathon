import { useState, useEffect, useRef } from "react";
import { ShieldCheckIcon } from "lucide-react";
import { loginConGoogle } from "../services/authService";

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const googleInicializado = useRef(false); 

  useEffect(() => {
    if (typeof google !== "undefined" && !googleInicializado.current) {
      google.accounts.id.initialize({
        client_id: "249701213502-v0nmel3t0r6otgu71r0fek42p2olchbc.apps.googleusercontent.com",
        callback: handleGoogleResponse,
      });
      google.accounts.id.renderButton(
        document.getElementById("btnGoogleLogin"),
        { theme: "outline", size: "large", width: "356", text: "signin_with", shape: "pill" }
      );
      googleInicializado.current = true; 
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    setError("");
    try {
      const usuario = await loginConGoogle(response.credential);
      onLogin(usuario);
    } catch (err) {
      setError(err.message || "Error al autenticar con la cuenta institucional.");
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
          <h1 className="text-5xl font-bold leading-tight text-white">
            Decisiones oportunas<br />para una operación<br />eficiente.
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

      {/* Login con Google */}
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
              Acceda de forma segura usando su correo institucional registrado.
            </p>
          </div>

          <div className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Contenedor donde Google renderizará el botón nativo e inviolable */}
            <div className="flex flex-col items-center justify-center pt-2">
              {loading ? (
                <div className="text-sm font-semibold text-slate-600 flex items-center gap-2 py-3">
                  <span className="animate-pulse">Validando cuenta institucional...</span>
                </div>
              ) : (
                <div id="btnGoogleLogin" className="w-full flex justify-center"></div>
              )}
            </div>            
          </div>
        </div>
      </section>
    </main>
  );
}