"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';


const iconDefault = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});


const iconCritical = L.icon({
  ...iconDefault.options,
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
});

interface Report {
  id: string;
  status: string;
  severity: string;
  latitude: number;
  longitude: number;
  reportCount: number;
  createdAt: string;
}

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (map && map.flyTo) {
      try {
        map.flyTo(center, zoom, { animate: true, duration: 1.5 });
      } catch (error) {
        console.warn("Leaflet map fast-refresh artifact ignored.");
      }
    }
  }, [center, zoom, map]);
  return null;
}

export default function Map({ reports, className = "h-[500px] rounded-3xl", userLocation }: { reports: Report[], className?: string, userLocation?: {lat: number, lng: number} }) {

  const defaultCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng]
    : reports.length > 0 
      ? [reports[0].latitude, reports[0].longitude] 
      : [20.5937, 78.9629];

  const zoomLevel = userLocation ? 16 : (reports.length > 0 ? 14 : 5);

  return (
    <div className={`w-full overflow-hidden shadow-inner border border-gray-200/60 z-0 ${className}`}>
      <MapContainer 
        center={defaultCenter} 
        zoom={zoomLevel} 
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <MapUpdater center={defaultCenter} zoom={zoomLevel} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        
        {reports.map((report) => (
          <Marker 
            key={report.id} 
            position={[report.latitude, report.longitude]}
            icon={report.severity === 'CRITICAL' || report.severity === 'HIGH' ? iconCritical : iconDefault}
          >
            <Popup className="rounded-xl">
              <div className="p-1">
                <div className="font-bold text-gray-900 text-sm mb-1">
                  {report.severity} Pothole
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  Status: <span className="font-semibold text-blue-600">{report.status}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Reported {report.reportCount} time(s)
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
