import { useState, useEffect, useRef } from "react";
import {
  ShieldCheckIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import {
  loginConGoogle,
  loginConPassword,
} from "../services/authService";

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const googleInicializado = useRef(false);

  // ============================================================
  // GOOGLE LOGIN
  // ============================================================
  useEffect(() => {
    const inicializarGoogle = () => {
      const boton = document.getElementById("btnGoogleLogin");

      if (
        window.google &&
        boton &&
        !googleInicializado.current
      ) {
        window.google.accounts.id.initialize({
          client_id:
            "557061520522-ag9hmkpkigsgmiqkprprvfdddsk3hbuo.apps.googleusercontent.com",
          ux_mode: "popup",
          callback: handleGoogleResponse,
        });

        window.google.accounts.id.renderButton(
          boton,
          {
            theme: "outline",
            size: "large",
            width: 356,
            text: "signin_with",
            shape: "pill",
          }
        );

        googleInicializado.current = true;
      }
    };

    const timer = setInterval(
      inicializarGoogle,
      300
    );

    return () => clearInterval(timer);
  }, []);

  // ============================================================
  // RESPUESTA GOOGLE
  // ============================================================
  const handleGoogleResponse = async (response) => {
    setLoading(true);
    setError("");

    try {
      const usuario = await loginConGoogle(
        response.credential
      );

      onLogin(usuario);

    } catch (err) {
      console.error(
        "Error autenticando con Google:",
        err
      );

      setError(
        err.message ||
        "Error al autenticar con la cuenta institucional."
      );

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOGIN CORREO + PASSWORD
  // ============================================================
  const handleLoginPassword = async (e) => {
    e.preventDefault();

    setError("");

    if (!correo.trim()) {
      setError("Ingrese su correo electrónico.");
      return;
    }

    if (!password.trim()) {
      setError("Ingrese su contraseña.");
      return;
    }

    setLoading(true);

    try {
      const usuario = await loginConPassword(
        correo.trim(),
        password
      );

      onLogin(usuario);

    } catch (err) {
      console.error(
        "Error iniciando sesión:",
        err
      );

      setError(
        err.message ||
        "Correo o contraseña incorrectos."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-slate-100">

      {/* ======================================================
          PANEL IZQUIERDO
      ======================================================= */}
      <section className="hidden lg:flex w-[46%] flex-col justify-between bg-[#003f6d] p-12">

        {/* LOGO */}
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


        {/* TEXTO PRINCIPAL */}
        <div className="max-w-md">

          <h1 className="text-5xl font-bold leading-tight text-white">
            Decisiones oportunas
            <br />
            para una operación
            <br />
            eficiente.
          </h1>

          <p className="mt-6 text-lg text-blue-100">
            Supervise procesos, equipos y cobertura
            territorial desde una única plataforma
            de análisis.
          </p>

        </div>


        {/* FOOTER */}
        <p className="text-sm text-blue-200">
          © 2026 SEDAPAR · Uso institucional autorizado
        </p>

      </section>


      {/* ======================================================
          PANEL LOGIN
      ======================================================= */}
      <section className="flex flex-1 items-center justify-center p-6">

        <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-xl">

          {/* ==================================================
              CABECERA
          =================================================== */}
          <div className="mb-7">

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#e8f4fc] text-[#006cb7]">

              <ShieldCheckIcon size={28} />

            </div>

            <h2 className="text-3xl font-bold text-slate-900">
              Bienvenido
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Acceda a la plataforma utilizando su
              cuenta institucional.
            </p>

          </div>


          {/* ==================================================
              ERROR
          =================================================== */}
          {error && (

            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">

              {error}

            </div>

          )}


          {/* ==================================================
              LOGIN CON CORREO
          =================================================== */}
          <form
            onSubmit={handleLoginPassword}
            className="space-y-4"
          >

            {/* CORREO */}
            <div>

              <label className="text-xs font-bold text-slate-700">
                Correo institucional
              </label>

              <div className="relative mt-2">

                <Mail
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  value={correo}
                  onChange={(e) =>
                    setCorreo(e.target.value)
                  }
                  placeholder="ejemplo@sedapar.com.pe"
                  disabled={loading}
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#006cb7] focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
                />

              </div>

            </div>


            {/* PASSWORD */}
            <div>

              <label className="text-xs font-bold text-slate-700">
                Contraseña
              </label>

              <div className="relative mt-2">

                <Lock
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type={
                    mostrarPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Ingrese su contraseña"
                  disabled={loading}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm text-slate-800 outline-none transition focus:border-[#006cb7] focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarPassword(
                      !mostrarPassword
                    )
                  }
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  title={
                    mostrarPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >

                  {mostrarPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}

                </button>

              </div>

            </div>


            {/* BOTÓN LOGIN */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#006cb7] py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#00589b] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
            >

              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />

                  Iniciando sesión...
                </>
              ) : (
                "Iniciar sesión"
              )}

            </button>

          </form>


          {/* ==================================================
              SEPARADOR
          =================================================== */}
          <div className="my-6 flex items-center gap-3">

            <div className="h-px flex-1 bg-slate-200" />

            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              O continuar con
            </span>

            <div className="h-px flex-1 bg-slate-200" />

          </div>


          {/* ==================================================
              GOOGLE
          =================================================== */}
          <div className="flex flex-col items-center justify-center">

            {loading ? (

              <div className="flex items-center gap-2 py-3 text-sm font-semibold text-slate-500">

                <Loader2
                  size={16}
                  className="animate-spin text-[#006cb7]"
                />

                <span>
                  Validando cuenta institucional...
                </span>

              </div>

            ) : (

              <div
                id="btnGoogleLogin"
                className="w-full flex justify-center"
              />

            )}

          </div>


          {/* ==================================================
              INFORMACIÓN
          =================================================== */}
          <div className="mt-6 rounded-xl bg-slate-50 border border-slate-100 p-3">

            <p className="text-center text-[10px] leading-relaxed text-slate-400">

              Utilice su cuenta institucional registrada
              en el sistema. El acceso está restringido
              al personal autorizado.

            </p>

          </div>

        </div>

      </section>

    </main>
  );
}