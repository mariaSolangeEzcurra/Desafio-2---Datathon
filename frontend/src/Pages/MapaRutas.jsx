import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 🟢 Íconos con URLs absolutas para evitar problemas de assets en Leaflet
const iconoAzulHecho = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconoRojoImpedimento = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconoAmarilloFalta = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const COLORES_OPERARIOS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#db2777', '#059669', '#0284c7'];

export default function MapaRutas({ procesoActivo, mapaProcesos }) {
  const [actividadesBD, setActividadesBD] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const consumirBackend = async () => {
      setLoading(true);
      try {
        const respuesta = await fetch("http://localhost:8000/api/actividades/");
        const data = await respuesta.json();
        setActividadesBD(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error conectando el mapa con la base de datos:", error);
      } finally {
        setLoading(false);
      }
    };

    consumirBackend();
  }, [procesoActivo]);

  const datosProcesadosGps = useMemo(() => {
    if (actividadesBD.length === 0) {
      return { marcadores: [], rutasPorOperario: {}, metricas: { realizados: 0, faltan: 0, impedimentos: 0 } };
    }

    const tipoBuscado = (mapaProcesos && mapaProcesos[procesoActivo]) || procesoActivo || "Lectura Comercial";
    const tipoBuscadoLimpio = tipoBuscado.trim().toLowerCase();
    const procesoCortoLimpio = procesoActivo.trim().toLowerCase();

    const actividadesConGps = [];
    let realizados = 0;
    let faltan = 0;
    let impedimentos = 0;

    actividadesBD.forEach((act) => {
      if (!act) return;

      const tipoAct = (act.tipo_actividad || "").trim().toLowerCase();
      const coincideProceso = tipoAct.includes(tipoBuscadoLimpio) || tipoAct.includes(procesoCortoLimpio);
      if (!coincideProceso) return;

      let latRaw = act.cGPSLat;
      let lngRaw = act.cGPSLon;

      if (latRaw === null || lngRaw === null || latRaw === undefined || lngRaw === undefined) return;

      let latParsed = parseFloat(latRaw);
      let lngParsed = parseFloat(lngRaw);

      // Conversor adaptivo para georreferenciación entera masiva
      if (Math.abs(latParsed) > 180) {
        const strLat = String(latRaw);
        latParsed = parseFloat((strLat.startsWith('-') ? '-' : '') + strLat.replace('-', '').substring(0, 2) + '.' + strLat.replace('-', '').substring(2));
      }
      if (Math.abs(lngParsed) > 180) {
        const strLng = String(lngRaw);
        lngParsed = parseFloat((strLng.startsWith('-') ? '-' : '') + strLng.replace('-', '').substring(0, 2) + '.' + strLng.replace('-', '').substring(2));
      }

      if (!isNaN(latParsed) && !isNaN(lngParsed) && latParsed !== 0 && lngParsed !== 0) {
        actividadesConGps.push({
          ...act,
          _latEstandar: latParsed,
          _lngEstandar: lngParsed
        });
      }
    });

    const marcadores = actividadesConGps.map((act) => {
      const resLimpio = (act.resultado || "").trim().toLowerCase();
      const estLimpio = (act.estado || "").trim().toLowerCase();

      // Clasificación de Estados del Trabajo en Campo
      let tipoMarcador = "realizado"; // Por defecto: azul (OK)

      if (
        resLimpio.includes("impedimento") || 
        resLimpio.includes("anomalia") || 
        resLimpio.includes("fuera de radio") || 
        estLimpio.includes("impedida") || 
        estLimpio.includes("inconcluso")
      ) {
        tipoMarcador = "impedimento"; // Rojo
        impedimentos++;
      } else if (
        estLimpio.includes("pendiente") || 
        estLimpio.includes("falta") || 
        resLimpio === "" || 
        resLimpio.includes("no realizado")
      ) {
        tipoMarcador = "falta"; // Amarillo
        faltan++;
      } else {
        realizados++;
      }

      return {
        id: act.actividad_id || Math.random(),
        posicion: [act._latEstandar, act._lngEstandar],
        suministro: act.cCodCnx || "N/A",
        operario: act.cNomPrs || `Trabajador #${act.cCodPrs || "S/A"}`,
        codigo: act.cCodPrs || "S/A",
        grupoFacturacion: act.cGrupoFact || act.grupo_facturacion || "No Asig.",
        rutaAsignada: act.cRuta || act.ruta || "S/R",
        hora: act.hora_inicio || act.fecha_registro || "S/H",
        estado: act.estado || "Pendiente",
        resultado: act.resultado || "Ninguno",
        tipoMarcador
      };
    });

    // Dibujar trazo de ruta histórica (Tracks de ruta se basan sólo en los ya realizados o impedidos)
    const rutasPorOperario = {};
    const actividadesOrdenadasTiempo = [...actividadesConGps]
      .filter(a => {
        const est = (a.estado || "").trim().toLowerCase();
        return !est.includes("pendiente") && !est.includes("falta");
      })
      .sort((a, b) => new Date(a.hora_inicio || 0) - new Date(b.hora_inicio || 0));

    actividadesOrdenadasTiempo.forEach((act) => {
      const idOperario = String(act.cCodPrs || "NoAsignado").trim();
      if (!rutasPorOperario[idOperario]) {
        rutasPorOperario[idOperario] = [];
      }
      rutasPorOperario[idOperario].push([act._latEstandar, act._lngEstandar]);
    });

    return { marcadores, rutasPorOperario, metricas: { realizados, faltan, impedimentos } };
  }, [actividadesBD, procesoActivo, mapaProcesos]);

  const centroMapa = datosProcesadosGps.marcadores.length > 0 
    ? datosProcesadosGps.marcadores[0].posicion 
    : [-16.409047, -71.537451];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-6">
      {/* Encabezado e Indicadores Globales */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">
            MONITOR DE RUTAS, FACTURACIÓN Y PERSONAL GIS
          </span>
          <h3 className="text-base font-bold text-slate-800 mt-1">Supervisión General del Proceso en Campo</h3>
          <p className="text-xs text-slate-400">
            Filtro activo: <span className="font-semibold text-slate-600">{procesoActivo}</span>
          </p>
        </div>
        
        {/* Leyenda Dinámica de Avance del Personal */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100 w-full lg:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span> 
            <span>Realizados ({datosProcesadosGps.metricas.realizados})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span> 
            <span>Faltan / Pendientes ({datosProcesadosGps.metricas.faltan})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> 
            <span>Con Impedimento ({datosProcesadosGps.metricas.impedimentos})</span>
          </div>
          <div className="flex items-center gap-1.5 border-l pl-3 border-slate-200">
            <span className="w-4 h-0.5 bg-indigo-500 inline-block rounded"></span> Lineas de Ruta
          </div>
        </div>
      </div>

      {/* Contenedor del Mapa */}
      <div className="h-[520px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-10">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50/50 text-slate-400 p-4 text-center">
            <p className="text-xs font-medium text-slate-600 animate-pulse">Consultando estado de rutas y grupos de facturación...</p>
          </div>
        ) : datosProcesadosGps.marcadores.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50/50 text-slate-400 p-4 text-center">
            <span className="text-xl mb-1">🗺️</span>
            <p className="text-xs font-medium text-slate-600">No hay datos cartográficos disponibles en "{procesoActivo}".</p>
          </div>
        ) : (
          <MapContainer center={centroMapa} zoom={14} className="w-full h-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Renderizar Trazado de Rutas por cada Trabajador */}
            {Object.keys(datosProcesadosGps.rutasPorOperario).map((operarioKey, idx) => {
              const coordenadasRuta = datosProcesadosGps.rutasPorOperario[operarioKey];
              if (coordenadasRuta.length < 2) return null;

              return (
                <Polyline
                  key={operarioKey}
                  positions={coordenadasRuta}
                  pathOptions={{
                    color: COLORES_OPERARIOS[idx % COLORES_OPERARIOS.length],
                    weight: 3.5,
                    opacity: 0.75,
                    lineJoin: 'round'
                  }}
                />
              );
            })}

            {/* Suministros Georreferenciados (Pines de Trabajo) */}
            {datosProcesadosGps.marcadores.map((marker) => {
              // Asignación dinámica del ícono según el estado procesado
              let iconoElegido = iconoAzulHecho;
              if (marker.tipoMarcador === 'impedimento') iconoElegido = iconoRojoImpedimento;
              if (marker.tipoMarcador === 'falta') iconoElegido = iconoAmarilloFalta;

              return (
                <Marker 
                  key={marker.id} 
                  position={marker.posicion}
                  icon={iconoElegido}
                >
                  <Popup>
                    <div className="font-sans text-xs text-slate-800 p-1 space-y-2 min-w-[210px]">
                      <div className="border-b border-slate-100 pb-1 flex justify-between items-center">
                        <span className="font-bold text-slate-900 text-[13px]">
                          Suministro: {marker.suministro}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1 rounded">
                          {marker.hora.includes('T') ? marker.hora.split('T')[1]?.substring(0, 5) : marker.hora}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-slate-600">
                        <p>
                          <span className="text-slate-400 font-medium">Trabajador:</span> <br />
                          <strong className="text-slate-700">{marker.operario}</strong> 
                          <span className="text-[10px] text-slate-400 font-mono ml-1">({marker.codigo})</span>
                        </p>
                        <p>
                          <span className="text-slate-400 font-medium">Grupo Facturación:</span>{' '}
                          <span className="font-semibold text-slate-700">{marker.grupoFacturacion}</span>
                        </p>
                        <p>
                          <span className="text-slate-400 font-medium">Ruta Asignada:</span>{' '}
                          <span className="font-semibold text-slate-700">{marker.rutaAsignada}</span>
                        </p>
                      </div>

                      <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Estado:</span>
                          <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${
                            marker.tipoMarcador === 'realizado' ? 'bg-green-50 text-green-700' :
                            marker.tipoMarcador === 'impedimento' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                          }`}>
                            {marker.estado}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Resultado / Observación:</span>
                          <span className="font-medium text-slate-700 truncate max-w-[110px]" title={marker.resultado}>
                            {marker.resultado}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>
    </div>
  );
}