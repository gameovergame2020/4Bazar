
class YandexMapsService {
  private static instance: YandexMapsService | null = null;
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;
  private retryCount = 0;
  private maxRetries = 3;

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
    this.loadPromise = this.loadWithRetry();
    return this.loadPromise;
  }

  private async loadWithRetry(): Promise<void> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await this.attemptLoad();
        this.isLoaded = true;
        this.isLoading = false;
        this.retryCount = 0;
        return;
      } catch (error) {
        console.warn(`❌ Yandex Maps yuklash urinishi ${attempt + 1} muvaffaqiyatsiz:`, error);
        
        if (attempt === this.maxRetries) {
          this.isLoading = false;
          throw new Error(`Yandex Maps ${this.maxRetries + 1} marta urinildi, lekin yuklanmadi`);
        }
        
        // Har bir urinish orasida kutish
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  private attemptLoad(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Agar allaqachon yuklangan bo'lsa
      if (window.ymaps && window.ymaps.ready) {
        window.ymaps.ready(() => {
          resolve();
        });
        return;
      }

      // Mavjud skriptlarni tekshirish
      const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
      if (existingScript) {
        // Mavjud skript yuklanishini kutish
        existingScript.addEventListener('load', () => {
          if (window.ymaps && window.ymaps.ready) {
            window.ymaps.ready(() => resolve());
          } else {
            reject(new Error('Yandex Maps obyekti topilmadi'));
          }
        });
        existingScript.addEventListener('error', () => {
          reject(new Error('Yandex Maps skriptini yuklashda xato'));
        });
        return;
      }

      // Yangi skript yaratish
      const script = document.createElement('script');
      const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
      
      if (!apiKey || apiKey === 'undefined' || apiKey.includes('your_')) {
        reject(new Error('Yandex Maps API kaliti to\'g\'ri konfiguratsiya qilinmagan'));
        return;
      }

      console.log('🗺️ Yandex Maps yuklanmoqda...');

      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=uz_UZ&load=package.full`;
      script.type = 'text/javascript';
      script.async = true;
      script.timeout = 15000; // 15 soniya timeout

      const timeoutId = setTimeout(() => {
        script.remove();
        reject(new Error('Yandex Maps skriptini yuklash vaqti tugadi'));
      }, 15000);

      script.onload = () => {
        clearTimeout(timeoutId);
        console.log('✅ Yandex Maps skriti yuklandi');
        
        if (window.ymaps && window.ymaps.ready) {
          window.ymaps.ready(() => {
            resolve();
          });
        } else {
          reject(new Error('Yandex Maps obyekti mavjud emas'));
        }
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        script.remove();
        reject(new Error('Yandex Maps skriptini yuklashda tarmoq xatosi'));
      };

      document.head.appendChild(script);
    });
  }

  isYmapsReady(): boolean {
    return this.isLoaded && !!window.ymaps && !!window.ymaps.ready;
  }

  // Geocoding uchun xavfsiz wrapper
  async safeGeocode(query: any, options: any = {}): Promise<any> {
    if (!this.isYmapsReady()) {
      throw new Error('Yandex Maps hali tayyor emas');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Geocoding timeout'));
      }, options.timeout || 10000);

      try {
        window.ymaps.geocode(query, {
          ...options,
          timeout: options.timeout || 10000
        }).then((result: any) => {
          clearTimeout(timeout);
          resolve(result);
        }).catch((error: any) => {
          clearTimeout(timeout);
          reject(error);
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }
}

export const yandexMapsService = YandexMapsService.getInstance();
