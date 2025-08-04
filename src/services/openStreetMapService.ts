
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet ikonlari uchun fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export class OpenStreetMapService {
  private static instance: OpenStreetMapService | null = null;
  private map: L.Map | null = null;
  private currentMarker: L.Marker | null = null;
  private clickHandler: ((coordinates: [number, number]) => void) | null = null;

  private constructor() {}

  static getInstance(): OpenStreetMapService {
    if (!OpenStreetMapService.instance) {
      OpenStreetMapService.instance = new OpenStreetMapService();
    }
    return OpenStreetMapService.instance;
  }

  initializeMap(containerId: string, onMapClick?: (coordinates: [number, number]) => void): L.Map {
    if (this.map) {
      this.map.remove();
    }

    // Toshkent koordinatlari
    const tashkentCoords: [number, number] = [41.311158, 69.240562];

    this.map = L.map(containerId).setView(tashkentCoords, 12);

    // OpenStreetMap tile layer qo'shish
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(this.map);

    // Click handler
    if (onMapClick) {
      this.clickHandler = onMapClick;
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        this.addMarker([lat, lng]);
        onMapClick([lat, lng]);
      });
    }

    return this.map;
  }

  addMarker(coordinates: [number, number], popupText?: string): void {
    if (!this.map) return;

    // Eski markerni o'chirish
    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker);
    }

    // Yangi marker qo'shish
    this.currentMarker = L.marker(coordinates).addTo(this.map);
    
    if (popupText) {
      this.currentMarker.bindPopup(popupText).openPopup();
    }
  }

  // Tekin geocoding (Nominatim API)
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=uz`
      );
      
      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      }
      
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Geocoding xatosi:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }

  // Forward geocoding
  async geocode(address: string): Promise<[number, number] | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=uz`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding xatosi:', error);
      return null;
    }
  }

  getCurrentLocation(): Promise<[number, number]> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation qo\'llab-quvvatlanmaydi'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          reject(new Error('Joylashuvni aniqlab bo\'lmadi'));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.currentMarker = null;
    this.clickHandler = null;
  }
}

export const openStreetMapService = OpenStreetMapService.getInstance();
