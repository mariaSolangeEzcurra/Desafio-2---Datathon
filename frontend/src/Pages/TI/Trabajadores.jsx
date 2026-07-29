import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Loader2,
  Database,
  RefreshCw,
} from "lucide-react";

import { obtenerPersonal } from "../../services/trabajadorService";

export default function Trabajadores() {
  const [personal, setPersonal] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // ============================================================
  // CARGAR PERSONAL
  // ============================================================
  const cargarPersonal = async () => {
    setCargandoLista(true);

    try {
      const data = await obtenerPersonal(0, 100);

      setPersonal(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando personal:", error);
      setPersonal([]);
    } finally {
      setCargandoLista(false);
    }
  };

  // ============================================================
  // CARGAR AL INICIAR
  // ============================================================
  useEffect(() => {
    cargarPersonal();
  }, []);

  // ============================================================
  // FILTRAR POR CÓDIGO O NOMBRE
  // ============================================================
  const filtrados = personal.filter((p) => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return true;

    return (
      String(p.ccodprs || "")
        .toLowerCase()
        .includes(texto) ||
      String(p.nombre || "")
        .toLowerCase()
        .includes(texto)
    );
  });

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6 text-left">

      {/* ======================================================
          CABECERA GENERAL
      ======================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

        <div className="flex items-center justify-between gap-4">

          {/* INFORMACIÓN */}
          <div className="flex items-center gap-3 min-w-0">

            <div className="p-3 bg-blue-50 text-[#006cb7] rounded-xl shrink-0">
              <Users size={22} />
            </div>

            <div className="min-w-0">

              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Personal Operativo
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Consulta y búsqueda del personal operativo
                registrado en el sistema.
              </p>

            </div>

          </div>

          {/* TOTAL + ACTUALIZAR */}
          <div className="flex items-center gap-3 shrink-0">

            <div className="hidden sm:block text-xs text-slate-500">
              Total registrados:{" "}
              <span className="font-bold text-[#006cb7]">
                {personal.length}
              </span>
            </div>

            <button
              type="button"
              onClick={cargarPersonal}
              disabled={cargandoLista}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-[#006cb7] bg-blue-50 border border-blue-100 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >

              <RefreshCw
                size={14}
                className={
                  cargandoLista
                    ? "animate-spin"
                    : ""
                }
              />

              Actualizar

            </button>

          </div>

        </div>

        {/* TOTAL EN MÓVIL */}
        <div className="sm:hidden mt-3 text-xs text-slate-500">
          Total registrados:{" "}
          <span className="font-bold text-[#006cb7]">
            {personal.length}
          </span>
        </div>

      </div>


      {/* ======================================================
          BUSCADOR
      ======================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">

        <div className="flex items-center gap-3">

          <Search
            size={18}
            className="text-slate-400 shrink-0"
          />

          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="
              w-full
              text-xs
              bg-transparent
              focus:outline-none
              text-slate-700
              placeholder-slate-400
            "
          />

          {busqueda && (
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
              {filtrados.length} resultado
              {filtrados.length !== 1 ? "s" : ""}
            </span>
          )}

        </div>

      </div>


      {/* ======================================================
          TABLA
      ======================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

        {/* CABECERA DE LA TABLA */}
        <div className="flex items-center justify-between gap-3 mb-4">

          <div>

            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">

              <Users
                size={16}
                className="text-[#006cb7]"
              />

              Lista de Personal

            </h4>

            <p className="text-[10px] text-slate-400 mt-1">
              Personal operativo registrado actualmente.
            </p>

          </div>

          <span className="text-[10px] font-bold text-slate-400 uppercase">
            {filtrados.length} registros
          </span>

        </div>


        {/* ====================================================
            CONTENEDOR DE SCROLL
        ===================================================== */}
        <div className="border border-slate-200 rounded-xl overflow-auto max-h-[500px]">

          {cargandoLista ? (

            /* ==================================================
                CARGANDO
            =================================================== */
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">

              <Loader2
                className="animate-spin text-[#006cb7]"
                size={26}
              />

              <p className="text-xs">
                Cargando personal operativo...
              </p>

            </div>

          ) : filtrados.length === 0 ? (

            /* ==================================================
                SIN RESULTADOS
            =================================================== */
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">

              <div className="p-3 bg-slate-50 rounded-xl">
                <Database size={24} />
              </div>

              <p className="text-xs font-medium text-slate-500">
                {busqueda
                  ? "No se encontraron trabajadores con esa búsqueda."
                  : "No existe personal registrado."}
              </p>

              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className="text-[10px] font-bold text-[#006cb7] hover:underline"
                >
                  Limpiar búsqueda
                </button>
              )}

            </div>

          ) : (

            /* ==================================================
                UNA SOLA TABLA
            =================================================== */
            <table className="w-full min-w-[650px] text-left text-xs border-collapse">

              {/* =================================================
                  CABECERA FIJA
              ================================================== */}
              <thead className="sticky top-0 z-20 bg-slate-50 text-slate-600 uppercase">

                <tr className="border-b border-slate-200">

                  <th
                    className="
                      p-3
                      font-bold
                      whitespace-nowrap
                      bg-slate-50
                      w-[220px]
                    "
                  >
                    Código Lector
                  </th>

                  <th
                    className="
                      p-3
                      font-bold
                      whitespace-nowrap
                      bg-slate-50
                    "
                  >
                    Nombre
                  </th>

                </tr>

              </thead>


              {/* =================================================
                  FILAS
              ================================================== */}
              <tbody className="divide-y divide-slate-100">

                {filtrados.map((p, index) => (

                  <tr
                    key={
                      p.ccodprs ||
                      `trabajador-${index}`
                    }
                    className="hover:bg-slate-50/70 transition-colors"
                  >

                    {/* CÓDIGO */}
                    <td className="p-3 whitespace-nowrap">

                      <span className="inline-flex items-center gap-2">

                        <span className="p-1.5 rounded-lg bg-blue-50 text-[#006cb7]">

                          <Users size={13} />

                        </span>

                        <span className="font-bold text-[#006cb7]">
                          {p.ccodprs || "-"}
                        </span>

                      </span>

                    </td>


                    {/* NOMBRE */}
                    <td className="p-3 text-slate-800 font-medium">

                      {p.nombre || "-"}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

        </div>

      </div>

    </div>
  );
}