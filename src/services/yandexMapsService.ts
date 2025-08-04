
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
      // Agar window.ymaps allaqachon mavjud bo'lsa
      if (window.ymaps && window.ymaps.ready) {
        console.log('✅ Yandex Maps allaqachon mavjud');
        window.ymaps.ready(() => {
          console.log('✅ ymaps.ready() bajarildi');
          resolve();
        });
        return;
      }

      // Mavjud skriptlarni tekshirish
      const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
      if (existingScript) {
        console.log('🔄 Mavjud Yandex Maps skripti topildi, yuklanishini kutmoqda...');
        
        // Mavjud skript allaqachon yuklangan bo'lishi mumkin
        if (window.ymaps && window.ymaps.ready) {
          window.ymaps.ready(() => resolve());
          return;
        }

        // Mavjud skript yuklanishini kutish
        const loadHandler = () => {
          if (window.ymaps && window.ymaps.ready) {
            window.ymaps.ready(() => resolve());
          } else {
            reject(new Error('Yandex Maps obyekti yuklangandan keyin topilmadi'));
          }
          existingScript.removeEventListener('load', loadHandler);
          existingScript.removeEventListener('error', errorHandler);
        };

        const errorHandler = () => {
          reject(new Error('Mavjud Yandex Maps skriptini yuklashda xato'));
          existingScript.removeEventListener('load', loadHandler);
          existingScript.removeEventListener('error', errorHandler);
        };

        existingScript.addEventListener('load', loadHandler);
        existingScript.addEventListener('error', errorHandler);
        return;
      }

      // API kalitini tekshirish
      const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
      
      if (!apiKey || apiKey === 'undefined' || apiKey.includes('your_') || apiKey.trim() === '') {
        reject(new Error('Yandex Maps API kaliti to\'g\'ri konfiguratsiya qilinmagan. .env faylida VITE_YANDEX_MAPS_API_KEY ni to\'ldiring.'));
        return;
      }

      console.log('🗺️ Yangi Yandex Maps skripti yuklanmoqda...');

      // Yangi skript yaratish
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=uz_UZ&load=package.full`;
      script.type = 'text/javascript';
      script.async = true;
      script.defer = true;

      const timeoutId = setTimeout(() => {
        script.remove();
        reject(new Error('Yandex Maps skriptini yuklash vaqti tugadi (15 sekund)'));
      }, 15000);

      script.onload = () => {
        clearTimeout(timeoutId);
        console.log('✅ Yandex Maps skripti muvaffaqiyatli yuklandi');
        
        if (window.ymaps && window.ymaps.ready) {
          window.ymaps.ready(() => {
            console.log('✅ ymaps.ready() muvaffaqiyatli bajarildi');
            resolve();
          });
        } else {
          reject(new Error('Yandex Maps skripti yuklandi, lekin window.ymaps obyekti mavjud emas'));
        }
      };

      script.onerror = (error) => {
        clearTimeout(timeoutId);
        script.remove();
        console.error('❌ Skript yuklash xatosi:', error);
        reject(new Error('Yandex Maps skriptini yuklashda tarmoq xatosi. API kalitini tekshiring.'));
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

    // API kalitini tekshirish
    const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey.includes('your_')) {
      throw new Error('API key noto\'g\'ri konfiguratsiya qilingan');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Geocoding timeout'));
      }, options.timeout || 10000);

      try {
        // Geocoding so'rovini bajarish
        const geocodePromise = window.ymaps.geocode(query, {
          ...options,
          timeout: options.timeout || 10000
        });

        // Promise mavjudligini tekshirish
        if (!geocodePromise || typeof geocodePromise.then !== 'function') {
          clearTimeout(timeout);
          reject(new Error('Geocoding xizmati mavjud emas'));
          return;
        }

        geocodePromise.then((result: any) => {
          clearTimeout(timeout);
          if (!result) {
            reject(new Error('Geocoding natijasi bo\'sh'));
            return;
          }
          resolve(result);
        }).catch((error: any) => {
          clearTimeout(timeout);
          console.error('Geocoding API xatosi:', error);
          
          // Xato turini aniqlash
          if (error && typeof error === 'object') {
            if (error.message === 'scriptError' || error.message?.includes('scriptError')) {
              reject(new Error('API kaliti noto\'g\'ri yoki internetga ulanish muammosi'));
            } else if (error.message?.includes('Invalid API key')) {
              reject(new Error('API kaliti noto\'g\'ri'));
            } else if (error.message?.includes('timeout')) {
              reject(new Error('So\'rov vaqti tugadi'));
            } else {
              reject(new Error(`Geocoding xatosi: ${error.message || 'Noma\'lum xato'}`));
            }
          } else {
            reject(new Error('Geocoding xatosi yuz berdi'));
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        console.error('Geocoding try-catch xatosi:', error);
        reject(new Error('Geocoding xizmati bilan aloqa o\'rnatilmadi'));
      }
    });
  }
}

export const yandexMapsService = YandexMapsService.getInstance();
export default yandexMapsService;
