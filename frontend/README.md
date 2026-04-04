# TruckSpot Frontend

React + Vite + Bootstrap 5 web application for TruckSpot - Intelligent location recommendation system for food trucks.

## Quick Start

### Prerequisites
- Node.js v16+
- npm or yarn
- Backend running on `http://localhost:5000`

### Installation

```bash
# From the frontend directory
npm install
```

### Configuration

```bash
# Copy the example env file
cp .env.example .env
```

The `.env` file is already configured for local development:
```
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=TruckSpot
VITE_APP_VERSION=1.0.0
```

### Running the Development Server

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

Output files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx              # Navigation bar with logo/motto
│   │   ├── MapComponent.jsx        # Leaflet interactive map
│   │   └── RecommendationCard.jsx  # Recommendation display card
│   ├── pages/
│   │   └── Home.jsx               # Main page with all features
│   ├── services/
│   │   └── api.js                 # API client and endpoints
│   ├── utils/                     # Helper functions (future)
│   ├── App.jsx                    # Main app component
│   ├── App.css                    # Global styles
│   └── main.jsx                   # React entry point
├── public/
│   ├── assets/
│   │   ├── logo.png              # TruckSpot logo
│   │   └── motto.json            # App motto and tagline
│   └── index.html                # HTML entry point
├── package.json
├── vite.config.js
├── .env                          # Local environment variables
└── index.html
```

---

## Features

### Header Component
- Logo display from `/assets/logo.png`
- App name and tagline from `/assets/motto.json`
- Current date display
- Sticky navigation

### Map Component
- Interactive Leaflet map with OpenStreetMap tiles
- Markers for all food truck locations
- Circle overlays showing area coverage
- Click handlers for location selection
- Popup with location information

### Recommendation Cards
- Ranked list of top 3 locations
- Real-time score calculation
- Risk level indicator (Low/Medium/High)
- Revenue estimation display
- Foot traffic metrics
- Expandable score breakdown
- Reasons why location is recommended

### Home Page
- Full-page layout with multiple sections
- Map view with location selection
- Selected location details panel
- Recommendations grid
- Detailed analysis of selected recommendation
- Responsive Bootstrap grid layout
- Error handling and loading states
- Refresh functionality

---

## API Integration

### Available Endpoints

**Get Recommendations**
```javascript
import { recommendationService } from './services/api';

// Get recommendations for a specific date
const response = await recommendationService.getDailyRecommendations('2026-04-04');

// response.data = {
//   success: true,
//   date: "2026-04-04",
//   recommendations: [
//     {
//       rank: 1,
//       locationId: "loc_university_square",
//       locationName: "University Square",
//       score: 0.89,
//       estimatedRevenue: 174,
//       footTraffic: 1200,
//       ...
//     }
//   ]
// }
```

**Get All Locations**
```javascript
import { locationService } from './services/api';

const response = await locationService.getAllLocations();
```

**Get Location Details**
```javascript
const response = await locationService.getLocationById('loc_university_square');
```

---

## Styling

### Bootstrap 5
- Responsive grid system
- Pre-built components (cards, badges, buttons)
- Utility classes for spacing, colors, typography
- Mobile-first design

### Custom CSS (App.css)
- Custom color scheme
- Card hover effects
- Button animations
- Scrollbar styling
- Dark mode support (optional)
- Accessibility improvements

### Key Colors
- **Primary**: `#0d6efd` (Blue)
- **Success**: `#198754` (Green) - Revenue/traffic
- **Warning**: `#ffc107` (Yellow) - Competition/caution
- **Danger**: `#dc3545` (Red) - High risk

---

## Components Guide

### Header Component
```jsx
<Header date="2026-04-04" />
```
Displays sticky navbar with logo, motto, and current date.

### MapComponent
```jsx
<MapComponent 
  onLocationSelect={(location) => {}} 
  selectedLocationId="loc_university_square"
/>
```
Interactive map with location markers and selection handling.

### RecommendationCard
```jsx
<RecommendationCard 
  recommendation={recommendationObj}
  rank={1}
  onSelect={(rec) => {}}
/>
```
Displays single recommendation with metrics and details.

---

## State Management

### Home Page State
- `recommendations` - Array of top 3 recommendations
- `selectedLocation` - Currently selected location from map
- `selectedRecommendation` - Currently selected recommendation
- `date` - Date for recommendations (defaults to today)
- `loading` - Loading state for API calls
- `error` - Error messages from API

### Data Flow
```
User Click on Map
    ↓
handleLocationSelect()
    ↓
setSelectedLocation()
    ↓
Re-render with location details
    ↓
User sees location information
```

---

## Error Handling

All API calls are wrapped in try-catch blocks:
```javascript
try {
  const response = await recommendationService.getDailyRecommendations(date);
  setRecommendations(response.data.recommendations);
} catch (err) {
  setError('Failed to load recommendations. Please try again later.');
}
```

---

## Performance Tips

1. **Lazy Loading** - Images load on demand
2. **Memoization** - Components are optimized with React hooks
3. **Efficient Re-renders** - State updates are targeted
4. **Bundle Size** - Bootstrap loaded from CDN (optional)

---

## Troubleshooting

### "Cannot find module" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### CORS errors
- Ensure backend is running on `http://localhost:5000`
- Check `VITE_API_URL` in `.env` file

### Map not displaying
- Check browser console for Leaflet errors
- Ensure Leaflet CSS is imported in App.jsx
- Verify location coordinates are valid

### API calls failing
- Backend must be running
- Check network tab in DevTools
- Verify response format matches expected API response

---

## Future Enhancements

- [ ] User authentication
- [ ] Save favorite locations
- [ ] Historical data charts
- [ ] Mobile app version
- [ ] Real-time notifications
- [ ] Advanced filters
- [ ] Export recommendations to PDF
- [ ] multi-language support

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Resources

- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [Bootstrap 5 Docs](https://getbootstrap.com/)
- [Leaflet Docs](https://leafletjs.com/)
- [Axios Docs](https://axios-http.com/)

---

**Version**: 1.0.0  
**Last Updated**: April 4, 2026
