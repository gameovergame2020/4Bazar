
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MapPin, Phone, User, CreditCard, Truck } from 'lucide-react';

interface CheckoutPageProps {
  cart: { [key: string]: number };
  cakes: any[];
  onBack: () => void;
  onOrderComplete: () => void;
  removeFromCart: (cakeId: string) => void;
}

// Global Yandex Maps tiplarini e'lon qilish
declare global {
  interface Window {
    ymaps: any;
  }
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ cart, cakes, onBack, onOrderComplete, removeFromCart }) => {
  const [userInfo, setUserInfo] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'cash',
    paymentType: '', // Click, Payme, Visa/Mastercard uchun
    deliveryTime: 'asap', // Bitta tanlov
    customDeliveryDate: '',
    customDeliveryTime: ''
  });

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number] | null>(null);
  const [isLoadingGeocoding, setIsLoadingGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [isYmapsLoaded, setIsYmapsLoaded] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderDetails, setOrderDetails] = useState<{
    orderId: string;
    operatorPhone: string;
  } | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mahsulotlar ro'yxatini yaratish (hook emas, oddiy hisoblanish)
  const cartProducts = cart ? Object.entries(cart).map(([productId, quantity]) => {
    const product = cakes.find(p => p.id === productId);
    return product ? { ...product, quantity } : null;
  }).filter(Boolean) : [];

  const cartSubtotal = cartProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  
  // Yetkazib berish to'lovlari
  const getDeliveryFee = (deliveryTime: string) => {
    switch (deliveryTime) {
      case 'asap': return 15000; // Tez yetkazish uchun qo'shimcha to'lov
      case 'custom': return 0; // O'zi muddatini tanlash bepul
      default: return 0; // Bugun va ertaga yetkazish bepul
    }
  };
  
  const deliveryFee = getDeliveryFee(userInfo.deliveryTime);
  const totalPrice = cartSubtotal + deliveryFee;

  // Component yuklanganida - bu hook
  useEffect(() => {
    initializeYandexMap();

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Component unmount bo'lganda xaritani tozalash
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        } catch (error) {
          console.warn('Xaritani tozalashda xato:', error);
        }
      }
    };
  }, []);

  // Buyurtma tasdiqlanganda avtomatik qaytish
  useEffect(() => {
    if (orderConfirmed) {
      const timer = setTimeout(() => {
        setOrderConfirmed(false);
        setOrderDetails(null);
        onOrderComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [orderConfirmed, onOrderComplete]);

  // Cart bo'sh bo'lganda avtomatik bosh sahifaga qaytish
  useEffect(() => {
    if (cartProducts.length === 0 && !orderConfirmed) {
      const timer = setTimeout(() => {
        onBack();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [cartProducts.length, orderConfirmed, onBack]);

  // Agar cart bo'sh yoki mavjud bo'lmasa - avtomatik qaytish useEffect orqali bajariladi
  if (!cart || Object.keys(cart).length === 0) {
    return null; // Hech narsa ko'rsatmaslik, useEffect avtomatik qaytaradi
  }

  // Yandex Maps skriptini yuklash
  const loadYandexMaps = () => {
    return new Promise<void>((resolve, reject) => {
      // Agar allaqachon yuklangan bo'lsa
      if (window.ymaps && isYmapsLoaded) {
        resolve();
        return;
      }

      // Eski skriptlarni olib tashlash
      const existingScripts = document.querySelectorAll('script[src*="api-maps.yandex.ru"]');
      existingScripts.forEach(script => script.remove());

      // Window.ymaps ni tozalash
      if (window.ymaps) {
        delete window.ymaps;
      }

      const script = document.createElement('script');
      const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;

      console.log('🗺️ Yandex Maps yuklanmoqda, API kalit:', apiKey);

      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=uz_UZ&load=package.full`;
      script.type = 'text/javascript';
      script.async = true;

      script.onload = () => {
        console.log('✅ Yandex Maps skriti yuklandi');
        setIsYmapsLoaded(true);
        resolve();
      };

      script.onerror = (error) => {
        console.error('❌ Yandex Maps skriptini yuklashda xato:', error);
        setGeocodingError('Yandex Maps skriptini yuklashda xato');
        reject(new Error('Yandex Maps skriptini yuklashda xato'));
      };

      document.head.appendChild(script);
    });
  };

  // Yandex Maps ni ishga tushirish
  const initializeYandexMap = async () => {
    try {
      console.log('🚀 Yandex Maps ishga tushirilmoqda...');

      if (!isYmapsLoaded) {
        await loadYandexMaps();
      }

      // ymaps ready bo'lishini kutish
      await new Promise<void>((resolve, reject) => {
        if (!window.ymaps) {
          reject(new Error('ymaps object not found'));
          return;
        }

        window.ymaps.ready(() => {
          console.log('✅ Yandex Maps tayyor');
          resolve();
        });
      });

      // Xaritani yaratish
      if (mapRef.current && !mapInstanceRef.current) {
        try {
          mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
            center: [41.311158, 69.240562], // Toshkent markazi (lat, lon)
            zoom: 12,
            controls: ['zoomControl', 'fullscreenControl', 'geolocationControl']
          });

          console.log('🗺️ Xarita yaratildi');
          setIsMapInitialized(true);
          setGeocodingError(null);

          // Xarita bosilganda koordinatalarni olish
          mapInstanceRef.current.events.add('click', handleMapClick);

        } catch (mapError) {
          console.error('❌ Xarita yaratishda xato:', mapError);
          setGeocodingError('Xaritani yaratishda xato yuz berdi');
        }
      }

    } catch (error) {
      console.error('❌ Yandex Maps ishga tushirishda xato:', error);
      setGeocodingError('Xaritani yuklashda xato yuz berdi. API kalitini tekshiring.');
    }
  };

  // Xarita bosilganda
  const handleMapClick = async (e: any) => {
    try {
      const coords = e.get('coords');
      console.log('📍 Xaritada bosilgan koordinata:', coords);

      setSelectedCoordinates([coords[1], coords[0]]); // [lat, lon] formatida saqlash

      // Eski belgilarni olib tashlash
      if (placemarkRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.geoObjects.remove(placemarkRef.current);
      }

      // Yangi belgini qo'shish
      if (mapInstanceRef.current) {
        placemarkRef.current = new window.ymaps.Placemark(coords, {
          hintContent: 'Tanlangan manzil',
          balloonContent: 'Yetkazib berish manzili'
        }, {
          preset: 'islands#redDotIcon'
        });

        mapInstanceRef.current.geoObjects.add(placemarkRef.current);
      }

      // Koordinatani manzilga aylantirish
      await reverseGeocode(coords);

    } catch (error) {
      console.error('❌ Xarita click xatosi:', error);
    }
  };

  // Koordinatani manzilga aylantirish (Reverse Geocoding)
  const reverseGeocode = async (coords: [number, number]) => {
    try {
      setIsLoadingGeocoding(true);
      setGeocodingError(null);

      console.log('🔄 Reverse geocoding boshlanmoqda:', coords);

      if (!window.ymaps || !window.ymaps.geocode) {
        throw new Error('ymaps.geocode mavjud emas');
      }

      const result = await window.ymaps.geocode(coords, {
        kind: 'house',
        results: 1,
        lang: 'uz_UZ'
      });

      console.log('🔍 Geocoding natijasi:', result);

      const firstGeoObject = result.geoObjects.get(0);
      if (firstGeoObject) {
        const address = firstGeoObject.getAddressLine();
        console.log('✅ Manzil topildi:', address);

        if (address && address.trim()) {
          setDeliveryAddress(address);
          setUserInfo(prev => ({ ...prev, address }));
          setGeocodingError(null);
        } else {
          setGeocodingError('Ushbu joyning aniq manzilini aniqlab bo\'lmadi');
        }
      } else {
        console.warn('⚠️ Ushbu koordinata uchun manzil topilmadi');
        setGeocodingError('Ushbu joyning manzilini aniqlab bo\'lmadi');
      }

    } catch (error) {
      console.error('❌ Reverse geocoding xatosi:', error);
      setGeocodingError('Manzilni aniqlashda xato yuz berdi');
    } finally {
      setIsLoadingGeocoding(false);
    }
  };

  // Manzil qidirish (Forward Geocoding)
  const searchAddress = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      console.log('🔍 Manzil qidirilmoqda:', query);

      if (!window.ymaps || !window.ymaps.geocode) {
        console.warn('ymaps.geocode mavjud emas');
        return;
      }

      const result = await window.ymaps.geocode(`Uzbekistan, Tashkent, ${query}`, {
        kind: 'house',
        results: 5,
        lang: 'uz_UZ',
        boundedBy: [[40.0, 67.0], [42.0, 71.0]] // O'zbekiston chegaralari
      });

      const suggestions: string[] = [];

      // Iterator orqali natijalarni olish
      for (let i = 0; i < result.geoObjects.getLength(); i++) {
        const geoObject = result.geoObjects.get(i);
        const addressLine = geoObject.getAddressLine();
        if (addressLine && addressLine.trim()) {
          suggestions.push(addressLine);
        }
      }

      console.log('✅ Topilgan manzillar:', suggestions);
      setAddressSuggestions(suggestions);

    } catch (error) {
      console.error('❌ Manzil qidirishda xato:', error);
      setAddressSuggestions([]);
    }
  };

  // Manzil tanlanganda
  const selectAddress = async (address: string) => {
    setDeliveryAddress(address);
    setUserInfo(prev => ({ ...prev, address }));
    setAddressSuggestions([]);

    try {
      console.log('📍 Tanlangan manzil uchun koordinata qidirilmoqda:', address);

      if (!window.ymaps || !window.ymaps.geocode) {
        console.warn('ymaps.geocode mavjud emas');
        return;
      }

      const result = await window.ymaps.geocode(address, {
        kind: 'house',
        results: 1,
        lang: 'uz_UZ'
      });

      const firstGeoObject = result.geoObjects.get(0);
      if (firstGeoObject) {
        const coords = firstGeoObject.geometry.getCoordinates();
        console.log('✅ Koordinata topildi:', coords);

        setSelectedCoordinates([coords[0], coords[1]]);

        // Xaritani yangi koordinataga markazlashtirish
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(coords, 15);

          // Eski belgilarni olib tashlash
          if (placemarkRef.current) {
            mapInstanceRef.current.geoObjects.remove(placemarkRef.current);
          }

          // Yangi belgini qo'shish
          placemarkRef.current = new window.ymaps.Placemark(coords, {
            hintContent: 'Tanlangan manzil',
            balloonContent: address
          }, {
            preset: 'islands#redDotIcon'
          });

          mapInstanceRef.current.geoObjects.add(placemarkRef.current);
        }
      }

    } catch (error) {
      console.error('❌ Manzil uchun koordinata topishda xato:', error);
    }
  };

  // Manzil input o'zgarganda
  const handleAddressChange = (value: string) => {
    setDeliveryAddress(value);
    setUserInfo(prev => ({ ...prev, address: value }));

    // Debounce qidirish
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (isMapInitialized && isYmapsLoaded) {
        searchAddress(value);
      }
    }, 500);
  };

  // Mahsulotni butunlay o'chirish uchun alohida funksiya
  const removeProductCompletely = (cakeId: string) => {
    // HomePage dan kelgan removeFromCart funksiyasini chaqirish
    removeFromCart(cakeId);

    // Agar bu kifoya qilmasa, to'liq o'chirish
    const event = new CustomEvent('removeFromCartCompletely', {
      detail: { cakeId }
    });
    window.dispatchEvent(event);
  };

  // Buyurtmani yuborish
  const handleSubmitOrder = async () => {
    if (!userInfo.name || !userInfo.phone || !deliveryAddress) {
      alert('Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }

    // Custom vaqt tanlangan bo'lsa, kun va soat kiritilganligini tekshirish
    if (userInfo.deliveryTime === 'custom' && (!userInfo.customDeliveryDate || !userInfo.customDeliveryTime)) {
      alert('Iltimos, yetkazib berish uchun kun va soatni tanlang');
      return;
    }

    try {
      // Buyurtma ma'lumotlarini tayyorlash
      const orderData = {
        customerId: 'customer-' + Date.now(), // Real holatda foydalanuvchi ID si
        customerName: userInfo.name,
        customerPhone: userInfo.phone,
        cakeId: cartProducts[0]?.id || '', // Birinchi mahsulot ID si
        cakeName: cartProducts.map(p => p.name).join(', '), // Barcha mahsulotlar nomlari
        quantity: cartProducts.reduce((sum, p) => sum + p.quantity, 0), // Jami miqdor
        totalPrice: totalPrice,
        status: 'pending', // Operator tasdiqlashini kutmoqda
        deliveryAddress: deliveryAddress,
        coordinates: selectedCoordinates ? { 
          lat: selectedCoordinates[0], 
          lng: selectedCoordinates[1] 
        } : undefined,
        paymentMethod: userInfo.paymentMethod,
        paymentType: userInfo.paymentType,
        notes: `To'lov usuli: ${
          userInfo.paymentMethod === 'cash' ? 'Naqd pul' :
          userInfo.paymentMethod === 'card' ? 
            (userInfo.paymentType === 'click' ? 'Click' :
             userInfo.paymentType === 'payme' ? 'Payme' :
             userInfo.paymentType === 'visa' ? 'Visa/Mastercard' : 'Bank kartasi') :
          userInfo.paymentMethod
        }. Yetkazib berish: ${
          userInfo.deliveryTime === 'asap' ? 'Tez yetkazish (2-3 soat)' :
          userInfo.deliveryTime === 'today' ? 'Bugun yetkazish (09:00-22:00)' :
          userInfo.deliveryTime === 'tomorrow' ? 'Ertaga yetkazish (09:00-22:00)' :
          userInfo.deliveryTime === 'custom' ? `O'zi tanlagan vaqt: ${userInfo.customDeliveryDate ? new Date(userInfo.customDeliveryDate).toLocaleDateString('uz-UZ') : 'tanlanmagan'} soat ${userInfo.customDeliveryTime || 'tanlanmagan'}` : userInfo.deliveryTime
        }. Mahsulotlar: ${cartProducts.map(p => `${p.name} (${p.quantity} dona)`).join(', ')}`
      };

      console.log('🛒 Buyurtma Firebase ga yuborilmoqda:', orderData);

      // Firebase'ga buyurtma yaratish
      const { dataService } = await import('../services/dataService');
      const orderId = await dataService.createOrder(orderData);

      console.log('✅ Buyurtma yaratildi, ID:', orderId);

      // Operator telefon raqami
      const operatorPhone = '+998 90 123 45 67';

      // Buyurtma tasdiqlash modalini ko'rsatish
      setOrderDetails({ 
        orderId: `ORD-${orderId.slice(-8).toUpperCase()}`, 
        operatorPhone 
      });
      setOrderConfirmed(true);

      // Operator bildirishnomasi yuborish (optional)
      try {
        const { notificationService } = await import('../services/notificationService');
        await notificationService.createNotification({
          userId: 'operator-1', // Operator ID si
          type: 'order',
          title: 'Yangi buyurtma!',
          message: `${userInfo.name} tomonidan yangi buyurtma: ${cartProducts.map(p => p.name).join(', ')}`,
          data: { 
            orderId, 
            customerName: userInfo.name,
            customerPhone: userInfo.phone,
            totalPrice 
          },
          read: false,
          priority: 'high',
          actionUrl: `/operator/orders/${orderId}`
        });
        console.log('📢 Operator bildirishnomasi yuborildi');
      } catch (notifError) {
        console.warn('⚠️ Operator bildirishnomasi yuborishda xato:', notifError);
      }

    } catch (error) {
      console.error('❌ Buyurtma yuborishda xato:', error);
      alert('Buyurtma yuborishda xato yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-white shadow-sm border hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Buyurtmani rasmiylashtirish</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Foydalanuvchi ma'lumotlari */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Shaxsiy ma'lumotlar
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ism va familiya
                </label>
                <input
                  type="text"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ismingizni kiriting"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon raqam
                </label>
                <input
                  type="tel"
                  value={userInfo.phone}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="+998 90 123 45 67"
                />
              </div>
            </div>

            {/* To'lov usuli */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                To'lov usuli
              </h3>

              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={userInfo.paymentMethod === 'cash'}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="text-orange-500"
                  />
                  <span>💵 Naqd pul</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={userInfo.paymentMethod === 'card'}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="text-orange-500"
                  />
                  <span>💳 Bank kartasi</span>
                </label>
              </div>

              {/* Bank kartasi uchun Click va Payme tanlovi */}
              {userInfo.paymentMethod === 'card' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-3">💳 To'lov uchun:</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="cardType"
                        value="click"
                        checked={userInfo.paymentType === 'click'}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, paymentType: e.target.value }))}
                        className="text-blue-500"
                      />
                      <span>🔵 Click</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="cardType"
                        value="payme"
                        checked={userInfo.paymentType === 'payme'}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, paymentType: e.target.value }))}
                        className="text-blue-500"
                      />
                      <span>🟢 Payme</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Yetkazib berish muddati */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-500" />
                Yetkazib berish muddati
              </h3>

              <select
                value={userInfo.deliveryTime}
                onChange={(e) => setUserInfo(prev => ({ ...prev, deliveryTime: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
              >
                <option value="asap">⚡ Tez yetkazish (2-3 soat)</option>
                <option value="today">🌅 Bugun yetkazish (09:00-22:00)</option>
                <option value="tomorrow">📅 Ertaga yetkazish (09:00-22:00)</option>
                <option value="custom">⏰ O'zi muddatini tanlash</option>
              </select>

              {/* Qo'shimcha haq eslatmasi */}
              {userInfo.deliveryTime === 'asap' && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">⚡</span>
                    <p className="text-sm text-blue-700 font-medium">
                      Tez yetkazish uchun qo'shimcha 15,000 so'm to'lov olinadi
                    </p>
                  </div>
                </div>
              )}
              
              

              {/* Custom vaqt tanlash */}
              {userInfo.deliveryTime === 'custom' && (
                <div className="mt-4 space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-700 font-medium">
                    📅 Yetkazib berish kun va vaqtini tanlang:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kunni tanlang
                      </label>
                      <input
                        type="date"
                        value={userInfo.customDeliveryDate}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, customDeliveryDate: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vaqtni tanlang
                      </label>
                      <select
                        value={userInfo.customDeliveryTime}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, customDeliveryTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                      >
                        <option value="">Vaqt oralig'ini tanlang</option>
                        <option value="09:00-15:00">🌅 09:00-15:00 (Ertalab)</option>
                        <option value="15:00-22:00">🌆 15:00-22:00 (Kechqurun)</option>
                      </select>
                    </div>
                  </div>
                  
                  {userInfo.customDeliveryDate && userInfo.customDeliveryTime && (
                    <div className="bg-white p-3 rounded-lg border border-orange-300">
                      <p className="text-sm text-green-700">
                        ✅ Tanlangan vaqt: <span className="font-semibold">
                          {new Date(userInfo.customDeliveryDate).toLocaleDateString('uz-UZ', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })} soat {userInfo.customDeliveryTime}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Yetkazib berish manzili */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Yetkazib berish manzili
            </h2>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Manzilni kiriting yoki xaritadan tanlang"
                />

                {isLoadingGeocoding && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                  </div>
                )}

                {/* Manzil takliflari */}
                {addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => selectAddress(suggestion)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {geocodingError && (
                <p className="text-sm text-red-600">⚠️ {geocodingError}</p>
              )}

              {selectedCoordinates && !geocodingError && (
                <p className="text-sm text-green-600">
                  ✅ Manzil tanlandi: {selectedCoordinates[0].toFixed(6)}, {selectedCoordinates[1].toFixed(6)}
                </p>
              )}
            </div>

            {/* Xarita */}
            <div className="mt-4">
              <div 
                ref={mapRef}
                className="w-full h-64 rounded-lg border border-gray-200"
                style={{ minHeight: '256px' }}
              />
              {!isMapInitialized && (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border border-gray-200">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-600">Xarita yuklanmoqda...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buyurtma xulasasi */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mt-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Buyurtma xulasasi
          </h2>

          <div className="space-y-3">
            {cartProducts.map((product) => (
              <div key={product.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.quantity} dona</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">{(product.price * product.quantity).toLocaleString()} so'm</p>
                  <button
                    onClick={() => removeProductCompletely(product.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Mahsulotni o'chirish"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* Oraliq summa */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span>Mahsulotlar:</span>
              <span>{cartSubtotal.toLocaleString()} so'm</span>
            </div>

            {/* Yetkazib berish to'lovi */}
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Yetkazib berish:</span>
              <span>
                {deliveryFee > 0 ? `+${deliveryFee.toLocaleString()} so'm` : 'Bepul'}
              </span>
            </div>

            {/* Jami summa */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-xl font-bold">
              <span>Jami:</span>
              <span className="text-orange-600">{totalPrice.toLocaleString()} so'm</span>
            </div>
          </div>

          <button
            onClick={handleSubmitOrder}
            className="w-full mt-6 bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            Buyurtmani rasmiylashtirish
          </button>
        </div>
      </div>

      {/* Buyurtma tasdiqlash modali */}
      {orderConfirmed && orderDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center">
              {/* Success icon */}
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                🎉 Buyurtma muvaffaqiyatli yuborildi!
              </h3>

              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">📋 Buyurtma ID:</span>
                  <span className="font-mono font-bold text-orange-600">{orderDetails.orderId}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">📞 Operator telefoni:</span>
                  <span className="font-semibold text-blue-600">{orderDetails.operatorPhone}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">💰 Jami summa:</span>
                  <span className="font-bold text-green-600">{totalPrice.toLocaleString()} so'm</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">🚚 Yetkazib berish:</span>
                  <span className="font-medium text-blue-600">
                    {userInfo.deliveryTime === 'asap' ? 'Tez yetkazish (2-3 soat)' :
                     userInfo.deliveryTime === 'today' ? 'Bugun yetkazish (09:00-22:00)' :
                     userInfo.deliveryTime === 'tomorrow' ? 'Ertaga yetkazish (09:00-22:00)' :
                     userInfo.deliveryTime === 'custom' ? `O'zi tanlagan: ${userInfo.customDeliveryDate ? new Date(userInfo.customDeliveryDate).toLocaleDateString('uz-UZ') : 'Kun tanlanmagan'} soat ${userInfo.customDeliveryTime || 'tanlanmagan'}` :
                     userInfo.deliveryTime}
                  </span>
                </div>
              </div>

              <div className="text-sm text-gray-600 space-y-2 mb-6">
                <p>👥 Operator siz bilan tez orada bog'lanadi va buyurtmani tasdiqlaydi.</p>
                <p>⏰ Buyurtma holati haqida SMS orqali xabar beramiz.</p>
                <p>🚚 Yetkazib berish vaqti: 2-3 soat</p>
                <p className="text-orange-600 font-medium">⏱️ 3 soniyadan keyin avtomatik bosh sahifaga qaytamiz...</p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setOrderConfirmed(false);
                    setOrderDetails(null);
                    onOrderComplete();
                  }}
                  className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                >
                  Bosh sahifaga qaytish
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(orderDetails.orderId);
                    alert('Buyurtma ID nusxalandi!');
                  }}
                  className="w-full bg-gray-200 text-gray-700 py-2 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  📋 Buyurtma ID ni nusxalash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
