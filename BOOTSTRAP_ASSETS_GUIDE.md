# TruckSpot - Bootstrap 5 & Assets Guide

## Overview

TruckSpot is now configured to use **Bootstrap 5** for styling and includes dedicated folders for your **logo** and **motto**.

---

## 📁 Assets Structure

Your assets are organized in the **public folder** for easy serving:

```
frontend/
├── public/
│   ├── assets/
│   │   ├── logo.png          ← Your TruckSpot logo (PNG/JPG)
│   │   └── motto.json        ← TruckSpot tagline/motto file
│   └── index.html
```

### How to Add Your Logo & Motto

#### Step 1: Copy Your Logo
```bash
# Copy your logo image to:
# frontend/public/assets/logo.png
# Recommended size: 100x100px or 200x200px
```

#### Step 2: Create Motto File
Create `frontend/public/assets/motto.json`:
```json
{
  "motto": "Be there where demand is looking for you - with TruckSpot.",
  "tagline": "Where Hunger Finds You"
}
```

---

## 🎨 Bootstrap 5 Integration

### Installation
Bootstrap is already added to `package.json`:
```bash
npm install bootstrap
```

### Usage in Components

#### Navbar with Logo & Motto (Home.jsx)
```jsx
<nav className="navbar navbar-dark bg-primary mb-4">
  <div className="container-lg">
    <div className="d-flex align-items-center gap-3">
      <img 
        src="/assets/logo.png" 
        alt="TruckSpot Logo" 
        style={{ height: '50px', width: 'auto' }} 
      />
      <div>
        <h1 className="navbar-brand fs-3 mb-0">🚚 TruckSpot</h1>
        <small className="text-light">{motto.tagline}</small>
      </div>
    </div>
  </div>
</nav>
```

#### Common Bootstrap Classes

| Purpose | Bootstrap Class | Example |
|---------|-----------------|---------|
| Container | `.container` | `<div className="container">` |
| Grid | `.row`, `.col-md-4` | `<div className="row"><div className="col-md-4">` |
| Cards | `.card` | `<div className="card"><div className="card-body">` |
| Buttons | `.btn`, `.btn-primary` | `<button className="btn btn-primary">` |
| Text | `.text-muted`, `.fw-bold` | `<p className="text-muted fw-bold">` |
| Badges | `.badge`, `.bg-success` | `<span className="badge bg-success">` |
| Alerts | `.alert`, `.alert-info` | `<div className="alert alert-info">` |
| Forms | `.form-control`, `.form-label` | `<input className="form-control">` |

---

## 🎯 Component Structure

### App.jsx - Bootstrap CSS Import
```jsx
import 'bootstrap/dist/css/bootstrap.min.css';
```

### Header Component Pattern
```jsx
<nav className="navbar navbar-dark bg-primary">
  <div className="container-lg">
    {/* Logo and Title */}
  </div>
</nav>
```

### Card Component Pattern
```jsx
<div className="card shadow-sm">
  <div className="card-body">
    <h5 className="card-title">Title</h5>
    <p className="card-text">Content</p>
  </div>
</div>
```

### Grid Layout Pattern
```jsx
<div className="row g-3">
  <div className="col-md-4">Item 1</div>
  <div className="col-md-4">Item 2</div>
  <div className="col-md-4">Item 3</div>
</div>
```

---

## 📊 Database & Mock Data

### Configuration
- **Database Type**: JSON Mock Data (MVP only)
- **No external database required** for the MVP phase
- All data is stored in JSON files in `backend/src/data/`

### Mock Data Files

| File | Purpose |
|------|---------|
| `mockLocations.json` | Food truck parking locations across the city |
| `mockFootTraffic.json` | Pedestrian volume data by location and time |
| `mockEvents.json` | Local events and their impact on foot traffic |
| `mockCompetition.json` | Competitors and their locations |
| `weatherData.json` | Weather conditions affecting demand |

### Adding More Mock Data

All files are located in:
```
backend/src/data/
```

To add new locations, simply edit `mockLocations.json`:
```json
{
  "locations": [
    {
      "id": "loc_new_area",
      "name": "New Area Name",
      "lat": 44.4268,
      "lng": 26.1025,
      "zone": "new_zone",
      "capacity": "medium",
      "baseScore": 0.80,
      "parkingSpots": 15
    }
  ]
}
```

---

## 🎨 Styling Reference

### Color Scheme

#### Bootstrap Primary Colors
- **Primary (Blue)**: `#0d6efd` - Used for buttons, links, badges
- **Success (Green)**: `#198754` - Used for positive/revenue indicators
- **Warning (Yellow)**: `#ffc107` - Used for traffic/caution
- **Danger (Red)**: `#dc3545` - Used for high-risk indicators
- **Info (Cyan)**: `#0dcaf0` - Used for informational content
- **Muted (Gray)**: `#6c757d` - Used for secondary text

### Spacing Classes
- **Margin**: `.m-3`, `.mt-4`, `.mb-2`
- **Padding**: `.p-3`, `.pt-4`, `.pb-2`
- **Gap**: `.gap-3` (in flexbox/grid)

### Text Classes
- **Size**: `.fs-1` to `.fs-6` (font sizes)
- **Weight**: `.fw-bold`, `.fw-normal`, `.fw-light`
- **Color**: `.text-primary`, `.text-success`, `.text-danger`, `.text-muted`

### Shadow Classes
- `.shadow` - Full shadow
- `.shadow-sm` - Small shadow (used for cards)
- `.shadow-lg` - Large shadow

---

## 🚀 Next Steps

1. **Add Your Logo**
   - Place logo image at `frontend/public/assets/logo.png`
   - Size: 100x100px minimum, 200x200px recommended

2. **Update Motto**
   - Edit `frontend/public/assets/motto.json` with your tagline

3. **Customize Colors** (Optional)
   - Create `frontend/src/custom.scss` to override Bootstrap variables
   - Import before Bootstrap in `App.jsx`

4. **Add More Components**
   - All new components should use Bootstrap classes
   - Reference Bootstrap documentation: https://getbootstrap.com/

---

## 📝 File Checklist

- [ ] Logo image placed at `frontend/public/assets/logo.png`
- [ ] Motto JSON created at `frontend/public/assets/motto.json`
- [ ] Bootstrap installed via `npm install bootstrap`
- [ ] Bootstrap CSS imported in `App.jsx`
- [ ] Updated .gitignore with all entries
- [ ] Verified mock data files exist in `backend/src/data/`

---

## 🔗 Useful Resources

- **Bootstrap 5 Docs**: https://getbootstrap.com/docs/5.0/
- **Bootstrap Components**: https://getbootstrap.com/docs/5.0/components/
- **Bootstrap Grid**: https://getbootstrap.com/docs/5.0/layout/grid/
- **Bootstrap Utilities**: https://getbootstrap.com/docs/5.0/utilities/

---

**Updated**: April 4, 2026
**Status**: Ready for styling & setup
