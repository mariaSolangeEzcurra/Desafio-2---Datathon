import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Loader2,
  Award
} from "lucide-react";

import { obtenerPersonal } from "../../services/trabajadorService";


export default function Trabajadores() {

  const [personal, setPersonal] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [busqueda, setBusqueda] = useState("");


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


  useEffect(() => {
    cargarPersonal();
  }, []);



  const filtrados = personal.filter((p)=>{

    const texto = busqueda.toLowerCase();

    return (
      p.ccodprs?.toLowerCase().includes(texto) ||
      p.nombre?.toLowerCase().includes(texto) ||
      p.telefono?.toLowerCase().includes(texto)
    );

  });



  return (

    <div className="space-y-6 text-left">


      {/* LISTADO PERSONAL */}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">


        <h3 className="text-sm font-bold text-slate-700 uppercase mb-5 flex items-center gap-2">

          <Users 
            size={16}
            className="text-[#006cb7]"
          />

          Personal Operativo ({personal.length})

        </h3>



        {/* BUSCADOR */}

        <div className="
          border border-slate-200 
          rounded-xl p-2.5 
          flex items-center gap-2 
          bg-slate-50/50 mb-5
        ">

          <Search 
            size={16}
            className="text-slate-400"
          />


          <input

            type="text"

            placeholder="Buscar por código, nombre o teléfono..."

            value={busqueda}

            onChange={(e)=>setBusqueda(e.target.value)}

            className="
              w-full 
              text-xs 
              bg-transparent 
              outline-none
            "

          />

        </div>



        {/* TABLA */}

        <div className="overflow-x-auto">


          <table className="w-full text-left text-xs">


            <thead className="
              text-slate-500 
              uppercase 
              bg-slate-50 
              border-b
            ">

              <tr>

                <th className="p-3">
                  Código Lector
                </th>


                <th className="p-3">
                  Nombre
                </th>


                <th className="p-3">
                  Teléfono
                </th>


                <th className="p-3 text-center">
                  Último Puntaje
                </th>


                <th className="p-3 text-center">
                  Clasificación
                </th>


              </tr>

            </thead>



            <tbody className="divide-y">


            {
              cargandoLista ? (

                <tr>

                  <td 
                    colSpan="5"
                    className="p-6 text-center text-slate-400"
                  >

                    <Loader2
                      size={18}
                      className="animate-spin inline mr-2"
                    />

                    Cargando personal...

                  </td>

                </tr>


              ) : filtrados.length === 0 ? (

                <tr>

                  <td 
                    colSpan="5"
                    className="p-6 text-center text-slate-400"
                  >

                    No existe personal registrado.

                  </td>

                </tr>


              ) : (

                filtrados.map((p)=>(

                  <tr
                    key={p.ccodprs}
                    className="hover:bg-slate-50"
                  >


                    <td className="
                      p-3 
                      font-bold 
                      text-[#006cb7]
                    ">

                      {p.ccodprs}

                    </td>



                    <td className="
                      p-3 
                      font-medium 
                      text-slate-800
                    ">

                      {p.nombre}

                    </td>



                    <td className="
                      p-3 
                      text-slate-600
                    ">

                      {p.telefono || "-"}

                    </td>



                    <td className="
                      p-3 
                      text-center
                    ">


                      {
                        p.ultimo_puntaje !== null
                        ?
                        p.ultimo_puntaje
                        :
                        "-"
                      }


                    </td>



                    <td className="
                      p-3 
                      text-center
                    ">


                      {
                        p.ultima_clasificacion
                        ?

                        <span className="
                          inline-flex 
                          items-center 
                          gap-1
                          px-2.5
                          py-1
                          rounded-full
                          bg-emerald-50
                          text-emerald-700
                          border
                          border-emerald-200
                          text-[11px]
                          font-medium
                        ">

                          <Award size={12}/>

                          {p.ultima_clasificacion}

                        </span>

                        :

                        "-"

                      }


                    </td>



                  </tr>

                ))

              )
            }


            </tbody>


          </table>


        </div>


      </div>


    </div>

  );

}