import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPinOff, Navigation, Fuel, Clock, Route } from 'lucide-react';

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const TrackingMap = ({
  order,
  aiPrediction,
  station,
  destination,
  courier,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const boundsRef = useRef(null);

  // Resolução segura de coordenadas de origem (Posto)
  const stationData = station || order?.posto;
  const stationLat =
    stationData?.latitude !== undefined && stationData?.latitude !== null
      ? Number(stationData.latitude)
      : null;
  const stationLng =
    stationData?.longitude !== undefined && stationData?.longitude !== null
      ? Number(stationData.longitude)
      : null;

  // Resolução segura de coordenadas de destino
  const destLat =
    destination?.latitude !== undefined && destination?.latitude !== null
      ? Number(destination.latitude)
      : order?.destino_latitude !== undefined && order?.destino_latitude !== null
      ? Number(order.destino_latitude)
      : null;
  const destLng =
    destination?.longitude !== undefined && destination?.longitude !== null
      ? Number(destination.longitude)
      : order?.destino_longitude !== undefined && order?.destino_longitude !== null
      ? Number(order.destino_longitude)
      : null;

  const hasValidCoords =
    stationLat !== null &&
    stationLng !== null &&
    destLat !== null &&
    destLng !== null &&
    !isNaN(stationLat) &&
    !isNaN(stationLng) &&
    !isNaN(destLat) &&
    !isNaN(destLng) &&
    stationLat !== 0 &&
    destLat !== 0;

  // Extração e normalização da rota (GeoJSON lon,lat -> Leaflet lat,lon)
  let routeCoords = [];
  if (
    aiPrediction?.rota_geometria?.coordinates &&
    Array.isArray(aiPrediction.rota_geometria.coordinates) &&
    aiPrediction.rota_geometria.coordinates.length > 0
  ) {
    routeCoords = aiPrediction.rota_geometria.coordinates.map(([lon, lat]) => [
      Number(lat),
      Number(lon),
    ]);
  } else if (hasValidCoords) {
    routeCoords = [
      [stationLat, stationLng],
      [destLat, destLng],
    ];
  }

  const isFallbackRoute =
    aiPrediction?.fonte_roteamento === 'HAVERSINE_FALLBACK' || routeCoords.length <= 2;

  const courierLat = courier?.latitude ?? order?.entregador?.latitude;
  const courierLng = courier?.longitude ?? order?.entregador?.longitude;
  const routePointsCount = routeCoords.length;

  // Inicialização e sincronização do mapa Leaflet
  useEffect(() => {
    if (!hasValidCoords || !mapContainerRef.current) return;

    // Destruição defensiva de instância prévia para evitar "Map container is already initialized"
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    });
    mapInstanceRef.current = map;

    // Camada de tiles OpenStreetMap com atribuição correta
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // 1. Marcador do Posto de Origem (Índigo)
    const stationIcon = L.divIcon({
      className: 'station-div-icon',
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white shadow-lg border-2 border-white transform hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="22" x2="15" y2="22"/>
            <line x1="4" y1="9" x2="14" y2="9"/>
            <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/>
            <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });

    const stationName = escapeHtml(
      stationData?.nome_fantasia || stationData?.razao_social || 'Posto Credenciado de Origem'
    );
    L.marker([stationLat, stationLng], { icon: stationIcon })
      .bindPopup(`<strong>${stationName}</strong><br/><span style="font-size:12px;color:#4b5563;">Origem do carregamento de combustível</span>`)
      .addTo(map);

    // 2. Marcador do Destino (Verde Esmeralda)
    const destIcon = L.divIcon({
      className: 'dest-div-icon',
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white shadow-lg border-2 border-white transform hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });

    const destAddress = escapeHtml(order?.endereco_entrega || 'Ponto de Abastecimento');
    L.marker([destLat, destLng], { icon: destIcon })
      .bindPopup(`<strong>Destino da Carga</strong><br/><span style="font-size:12px;color:#4b5563;">${destAddress}</span>`)
      .addTo(map);

    // 3. Marcador do Entregador (Azul com pulso animado quando em transporte)
    if (order?.status === 'EM_TRANSPORTE') {
      const courierData = courier || order?.entregador;
      let courierPos = null;

      if (
        courierData?.latitude !== undefined &&
        courierData?.latitude !== null &&
        courierData?.longitude !== undefined &&
        courierData?.longitude !== null
      ) {
        courierPos = [Number(courierData.latitude), Number(courierData.longitude)];
      } else if (routeCoords.length > 2) {
        // Posição intermediária ao longo do traçado geométrico real
        const midIdx = Math.floor(routeCoords.length / 2);
        courierPos = routeCoords[midIdx];
      } else {
        courierPos = [(stationLat + destLat) / 2, (stationLng + destLng) / 2];
      }

      const courierIcon = L.divIcon({
        className: 'courier-div-icon',
        html: `
          <div class="relative flex items-center justify-center w-9 h-9">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white shadow-lg border-2 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                <path d="M15 18H9"/>
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
                <circle cx="17" cy="18" r="2"/>
                <circle cx="7" cy="18" r="2"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      });

      const courierLabel = escapeHtml(courierData?.nome || 'Entregador Operacional');
      L.marker(courierPos, { icon: courierIcon })
        .bindPopup(`<strong>${courierLabel}</strong><br/><span style="font-size:12px;color:#2563eb;font-weight:600;">Em deslocamento em rota</span>`)
        .addTo(map);
    }

    // 4. Polylines da Rota
    if (routeCoords.length >= 2) {
      if (isFallbackRoute) {
        L.polyline(routeCoords, {
          color: '#2563eb',
          weight: 4,
          dashArray: '6, 6',
          opacity: 0.85,
        }).addTo(map);
      } else {
        // Contorno branco para alto contraste e visibilidade sobre as ruas do OpenStreetMap
        L.polyline(routeCoords, {
          color: '#ffffff',
          weight: 7,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        L.polyline(routeCoords, {
          color: '#2563eb',
          weight: 4,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
      }

      // Enquadramento automático com margem de segurança
      const bounds = L.latLngBounds(routeCoords);
      boundsRef.current = bounds;
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [
    hasValidCoords,
    stationLat,
    stationLng,
    destLat,
    destLng,
    courierLat,
    courierLng,
    routePointsCount,
    isFallbackRoute,
    order?.status,
  ]);

  const handleRecenter = () => {
    if (mapInstanceRef.current && boundsRef.current) {
      mapInstanceRef.current.fitBounds(boundsRef.current, {
        padding: [40, 40],
        maxZoom: 16,
      });
    }
  };

  // Fallback gracioso quando não houver coordenadas válidas
  if (!hasValidCoords) {
    return (
      <div
        className="p-8 bg-gray-50 border border-gray-200 rounded-lg text-center flex flex-col items-center justify-center space-y-2 min-h-[220px]"
        role="region"
        aria-label="Mapa de rastreamento de entrega"
      >
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-1">
          <MapPinOff className="w-6 h-6" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-bold text-gray-800">
          Mapa de rastreamento temporariamente indisponível
        </h3>
        <p className="text-xs text-gray-500 max-w-sm">
          Não foi possível georreferenciar o posto de origem ou o local de entrega deste pedido. O ciclo operacional segue sendo atualizado normalmente.
        </p>
      </div>
    );
  }

  // Métricas para a barra de status de rota
  const distanciaKm =
    aiPrediction?.distancia_km !== undefined && aiPrediction?.distancia_km !== null
      ? Number(aiPrediction.distancia_km).toFixed(1)
      : order?.distancia_km !== undefined
      ? Number(order.distancia_km).toFixed(1)
      : null;

  const tempoTransitoMin =
    aiPrediction?.fatores_tempo?.transito_minutos ??
    aiPrediction?.tempo_viagem ??
    (aiPrediction?.total_minutos !== undefined ? aiPrediction.total_minutos : null);

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm space-y-0"
      role="region"
      aria-label="Mapa de rastreamento da rota"
    >
      {/* Barra de Status da Rota */}
      <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {distanciaKm && (
            <div className="flex items-center gap-1.5 text-gray-700 font-medium">
              <Route className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
              <span>
                Distância: <strong className="font-bold text-gray-900">{distanciaKm} km</strong>
              </span>
            </div>
          )}

          {tempoTransitoMin !== null && (
            <div className="flex items-center gap-1.5 text-gray-700 font-medium">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden="true" />
              <span>
                Deslocamento: <strong className="font-bold text-gray-900">~{tempoTransitoMin} min</strong>
              </span>
            </div>
          )}

          <div>
            {isFallbackRoute ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                Projeção Direta
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                Rota Real OSRM
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleRecenter}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-100 hover:text-gray-900 shadow-xs transition-colors cursor-pointer"
          title="Recentralizar enquadramento do mapa"
          aria-label="Recentralizar mapa no trajeto"
        >
          <Navigation className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
          <span>Recentralizar</span>
        </button>
      </div>

      {/* Container Leaflet */}
      <div
        ref={mapContainerRef}
        className="w-full h-80 sm:h-96 relative z-0"
        aria-label="Mapa interativo do trajeto de abastecimento"
      />
    </div>
  );
};

export default TrackingMap;
