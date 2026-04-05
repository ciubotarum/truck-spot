import React from 'react';

const RecommendationCard = ({ recommendation, rank, onSelect }) => {
  const location = recommendation.location;
  const decisions = recommendation.agenticAnalysis?.decisions || {};
  const demand = decisions.demand || {};
  const context = decisions.context || {};
  const revenue = decisions.revenue || {};

  const getRiskBadgeColor = (risk) => {
    switch (risk?.toLowerCase()) {
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
    if (score > 0.8) return '#198754';
    if (score > 0.6) return '#ffc107';
    return '#dc3545';
  };

  const extractFootTraffic = (reasoning) => {
    if (!reasoning) return 'N/A';
    const match = reasoning.match(/Foot traffic:\s*(\d+)/);
    return match ? match[1] : 'N/A';
  };

  const extractEvents = (reasoning) => {
    if (!reasoning) return 0;
    const match = reasoning.match(/Events:\s*(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const footTraffic = extractFootTraffic(demand.reasoning);
  const events = extractEvents(demand.reasoning);
  const reasons = [
    demand.analysis ? demand.analysis.substring(0, 100) + '...' : 'AI analysis unavailable',
    context.analysis ? context.analysis.substring(0, 100) + '...' : 'Context analysis unavailable'
  ];

  return (
    <div className="card h-100 shadow-sm border-0 hover-card">
      <div className="card-body d-flex flex-column">
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
              <h6 className="card-title mb-1">{location.name}</h6>
              <small className="text-muted">{location.zone}</small>
            </div>
          </div>
          <span className={`badge bg-${getRiskBadgeColor(recommendation.agenticAnalysis?.recommendation?.riskLevel)}`}>
            {recommendation.agenticAnalysis?.recommendation?.riskLevel?.toUpperCase() || 'N/A'} RISK
          </span>
        </div>

        <div className="row g-2 mb-3 flex-grow-1">
          <div className="col-4 text-center">
            <div className="metric-box">
              <div
                className="metric-score"
                style={{
                  color: getScoreColor(demand.demandScore),
                  fontSize: '24px',
                  fontWeight: 'bold'
                }}
              >
                {demand.demandScore?.toFixed(2) || 'N/A'}
              </div>
              <small className="text-muted d-block">Demand</small>
            </div>
          </div>
          <div className="col-4 text-center">
            <div className="metric-box">
              <div className="metric-revenue" style={{ color: '#198754', fontSize: '24px', fontWeight: 'bold' }}>
                {(revenue.currency || 'RON')} {revenue.projectedDailyRevenue || 0}
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
                {footTraffic}
              </div>
              <small className="text-muted d-block">Foot/Hour</small>
            </div>
          </div>
        </div>

        <div className="mb-3 pb-3 border-bottom">
          <small className="text-muted d-block mb-1">
            <strong>Capacity:</strong> {location.capacity?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
          </small>
          <small className="text-muted d-block">
            <strong>Context Adj:</strong> {context.contextAdjustment?.toFixed(2) || '1.00'} ({context.factors?.weather || 'N/A'})
          </small>
        </div>

        <div className="mb-3">
          <small className="fw-bold text-muted d-block mb-2">🤖 AI Analysis:</small>
          <ul className="list-unstyled mb-0">
            {reasons.map((reason, idx) => (
              <li key={idx} className="small text-muted mb-1">
                {reason}
              </li>
            ))}
          </ul>
        </div>

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
      `}</style>
    </div>
  );
};

export default RecommendationCard;
