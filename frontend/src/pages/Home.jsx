import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import MapComponent from '../components/MapComponent';
import RecommendationCard from '../components/RecommendationCard';
import { recommendationService } from '../services/api';

const Home = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecommendations();
  }, [date]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await recommendationService.getDailyRecommendations(date);
      setRecommendations(response.data.recommendations);
      if (response.data.recommendations.length > 0) {
        setSelectedRecommendation(response.data.recommendations[0]);
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      setError('Failed to load recommendations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleRecommendationSelect = (recommendation) => {
    setSelectedRecommendation(recommendation);
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Header */}
      <Header date={date} />

      {/* Main Content */}
      <main className="container-lg py-4 flex-grow-1">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError(null)}
              aria-label="Close"
            ></button>
          </div>
        )}

        {loading ? (
          // Loading State
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted">Analyzing locations and calculating recommendations...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Map Section */}
            <div className="row mb-4">
              <div className="col-lg-8">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">
                    <h5 className="card-title mb-3">📍 Location Map</h5>
                    <MapComponent
                      onLocationSelect={handleLocationSelect}
                      selectedLocationId={selectedLocation?.id}
                    />
                  </div>
                </div>
              </div>

              {/* Selected Location Info */}
              <div className="col-lg-4">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title mb-3">📌 Location Details</h5>

                    {selectedLocation ? (
                      <>
                        <h6 className="fw-bold mb-2">{selectedLocation.name}</h6>

                        <div className="mb-3">
                          <small className="text-muted d-block">
                            <strong>Zone:</strong> {selectedLocation.zone}
                          </small>
                          <small className="text-muted d-block">
                            <strong>Type:</strong> {selectedLocation.type.replace(/_/g, ' ')}
                          </small>
                          <small className="text-muted d-block">
                            <strong>Capacity:</strong> {selectedLocation.capacity.replace(/_/g, ' ')}
                          </small>
                          <small className="text-muted d-block">
                            <strong>Parking Spots:</strong> {selectedLocation.parkingSpots}
                          </small>
                          <small className="text-muted d-block">
                            <strong>Base Score:</strong> {selectedLocation.baseScore}
                          </small>
                        </div>

                        <p className="small text-muted flex-grow-1 mb-0">
                          {selectedLocation.description}
                        </p>
                      </>
                    ) : (
                      <div className="text-center text-muted flex-grow-1 d-flex align-items-center justify-content-center">
                        <div>
                          <p className="mb-0">Click on a location marker on the map</p>
                          <small>to view detailed information</small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations Section */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="card-title mb-1">⭐ Top Recommendations</h5>
                    <small className="text-muted">
                      Based on foot traffic, events, weather, and competition analysis
                    </small>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={loadRecommendations}
                  >
                    🔄 Refresh
                  </button>
                </div>

                {recommendations.length > 0 ? (
                  <div className="row g-3">
                    {recommendations.map((rec, idx) => (
                      <div key={rec.locationId} className="col-md-6 col-lg-4">
                        <RecommendationCard
                          recommendation={rec}
                          rank={idx + 1}
                          onSelect={handleRecommendationSelect}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="alert alert-info mb-0">
                    No recommendations available for this date.
                  </div>
                )}
              </div>
            </div>

            {/* Selected Recommendation Details */}
            {selectedRecommendation && (
              <div className="card shadow-sm border-0 bg-light-blue mb-4">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    💡 Why {selectedRecommendation.locationName}?
                  </h5>

                  <div className="row mb-3">
                    <div className="col-md-3">
                      <div className="text-center p-3 bg-white rounded">
                        <small className="text-muted d-block mb-2">Overall Score</small>
                        <h4 className="text-primary mb-0">{selectedRecommendation.score}</h4>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center p-3 bg-white rounded">
                        <small className="text-muted d-block mb-2">Est. Revenue</small>
                        <h4 className="text-success mb-0">€{selectedRecommendation.estimatedRevenue}</h4>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center p-3 bg-white rounded">
                        <small className="text-muted d-block mb-2">Foot Traffic</small>
                        <h4 className="text-warning mb-0">{selectedRecommendation.footTraffic}</h4>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center p-3 bg-white rounded">
                        <small className="text-muted d-block mb-2">Risk Level</small>
                        <h4 className={`mb-0 text-${
                          selectedRecommendation.riskLevel === 'low' ? 'success' :
                          selectedRecommendation.riskLevel === 'medium' ? 'warning' :
                          'danger'
                        }`}>
                          {selectedRecommendation.riskLevel.charAt(0).toUpperCase() +
                            selectedRecommendation.riskLevel.slice(1)}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-2">Key Factors:</h6>
                      <ul className="list-unstyled">
                        {selectedRecommendation.reasons.map((reason, idx) => (
                          <li key={idx} className="mb-1">
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-2">Competition Analysis:</h6>
                      {selectedRecommendation.competitionCount > 0 ? (
                        <p className="text-muted small">
                          <strong>{selectedRecommendation.competitionCount}</strong> competitor(s) at this location.
                          This may impact revenue, but high foot traffic compensates.
                        </p>
                      ) : (
                        <p className="text-success small">
                          ✓ <strong>No direct competition</strong> - Great opportunity!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-dark text-light py-3 mt-4">
        <div className="container-lg text-center">
          <small className="text-muted">
            TruckSpot © 2026 | Intelligent Location Recommendations for Food Trucks
          </small>
        </div>
      </footer>
    </div>
  );
};

export default Home;
