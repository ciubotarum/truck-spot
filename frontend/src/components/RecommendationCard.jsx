import React from 'react';

const RecommendationCard = ({ recommendation, rank, onSelect }) => {
  const getRiskBadgeColor = (risk) => {
    switch (risk) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getScoreColor = (score) => {
    if (score > 0.8) return '#198754'; // green
    if (score > 0.6) return '#ffc107'; // yellow
    return '#dc3545'; // red
  };

  return (
    <div className="card h-100 shadow-sm border-0 hover-card">
      <div className="card-body d-flex flex-column">
        {/* Rank and Title */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="d-flex gap-2 align-items-start">
            <span
              className="badge rounded-circle"
              style={{
                width: '35px',
                height: '35px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0d6efd',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              #{rank}
            </span>
            <div>
              <h6 className="card-title mb-1">{recommendation.locationName}</h6>
              <small className="text-muted">{recommendation.zone}</small>
            </div>
          </div>
          <span className={`badge bg-${getRiskBadgeColor(recommendation.riskLevel)}`}>
            {recommendation.riskLevel.charAt(0).toUpperCase() + recommendation.riskLevel.slice(1)} RISK
          </span>
        </div>

        {/* Score Metrics */}
        <div className="row g-2 mb-3 flex-grow-1">
          <div className="col-4 text-center">
            <div className="metric-box">
              <div
                className="metric-score"
                style={{
                  color: getScoreColor(recommendation.score),
                  fontSize: '24px',
                  fontWeight: 'bold'
                }}
              >
                {recommendation.score}
              </div>
              <small className="text-muted d-block">Score</small>
            </div>
          </div>
          <div className="col-4 text-center">
            <div className="metric-box">
              <div className="metric-revenue" style={{ color: '#198754', fontSize: '24px', fontWeight: 'bold' }}>
                €{recommendation.estimatedRevenue}
              </div>
              <small className="text-muted d-block">Revenue</small>
            </div>
          </div>
          <div className="col-4 text-center">
            <div className="metric-box">
              <div
                className="metric-traffic"
                style={{ color: '#ffc107', fontSize: '24px', fontWeight: 'bold' }}
              >
                {recommendation.footTraffic}
              </div>
              <small className="text-muted d-block">Foot Traffic</small>
            </div>
          </div>
        </div>

        {/* Capacity Info */}
        <div className="mb-3 pb-3 border-bottom">
          <small className="text-muted d-block mb-1">
            <strong>Capacity:</strong> {recommendation.capacity.replace(/_/g, ' ').toUpperCase()}
          </small>
          <small className="text-muted d-block">
            <strong>Competition:</strong> {recommendation.competitionCount > 0 ? `${recommendation.competitionCount} competitor(s)` : 'None'}
          </small>
        </div>

        {/* Why This Location */}
        <div className="mb-3">
          <small className="fw-bold text-muted d-block mb-2">Why this location?</small>
          <ul className="list-unstyled mb-0">
            {recommendation.reasons.map((reason, idx) => (
              <li key={idx} className="small text-muted mb-1">
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Score Breakdown (Collapsible) */}
        <div className="mb-3">
          <details className="score-breakdown">
            <summary className="small fw-bold text-muted cursor-pointer">
              📊 Score Breakdown
            </summary>
            <div className="mt-2 ps-2 border-start border-secondary">
              <div className="d-flex justify-content-between mb-1">
                <small className="text-muted">Traffic</small>
                <small className="text-muted">{(recommendation.scoreBreakdown.traffic * 100).toFixed(0)}%</small>
              </div>
              <div className="progress mb-2" style={{ height: '6px' }}>
                <div
                  className="progress-bar"
                  style={{ width: `${recommendation.scoreBreakdown.traffic * 100}%` }}
                ></div>
              </div>

              <div className="d-flex justify-content-between mb-1">
                <small className="text-muted">Events</small>
                <small className="text-muted">{(recommendation.scoreBreakdown.events * 100).toFixed(0)}%</small>
              </div>
              <div className="progress mb-2" style={{ height: '6px' }}>
                <div
                  className="progress-bar bg-success"
                  style={{ width: `${recommendation.scoreBreakdown.events * 100}%` }}
                ></div>
              </div>

              <div className="d-flex justify-content-between mb-1">
                <small className="text-muted">Competition</small>
                <small className="text-muted">{(recommendation.scoreBreakdown.competition * 100).toFixed(0)}%</small>
              </div>
              <div className="progress mb-2" style={{ height: '6px' }}>
                <div
                  className="progress-bar bg-warning"
                  style={{ width: `${recommendation.scoreBreakdown.competition * 100}%` }}
                ></div>
              </div>

              <div className="d-flex justify-content-between mb-1">
                <small className="text-muted">Base</small>
                <small className="text-muted">{(recommendation.scoreBreakdown.base * 100).toFixed(0)}%</small>
              </div>
              <div className="progress mb-2" style={{ height: '6px' }}>
                <div
                  className="progress-bar bg-info"
                  style={{ width: `${recommendation.scoreBreakdown.base * 100}%` }}
                ></div>
              </div>

              <div className="d-flex justify-content-between mb-1">
                <small className="text-muted">Weather</small>
                <small className="text-muted">{(recommendation.scoreBreakdown.weather * 100).toFixed(0)}%</small>
              </div>
              <div className="progress" style={{ height: '6px' }}>
                <div
                  className="progress-bar bg-secondary"
                  style={{ width: `${recommendation.scoreBreakdown.weather * 100}%` }}
                ></div>
              </div>
            </div>
          </details>
        </div>

        {/* Action Button */}
        <button
          className="btn btn-primary w-100 mt-auto"
          onClick={() => onSelect(recommendation)}
        >
          📍 View Details
        </button>
      </div>

      <style>{`
        .hover-card {
          transition: all 0.3s ease;
        }
        .hover-card:hover {
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
          transform: translateY(-2px);
        }
        .score-breakdown summary {
          cursor: pointer;
          user-select: none;
        }
        .score-breakdown summary:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default RecommendationCard;
