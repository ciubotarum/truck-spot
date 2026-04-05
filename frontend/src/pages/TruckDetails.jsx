import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import { authService, setAuthToken, truckService } from '../services/api';

const TruckDetails = () => {
  const { truckId } = useParams();
  const navigate = useNavigate();
  const [date] = useState(new Date().toISOString().split('T')[0]);

  const [authUser, setAuthUser] = useState(null);
  const [authProfile, setAuthProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menu, setMenu] = useState([]);

  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    currency: 'RON',
    description: ''
  });

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
        window.localStorage.removeItem('truckspot_auth_token');
        setAuthToken(null);
        setAuthUser(null);
        setAuthProfile(null);
      });
  }, []);

  const isOwner = useMemo(() => {
    if (!authUser?.id || !truckId) return false;
    return String(authUser.id) === String(truckId);
  }, [authUser, truckId]);

  const loadTruck = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await truckService.getTruck(truckId);
      setProfile(res.data?.data?.profile || null);
      {
        const items = res.data?.data?.menu || [];
        // Defensive filter: only show items for this truck.
        const filtered = items.filter((i) => !i?.truckId || String(i.truckId) === String(truckId));
        setMenu(filtered);
      }
    } catch (e) {
      setProfile(null);
      setMenu([]);
      setError(e?.response?.data?.error || 'Failed to load truck details');
    } finally {
      setLoading(false);
    }
  };

  const loadMyMenu = async () => {
    if (!isOwner) return;
    try {
      setMenuLoading(true);
      setMenuError(null);
      const res = await truckService.getMyMenu();
      setMenu(res.data?.data || []);
    } catch (e) {
      setMenuError(e?.response?.data?.error || 'Failed to load your menu');
    } finally {
      setMenuLoading(false);
    }
  };

  useEffect(() => {
    if (!truckId) return;
    loadTruck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [truckId]);

  useEffect(() => {
    if (!isOwner) return;
    loadMyMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  const logout = () => {
    window.localStorage.removeItem('truckspot_auth_token');
    setAuthToken(null);
    setAuthUser(null);
    setAuthProfile(null);
  };

  const addMenuItem = async (e) => {
    e.preventDefault();
    if (!isOwner) return;

    try {
      setMenuLoading(true);
      setMenuError(null);

      await truckService.addMyMenuItem({
        name: newItem.name,
        price: newItem.price,
        currency: 'RON',
        description: newItem.description || null
      });

      setNewItem({ name: '', price: '', currency: 'RON', description: '' });
      await loadMyMenu();
    } catch (e2) {
      setMenuError(e2?.response?.data?.error || 'Failed to add menu item');
    } finally {
      setMenuLoading(false);
    }
  };

  const deleteMenuItem = async (itemId) => {
    if (!isOwner) return;

    try {
      setMenuLoading(true);
      setMenuError(null);
      await truckService.deleteMyMenuItem(itemId);
      await loadMyMenu();
    } catch (e) {
      setMenuError(e?.response?.data?.error || 'Failed to delete menu item');
    } finally {
      setMenuLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header
        date={date}
        authUser={authUser}
        authProfile={authProfile}
        onOpenAuth={() => navigate('/')}
        onLogout={logout}
      />

      <main className="container-lg py-4 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Link to="/" className="btn btn-outline-secondary">
            ← Back
          </Link>
          <button type="button" className="btn btn-outline-primary" onClick={loadTruck} disabled={loading}>
            Refresh
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mb-0">Loading truck details…</p>
            </div>
          </div>
        ) : profile ? (
          <div className="row g-4">
            <div className="col-lg-5">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h3 className="h5 fw-bold mb-1">{profile.truckName || 'Food truck'}</h3>
                  <div className="text-muted small mb-3">Truck ID: {profile.truckId}</div>

                  <div className="small text-muted">
                    <div>
                      <strong>Cuisine:</strong> {profile.cuisine || 'Not specified'}
                    </div>
                    <div>
                      <strong>Phone:</strong> {profile.phone || 'Not provided'}
                    </div>
                  </div>

                  {profile.description ? (
                    <p className="text-muted small mt-3 mb-0">{profile.description}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h4 className="h6 fw-bold mb-0">Menu</h4>
                  </div>

                  {menuError && (
                    <div className="alert alert-danger py-2" role="alert">
                      {menuError}
                    </div>
                  )}

                  {menu.length > 0 ? (
                    <div className="list-group mb-3">
                      {menu.map((item) => (
                        <div key={item.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <div>
                              <div className="fw-bold">{item.name}</div>
                              {item.description ? (
                                <div className="small text-muted">{item.description}</div>
                              ) : null}
                            </div>
                            <div className="text-end">
                              <div className="fw-bold">
                                {item.currency || 'EUR'} {item.price}
                              </div>
                              {isOwner ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger mt-2"
                                  onClick={() => deleteMenuItem(item.id)}
                                  disabled={menuLoading}
                                >
                                  Delete
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="small text-muted mb-3">No menu items yet.</div>
                  )}

                  {isOwner ? (
                    <form onSubmit={addMenuItem}>
                      <h5 className="h6 fw-bold">Add menu item</h5>
                      <div className="row g-2">
                        <div className="col-md-6">
                          <label className="form-label small text-muted mb-1">Name</label>
                          <input
                            className="form-control"
                            value={newItem.name}
                            onChange={(e) => setNewItem((s) => ({ ...s, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small text-muted mb-1">Price</label>
                          <input
                            className="form-control"
                            value={newItem.price}
                            onChange={(e) => setNewItem((s) => ({ ...s, price: e.target.value }))}
                            inputMode="decimal"
                            required
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small text-muted mb-1">Currency</label>
                          <input className="form-control" value="RON" readOnly />
                        </div>
                        <div className="col-12">
                          <label className="form-label small text-muted mb-1">Description (optional)</label>
                          <input
                            className="form-control"
                            value={newItem.description}
                            onChange={(e) => setNewItem((s) => ({ ...s, description: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="d-flex justify-content-end mt-3">
                        <button type="submit" className="btn btn-primary" disabled={menuLoading}>
                          {menuLoading ? 'Please wait…' : 'Add'}
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="alert alert-warning">Truck not found.</div>
        )}
      </main>

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

export default TruckDetails;
