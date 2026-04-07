import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import motto from '../data/motto.json';

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

const Header = ({ date, authUser, authProfile, onOpenAuth, onLogout, onDateChange }) => {
  const [currentDate, setCurrentDate] = useState('');
  const [isPickingDate, setIsPickingDate] = useState(false);
  const canPickDate = typeof onDateChange === 'function';

  useEffect(() => {
    setCurrentDate(new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }));
  }, [date]);

  useEffect(() => {
    // If the parent updates the date, close the picker.
    setIsPickingDate(false);
  }, [date]);

  return (
    <nav className="navbar navbar-dark bg-primary sticky-top">
      <div className="container-lg">
        <div className="navbar-brand d-flex align-items-center gap-3 mb-0">
          {/* Logo */}
          <div
            style={{
              width: '50px',
              height: '50px',
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src="/assets/logo.png"
              alt="TruckSpot Logo"
              style={{ maxHeight: '45px', maxWidth: '45px', objectFit: 'contain' }}
            />
          </div>

          {/* Title and Tagline */}
          <div>
            <h1 className="fs-4 mb-0 fw-bold">
              {import.meta.env.VITE_APP_NAME}
            </h1>
            <small className="text-light">{motto.tagline}</small>
          </div>
        </div>

        {/* Right side */}
        <div className="text-light text-end d-flex align-items-center gap-3">
          <div>
            <small className="d-block opacity-75">📅 Recommendations for</small>
            {canPickDate ? (
              isPickingDate ? (
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={isValidDate(date) ? date : ''}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (!isValidDate(next)) return;
                    onDateChange(next);
                  }}
                  onBlur={() => setIsPickingDate(false)}
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  className="btn btn-link p-0 text-light text-decoration-none fw-bold"
                  onClick={() => setIsPickingDate(true)}
                  aria-label="Change recommendations date"
                >
                  {currentDate}
                </button>
              )
            ) : (
              <strong>{currentDate}</strong>
            )}
          </div>

          <div className="text-end">
            {authUser ? (
              <>
                <div className="d-flex align-items-center gap-2">
                  <strong className="small">
                    {authProfile?.truckName || authUser.email}
                  </strong>
                  <Link
                    to={`/trucks/${authUser.id}`}
                    className="btn btn-sm btn-outline-light"
                  >
                    My Truck
                  </Link>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light"
                    onClick={onLogout}
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={() => onOpenAuth?.('login')}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
