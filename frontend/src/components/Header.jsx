import React, { useState, useEffect } from 'react';
import motto from '../data/motto.json';

const Header = ({ date }) => {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    setCurrentDate(new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }));
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

        {/* Date Display */}
        <div className="text-light text-end">
          <small className="d-block opacity-75">📅 Recommendations for</small>
          <strong>{currentDate}</strong>
        </div>
      </div>
    </nav>
  );
};

export default Header;
