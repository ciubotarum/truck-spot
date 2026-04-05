import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
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

const TOP_TIER_COUNT = 2;
const MID_TIER_COUNT = 2;

const MapComponent = ({ recommendations = [], onLocationSelect, onOpenDetails, selectedLocationId }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const iconCacheRef = useRef(new Map());

  const recommendationRankById = useMemo(() => {
    const map = new Map();
    (recommendations || []).forEach((rec, idx) => {
      const id = rec?.location?.id;
      if (id) map.set(id, idx);
    });
    return map;
  }, [recommendations]);

  const getTierForLocation = (locationId) => {
    const rank = recommendationRankById.get(locationId);
    if (rank === undefined) return 'default';
    if (rank < TOP_TIER_COUNT) return 'top';
    if (rank < TOP_TIER_COUNT + MID_TIER_COUNT) return 'mid';
    return 'low';
  };

  const getMarkerIcon = (tier, isSelected) => {
    const cacheKey = `${tier}-${isSelected ? 'selected' : 'normal'}`;
    const cached = iconCacheRef.current.get(cacheKey);
    if (cached) return cached;

    const tierClass =
      tier === 'top'
        ? 'ts-marker--top'
        : tier === 'mid'
          ? 'ts-marker--mid'
          : tier === 'low'
            ? 'ts-marker--low'
            : 'ts-marker--default';

    const icon = L.divIcon({
      className: 'leaflet-div-icon ts-marker-icon',
      html: `<div class="ts-marker ${tierClass} ${isSelected ? 'ts-marker--selected' : ''}" aria-label="Location marker"></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -12]
    });

    iconCacheRef.current.set(cacheKey, icon);
    return icon;
  };

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
            icon={getMarkerIcon(getTierForLocation(location.id), selectedLocationId === location.id)}
            eventHandlers={{
              click: () => onLocationSelect(location)
            }}
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
                  onClick={() => {
                    onLocationSelect(location);
                    onOpenDetails?.(location);
                  }}
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
