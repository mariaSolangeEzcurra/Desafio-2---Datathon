import { useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  X
} from "lucide-react";

export default function CargarReporte() {
  const [archivo, setArchivo] = useState(null);
  const [fechaReporte, setFechaReporte] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  // =====================================
  // SUBIR EXCEL
  // =====================================
  const importarExcel = async () => {
    if(!archivo){
      alert(
        "Seleccione un archivo Excel"
      );
      return;
    }

    if(!fechaReporte){
      alert(
        "Seleccione la fecha del reporte"
      );
      return;

    }

    const formData = new FormData();
    formData.append(
      "archivo",
      archivo
    );
    formData.append(
      "fecha_reporte",
      fechaReporte
    );

    try{
      setLoading(true);

      const response = await fetch(
        "http://localhost:8000/api/desempeno/upload",

        {
          method:"POST",
          body:formData
        }
      );

      if(!response.ok){
        const error =
          await response.json();

        throw new Error(
          error.detail ||
          "Error subiendo archivo"
        );
      }
      const data =
        await response.json();
      setResultado(data);
    }
    catch(error){
      console.error(error);
      alert(
        error.message
      );
    }
    finally{
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="
        text-2xl 
        font-bold 
        text-slate-800
        ">
          Carga de Reporte Diario
        </h1>
        <p className="
        text-sm 
        text-slate-500
        ">
          Importación del reporte de eficiencia de lecturas
        </p>
      </div>

      {/* CARD UPLOAD */}
      <div className="
      bg-white
      border
      rounded-2xl
      shadow-sm
      p-6
      ">
        <div className="
        flex
        items-center
        gap-3
        mb-5
        ">
          <FileSpreadsheet
            className="text-[#006cb7]"
          />
          <h2 className="
          font-bold
          ">
            Importar Excel
          </h2>
        </div>

        {/* FECHA */}
        <label className="
        text-sm
        text-slate-600
        ">
          Fecha del reporte
        </label>

        <input
          type="date"
          className="
          border
          rounded-xl
          p-2
          w-full
          mt-2
          mb-5
          "
          value={fechaReporte}
          onChange={
            e=>setFechaReporte(
              e.target.value
            )
          }
        />
        {/* ARCHIVO */}

        <label
          className="
          flex
          items-center
          gap-3
          bg-[#006cb7]
          text-white
          px-4
          py-3
          rounded-xl
          cursor-pointer
          w-fit
          "
        >
          <UploadCloud size={18}/>
          Seleccionar Excel
          <input
            type="file"
            accept="
            .xlsx,.xls
            "
            hidden
            onChange={
              e=>
              setArchivo(
                e.target.files[0]
              )
            }
          />
        </label>

        {
          archivo &&

          <div className="
          mt-4
          bg-slate-50
          border
          rounded-xl
          p-3
          text-sm
          ">
             {archivo.name}
          </div>
        }

        <button
          onClick={importarExcel}
          disabled={loading}
          className="
          mt-6
          bg-[#006cb7]
          text-white
          px-5
          py-2
          rounded-xl
          disabled:opacity-50
          "
        >
          {
            loading
            ?
            "Procesando..."
            :
            "Procesar reporte"
          }
        </button>
      </div>

      {/* RESULTADO */}
      {
        resultado &&

        <div className="
        bg-white
        border
        rounded-2xl
        shadow-sm
        p-6
        ">
          <div className="
          flex
          items-center
          gap-3
          mb-4
          ">
            <CheckCircle
              className="text-green-600"
            />
            <h2 className="
            font-bold
            ">
              Resultado de carga
            </h2>
          </div>

          <div className="
          grid
          grid-cols-3
          gap-4
          ">
            <div className="
            bg-slate-50
            p-4
            rounded-xl
            ">
              <p className="text-sm">
                Registros insertados
              </p>

              <b className="text-xl">
                {
                  resultado.registros_insertados
                }
              </b>
            </div>

            <div className="
            bg-slate-50
            p-4
            rounded-xl
            ">
              <p className="text-sm">
                Trabajadores procesados
              </p>
              <b className="text-xl">
                {
                  resultado.trabajadores_procesados
                }
              </b>
            </div>

            <div className="
            bg-slate-50
            p-4
            rounded-xl
            ">

              <p className="text-sm">
                Evaluaciones generadas
              </p>

              <b className="text-xl">
                {
                  resultado.evaluaciones_generadas
                }
              </b>
            </div>
          </div>
        </div>
      }

    </div>

  );

}