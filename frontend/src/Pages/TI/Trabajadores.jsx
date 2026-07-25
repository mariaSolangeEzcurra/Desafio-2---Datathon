import React, { useState, useEffect, useRef } from "react";
import { Database, AlertCircle, CheckCircle2, Users, Search, UserPlus, Pencil, Trash2, X, AlertTriangleIcon } from "lucide-react";
import { obtenerTrabajadores, crearTrabajador, actualizarTrabajador, eliminarTrabajador, cargarTrabajadoresExcel } from "../../services/trabajadorService";

export default function Trabajadores() {
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const fileInputRef = useRef(null);

  const [trabajadores, setTrabajadores] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // Estados unificados para los modales
  const [modal, setModal] = useState({ open: false, data: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, data: null });
  const [form, setForm] = useState({ ccodprs: "", nombre: "", telefono: "" });
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState("");

  const fetchTrabajadores = async () => {
    setCargandoLista(true);
    try { 
      const res = await obtenerTrabajadores();
      setTrabajadores(Array.isArray(res) ? res : (res?.data || []));
    } catch (e) { 
      setTrabajadores([]);
    } finally { 
      setCargandoLista(false); 
    }
  };

  useEffect(() => { fetchTrabajadores(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!archivo) return;
    setSubiendo(true);
    setStatus({ type: "loading", message: "Procesando archivo Excel..." });
    try {
      const res = await cargarTrabajadoresExcel(archivo);
      setStatus({ type: "success", message: `${res.mensaje || "Carga completada"}. Nuevos: ${res.nuevos ?? 0} | Actualizados: ${res.actualizados ?? 0}` });
      setArchivo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchTrabajadores();
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.detail || "Error al procesar el Excel." });
    } finally { setSubiendo(false); }
  };

  const abrirModal = (t = null) => {
    setModal({ open: true, data: t });
    setForm(t ? { ccodprs: t.ccodprs || "", nombre: t.nombre || "", telefono: t.telefono || "" } : { ccodprs: "", nombre: "", telefono: "" });
    setErrorModal("");
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.ccodprs || !form.nombre) return;
    setGuardando(true);
    setErrorModal("");
    try {
      if (modal.data) {
        await actualizarTrabajador(modal.data.ccodprs, { nombre: form.nombre.trim(), telefono: form.telefono.trim() });
      } else {
        await crearTrabajador({ ccodprs: form.ccodprs.trim(), nombre: form.nombre.trim(), telefono: form.telefono.trim() });
      }
      setModal({ open: false, data: null });
      await fetchTrabajadores();
    } catch (err) {
      setErrorModal(err.response?.data?.detail || "Error al guardar.");
    } finally { setGuardando(false); }
  };

  const handleEliminar = async () => {
    if (!deleteModal.data) return;
    setGuardando(true);
    try {
      await eliminarTrabajador(deleteModal.data.ccodprs);
      setDeleteModal({ open: false, data: null });
      await fetchTrabajadores();
    } catch (err) {
      alert("Error al eliminar.");
    } finally { setGuardando(false); }
  };

  const filtrados = trabajadores.filter(t => {
    const q = busqueda.toLowerCase().trim();
    return (t.nombre || "").toLowerCase().includes(q) || (t.ccodprs || "").toString().toLowerCase().includes(q) || (t.telefono || "").toString().includes(q);
  });

  return (
    <div className="space-y-6 text-left">
      {/* Carga Masiva */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
          <Database size={16} className="text-[#006cb7]" /> Carga Masiva (Personal Lector Notificador)
        </h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#006cb7] bg-slate-50/50">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => setArchivo(e.target.files[0])} />
            <p className="text-xs text-slate-600 font-medium">{archivo ? archivo.name : "Haga clic para seleccionar el archivo Excel (.xlsx)"}</p>
          </div>
          <button disabled={!archivo || subiendo} className="w-full bg-[#006cb7] text-white py-2.5 rounded-xl font-bold text-xs disabled:bg-slate-300">
            {subiendo ? "Procesando..." : "Iniciar Carga Masiva"}
          </button>
        </form>
        {status.message && (
          <div className={`mt-3 p-3 rounded-xl border text-xs flex items-center gap-2 ${status.type === "success" ? "bg-emerald-50 text-emerald-900 border-emerald-200" : "bg-rose-50 text-rose-900 border-rose-200"}`}>
            {status.type === "success" ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
            <span>{status.message}</span>
          </div>
        )}
      </div>

      {/* Tabla y Buscador */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
            <Users size={16} className="text-[#006cb7]" /> Personal Operativo ({trabajadores.length})
          </h3>
          <button onClick={() => abrirModal()} className="bg-[#006cb7] text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-[#00589b]">
            <UserPlus size={14} /> Nuevo Trabajador
          </button>
        </div>

        <div className="border border-slate-200 rounded-xl p-2.5 flex items-center gap-2 bg-slate-50/50">
          <Search size={16} className="text-slate-400 ml-1" />
          <input type="text" placeholder="Buscar por código, nombre o teléfono..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full text-xs bg-transparent outline-none" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="p-3">Cod. Lector</th>
                <th className="p-3">Apellidos y Nombres</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cargandoLista ? (
                <tr><td colSpan={4} className="p-6 text-center text-slate-400">Cargando datos...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-slate-400">No hay trabajadores registrados.</td></tr>
              ) : (
                filtrados.map((t) => (
                  <tr key={t.ccodprs} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-700">{t.ccodprs}</td>
                    <td className="p-3 font-medium text-slate-800">{t.nombre}</td>
                    <td className="p-3 text-slate-600">{t.telefono || "-"}</td>
                    <td className="p-3 flex justify-center gap-2">
                      <button onClick={() => abrirModal(t)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteModal({ open: true, data: t })} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleGuardar} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl border">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-xs font-bold uppercase text-slate-800">{modal.data ? "Editar" : "Nuevo"} Trabajador</h4>
              <button type="button" onClick={() => setModal({ open: false, data: null })} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            {errorModal && <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200">{errorModal}</div>}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">COD. LECTOR / CCODPRS</label>
              <input type="text" required placeholder="Ej. 122" disabled={!!modal.data} value={form.ccodprs} onChange={(e) => setForm({ ...form, ccodprs: e.target.value })} className="w-full text-xs border rounded-xl p-2.5 outline-none focus:border-[#006cb7] disabled:bg-slate-100" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Apellidos y Nombres</label>
              <input type="text" required placeholder="Ej. PAUCAR PANCA GUILLERMO" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full text-xs border rounded-xl p-2.5 outline-none focus:border-[#006cb7]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Teléfono (9 dígitos)</label>
              <input type="text" inputMode="numeric" placeholder="Ej. 946436099" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value.replace(/\D/g, "").slice(0, 9) })} maxLength={9} className="w-full text-xs border rounded-xl p-2.5 outline-none focus:border-[#006cb7]" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setModal({ open: false, data: null })} className="px-3 py-1.5 border rounded-xl text-xs font-bold text-slate-600">Cancelar</button>
              <button disabled={guardando} className="px-4 py-1.5 bg-[#006cb7] text-white rounded-xl text-xs font-bold disabled:opacity-50">{guardando ? "Guardando..." : "Guardar"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Confirmar Eliminación Personalizado */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl border text-left">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 text-red-600 rounded-full"><AlertTriangleIcon size={20} /></div>
              <h4 className="text-sm font-bold text-slate-800">¿Eliminar trabajador?</h4>
            </div>
            <p className="text-xs text-slate-600">¿Deseas eliminar a <strong className="text-slate-800">{deleteModal.data?.nombre}</strong>? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setDeleteModal({ open: false, data: null })} className="px-3 py-1.5 border rounded-xl text-xs font-bold text-slate-600">Cancelar</button>
              <button onClick={handleEliminar} disabled={guardando} className="px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold disabled:opacity-50">{guardando ? "Eliminando..." : "Sí, eliminar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}