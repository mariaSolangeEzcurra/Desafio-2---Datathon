import React, { useEffect, useState } from "react";
import {
  FileText,
  Printer,
  ArrowLeft,
  Database,
  Loader2,
  Search,
  RotateCcw,
} from "lucide-react";
import axios from "axios";

export default function CatalogosDashboard() {
  const [catalogoSeleccionado, setCatalogoSeleccionado] = useState(null);
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const catalogosDisponibles = [
    {
      id: "impedimentos",
      label: "Impedimentos",
      descripcion: "Consulta los tipos de impedimentos registrados.",
    },
    {
      id: "observaciones",
      label: "Observaciones",
      descripcion: "Consulta las observaciones registradas.",
    },
    {
      id: "grupos",
      label: "Grupos de Facturación",
      descripcion: "Consulta los grupos de facturación del sistema.",
    },
  ];

  // ============================================================
  // CARGAR CATÁLOGO
  // ============================================================
  useEffect(() => {
    if (!catalogoSeleccionado) return;

    const fetchDatos = async () => {
      setCargando(true);

      try {
        const response = await axios.get(
          `http://localhost:8000/api/catalogos/${catalogoSeleccionado}`
        );

        setDatos(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (error) {
        console.error(
          "Error al cargar el catálogo:",
          error
        );

        setDatos([]);
      } finally {
        setCargando(false);
      }
    };

    fetchDatos();
  }, [catalogoSeleccionado]);

  // ============================================================
  // VOLVER
  // ============================================================
  const volverCatalogos = () => {
    setCatalogoSeleccionado(null);
    setBusqueda("");
    setDatos([]);
  };

  // ============================================================
  // CATÁLOGOS PRINCIPALES
  // ============================================================
  if (!catalogoSeleccionado) {
    return (
      <div className="space-y-6 text-left">

        {/* CABECERA */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="p-3 bg-blue-50 text-[#006cb7] rounded-xl">
                <Database size={22} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  Gestión de Catálogos
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Consulta los catálogos utilizados por el sistema.
                </p>
              </div>

            </div>

            <div className="text-xs text-slate-500">
              Catálogos disponibles:{" "}
              <span className="font-bold text-[#006cb7]">
                {catalogosDisponibles.length}
              </span>
            </div>

          </div>

        </div>

        {/* LISTA DE CATÁLOGOS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

          <div className="mb-5">

            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Catálogos del sistema
            </h4>

            <p className="text-[10px] text-slate-400 mt-1">
              Selecciona un catálogo para consultar sus registros.
            </p>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

            {catalogosDisponibles.map((catalogo) => (

              <button
                key={catalogo.id}
                type="button"
                onClick={() =>
                  setCatalogoSeleccionado(catalogo.id)
                }
                className="
                  group
                  flex
                  items-center
                  gap-4
                  p-5
                  text-left
                  bg-white
                  border
                  border-slate-200
                  rounded-xl
                  hover:border-[#006cb7]
                  hover:bg-blue-50/30
                  hover:shadow-sm
                  transition-all
                "
              >

                <div
                  className="
                    p-3
                    bg-blue-50
                    text-[#006cb7]
                    rounded-xl
                    shrink-0
                    group-hover:bg-[#006cb7]
                    group-hover:text-white
                    transition-colors
                  "
                >
                  <FileText size={20} />
                </div>

                <div className="min-w-0">

                  <h5 className="text-xs font-bold text-slate-700 group-hover:text-[#006cb7] transition-colors">
                    {catalogo.label}
                  </h5>

                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    {catalogo.descripcion}
                  </p>

                  <span className="inline-block mt-2 text-[10px] font-bold text-[#006cb7]">
                    Ver registros →
                  </span>

                </div>

              </button>

            ))}

          </div>

        </div>

      </div>
    );
  }

  // ============================================================
  // INFORMACIÓN DEL CATÁLOGO ACTUAL
  // ============================================================
  const infoActual =
    catalogosDisponibles.find(
      (c) => c.id === catalogoSeleccionado
    );

  // ============================================================
  // FILTRAR DATOS
  // ============================================================
  const textoBusqueda = busqueda
    .trim()
    .toLowerCase();

  const datosFiltrados = datos.filter((item) => {

    if (!textoBusqueda) return true;

    return Object.values(item).some((valor) =>
      String(valor ?? "")
        .toLowerCase()
        .includes(textoBusqueda)
    );
  });

  // ============================================================
  // COLUMNAS
  // ============================================================
  const columnas =
    datos.length > 0
      ? Object.keys(datos[0])
      : [];

  // ============================================================
  // RENDER CATÁLOGO
  // ============================================================
  return (
    <div className="space-y-6 text-left print:m-0 print:p-0">

      {/* ======================================================
          ESTILOS PARA IMPRESIÓN
      ======================================================= */}
      <style>{`
        @media print {

          aside,
          header,
          nav,
          .print-hide-all {
            display: none !important;
          }

          main,
          body,
          #root {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            overflow: visible !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          th,
          td {
            border: 1px solid #cbd5e1 !important;
            padding: 7px 9px !important;
            font-size: 9px !important;
          }

          thead {
            display: table-header-group;
          }

          tr {
            break-inside: avoid;
          }
        }
      `}</style>

      {/* ======================================================
          CABECERA
      ======================================================= */}
      <div
        className="
          bg-white
          border
          border-slate-200
          rounded-2xl
          p-6
          shadow-sm
          flex
          flex-col
          md:flex-row
          md:items-center
          md:justify-between
          gap-4
          print-hide-all
          print:hidden
        "
      >

        <div className="flex items-center gap-3 min-w-0">

          {/* VOLVER */}
          <button
            type="button"
            onClick={volverCatalogos}
            className="
              p-2
              border
              border-slate-200
              rounded-xl
              text-slate-500
              hover:bg-slate-50
              hover:text-[#006cb7]
              transition-colors
              shrink-0
            "
            title="Volver a catálogos"
          >
            <ArrowLeft size={17} />
          </button>

          {/* ICONO */}
          <div className="p-3 bg-blue-50 text-[#006cb7] rounded-xl shrink-0">
            <Database size={20} />
          </div>

          {/* TÍTULO */}
          <div className="min-w-0">

            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide truncate">
              {infoActual?.label}
            </h3>

            <p className="text-[10px] text-slate-400 mt-1">
              Consulta de registros del catálogo.
            </p>

          </div>

        </div>

        {/* BOTÓN PDF */}
        <button
          type="button"
          onClick={() => window.print()}
          className="
            shrink-0
            inline-flex
            items-center
            justify-center
            gap-2
            px-4
            py-2.5
            rounded-xl
            text-xs
            font-bold
            text-white
            bg-[#006cb7]
            hover:bg-[#005a9c]
            transition-colors
          "
        >
          <Printer size={15} />
          Imprimir / Guardar PDF
        </button>

      </div>

      {/* ======================================================
          BUSCADOR
      ======================================================= */}
      <div
        className="
          bg-white
          border
          border-slate-200
          rounded-2xl
          p-4
          shadow-sm
          flex
          items-center
          gap-3
          print-hide-all
          print:hidden
        "
      >

        <Search
          size={18}
          className="text-slate-400 ml-2 shrink-0"
        />

        <input
          type="text"
          placeholder={`Buscar en ${infoActual?.label}...`}
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
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
          <button
            type="button"
            onClick={() => setBusqueda("")}
            className="
              p-1.5
              rounded-lg
              text-slate-400
              hover:bg-slate-100
              hover:text-slate-600
              transition
            "
            title="Limpiar búsqueda"
          >
            <RotateCcw size={14} />
          </button>
        )}

      </div>

      {/* ======================================================
          TÍTULO PARA PDF
      ======================================================= */}
      <div className="hidden print:block mb-4 border-b border-slate-300 pb-3">

        <h1 className="text-lg font-bold text-slate-900 uppercase">
          SEDAPAR — CATÁLOGO DE {infoActual?.label}
        </h1>

        <p className="text-xs text-slate-500 mt-1">
          Fecha de emisión:{" "}
          {new Date().toLocaleDateString("es-PE")}
        </p>

      </div>

      {/* ======================================================
          CONTENEDOR DE TABLA
      ======================================================= */}
      <div
        className="
          bg-white
          border
          border-slate-200
          rounded-2xl
          p-6
          shadow-sm
          print:border-none
          print:p-0
          print:shadow-none
        "
      >

        {/* CABECERA DE TABLA */}
        <div className="flex items-center justify-between gap-3 mb-4 print:hidden">

          <div>

            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Registros
            </h4>

            <p className="text-[10px] text-slate-400 mt-1">
              {busqueda
                ? `${datosFiltrados.length} registros encontrados`
                : `${datos.length} registros disponibles`}
            </p>

          </div>

          <span className="text-[10px] font-bold text-slate-400 uppercase">
            {columnas.length} columnas
          </span>

        </div>

        {/* ====================================================
            TABLA ÚNICA
            - Scroll vertical
            - Scroll horizontal
            - Cabecera fija
        ===================================================== */}
        <div
          className="
            border
            border-slate-200
            rounded-xl
            overflow-auto
            max-h-[520px]
            print:border-none
            print:overflow-visible
            print:max-h-none
          "
        >

          {cargando ? (

            /* CARGANDO */
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">

              <Loader2
                className="animate-spin text-[#006cb7]"
                size={26}
              />

              <p className="text-xs">
                Cargando registros del catálogo...
              </p>

            </div>

          ) : datosFiltrados.length === 0 ? (

            /* SIN RESULTADOS */
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">

              <div className="p-3 bg-slate-50 rounded-xl">
                <Database size={24} />
              </div>

              <p className="text-xs font-medium text-slate-500">
                {busqueda
                  ? "No se encontraron registros con esa búsqueda."
                  : "No existen registros en este catálogo."}
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
                TABLA
            =================================================== */
            <table
              className="
                w-full
                min-w-[900px]
                text-left
                text-xs
                border-collapse
              "
            >

              {/* =================================================
                  CABECERA FIJA
              ================================================== */}
              <thead
                className="
                  sticky
                  top-0
                  z-20
                  bg-slate-50
                  text-slate-600
                  uppercase
                "
              >

                <tr className="border-b border-slate-200">

                  {columnas.map((key) => (

                    <th
                      key={key}
                      className="
                        p-3
                        font-bold
                        whitespace-nowrap
                        bg-slate-50
                        border-b
                        border-slate-200
                      "
                    >
                      {key.replace(/_/g, " ")}
                    </th>

                  ))}

                </tr>

              </thead>

              {/* =================================================
                  FILAS
              ================================================== */}
              <tbody className="divide-y divide-slate-100">

                {datosFiltrados.map((item, index) => (

                  <tr
                    key={index}
                    className="
                      hover:bg-slate-50/70
                      transition-colors
                      print:break-inside-avoid
                    "
                  >

                    {columnas.map((key) => (

                      <td
                        key={key}
                        className="
                          p-3
                          text-slate-700
                          font-medium
                          whitespace-nowrap
                          border-b
                          border-slate-100
                        "
                      >
                        {String(item[key] ?? "-")}
                      </td>

                    ))}

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