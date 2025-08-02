
class YandexMapsService {
  private static instance: YandexMapsService | null = null;
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): YandexMapsService {
    if (!YandexMapsService.instance) {
      YandexMapsService.instance = new YandexMapsService();
    }
    return YandexMapsService.instance;
  }

  async loadYandexMaps(): Promise<void> {
    // Agar allaqachon yuklangan bo'lsa
    if (this.isLoaded && window.ymaps) {
      return Promise.resolve();
    }

    // Agar hozir yuklanayotgan bo'lsa, kutamiz
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = new Promise<void>((resolve, reject) => {
      // Agar allaqachon yuklangan bo'lsa
      if (window.ymaps) {
        this.isLoaded = true;
        this.isLoading = false;
        resolve();
        return;
      }

      // Mavjud skriptlarni tekshirish
      const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
      if (existingScript) {
        // Mavjud skript yuklanishini kutish
        existingScript.addEventListener('load', () => {
          this.isLoaded = true;
          this.isLoading = false;
          resolve();
        });
        existingScript.addEventListener('error', () => {
          this.isLoading = false;
          reject(new Error('Yandex Maps yuklanmadi'));
        });
        return;
      }

      // Yangi skript yaratish
      const script = document.createElement('script');
      const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
      
      console.log('🗺️ Yandex Maps yuklanmoqda, API kalit:', apiKey);

      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=uz_UZ&load=package.full`;
      script.type = 'text/javascript';
      script.async = true;

      script.onload = () => {
        console.log('✅ Yandex Maps skriti yuklandi');
        this.isLoaded = true;
        this.isLoading = false;
        resolve();
      };

      script.onerror = () => {
        console.error('❌ Yandex Maps skriptini yuklashda xato');
        this.isLoading = false;
        reject(new Error('Yandex Maps skriptini yuklashda xato'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  isYmapsReady(): boolean {
    return this.isLoaded && !!window.ymaps;
  }
}

export const yandexMapsService = YandexMapsService.getInstance();
