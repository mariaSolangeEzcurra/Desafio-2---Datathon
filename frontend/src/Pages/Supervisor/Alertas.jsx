import { useEffect, useState } from "react";

import {
  AlertTriangle,
  RefreshCw,
  Eye,
  X,
  Calendar,
  CheckCircle,
  MapPin
} from "lucide-react";

import {
  obtenerAlertas,
  evaluarAlertas,
  obtenerDetalleAlerta,
  cambiarEstadoAlerta
} from "../../services/alertasService";


export default function Alertas() {

  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [evaluando, setEvaluando] = useState(false);

  const [fecha, setFecha] = useState("");

  const [detalle, setDetalle] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);



  useEffect(() => {
    cargarAlertas();
  }, []);



  const cargarAlertas = async () => {

    try {

      setLoading(true);

      const data = await obtenerAlertas();

      setAlertas(data || []);

    } catch(error){

      console.error(
        "Error cargando alertas",
        error
      );

    } finally {

      setLoading(false);

    }

  };




  const ejecutarEvaluacion = async()=>{

    if(!fecha){

      alert("Seleccione una fecha");

      return;

    }


    try{

      setEvaluando(true);


      await evaluarAlertas(fecha);


      await cargarAlertas();


    }catch(error){

      console.error(
        "Error evaluando alertas",
        error
      );


    }finally{

      setEvaluando(false);

    }

  };





  const verDetalle = async(id)=>{

    try{

      const data =
        await obtenerDetalleAlerta(id);


      setDetalle(data);

      setMostrarDetalle(true);


    }catch(error){

      console.error(
        "Error obteniendo detalle",
        error
      );

    }

  };





  const actualizarEstado = async()=>{


    try{


      const usuario =
        JSON.parse(
          localStorage.getItem("usuario")
        );



      await cambiarEstadoAlerta(

        detalle.alerta_id,

        {

          estado_alerta:
            detalle.estado_alerta,


          comentario:
            "Actualización realizada por supervisor",


          supervisor_id:
            usuario?.id || "SUP001"

        }

      );


      setMostrarDetalle(false);

      await cargarAlertas();



    }catch(error){

      console.error(
        "Error actualizando estado",
        error
      );

    }

  };






  const colorNivel=(nivel)=>{

    switch(nivel){

      case "Alto":
        return "bg-red-100 text-red-700";


      case "Medio":
        return "bg-yellow-100 text-yellow-700";


      case "Bajo":
        return "bg-green-100 text-green-700";


      default:
        return "bg-slate-100 text-slate-600";

    }

  };






  const colorEstado=(estado)=>{


    switch(estado){

      case "Pendiente":
        return "bg-red-100 text-red-700";


      case "En Revisión":
        return "bg-yellow-100 text-yellow-700";


      case "Escalada":
        return "bg-orange-100 text-orange-700";


      case "Resuelto":
        return "bg-green-100 text-green-700";


      default:
        return "bg-slate-100 text-slate-600";

    }

  };





  return (

    <div className="space-y-6">


      <div className="flex flex-col sm:flex-row justify-between gap-4">

        <div>

          <h1 className="text-2xl font-bold text-slate-800">
            Alertas y Supervisión
          </h1>


          <p className="text-sm text-gray-500">
            Monitoreo de incidencias generadas por evaluación de KPIs operativos.
          </p>

        </div>


      </div>





      <div className="bg-white rounded-2xl border shadow-sm p-5">


        <div className="flex items-center gap-3 mb-4">


          <Calendar className="text-[#006cb7]" />


          <h2 className="font-bold text-slate-800">
            Evaluar alertas
          </h2>


        </div>



        <div className="flex gap-3">


          <input

            type="date"

            value={fecha}

            onChange={(e)=>setFecha(e.target.value)}

            className="border rounded-xl px-4 py-2 text-sm"

          />



          <button

            onClick={ejecutarEvaluacion}

            disabled={evaluando}

            className="
            bg-[#006cb7]
            hover:bg-[#005799]
            text-white
            px-5
            py-2
            rounded-xl
            font-semibold
            flex
            items-center
            gap-2
            disabled:opacity-50
            "

          >

            <RefreshCw

              size={16}

              className={
                evaluando
                ?
                "animate-spin"
                :
                ""
              }

            />


            {
              evaluando
              ?
              "Evaluando..."
              :
              "Evaluar"
            }


          </button>



        </div>


      </div>






      <div className="
        bg-white
        rounded-2xl
        border
        shadow-sm
        overflow-hidden
      ">


        <div className="
          p-5
          border-b
          flex
          justify-between
          items-center
        ">


          <div className="
            flex
            items-center
            gap-3
          ">


            <AlertTriangle className="text-[#006cb7]" />


            <div>

              <h2 className="font-bold text-slate-800">
                Alertas registradas
              </h2>


              <p className="text-xs text-gray-500">
                Listado de alertas generadas por desempeño operativo.
              </p>


            </div>


          </div>


          <div className="text-xs text-gray-500">

            {alertas.length} registros

          </div>


        </div>






        <div className="overflow-x-auto">


          <table className="w-full text-sm text-left">


            <thead className="bg-slate-50 text-slate-600">

              <tr>

                <th className="p-3">Nivel</th>
                <th className="p-3">KPI</th>
                <th className="p-3">Trabajador</th>
                <th className="p-3">Zona</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Umbral</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Acción</th>

              </tr>

            </thead>




            <tbody>


            {
              loading ? (

                <tr>

                  <td
                    colSpan="8"
                    className="p-6 text-center"
                  >

                    Cargando alertas...

                  </td>

                </tr>


              )
              :
              alertas.length===0 ? (

                <tr>

                  <td
                    colSpan="8"
                    className="p-6 text-center text-gray-500"
                  >

                    No existen alertas registradas.

                  </td>

                </tr>


              )
              :
              alertas.map((a)=>(


                <tr
                  key={a.alerta_id}
                  className="
                  border-t
                  hover:bg-slate-50
                  "
                >


                  <td className="p-3">

                    <span
                      className={`
                      px-3
                      py-1
                      rounded-full
                      text-xs
                      font-semibold
                      ${colorNivel(a.nivel)}
                      `}
                    >

                      {a.nivel}

                    </span>

                  </td>



                  <td className="p-3 font-semibold">
                    {a.kpi}
                  </td>



                  <td className="p-3">
                    {a.ccodprs}
                  </td>



                  <td className="p-3">

                    <div className="flex gap-1 items-center">

                      <MapPin size={14}/>

                      {a.zona_id}

                    </div>

                  </td>



                  <td className="p-3 font-bold">
                    {a.valor_actual}
                  </td>



                  <td className="p-3">
                    {a.valor_umbral}
                  </td>



                  <td className="p-3">

                    <span
                      className={`
                      px-3
                      py-1
                      rounded-full
                      text-xs
                      font-semibold
                      ${colorEstado(a.estado_alerta)}
                      `}
                    >

                      {a.estado_alerta}

                    </span>

                  </td>



                  <td className="p-3">

                    <button

                      onClick={()=>verDetalle(a.alerta_id)}

                      className="
                      bg-[#006cb7]
                      hover:bg-[#005799]
                      text-white
                      px-3
                      py-2
                      rounded-lg
                      flex
                      items-center
                      gap-2
                      text-xs
                      font-semibold
                      "

                    >

                      <Eye size={15}/>

                      Ver

                    </button>


                  </td>


                </tr>


              ))

            }


            </tbody>


          </table>


        </div>


      </div>







      {
        mostrarDetalle &&
        detalle &&

        <div className="
          fixed
          inset-0
          bg-black/40
          backdrop-blur-sm
          flex
          items-center
          justify-center
          z-50
          p-4
        ">


          <div className="
            bg-white
            rounded-2xl
            w-full
            max-w-lg
            shadow-xl
          ">



            <div className="
              flex
              justify-between
              p-6
              border-b
            ">


              <div>


                <h2 className="
                  text-xl
                  font-bold
                  text-slate-800
                ">

                  Detalle de alerta

                </h2>


                <p className="text-sm text-gray-500">

                  {detalle.alerta_id}

                </p>


              </div>



              <button
                onClick={()=>setMostrarDetalle(false)}
              >

                <X/>

              </button>


            </div>





            <div className="p-6 space-y-3">


              <p>
                <b>KPI:</b> {detalle.kpi}
              </p>


              <p>
                <b>Motivo:</b> {detalle.motivo}
              </p>


              <p>
                <b>Trabajador:</b> {detalle.ccodprs}
              </p>


              <p>
                <b>Zona:</b> {detalle.zona_id}
              </p>




              <select

                value={detalle.estado_alerta}

                onChange={
                  e =>
                  setDetalle({
                    ...detalle,
                    estado_alerta:e.target.value
                  })
                }

                className="
                border
                rounded-xl
                p-2
                w-full
                "

              >

                <option>Pendiente</option>
                <option>En Revisión</option>
                <option>Escalada</option>
                <option>Resuelto</option>


              </select>





              <button

                onClick={actualizarEstado}

                className="
                mt-4
                w-full
                bg-green-600
                hover:bg-green-700
                text-white
                py-3
                rounded-xl
                font-semibold
                flex
                justify-center
                gap-2
                "

              >

                <CheckCircle size={18}/>

                Actualizar estado


              </button>



            </div>


          </div>


        </div>

      }


    </div>

  );

}