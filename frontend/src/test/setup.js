import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Leaflet for JSDOM test environments
const createMockMap = () => ({
  setView: vi.fn().mockReturnThis(),
  fitBounds: vi.fn().mockReturnThis(),
  remove: vi.fn().mockReturnThis(),
  invalidateSize: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  off: vi.fn().mockReturnThis(),
  addLayer: vi.fn().mockReturnThis(),
  removeLayer: vi.fn().mockReturnThis(),
});

const createMockLayer = () => ({
  addTo: vi.fn().mockReturnThis(),
  bindPopup: vi.fn().mockReturnThis(),
  openPopup: vi.fn().mockReturnThis(),
  remove: vi.fn().mockReturnThis(),
  setLatLng: vi.fn().mockReturnThis(),
});

vi.mock('leaflet', () => {
  const L = {
    map: vi.fn(() => createMockMap()),
    tileLayer: vi.fn(() => createMockLayer()),
    marker: vi.fn(() => createMockLayer()),
    polyline: vi.fn(() => createMockLayer()),
    divIcon: vi.fn((opts) => opts),
    latLngBounds: vi.fn((coords) => ({
      isValid: vi.fn(() => true),
      extend: vi.fn().mockReturnThis(),
      getCenter: vi.fn(() => ({ lat: 0, lng: 0 })),
      coords,
    })),
    latLng: vi.fn((lat, lng) => ({ lat, lng })),
  };

  return {
    default: L,
    ...L,
  };
});
