import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Outlet } from '@/types';
import L from 'leaflet';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MARKER_ICON = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapProps {
  outlets: Outlet[];
}

export default function Map({ outlets }: MapProps) {
  return (
    <MapContainer
      center={[3.1390, 101.6869]}
      zoom={11}
      style={{ height: '600px', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {outlets.map((outlet) => 
        outlet.lat && outlet.lng ? (
          <Marker
            key={outlet.address}
            position={[outlet.lat, outlet.lng]}
            icon={MARKER_ICON}
          >
            <Popup>
              <div className="text-sm">
                <h3 className="font-bold">{outlet.name}</h3>
                <p>{outlet.address}</p>
                <p className="my-1">{outlet.operating_hours}</p>
                <a
                  href={outlet.waze_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#006B10] hover:underline"
                >
                  Open in Waze
                </a>
              </div>
            </Popup>
          </Marker>
        ) : null
      )}
      {outlets.map((outlet) => 
        outlet.lat && outlet.lng ? (
          <Circle
            key={`circle-${outlet.address}`}
            center={[outlet.lat, outlet.lng]}
            radius={5000}
            pathOptions={{
              color: '#006B10',
              fillColor: '#006B10',
              fillOpacity: 0.1,
            }}
          />
        ) : null
      )}
    </MapContainer>
  );
} 