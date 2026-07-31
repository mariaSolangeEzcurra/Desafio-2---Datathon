import React, { useEffect, useState } from "react";
import {
  FileText,
  Printer,
  ArrowLeft,
  Database,
  Loader2,
  Search,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { catalogoService } from "../../services/catalogoService";

export default function CatalogosDashboard() {
  const [catalogoSeleccionado, setCatalogoSeleccionado] = useState(null);
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // ============================================================
  // CRUD
  // ============================================================

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoFormulario, setModoFormulario] = useState("crear");
  const [itemSeleccionado, setItemSeleccionado] = useState(null);

  const [formulario, setFormulario] = useState({});
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState(null);

  // ============================================================
  // CATÁLOGOS DISPONIBLES
  // ============================================================

  const catalogosDisponibles = [
    {
      id: "impedimentos",
      label: "Impedimentos",
      descripcion:
        "Administra los códigos de impedimentos utilizados durante la lectura.",
      campos: [
        {
          nombre: "codigo",
          label: "Código",
          placeholder: "Ej. 10",
        },
        {
          nombre: "descripcion",
          label: "Descripción",
          placeholder: "Ej. MEDIDOR INACCESIBLE",
        },
      ],
    },
    {
      id: "observaciones",
      label: "Observaciones",
      descripcion:
        "Administra los códigos de observaciones registrados durante la lectura.",
      campos: [
        {
          nombre: "codigo",
          label: "Código",
          placeholder: "Ej. 50",
        },
        {
          nombre: "descripcion",
          label: "Descripción",
          placeholder: "Ej. MANIPULACION",
        },
      ],
    },
    {
      id: "grupos",
      label: "Grupos de Facturación",
      descripcion:
        "Administra los grupos y códigos de facturación utilizados por el sistema.",
      campos: [
        {
          nombre: "cmetfac",
          label: "Código Metfac",
          placeholder: "Ej. 1001",
        },
        {
          nombre: "ccodmet",
          label: "Código Met",
          placeholder: "Ej. 1",
        },
        {
          nombre: "cnommet",
          label: "Nombre del Grupo",
          placeholder: "Ej. GRUPO I",
        },
      ],
    },
  ];

  // ============================================================
  // INFORMACIÓN DEL CATÁLOGO ACTUAL
  // ============================================================

  const infoActual = catalogosDisponibles.find(
    (catalogo) => catalogo.id === catalogoSeleccionado
  );

  // ============================================================
  // MENSAJES
  // ============================================================

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({
      tipo,
      texto,
    });

    setTimeout(() => {
      setMensaje(null);
    }, 3500);
  };

  // ============================================================
  // CARGAR CATÁLOGO
  // ============================================================

  const cargarCatalogo = async () => {
    if (!catalogoSeleccionado) return;

    setCargando(true);

    try {
      const resultado = await catalogoService.obtenerCatalogo(
        catalogoSeleccionado
      );

      setDatos(Array.isArray(resultado) ? resultado : []);
    } catch (error) {
      console.error("Error al cargar el catálogo:", error);

      setDatos([]);

      const detalle = error?.response?.data?.detail;

      mostrarMensaje(
        "error",
        typeof detalle === "string"
          ? detalle
          : "No se pudo cargar el catálogo."
      );
    } finally {
      setCargando(false);
    }
  };

  // ============================================================
  // CARGAR AUTOMÁTICAMENTE
  // ============================================================

  useEffect(() => {
    if (!catalogoSeleccionado) return;

    cargarCatalogo();
  }, [catalogoSeleccionado]);

  // ============================================================
  // VOLVER
  // ============================================================

  const volverCatalogos = () => {
    setCatalogoSeleccionado(null);
    setBusqueda("");
    setDatos([]);
    cerrarModal();
  };

  // ============================================================
  // CREAR
  // ============================================================

  const abrirCrear = () => {
    setModoFormulario("crear");
    setItemSeleccionado(null);

    /*
      Los campos son definidos explícitamente según
      la estructura real de cada API.
    */

    const nuevoFormulario = {};

    infoActual?.campos?.forEach((campo) => {
      nuevoFormulario[campo.nombre] = "";
    });

    setFormulario(nuevoFormulario);
    setModalAbierto(true);
  };

  // ============================================================
  // EDITAR
  // ============================================================

  const abrirEditar = (item) => {
    setModoFormulario("editar");
    setItemSeleccionado(item);

    const copia = {};

    infoActual?.campos?.forEach((campo) => {
      copia[campo.nombre] = item[campo.nombre] ?? "";
    });

    setFormulario(copia);
    setModalAbierto(true);
  };

  // ============================================================
  // CERRAR MODAL
  // ============================================================

  const cerrarModal = () => {
    if (guardando) return;

    setModalAbierto(false);
    setFormulario({});
    setItemSeleccionado(null);
  };

  // ============================================================
  // CAMBIAR CAMPO
  // ============================================================

  const cambiarCampo = (campo, valor) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  // ============================================================
  // OBTENER IDENTIFICADOR REAL
  // ============================================================

  const obtenerIdItem = (item) => {
    if (!item || !catalogoSeleccionado) {
      return null;
    }

    /*
      IMPEDIMENTOS:
      codigo

      OBSERVACIONES:
      codigo

      GRUPOS:
      cmetfac
    */

    if (
      catalogoSeleccionado === "impedimentos" ||
      catalogoSeleccionado === "observaciones"
    ) {
      return item.codigo ?? null;
    }

    if (catalogoSeleccionado === "grupos") {
      return item.cmetfac ?? null;
    }

    return null;
  };

  // ============================================================
  // PREPARAR DATOS
  // ============================================================

  const prepararDatos = () => {
    const datosEnviar = {};

    infoActual?.campos?.forEach((campo) => {
      let valor = formulario[campo.nombre];

      if (typeof valor === "string") {
        valor = valor.trim();
      }

      datosEnviar[campo.nombre] = valor;
    });

    return datosEnviar;
  };

  // ============================================================
  // VALIDAR FORMULARIO
  // ============================================================

  const validarFormulario = () => {
    if (!infoActual?.campos) {
      return false;
    }

    for (const campo of infoActual.campos) {
      const valor = formulario[campo.nombre];

      if (
        valor === undefined ||
        valor === null ||
        String(valor).trim() === ""
      ) {
        mostrarMensaje(
          "error",
          `El campo "${campo.label}" es obligatorio.`
        );

        return false;
      }
    }

    return true;
  };

  // ============================================================
  // GUARDAR
  // ============================================================

  const guardarItem = async (e) => {
    e.preventDefault();

    if (guardando) return;

    if (!validarFormulario()) {
      return;
    }

    setGuardando(true);

    try {
      const tipo = catalogoSeleccionado;
      const datosEnviar = prepararDatos();

      console.log("=================================");
      console.log("CATÁLOGO:", tipo);
      console.log("DATOS ENVIADOS:", datosEnviar);
      console.log("=================================");

      // ========================================================
      // CREAR
      // ========================================================

      if (modoFormulario === "crear") {
        await catalogoService.crearCatalogo(
          tipo,
          datosEnviar
        );

        mostrarMensaje(
          "success",
          "Registro creado correctamente."
        );
      }

      // ========================================================
      // EDITAR
      // ========================================================

      else {
        const idItem = obtenerIdItem(itemSeleccionado);

        if (
          idItem === null ||
          idItem === undefined ||
          idItem === ""
        ) {
          mostrarMensaje(
            "error",
            "No se encontró el identificador del registro."
          );

          return;
        }

        await catalogoService.actualizarCatalogo(
          tipo,
          idItem,
          datosEnviar
        );

        mostrarMensaje(
          "success",
          "Registro actualizado correctamente."
        );
      }

      cerrarModal();

      await cargarCatalogo();
    } catch (error) {
      console.error("Error al guardar catálogo:", error);

      const detalle = error?.response?.data?.detail;

      let mensajeError = "No se pudo guardar el registro.";

      if (typeof detalle === "string") {
        mensajeError = detalle;
      } else if (Array.isArray(detalle)) {
        mensajeError =
          detalle
            .map((item) => item.msg)
            .filter(Boolean)
            .join(", ") || mensajeError;
      }

      mostrarMensaje("error", mensajeError);
    } finally {
      setGuardando(false);
    }
  };

  // ============================================================
  // ELIMINAR
  // ============================================================

  const eliminarItem = async (item) => {
    const idItem = obtenerIdItem(item);

    if (
      idItem === null ||
      idItem === undefined ||
      idItem === ""
    ) {
      mostrarMensaje(
        "error",
        "No se encontró el identificador del registro."
      );

      return;
    }

    const confirmar = window.confirm(
      `¿Estás segura de eliminar este registro?\n\nIdentificador: ${idItem}`
    );

    if (!confirmar) return;

    try {
      await catalogoService.eliminarCatalogo(
        catalogoSeleccionado,
        idItem
      );

      mostrarMensaje(
        "success",
        "Registro eliminado correctamente."
      );

      await cargarCatalogo();
    } catch (error) {
      console.error("Error al eliminar catálogo:", error);

      const detalle = error?.response?.data?.detail;

      let mensajeError =
        "No se pudo eliminar el registro.";

      if (typeof detalle === "string") {
        mensajeError = detalle;
      } else if (Array.isArray(detalle)) {
        mensajeError =
          detalle
            .map((item) => item.msg)
            .filter(Boolean)
            .join(", ") || mensajeError;
      }

      mostrarMensaje("error", mensajeError);
    }
  };

  // ============================================================
  // FILTRAR
  // ============================================================

  const textoBusqueda = busqueda.trim().toLowerCase();

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

  const columnas = infoActual?.campos?.map(
    (campo) => campo.nombre
  ) || [];

  // ============================================================
  // PANTALLA PRINCIPAL
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
                  Administra los catálogos utilizados por el sistema.
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

        {/* LISTA */}

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

          <div className="mb-5">

            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Catálogos del sistema
            </h4>

            <p className="text-[10px] text-slate-400 mt-1">
              Selecciona un catálogo para consultar y administrar sus registros.
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
                    Administrar registros →
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
  // VISTA DEL CATÁLOGO
  // ============================================================

  return (
    <div className="space-y-6 text-left print:m-0 print:p-0">

      {/* ======================================================
          MENSAJE
      ====================================================== */}

      {mensaje && (
        <div
          className={`
            fixed
            top-5
            right-5
            z-[100]
            flex
            items-center
            gap-3
            px-4
            py-3
            rounded-xl
            shadow-lg
            border
            text-xs
            font-medium
            max-w-sm
            ${
              mensaje.tipo === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }
          `}
        >

          {mensaje.tipo === "success" ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}

          <span>{mensaje.texto}</span>

        </div>
      )}

      {/* ======================================================
          ESTILOS IMPRESIÓN
      ====================================================== */}

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
      ====================================================== */}

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

          <div className="p-3 bg-blue-50 text-[#006cb7] rounded-xl shrink-0">
            <Database size={20} />
          </div>

          <div className="min-w-0">

            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide truncate">
              {infoActual?.label}
            </h3>

            <p className="text-[10px] text-slate-400 mt-1">
              Administración de registros del catálogo.
            </p>

          </div>

        </div>

        <div className="flex items-center gap-2 shrink-0">

          {/* ACTUALIZAR */}

          <button
            type="button"
            onClick={cargarCatalogo}
            disabled={cargando}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              px-3
              py-2.5
              rounded-xl
              text-xs
              font-bold
              text-slate-600
              bg-slate-50
              border
              border-slate-200
              hover:bg-slate-100
              transition-colors
              disabled:opacity-50
            "
            title="Actualizar"
          >

            <RefreshCw
              size={15}
              className={cargando ? "animate-spin" : ""}
            />

            <span className="hidden sm:inline">
              Actualizar
            </span>

          </button>

          {/* NUEVO */}

          <button
            type="button"
            onClick={abrirCrear}
            className="
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
            <Plus size={15} />
            Nuevo registro
          </button>

          {/* PDF */}

          <button
            type="button"
            onClick={() => window.print()}
            className="
              hidden
              lg:inline-flex
              items-center
              justify-center
              gap-2
              px-4
              py-2.5
              rounded-xl
              text-xs
              font-bold
              text-[#006cb7]
              bg-blue-50
              hover:bg-blue-100
              transition-colors
            "
          >
            <Printer size={15} />
            PDF
          </button>

        </div>

      </div>

      {/* ======================================================
          BUSCADOR
      ====================================================== */}

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
          TÍTULO PDF
      ====================================================== */}

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
          TABLA
      ====================================================== */}

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

            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">

              <div className="p-3 bg-slate-50 rounded-xl">
                <Database size={24} />
              </div>

              <p className="text-xs font-medium text-slate-500">
                {busqueda
                  ? "No se encontraron registros con esa búsqueda."
                  : "No existen registros en este catálogo."}
              </p>

              {!busqueda && (
                <button
                  type="button"
                  onClick={abrirCrear}
                  className="
                    mt-2
                    inline-flex
                    items-center
                    gap-2
                    px-3
                    py-2
                    rounded-lg
                    bg-blue-50
                    text-[#006cb7]
                    text-[10px]
                    font-bold
                    hover:bg-blue-100
                    print:hidden
                  "
                >
                  <Plus size={14} />
                  Crear primer registro
                </button>
              )}

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

            <table
              className="
                w-full
                min-w-[700px]
                text-left
                text-xs
                border-collapse
              "
            >

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

                  {infoActual?.campos?.map((campo) => (

                    <th
                      key={campo.nombre}
                      className="
                        p-3
                        font-bold
                        whitespace-nowrap
                        bg-slate-50
                        border-b
                        border-slate-200
                      "
                    >
                      {campo.label}
                    </th>

                  ))}

                  <th
                    className="
                      p-3
                      font-bold
                      whitespace-nowrap
                      bg-slate-50
                      border-b
                      border-slate-200
                      print:hidden
                    "
                  >
                    Acciones
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {datosFiltrados.map((item, index) => (

                  <tr
                    key={obtenerIdItem(item) ?? index}
                    className="
                      hover:bg-slate-50/70
                      transition-colors
                      print:break-inside-avoid
                    "
                  >

                    {infoActual?.campos?.map((campo) => (

                      <td
                        key={campo.nombre}
                        className="
                          p-3
                          text-slate-700
                          font-medium
                          whitespace-nowrap
                          border-b
                          border-slate-100
                        "
                      >
                        {String(
                          item[campo.nombre] ?? "-"
                        )}
                      </td>

                    ))}

                    <td
                      className="
                        p-3
                        border-b
                        border-slate-100
                        print:hidden
                      "
                    >

                      <div className="flex items-center gap-1">

                        {/* EDITAR */}

                        <button
                          type="button"
                          onClick={() => abrirEditar(item)}
                          className="
                            p-2
                            rounded-lg
                            text-slate-400
                            hover:text-[#006cb7]
                            hover:bg-blue-50
                            transition-colors
                          "
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>

                        {/* ELIMINAR */}

                        <button
                          type="button"
                          onClick={() => eliminarItem(item)}
                          className="
                            p-2
                            rounded-lg
                            text-slate-400
                            hover:text-red-600
                            hover:bg-red-50
                            transition-colors
                          "
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

        </div>

      </div>

      {/* ======================================================
          MODAL
      ====================================================== */}

      {modalAbierto && (

        <div
          className="
            fixed
            inset-0
            z-[90]
            flex
            items-center
            justify-center
            p-4
            bg-slate-900/40
            backdrop-blur-[2px]
          "
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              cerrarModal();
            }
          }}
        >

          <div
            className="
              w-full
              max-w-lg
              bg-white
              rounded-2xl
              shadow-2xl
              border
              border-slate-200
              overflow-hidden
            "
          >

            {/* HEADER */}

            <div className="flex items-center justify-between p-5 border-b border-slate-200">

              <div className="flex items-center gap-3">

                <div className="p-2.5 bg-blue-50 text-[#006cb7] rounded-xl">

                  {modoFormulario === "crear" ? (
                    <Plus size={18} />
                  ) : (
                    <Pencil size={18} />
                  )}

                </div>

                <div>

                  <h3 className="text-sm font-bold text-slate-700">

                    {modoFormulario === "crear"
                      ? "Nuevo registro"
                      : "Editar registro"}

                  </h3>

                  <p className="text-[10px] text-slate-400 mt-1">
                    {infoActual?.label}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
                className="
                  p-2
                  rounded-lg
                  text-slate-400
                  hover:bg-slate-100
                  hover:text-slate-600
                  transition
                "
              >
                <X size={18} />
              </button>

            </div>

            {/* FORMULARIO */}

            <form
              onSubmit={guardarItem}
              className="p-5"
            >

              {/* INFORMACIÓN */}

              <div className="mb-5">

                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Tipo de catálogo
                </label>

                <div
                  className="
                    flex
                    items-center
                    gap-3
                    px-3
                    py-2.5
                    bg-slate-50
                    border
                    border-slate-200
                    rounded-xl
                  "
                >

                  <Database
                    size={15}
                    className="text-[#006cb7]"
                  />

                  <span className="text-xs font-bold text-slate-700">
                    {infoActual?.label}
                  </span>

                  <span className="ml-auto text-[9px] font-medium text-slate-400">
                    {catalogoSeleccionado}
                  </span>

                </div>

              </div>

              {/* CAMPOS */}

              <div className="space-y-4">

                {infoActual?.campos?.map((campo) => {

                  const esIdentificador =
                    (catalogoSeleccionado === "impedimentos" ||
                      catalogoSeleccionado === "observaciones") &&
                    campo.nombre === "codigo";

                  const esGrupoIdentificador =
                    catalogoSeleccionado === "grupos" &&
                    campo.nombre === "cmetfac";

                  const bloquearIdentificador =
                    modoFormulario === "editar" &&
                    (esIdentificador || esGrupoIdentificador);

                  return (
                    <div key={campo.nombre}>

                      <label
                        htmlFor={`campo-${campo.nombre}`}
                        className="
                          block
                          text-[10px]
                          font-bold
                          text-slate-600
                          uppercase
                          tracking-wide
                          mb-2
                        "
                      >
                        {campo.label}
                      </label>

                      <input
                        id={`campo-${campo.nombre}`}
                        type="text"
                        value={
                          formulario[campo.nombre] ?? ""
                        }
                        onChange={(e) =>
                          cambiarCampo(
                            campo.nombre,
                            e.target.value
                          )
                        }
                        placeholder={campo.placeholder}
                        disabled={
                          guardando ||
                          bloquearIdentificador
                        }
                        className={`
                          w-full
                          px-3
                          py-2.5
                          rounded-xl
                          border
                          border-slate-200
                          text-xs
                          text-slate-700
                          placeholder-slate-400
                          focus:outline-none
                          focus:ring-2
                          focus:ring-blue-100
                          focus:border-[#006cb7]
                          transition
                          ${
                            bloquearIdentificador
                              ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                              : "bg-white"
                          }
                        `}
                      />

                      {bloquearIdentificador && (
                        <p className="text-[9px] text-slate-400 mt-1">
                          El identificador no puede modificarse.
                        </p>
                      )}

                    </div>
                  );
                })}

              </div>

              {/* BOTONES */}

              <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100">

                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="
                    px-4
                    py-2.5
                    rounded-xl
                    text-xs
                    font-bold
                    text-slate-600
                    bg-slate-50
                    border
                    border-slate-200
                    hover:bg-slate-100
                    transition
                    disabled:opacity-50
                  "
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="
                    inline-flex
                    items-center
                    gap-2
                    px-4
                    py-2.5
                    rounded-xl
                    text-xs
                    font-bold
                    text-white
                    bg-[#006cb7]
                    hover:bg-[#005a9c]
                    transition
                    disabled:opacity-50
                  "
                >

                  {guardando ? (
                    <>
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={14} />

                      {modoFormulario === "crear"
                        ? "Crear registro"
                        : "Guardar cambios"}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}