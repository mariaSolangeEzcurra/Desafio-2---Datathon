import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";

import navigation from "../config/navigation";
import SidebarItem from "./SidebarItem";

export default function Sidebar({

  usuario,

  vista,

  setVista,

}) {

  const [collapsed, setCollapsed] = useState(false);

  const menu = navigation.filter((item) =>
    item.roles.includes(usuario.rol)
  );

  return (

    <aside
      className={`flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300
      ${collapsed ? "w-20" : "w-72"}`}
    >

      {/* Logo */}

      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-6">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#006cb7] text-white">

          <Building2 size={22} />

        </div>

        {

          !collapsed && (

            <div>

              <h2 className="font-bold text-slate-800">

                SEDAPAR

              </h2>

              <p className="text-sm text-slate-500">

                Supervisión Operativa

              </p>

            </div>

          )

        }

      </div>

      {/* Menú */}

      <div className="flex-1 space-y-2 overflow-y-auto p-4">

        {

          menu.map((item) => (

            <SidebarItem

              key={item.id}

              item={item}

              vista={vista}

              setVista={setVista}

              collapsed={collapsed}

            />

          ))

        }

      </div>

      {/* Usuario */}

      <div className="border-t border-slate-200 p-4">

        {

          !collapsed && (

            <>

              <p className="font-semibold text-slate-700">

                {usuario.nombre}

              </p>

              <p className="text-sm text-slate-500">

                {usuario.rol}

              </p>

            </>

          )

        }

        <button

          onClick={() => setCollapsed(!collapsed)}

          className="mt-4 flex w-full items-center justify-center rounded-xl border border-slate-200 py-2 transition hover:bg-slate-100"

        >

          {

            collapsed

              ? <ChevronRight size={18} />

              : <ChevronLeft size={18} />

          }

        </button>

      </div>

    </aside>

  );

}