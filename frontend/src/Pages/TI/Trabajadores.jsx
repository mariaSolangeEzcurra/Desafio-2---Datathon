import { useEffect, useState } from "react";
import { Users, UploadCloud, Plus, X } from "lucide-react";


export default function Trabajadores() {

  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(false);

  const [mostrarModal, setMostrarModal] = useState(false);

  const [nuevoTrabajador, setNuevoTrabajador] = useState({
    ccodprs: "",
    nombre: "",
    supervisor: ""
  });


  // ================================
  // LISTAR TRABAJADORES
  // ================================

  const cargarTrabajadores = async () => {

    try {

      setLoading(true);


      const response = await fetch(
        "http://localhost:8000/api/trabajadores/"
      );


      const data = await response.json();

      setTrabajadores(data);


    } catch(error){

      console.error(
        "Error cargando trabajadores",
        error
      );


    } finally {

      setLoading(false);

    }

  };



  useEffect(()=>{

    cargarTrabajadores();

  },[]);




  // ================================
  // IMPORTAR EXCEL
  // ================================

  const importarExcel = async (e)=>{


    const archivo = e.target.files[0];


    if(!archivo) return;



    const formData = new FormData();


    // IMPORTANTE:
    // coincide con FastAPI:
    // archivo: UploadFile = File(...)
    formData.append(
      "archivo",
      archivo
    );



    try {


      const response = await fetch(
        "http://localhost:8000/api/trabajadores/upload",
        {
          method:"POST",
          body:formData
        }
      );



      if(!response.ok){

        const error = await response.json();

        console.log(error);

        throw new Error(
          "Error importando archivo"
        );

      }



      const data = await response.json();


      console.log(
        "Importación correcta:",
        data
      );


      cargarTrabajadores();



    } catch(error){

      console.error(error);

      alert(
        "Error al importar trabajadores"
      );

    }


  };




  // ================================
  // CREAR TRABAJADOR
  // ================================

  const crearTrabajador = async()=>{


    try{


      const response = await fetch(
        "http://localhost:8000/api/trabajadores/",
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify(
            nuevoTrabajador
          )
        }
      );



      if(!response.ok){

        throw new Error(
          "Error creando trabajador"
        );

      }



      await response.json();


      setMostrarModal(false);


      setNuevoTrabajador({
        ccodprs:"",
        nombre:"",
        supervisor:""
      });


      cargarTrabajadores();



    }catch(error){


      console.error(error);

      alert(
        "No se pudo crear trabajador"
      );


    }


  };




  return (

    <div className="space-y-6">



      {/* HEADER */}

      <div className="flex justify-between items-center">


        <div>

          <h1 className="text-2xl font-bold text-slate-800">
            Gestión de Trabajadores
          </h1>


          <p className="text-sm text-slate-500">
            Administración del personal operativo
          </p>


        </div>



        <div className="flex gap-3">


          {/* IMPORTAR */}

          <label
            className="
            flex items-center gap-2
            bg-[#006cb7]
            text-white
            px-4 py-2
            rounded-xl
            cursor-pointer
            "
          >

            <UploadCloud size={18}/>

            Importar Excel


            <input
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={importarExcel}
            />

          </label>




          {/* NUEVO */}

          <button

            onClick={()=>setMostrarModal(true)}

            className="
            flex items-center gap-2
            bg-white
            border
            px-4 py-2
            rounded-xl
            "
          >

            <Plus size={18}/>

            Nuevo trabajador


          </button>


        </div>


      </div>






      {/* TABLA */}

      <div className="bg-white border rounded-2xl shadow-sm">



        <div className="p-5 border-b flex items-center gap-3">


          <Users className="text-[#006cb7]"/>


          <h2 className="font-bold">

            Trabajadores registrados

          </h2>


        </div>





        <table className="w-full text-sm">


          <thead className="bg-slate-50">


            <tr>


              <th className="p-3 text-left">
                Código
              </th>


              <th className="p-3 text-left">
                Nombre
              </th>


              <th className="p-3 text-left">
                Supervisor
              </th>


            </tr>


          </thead>



          <tbody>


          {
            loading ?

            <tr>
              <td
              colSpan="3"
              className="p-5 text-center"
              >
                Cargando...
              </td>
            </tr>


            :

            trabajadores.map((t)=>(

              <tr
                key={t.ccodprs}
                className="border-t"
              >


                <td className="p-3">
                  {t.ccodprs}
                </td>


                <td className="p-3">
                  {t.nombre}
                </td>


                <td className="p-3">
                  {t.supervisor ?? "-"}
                </td>


              </tr>

            ))

          }


          </tbody>


        </table>



      </div>







      {/* MODAL CREAR */}

      {
        mostrarModal && (

          <div
          className="
          fixed inset-0
          bg-black/30
          flex items-center
          justify-center
          "
          >


            <div
            className="
            bg-white
            rounded-2xl
            p-6
            w-[400px]
            "
            >


              <div
              className="
              flex justify-between
              items-center mb-5
              "
              >

                <h2 className="font-bold text-lg">
                  Nuevo trabajador
                </h2>


                <button
                onClick={()=>setMostrarModal(false)}
                >

                  <X/>

                </button>


              </div>




              <input

                placeholder="Código trabajador"

                className="
                border p-2 rounded-lg w-full mb-3
                "

                value={nuevoTrabajador.ccodprs}

                onChange={(e)=>
                  setNuevoTrabajador({
                    ...nuevoTrabajador,
                    ccodprs:e.target.value
                  })
                }

              />




              <input

                placeholder="Nombre"

                className="
                border p-2 rounded-lg w-full mb-3
                "

                value={nuevoTrabajador.nombre}

                onChange={(e)=>
                  setNuevoTrabajador({
                    ...nuevoTrabajador,
                    nombre:e.target.value
                  })
                }

              />




              <input

                placeholder="Supervisor (opcional)"

                className="
                border p-2 rounded-lg w-full mb-4
                "

                value={nuevoTrabajador.supervisor}

                onChange={(e)=>
                  setNuevoTrabajador({
                    ...nuevoTrabajador,
                    supervisor:e.target.value
                  })
                }

              />



              <button

              onClick={crearTrabajador}

              className="
              w-full
              bg-[#006cb7]
              text-white
              py-2
              rounded-xl
              "

              >

                Guardar


              </button>



            </div>


          </div>

        )
      }



    </div>

  );

}