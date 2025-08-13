class LeafletMapService {
  private static instance: LeafletMapService | null = null;
  private isLoaded = false;
  private retryCount = 0;
  private maxRetries = 2;

  private constructor() {}

  static getInstance(): LeafletMapService {
    if (!LeafletMapService.instance) {
      LeafletMapService.instance = new LeafletMapService();
    }
    return LeafletMapService.instance;
  }

  async loadLeaflet(): Promise<void> {
    if (this.isLoaded && window.L) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      // CSS yuklash
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      cssLink.crossOrigin = '';
      document.head.appendChild(cssLink);

      // JavaScript yuklash
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';

      script.onload = () => {
        this.isLoaded = true;
        console.log('✅ Leaflet xaritasi yuklandi');
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Leaflet yuklanmadi'));
      };

      document.head.appendChild(script);
    });
  }

  createMap(containerId: string, options: any = {}) {
    if (!window.L) {
      throw new Error('Leaflet hali yuklanmagan');
    }

    const defaultOptions = {
      center: [41.2995, 69.2401], // Toshkent
      zoom: 13,
      ...options
    };

    const map = window.L.map(containerId, defaultOptions);

    // OpenStreetMap tiles qo'shish
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    return map;
  }

  // Nominatim API orqali manzil qidirish
  async searchAddress(query: string): Promise<any[]> {
    try {
      const searchQuery = `${query}, Tashkent, Uzbekistan`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=uz&accept-language=uz,en`
      );

      if (!response.ok) {
        throw new Error('Nominatim API xatosi');
      }

      const data = await response.json();
      return data || [];

    } catch (error) {
      console.error('❌ Manzil qidirishda xato:', error);
      return [];
    }
  }

  // Koordinatani manzilga aylantirish (reverse geocoding)
  async reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=uz,en`
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding xatosi');
      }

      const data = await response.json();
      return data.display_name || `Koordinata: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;

    } catch (error) {
      console.error('❌ Reverse geocoding xatosi:', error);
      return `Koordinata: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  }
}

export const leafletMapService = LeafletMapService.getInstance();
export default leafletMapService;