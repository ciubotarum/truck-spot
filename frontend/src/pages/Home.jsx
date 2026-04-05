import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import MapComponent from '../components/MapComponent';
import RecommendationCard from '../components/RecommendationCard';
import { agentService, parkingService, authService, setAuthToken } from '../services/api';

const Home = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [parkingLoading, setParkingLoading] = useState(false);
  const [parkingError, setParkingError] = useState(null);
  const [parkingAvailability, setParkingAvailability] = useState(null);
  const [selectedSpotNumber, setSelectedSpotNumber] = useState('');

  const [authUser, setAuthUser] = useState(null);
  const [authProfile, setAuthProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    truckName: '',
    cuisine: '',
    description: '',
    phone: ''
  });

  const [guestUserId] = useState(() => {
    try {
      const existing = window.localStorage.getItem('truckspot_user_id');
      if (existing) return existing;
      const id = (window.crypto?.randomUUID ? window.crypto.randomUUID() : `user_${Math.random().toString(16).slice(2)}`);
      window.localStorage.setItem('truckspot_user_id', id);
      return id;
    } catch {
      return `user_${Math.random().toString(16).slice(2)}`;
    }
  });

  const effectiveUserId = authUser?.id || guestUserId;

  useEffect(() => {
    // Boot auth from localStorage token (if present)
    const token = window.localStorage.getItem('truckspot_auth_token');
    if (!token) return;

    setAuthToken(token);
    authService.me()
      .then((res) => {
        const data = res.data?.data;
        setAuthUser(data?.user || null);
        setAuthProfile(data?.profile || null);
      })
      .catch(() => {
        // Token invalid/expired
        window.localStorage.removeItem('truckspot_auth_token');
        setAuthToken(null);
        setAuthUser(null);
        setAuthProfile(null);
      });
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [date]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await agentService.getAIRecommendations(date);
      setRecommendations(response.data.recommendations);
      if (response.data.recommendations.length > 0) {
        setSelectedRecommendation(response.data.recommendations[0]);
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      setError('Failed to load AI recommendations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleOpenLocationDetails = (location) => {
    if (!location) return;

    setSelectedLocation(location);
    const matchingRecommendation = recommendations.find(r => r?.location?.id === location.id) || null;
    setSelectedRecommendation(matchingRecommendation);
    setIsDetailsOpen(true);
  };

  const handleRecommendationSelect = (recommendation) => {
    setSelectedRecommendation(recommendation);

    // Also sync the map + right-side Location Details panel.
    if (recommendation?.location) {
      setSelectedLocation(recommendation.location);
    }

    // Show a modal with full details.
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
  };

  const loadParkingAvailability = async (locationId) => {
    try {
      setParkingLoading(true);
      setParkingError(null);
      const res = await parkingService.getAvailability(date, locationId, effectiveUserId);
      const data = res.data?.data;
      setParkingAvailability(data || null);
      setSelectedSpotNumber('');
    } catch (e) {
      setParkingAvailability(null);
      setParkingError(e?.response?.data?.error || 'Failed to load parking availability');
    } finally {
      setParkingLoading(false);
    }
  };

  const reserveSelectedSpot = async (locationId) => {
    try {
      if (!selectedSpotNumber) return;
      setParkingLoading(true);
      setParkingError(null);
      const res = await parkingService.reserveSpot(date, locationId, effectiveUserId, Number(selectedSpotNumber));
      const data = res.data?.data?.availability;
      setParkingAvailability(data || null);
    } catch (e) {
      setParkingError(e?.response?.data?.error || 'Failed to reserve spot');
    } finally {
      setParkingLoading(false);
    }
  };

  const releaseMySpot = async (locationId) => {
    try {
      setParkingLoading(true);
      setParkingError(null);
      const res = await parkingService.releaseSpot(date, locationId, effectiveUserId);
      const data = res.data?.data?.availability;
      setParkingAvailability(data || null);
      setSelectedSpotNumber('');
    } catch (e) {
      setParkingError(e?.response?.data?.error || 'Failed to release spot');
    } finally {
      setParkingLoading(false);
    }
  };

  const openAuth = (mode = 'login') => {
    setAuthError(null);
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const closeAuth = () => {
    setIsAuthOpen(false);
    setAuthError(null);
    setAuthLoading(false);
  };

  const logout = () => {
    window.localStorage.removeItem('truckspot_auth_token');
    setAuthToken(null);
    setAuthUser(null);
    setAuthProfile(null);
  };

  const submitAuth = async (e) => {
    e.preventDefault();
    try {
      setAuthLoading(true);
      setAuthError(null);

      const res = authMode === 'register'
        ? await authService.register({
          email: authForm.email,
          password: authForm.password,
          truckName: authForm.truckName,
          cuisine: authForm.cuisine || null,
          description: authForm.description || null,
          phone: authForm.phone || null
        })
        : await authService.login({
          email: authForm.email,
          password: authForm.password
        });

      const token = res.data?.data?.token;
      const user = res.data?.data?.user || null;
      const profile = res.data?.data?.profile || null;

      if (!token) throw new Error('Missing token');

      window.localStorage.setItem('truckspot_auth_token', token);
      setAuthToken(token);
      setAuthUser(user);
      setAuthProfile(profile);
      closeAuth();
    } catch (err) {
      setAuthError(err?.response?.data?.error || err?.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    const anyModalOpen = isDetailsOpen || isAuthOpen;
    if (!anyModalOpen) return;

    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (isAuthOpen) return closeAuth();
      if (isDetailsOpen) return closeDetails();
    };

    document.body.classList.add('modal-open');
    window.addEventListener('keydown', onKeyDown);
    return () => {
      const stillOpen = isDetailsOpen || isAuthOpen;
      if (!stillOpen) document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isDetailsOpen, isAuthOpen]);

  useEffect(() => {
    if (!isDetailsOpen) return;
    const locationId = selectedLocation?.id || selectedRecommendation?.location?.id;
    if (!locationId) return;
    loadParkingAvailability(locationId);
  }, [isDetailsOpen, selectedRecommendation, selectedLocation, date]);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Header */}
      <Header
        date={date}
        authUser={authUser}
        authProfile={authProfile}
        onOpenAuth={openAuth}
        onLogout={logout}
      />

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
                      recommendations={recommendations}
                      onLocationSelect={handleLocationSelect}
                      onOpenDetails={handleOpenLocationDetails}
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
                    <h5 className="card-title mb-1">🤖 AI-Powered Recommendations</h5>
                    <small className="text-muted">
                      Agentic AI analyzes demand, context, and revenue for optimal results
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
                      <div key={rec.location?.id || idx} className="col-md-6 col-lg-4">
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
            {isDetailsOpen && (selectedLocation || selectedRecommendation) && (
              <>
                {(() => {
                  const detailsLocation = selectedLocation || selectedRecommendation?.location;
                  const hasRecommendation = !!selectedRecommendation;
                  return (
                <>
                <div
                  className="modal fade show"
                  role="dialog"
                  aria-modal="true"
                  style={{ display: 'block' }}
                  onMouseDown={(e) => {
                    // Click outside closes (backdrop behavior)
                    if (e.target === e.currentTarget) closeDetails();
                  }}
                >
                  <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                    <div className="modal-content">
                      <div className="modal-header">
                        <div>
                          <h5 className="modal-title mb-0">
                            {detailsLocation?.name || 'Location details'}
                          </h5>
                          <small className="text-muted">
                            {detailsLocation?.zone || 'Unknown zone'}
                          </small>
                        </div>
                        <button type="button" className="btn-close" aria-label="Close" onClick={closeDetails}></button>
                      </div>

                      <div className="modal-body">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="card border-0 bg-light">
                              <div className="card-body">
                                <h6 className="fw-bold mb-2">📌 Location</h6>
                                <div className="small text-muted">
                                  <div><strong>Type:</strong> {detailsLocation?.type?.replace(/_/g, ' ') || 'N/A'}</div>
                                  <div><strong>Capacity:</strong> {detailsLocation?.capacity?.replace(/_/g, ' ') || 'N/A'}</div>
                                  <div>
                                    <strong>Parking:</strong>{' '}
                                    {parkingAvailability
                                      ? `${parkingAvailability.available}/${parkingAvailability.total} available`
                                      : `${detailsLocation?.parkingSpots ?? 'N/A'} total`}
                                  </div>
                                </div>
                                {detailsLocation?.description && (
                                  <p className="small text-muted mb-0 mt-2">
                                    {detailsLocation.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="card border-0 bg-light">
                              <div className="card-body">
                                <h6 className="fw-bold mb-2">🤖 AI Summary</h6>
                                {hasRecommendation ? (
                                  <div className="row g-2">
                                    <div className="col-6">
                                      <div className="p-2 bg-white rounded text-center">
                                        <small className="text-muted d-block">Demand</small>
                                        <div className="fw-bold">
                                          {selectedRecommendation.agenticAnalysis?.decisions?.demand?.demandScore?.toFixed(2) || 'N/A'}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="col-6">
                                      <div className="p-2 bg-white rounded text-center">
                                        <small className="text-muted d-block">Context Adj.</small>
                                        <div className="fw-bold">
                                          {selectedRecommendation.agenticAnalysis?.decisions?.context?.contextAdjustment?.toFixed(2) || '1.00'}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="col-6">
                                      <div className="p-2 bg-white rounded text-center">
                                        <small className="text-muted d-block">Est. Revenue</small>
                                        <div className="fw-bold text-success">
                                          €{selectedRecommendation.agenticAnalysis?.decisions?.revenue?.projectedDailyRevenue || 0}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="col-6">
                                      <div className="p-2 bg-white rounded text-center">
                                        <small className="text-muted d-block">Risk</small>
                                        <div className="fw-bold">
                                          {selectedRecommendation.agenticAnalysis?.recommendation?.riskLevel || 'N/A'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="small text-muted">
                                    No AI recommendation details for this location.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="col-12">
                            <div className="card border-0">
                              <div className="card-body p-0">
                                <h6 className="fw-bold mb-2">🧠 AI Reasoning</h6>
                                {hasRecommendation ? (
                                  <div className="row g-3">
                                    <div className="col-md-6">
                                      <div className="p-3 bg-light rounded">
                                        <div className="small fw-bold mb-2">Demand</div>
                                        <div className="small text-muted">
                                          {selectedRecommendation.agenticAnalysis?.decisions?.demand?.analysis || 'No demand analysis available.'}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="col-md-6">
                                      <div className="p-3 bg-light rounded">
                                        <div className="small fw-bold mb-2">Context</div>
                                        <div className="small text-muted">
                                          {selectedRecommendation.agenticAnalysis?.decisions?.context?.analysis || 'No context analysis available.'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="small text-muted">
                                    Open the recommendation card for this location to see AI reasoning.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="col-12">
                            <div className="card border-0 bg-light">
                              <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <h6 className="fw-bold mb-0">🅿️ Reserve a Parking Spot</h6>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => loadParkingAvailability(detailsLocation?.id)}
                                    disabled={parkingLoading}
                                  >
                                    Refresh
                                  </button>
                                </div>

                                {parkingError && (
                                  <div className="alert alert-danger py-2 mb-2">
                                    {parkingError}
                                  </div>
                                )}

                                {parkingAvailability ? (
                                  <>
                                    <div className="small text-muted mb-2">
                                      Availability: <strong>{parkingAvailability.available}/{parkingAvailability.total}</strong>
                                      {parkingAvailability.mySpot ? (
                                        <> · Your spot: <strong>#{parkingAvailability.mySpot}</strong></>
                                      ) : null}
                                    </div>

                                    <div className="row g-2 align-items-end">
                                      <div className="col-md-6">
                                        <label className="form-label small text-muted mb-1">Select spot</label>
                                        <select
                                          className="form-select"
                                          value={selectedSpotNumber}
                                          onChange={(e) => setSelectedSpotNumber(e.target.value)}
                                          disabled={parkingLoading || !!parkingAvailability.mySpot}
                                        >
                                          <option value="">Choose an available spot…</option>
                                          {parkingAvailability.availableSpots.map((spot) => (
                                            <option key={spot} value={spot}>{`Spot #${spot}`}</option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="col-md-6 d-flex gap-2">
                                        <button
                                          type="button"
                                          className="btn btn-success flex-grow-1"
                                          onClick={() => reserveSelectedSpot(detailsLocation?.id)}
                                          disabled={parkingLoading || !selectedSpotNumber || !!parkingAvailability.mySpot}
                                        >
                                          Reserve
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-outline-danger"
                                          onClick={() => releaseMySpot(detailsLocation?.id)}
                                          disabled={parkingLoading || !parkingAvailability.mySpot}
                                        >
                                          Release
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="small text-muted">
                                    {parkingLoading ? 'Loading parking availability…' : 'No parking data available.'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="modal-footer">
                        <button type="button" className="btn btn-outline-secondary" onClick={closeDetails}>
                          Close
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            // Keep behavior minimal: close and keep selection synced.
                            closeDetails();
                          }}
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-backdrop fade show" onClick={closeDetails}></div>
                </>
                  );
                })()}
              </>
            )}

            {/* Owner Auth Modal */}
            {isAuthOpen && (
              <>
                <div
                  className="modal fade show"
                  role="dialog"
                  aria-modal="true"
                  style={{ display: 'block' }}
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) closeAuth();
                  }}
                >
                  <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                      <div className="modal-header">
                        <div>
                          <h5 className="modal-title mb-0">Food Truck Owner</h5>
                          <small className="text-muted">Login or create an owner account</small>
                        </div>
                        <button type="button" className="btn-close" aria-label="Close" onClick={closeAuth}></button>
                      </div>

                      <div className="modal-body">
                        {authMode === 'login' ? (
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <small className="text-muted">
                              If you don’t have an account, click <strong>Register</strong>.
                            </small>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => {
                                setAuthMode('register');
                                setAuthError(null);
                              }}
                              disabled={authLoading}
                            >
                              Register
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <small className="text-muted">
                              Already have an account?
                            </small>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setAuthMode('login');
                                setAuthError(null);
                              }}
                              disabled={authLoading}
                            >
                              Back to login
                            </button>
                          </div>
                        )}

                        {authError && (
                          <div className="alert alert-danger py-2">
                            {authError}
                          </div>
                        )}

                        <form onSubmit={submitAuth}>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <label className="form-label">Email</label>
                              <input
                                type="email"
                                className="form-control"
                                value={authForm.email}
                                onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
                                required
                                autoComplete="email"
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Password</label>
                              <input
                                type="password"
                                className="form-control"
                                value={authForm.password}
                                onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
                                required
                                minLength={8}
                                autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                              />
                            </div>

                            {authMode === 'register' && (
                              <>
                                <div className="col-md-6">
                                  <label className="form-label">Truck name</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={authForm.truckName}
                                    onChange={(e) => setAuthForm((f) => ({ ...f, truckName: e.target.value }))}
                                    required
                                  />
                                </div>
                                <div className="col-md-6">
                                  <label className="form-label">Cuisine (optional)</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={authForm.cuisine}
                                    onChange={(e) => setAuthForm((f) => ({ ...f, cuisine: e.target.value }))}
                                  />
                                </div>
                                <div className="col-12">
                                  <label className="form-label">Description (optional)</label>
                                  <textarea
                                    className="form-control"
                                    rows={3}
                                    value={authForm.description}
                                    onChange={(e) => setAuthForm((f) => ({ ...f, description: e.target.value }))}
                                  />
                                </div>
                                <div className="col-12">
                                  <label className="form-label">Phone (optional)</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={authForm.phone}
                                    onChange={(e) => setAuthForm((f) => ({ ...f, phone: e.target.value }))}
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          <div className="d-flex justify-content-end gap-2 mt-4">
                            <button type="button" className="btn btn-outline-secondary" onClick={closeAuth} disabled={authLoading}>
                              Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={authLoading}>
                              {authLoading ? 'Please wait…' : (authMode === 'register' ? 'Create account' : 'Login')}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-backdrop fade show" onClick={closeAuth}></div>
              </>
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
