import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import { locationService } from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

const MapComponent = ({ onLocationSelect, selectedLocationId }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await locationService.getAllLocations();
      setLocations(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load locations:', err);
      setError('Failed to load locations. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '500px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading map...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
        <button className="btn btn-sm btn-outline-danger ms-2" onClick={loadLocations}>
          Retry
        </button>
      </div>
    );
  }

  if (locations.length === 0) {
    return <div className="alert alert-info">No locations available</div>;
  }

  // Center map on average of all locations
  const center = [
    locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length,
    locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length
  ];

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '500px', width: '100%', borderRadius: '0.375rem' }}
      className="border"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Render all locations */}
      {locations.map(location => (
        <React.Fragment key={location.id}>
          <Marker
            position={[location.lat, location.lng]}
            eventHandlers={{
              click: () => onLocationSelect(location)
            }}
            className={selectedLocationId === location.id ? 'selected-marker' : ''}
          >
            <Popup>
              <div>
                <h6 className="mb-2 fw-bold">{location.name}</h6>
                <small className="text-muted d-block">
                  <strong>Zone:</strong> {location.zone}
                </small>
                <small className="text-muted d-block">
                  <strong>Capacity:</strong> {location.capacity}
                </small>
                <small className="text-muted d-block">
                  <strong>Parking:</strong> {location.parkingSpots} spots
                </small>
                <button
                  className="btn btn-sm btn-primary mt-2 w-100"
                  onClick={() => onLocationSelect(location)}
                >
                  Select
                </button>
              </div>
            </Popup>
          </Marker>

          {/* Circle to show area coverage */}
          <Circle
            center={[location.lat, location.lng]}
            radius={300}
            pathOptions={{
              fillColor: location.capacity === 'very_high' ? '#198754' : '#0d6efd',
              fillOpacity: 0.1,
              weight: 1,
              opacity: 0.5,
              color: location.capacity === 'very_high' ? '#198754' : '#0d6efd'
            }}
          />
        </React.Fragment>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
