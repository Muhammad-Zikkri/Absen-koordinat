'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + Next.js
const getIcon = () => {
  if (typeof window === 'undefined') return null;
  return L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
};

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface MapProps {
  userLocation: { lat: number; lng: number } | null;
  officeLocation: { lat: number; lng: number };
  radius: number;
}

export default function MapComponent({ userLocation, officeLocation, radius }: MapProps) {
  const center: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : [officeLocation.lat, officeLocation.lng];
  const icon = getIcon();

  return (
    <MapContainer center={center} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <ChangeView center={center} />
      
      <Circle 
        center={[officeLocation.lat, officeLocation.lng]} 
        radius={radius} 
        pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.2 }} 
      />
      
      <Marker position={[officeLocation.lat, officeLocation.lng]} icon={icon as L.Icon} />

      {userLocation && icon && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={icon as L.Icon} />
      )}
    </MapContainer>
  );
}
