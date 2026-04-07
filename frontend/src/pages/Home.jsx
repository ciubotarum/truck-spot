import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import MapComponent from '../components/MapComponent';
import RecommendationCard from '../components/RecommendationCard';
import { agentService, parkingService, authService, reservationsService, setAuthToken } from '../services/api';

const Home = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [parkingLoading, setParkingLoading] = useState(false);
  const [parkingError, setParkingError] = useState(null);
  const [parkingAvailability, setParkingAvailability] = useState(null);
  const [selectedSpotNumber, setSelectedSpotNumber] = useState('');

  const [reservedTrucks, setReservedTrucks] = useState([]);
  const [reservedTrucksLoading, setReservedTrucksLoading] = useState(false);
  const [reservedTrucksError, setReservedTrucksError] = useState(null);

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

  // Keep guest id for future needs; parking reservations are owner-only now.
  const effectiveUserId = authUser?.id || guestUserId;

  const [myReservations, setMyReservations] = useState([]);
  const [myReservationsLoading, setMyReservationsLoading] = useState(false);
  const [myReservationsError, setMyReservationsError] = useState(null);

  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  const myReservationsByDate = useMemo(() => {
    const groups = new Map();
    for (const r of (myReservations || [])) {
      const key = r?.date || 'Unknown date';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }

    // Sort: newest date first; keep "Unknown date" last.
    return Array.from(groups.entries())
      .sort(([a], [b]) => {
        if (a === 'Unknown date') return 1;
        if (b === 'Unknown date') return -1;
        return String(b).localeCompare(String(a));
      })
      .map(([dateKey, items]) => ({ date: dateKey, items }));
  }, [myReservations]);

  const loadMyReservations = async () => {
    if (!authUser) return;
    try {
      setMyReservationsLoading(true);
      setMyReservationsError(null);
      // Load across all dates; UI should show date per reservation.
      const res = await reservationsService.listMine();
      setMyReservations(res.data?.data || []);
    } catch (e) {
      setMyReservations([]);
      setMyReservationsError(e?.response?.data?.error || 'Failed to load reservations');
    } finally {
      setMyReservationsLoading(false);
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, authUser?.id]);

  const loadRecommendations = async () => {
    try {
      if (!authUser) {
        // Guests should not see AI recommendations.
        setRecommendations([]);
        setSelectedRecommendation(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const response = await agentService.getMyAIRecommendations(date);
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
      const res = await parkingService.getAvailability(date, locationId);
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

  const loadReservedTrucks = async (locationId) => {
    try {
      setReservedTrucksLoading(true);
      setReservedTrucksError(null);
      const res = await parkingService.listTrucks(date, locationId);
      setReservedTrucks(res.data?.data || []);
    } catch (e) {
      setReservedTrucks([]);
      setReservedTrucksError(e?.response?.data?.error || 'Failed to load reserved trucks');
    } finally {
      setReservedTrucksLoading(false);
    }
  };

  const reserveSelectedSpot = async (locationId) => {
    try {
      if (!selectedSpotNumber) return;
      if (!authUser) {
        openAuth('login');
        return;
      }
      setParkingLoading(true);
      setParkingError(null);
      const res = await parkingService.reserveSpot(date, locationId, Number(selectedSpotNumber));
      const data = res.data?.data?.availability;
      setParkingAvailability(data || null);
      await loadMyReservations();
    } catch (e) {
      setParkingError(e?.response?.data?.error || 'Failed to reserve spot');
    } finally {
      setParkingLoading(false);
    }
  };

  const releaseMySpot = async (locationId) => {
    try {
      if (!authUser) {
        openAuth('login');
        return;
      }
      setParkingLoading(true);
      setParkingError(null);
      const res = await parkingService.releaseSpot(date, locationId);
      const data = res.data?.data?.availability;
      setParkingAvailability(data || null);
      setSelectedSpotNumber('');
      await loadMyReservations();
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
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isDetailsOpen, isAuthOpen]);

  useEffect(() => {
    if (!isDetailsOpen) return;
    const locationId = selectedLocation?.id || selectedRecommendation?.location?.id;
    if (!locationId) return;
    loadParkingAvailability(locationId);
    loadReservedTrucks(locationId);
  }, [isDetailsOpen, selectedRecommendation, selectedLocation, date]);

  useEffect(() => {
    if (!authUser) {
      setMyReservations([]);
      return;
    }
    loadMyReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Header */}
      <Header
        date={date}
        onDateChange={setDate}
        authUser={authUser}
        authProfile={authProfile}
        onOpenAuth={openAuth}
        onLogout={logout}
      />

      {/* Main Content */}
      <main className="container-lg py-4 flex-grow-1">
        {/* Welcome Banner for Guests */}
        {!authUser && (
          <div className="card border-0 mb-4" style={{ backgroundColor: '#4f46e5' }}>
            <div className="card-body py-4">
              <div className="row align-items-center">
                <div className="col-lg-12">
                  <h2 className="text-white mb-2">Welcome to TruckSpot</h2>
                  <p className="text-white mb-0">
                    Find the best food trucks in your area, or if you're a truck owner, 
                    get AI-powered recommendations on where to sell.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    <h5 className="card-title mb-3">📍 Find Food Trucks Near You</h5>
                    <div className="small text-muted mb-2">
                      {authUser ? 'Click a marker to see available parking spots.' : 'Click a marker to see food trucks available today.'}
                    </div>
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
                          <p className="mb-0 fw-bold">Click on a location marker</p>
                          <small>{authUser ? 'to view parking spots and availability' : 'to see which food trucks are there today'}</small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Cards for Guests */}
            {!authUser && (
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="card border-0 h-100" style={{ background: '#f8f9fa' }}>
                    <div className="card-body">
                      <h6 className="fw-bold mb-2">🍔 For Food Lovers</h6>
                      <p className="small text-muted mb-0">
                        Browse the map to find food trucks near you. Click on any location marker to see 
                        which trucks are serving there today.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card border-0 h-100" style={{ background: '#f8f9fa' }}>
                    <div className="card-body">
                      <h6 className="fw-bold mb-2">🚚 For Truck Owners</h6>
                      <p className="small text-muted mb-0">
                        Get AI-powered recommendations on the best locations to sell, 
                        based on demand, competition, and more. Login or register to get started.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {authUser && (
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <h5 className="card-title mb-0">My Reservations</h5>
                      <small className="text-muted">Across all dates</small>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={loadMyReservations}
                      disabled={myReservationsLoading}
                    >
                      Refresh
                    </button>
                  </div>

                  {myReservationsError && (
                    <div className="alert alert-danger py-2 mb-2">{myReservationsError}</div>
                  )}

                  {myReservationsLoading ? (
                    <div className="small text-muted">Loading…</div>
                  ) : myReservationsByDate.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {myReservationsByDate.map((group) => (
                        <div key={group.date} className="border rounded">
                          <div className="d-flex align-items-center justify-content-between px-3 py-2 bg-light border-bottom">
                            <div className="fw-semibold">
                              {group.date}
                              {group.date === todayDate ? (
                                <span className="badge text-bg-primary ms-2">Today</span>
                              ) : null}
                            </div>
                            <span className="badge text-bg-secondary">
                              {group.items.length} booking{group.items.length === 1 ? '' : 's'}
                            </span>
                          </div>

                          <div className="table-responsive">
                            <table className="table table-sm mb-0">
                              <thead>
                                <tr>
                                  <th>Location</th>
                                  <th>Spot</th>
                                  <th>Created</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.items
                                  .slice()
                                  .sort((a, b) => String(b?.createdAt || '').localeCompare(String(a?.createdAt || '')))
                                  .map((r, idx) => (
                                    <tr key={`${r.locationId}-${r.spotNumber}-${r.date}-${idx}`}>
                                      <td>{r.locationName || r.locationId}</td>
                                      <td>#{r.spotNumber}</td>
                                      <td className="text-muted">
                                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="small text-muted">No reservations yet.</div>
                  )}
                </div>
              </div>
            )}

            {/* Recommendations Section (owners only) */}
            {authUser ? (
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="card-title mb-1">🤖 AI-Powered Recommendations</h5>
                      <small className="text-muted">
                        Personalized for your truck using your menu prices (gross estimate)
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
            ) : null}

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

                          {authUser ? (
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
                                          <small className="text-muted d-block">Gross Revenue</small>
                                          <div className="fw-bold text-success">
                                            {(selectedRecommendation.agenticAnalysis?.decisions?.revenue?.currency || 'RON')}{' '}
                                            {selectedRecommendation.agenticAnalysis?.decisions?.revenue?.projectedDailyRevenue || 0}
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
                          ) : null}

                          {authUser ? (
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
                          ) : null}

                          <div className="col-12">
                            <div className="card border-0 bg-light">
                              <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <h6 className="fw-bold mb-0">
                                    {authUser ? '🅿️ Reserve a Parking Spot' : '🍔 Food trucks here today'}
                                  </h6>
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

                                    {!authUser ? (
                                      <div className="mb-2">
                                        {reservedTrucksError && (
                                          <div className="alert alert-danger py-2 mb-2">{reservedTrucksError}</div>
                                        )}

                                        {reservedTrucksLoading ? (
                                          <div className="small text-muted">Loading trucks…</div>
                                        ) : reservedTrucks.length > 0 ? (
                                          <div className="list-group">
                                            {reservedTrucks.map((t, idx) => (
                                              <Link
                                                key={`${t.spotNumber}-${idx}`}
                                                to={t.truckId ? `/trucks/${t.truckId}` : '#'}
                                                className={`list-group-item list-group-item-action${t.truckId ? '' : ' disabled'}`}
                                                onClick={(e) => {
                                                  if (!t.truckId) {
                                                    e.preventDefault();
                                                    return;
                                                  }
                                                  // Close modal before navigating.
                                                  closeDetails();
                                                }}
                                              >
                                                <div className="d-flex justify-content-between align-items-start">
                                                  <div>
                                                    <div className="fw-bold">{t.truckName || 'Food truck'}</div>
                                                    <div className="small text-muted">
                                                      {t.cuisine ? t.cuisine : 'Cuisine not specified'}
                                                    </div>
                                                  </div>
                                                  <span className="badge text-bg-secondary">Spot #{t.spotNumber}</span>
                                                </div>
                                                {t.description ? (
                                                  <div className="small text-muted mt-2">{t.description}</div>
                                                ) : null}
                                              </Link>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="small text-muted">No food trucks reserved here yet.</div>
                                        )}
                                      </div>
                                    ) : (
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
                                    )}
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
        <div className="container-lg">
          <div className="row text-center text-md-start">
            <div className="col-md-4 mb-3 mb-md-0">
              <h6 className="text-white mb-2">TruckSpot</h6>
              <small className="text-muted d-block">Intelligent location recommendations for food trucks</small>
            </div>
            <div className="col-md-4 mb-3 mb-md-0">
              <h6 className="text-white mb-2">For Owners</h6>
              <small className="text-muted d-block">AI-powered recommendations to maximize your revenue</small>
            </div>
            <div className="col-md-4">
              <h6 className="text-white mb-2">For Customers</h6>
              <small className="text-muted d-block">Find the best food trucks near you</small>
            </div>
          </div>
          <hr className="border-secondary" />
          <div className="text-center">
            <small className="text-muted">© 2026 TruckSpot</small>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
