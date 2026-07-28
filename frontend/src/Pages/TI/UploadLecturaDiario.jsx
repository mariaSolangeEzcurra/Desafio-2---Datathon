import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  History
} from "lucide-react";

import {
  subirReporteDiario,
  obtenerHistorialReportes
} from "../../services/uploadDiarioService";


export default function CargarReporte() {


  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);

  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  const [reportesProcesados, setReportesProcesados] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);

  const fileInputRef = useRef(null);



  const cargarHistorial = async () => {

    try {

      setCargandoHistorial(true);

      const data = await obtenerHistorialReportes();

      setReportesProcesados(
        Array.isArray(data) ? data : []
      );


    } catch (err) {

      console.error(
        "Error cargando reportes diarios:",
        err
      );


    } finally {

      setCargandoHistorial(false);

    }

  };




  useEffect(() => {

    cargarHistorial();

  }, []);





  const handleFileChange = (e) => {


    const selectedFile = e.target.files[0];


    if (!selectedFile) return;



    if (!/\.(xlsx|xls)$/i.test(selectedFile.name)) {


      setError(
        "Solo se permiten archivos Excel (.xlsx, .xls)"
      );

      setArchivo(null);

      return;

    }



    setError(null);

    setArchivo(selectedFile);


  };





  const handleProcesar = async (e) => {


    e.preventDefault();



    if (!archivo) {

      setError(
        "Seleccione un archivo Excel."
      );

      return;

    }




    try {


      setLoading(true);

      setError(null);

      setResultado(null);



      const data =
        await subirReporteDiario(archivo);



      setResultado(data);



      setArchivo(null);



      if (fileInputRef.current) {

        fileInputRef.current.value = "";

      }



      await cargarHistorial();



    } catch (err) {


      console.error(
        "Error procesando reporte:",
        err
      );


      setError(
        err.response?.data?.detail ||
        err.message ||
        "Error procesando archivo."
      );



    } finally {


      setLoading(false);


    }


  };






  return (

    <div className="space-y-6 text-left">



      {/* CARGA */}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">


        <h3 className="text-sm font-bold text-slate-700 uppercase mb-1 flex items-center gap-2">


          <FileSpreadsheet
            size={16}
            className="text-[#006cb7]"
          />


          Carga de Reporte Diario de Lecturas


        </h3>



        <p className="text-xs text-slate-500 mb-6">


          Importa el Excel diario generado por los lectores para actualizar indicadores de desempeño.


        </p>




        <form
          onSubmit={handleProcesar}
          className="space-y-4"
        >



          <div>


            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-2">


              Archivo Excel


            </label>



            <div

              onClick={() =>
                fileInputRef.current?.click()
              }

              className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#006cb7] bg-slate-50/50"

            >


              <input

                ref={fileInputRef}

                type="file"

                accept=".xlsx,.xls"

                onChange={handleFileChange}

                className="hidden"

              />



              {

                archivo ? (


                  <div className="flex justify-center items-center gap-2">


                    <FileSpreadsheet
                      size={18}
                      className="text-[#006cb7]"
                    />


                    <span className="text-xs font-semibold">

                      {archivo.name}

                    </span>


                  </div>



                ) : (


                  <div className="flex justify-center items-center gap-2 text-xs text-slate-500">


                    <UploadCloud
                      size={18}
                    />


                    Seleccione el Excel del reporte diario


                  </div>


                )


              }



            </div>



          </div>





          <button

            type="submit"

            disabled={loading || !archivo}

            className="w-full bg-[#006cb7] text-white py-2.5 rounded-xl font-bold text-xs disabled:bg-slate-300 flex items-center justify-center gap-2"

          >



            {

              loading ? (


                <>

                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  Procesando reporte...


                </>



              ) : (


                "Procesar Reporte Diario"


              )


            }


          </button>



        </form>







        {error && (


          <div className="mt-4 p-3 rounded-xl border text-xs flex gap-2 bg-rose-50 text-rose-900 border-rose-200">


            <AlertCircle size={16}/>


            {error}


          </div>


        )}






        {resultado && (


          <div className="mt-4 p-4 rounded-xl border bg-emerald-50 border-emerald-200">


            <div className="flex items-center gap-2 text-xs font-bold mb-3">


              <CheckCircle2
                size={16}
              />


              {resultado.message || "Reporte procesado correctamente"}


            </div>




            <div className="grid grid-cols-4 gap-3 text-center">


              <div className="bg-white rounded-lg p-2">


                <p className="text-[10px]">
                  INSERTADOS
                </p>


                <b>
                  {resultado.registros_insertados}
                </b>


              </div>



              <div className="bg-white rounded-lg p-2">


                <p className="text-[10px]">
                  ACTUALIZADOS
                </p>


                <b>
                  {resultado.registros_actualizados}
                </b>


              </div>




              <div className="bg-white rounded-lg p-2">


                <p className="text-[10px]">
                  ERRORES
                </p>


                <b>
                  {resultado.registros_error}
                </b>


              </div>




              <div className="bg-white rounded-lg p-2">


                <p className="text-[10px]">
                  TOTAL
                </p>


                <b>
                  {resultado.total_filas_excel}
                </b>


              </div>



            </div>



          </div>


        )}





      </div>








      {/* HISTORIAL */}



      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">


        <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">


          <History
            size={16}
          />


          Resúmenes Diarios ({reportesProcesados.length})


        </h3>





        <div className="overflow-x-auto">


          <table className="w-full text-xs">


            <thead className="bg-slate-50">


              <tr className="border-b">


                <th className="p-3">
                  Lector
                </th>


                <th className="p-3">
                  Fecha
                </th>


                <th className="p-3">
                  Lecturas
                </th>


                <th className="p-3">
                  Pendientes
                </th>


                <th className="p-3">
                  Impedimentos
                </th>


                <th className="p-3">
                  Eficiencia
                </th>


              </tr>


            </thead>




            <tbody className="divide-y">


              {

              cargandoHistorial ? (


                <tr>

                  <td
                    colSpan="6"
                    className="p-6 text-center"
                  >

                    <Loader2
                      className="animate-spin inline"
                    />

                    Cargando...

                  </td>


                </tr>



              ) : reportesProcesados.length === 0 ? (


                <tr>

                  <td
                    colSpan="6"
                    className="p-6 text-center text-slate-400"
                  >

                    No existen reportes diarios.

                  </td>


                </tr>



              ) : (


                reportesProcesados.map((item)=> (


                  <tr key={item.id}>


                    <td className="p-3 font-medium">

                      {item.ccodprs}

                    </td>



                    <td className="p-3">


                      <Calendar size={12} className="inline mr-1"/>


                      {item.fecha}


                    </td>



                    <td className="p-3 text-center">


                      {item.lecturas_realizadas}


                    </td>



                    <td className="p-3 text-center">


                      {item.lecturas_pendientes}


                    </td>



                    <td className="p-3 text-center">


                      {item.cantidad_impedimentos}


                    </td>



                    <td className="p-3 text-center font-bold text-[#006cb7]">


                      {item.eficiencia}%


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