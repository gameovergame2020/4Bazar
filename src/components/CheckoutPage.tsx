import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MapPin, Phone, User, CreditCard, Truck } from 'lucide-react';

// CSS animatsiyalari uchun style tag qo'shish
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }

  .animate-slideUp {
    animation: slideUp 0.4s ease-out;
  }

  .animate-slideDown {
    animation: slideDown 0.3s ease-out;
  }
`;

// Style tag ni head ga qo'shish
if (typeof document !== 'undefined' && !document.getElementById('checkout-animations')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'checkout-animations';
  styleElement.textContent = animationStyles;
  document.head.appendChild(styleElement);
}

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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

  // Buyurtma tasdiqlanganda avtomatik qaytish (o'chirib qo'yildi)
  // useEffect(() => {
  //   if (orderConfirmed) {
  //     const timer = setTimeout(() => {
  //       setOrderConfirmed(false);
  //       setOrderDetails(null);
  //       onOrderComplete();
  //     }, 3000);

  //     return () => clearTimeout(timer);
  //   }
  // }, [orderConfirmed, onOrderComplete]);

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

    // Bank kartasi tanlangan bo'lsa, to'lov modalini ko'rsatish
    if (userInfo.paymentMethod === 'card') {
      setShowPaymentModal(true);
      return;
    }

    try {
      // Haqiqiy foydalanuvchi ID sini olish va yaratish
      let userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      
      // Agar ID mavjud bo'lmasa, telefon raqami asosida yaratish
      if (!userId) {
        // Telefon raqamini normalize qilish
        const normalizedPhone = userInfo.phone.replace(/\D/g, ''); // Faqat raqamlar
        userId = `customer_${normalizedPhone}_${Date.now()}`;
        
        // ID ni saqlash
        localStorage.setItem('userId', userId);
        sessionStorage.setItem('userId', userId);
        
        console.log('🆔 Yangi customer ID yaratildi:', userId);
      }

      console.log('🛒 Customer ID dan foydalanilmoqda:', userId);
      console.log('📱 Customer telefon:', userInfo.phone);

      const orderData = {
        customerId: userId.toString(), // String formatida saqlash
        customerName: userInfo.name.trim(),
        customerPhone: userInfo.phone.trim(),
        cakeId: cartProducts[0]?.id || '', // Birinchi mahsulot ID si
        cakeName: cartProducts.map(p => p.name).join(', '), // Barcha mahsulotlar nomlari
        quantity: cartProducts.reduce((sum, p) => sum + p.quantity, 0), // Jami miqdor
        totalPrice: totalPrice,
        status: 'pending', // Operator tasdiqlashini kutmoqda
        deliveryAddress: deliveryAddress.trim(),
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

  // To'lov turini tanlash va buyurtmani davom ettirish
  const handlePaymentTypeSelect = async (paymentType: string) => {
    setUserInfo(prev => ({ ...prev, paymentType }));
    setShowPaymentModal(false);

    // To'lov turi tanlanganidan keyin buyurtmani yuborish
    await processOrder(paymentType);
  };

  // Buyurtmani qayta ishlash (to'lov turi bilan)
  const processOrder = async (paymentType?: string) => {
    const finalPaymentType = paymentType || userInfo.paymentType;

    try {
      // Haqiqiy foydalanuvchi ID sini olish va yaratish
      let userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      
      // Agar ID mavjud bo'lmasa, telefon raqami asosida yaratish
      if (!userId) {
        // Telefon raqamini normalize qilish
        const normalizedPhone = userInfo.phone.replace(/\D/g, ''); // Faqat raqamlar
        userId = `customer_${normalizedPhone}_${Date.now()}`;
        
        // ID ni saqlash
        localStorage.setItem('userId', userId);
        sessionStorage.setItem('userId', userId);
        
        console.log('🆔 Yangi customer ID yaratildi (processOrder):', userId);
      }

      console.log('🛒 Customer ID dan foydalanilmoqda (processOrder):', userId);

      const orderData = {
        customerId: userId.toString(), // String formatida saqlash
        customerName: userInfo.name,
        customerPhone: userInfo.phone,
        cakeId: cartProducts[0]?.id || '',
        cakeName: cartProducts.map(p => p.name).join(', '),
        quantity: cartProducts.reduce((sum, p) => sum + p.quantity, 0),
        totalPrice: totalPrice,
        status: 'pending',
        deliveryAddress: deliveryAddress,
        coordinates: selectedCoordinates ? { 
          lat: selectedCoordinates[0], 
          lng: selectedCoordinates[1] 
        } : undefined,
        paymentMethod: userInfo.paymentMethod,
        paymentType: finalPaymentType,
        notes: `To'lov usuli: ${
          userInfo.paymentMethod === 'cash' ? 'Naqd pul' :
          userInfo.paymentMethod === 'card' ? 
            (finalPaymentType === 'click' ? 'Click' :
             finalPaymentType === 'payme' ? 'Payme' :
             finalPaymentType === 'visa' ? 'Visa/Mastercard' : 'Bank kartasi') :
          userInfo.paymentMethod
        }. Yetkazib berish: ${
          userInfo.deliveryTime === 'asap' ? 'Tez yetkazish (2-3 soat)' :
          userInfo.deliveryTime === 'today' ? 'Bugun yetkazish (09:00-22:00)' :
          userInfo.deliveryTime === 'tomorrow' ? 'Ertaga yetkazish (09:00-22:00)' :
          userInfo.deliveryTime === 'custom' ? `O'zi tanlagan vaqt: ${userInfo.customDeliveryDate ? new Date(userInfo.customDeliveryDate).toLocaleDateString('uz-UZ') : 'tanlanmagan'} soat ${userInfo.customDeliveryTime || 'tanlanmagan'}` : userInfo.deliveryTime
        }. Mahsulotlar: ${cartProducts.map(p => `${p.name} (${p.quantity} dona)`).join(', ')}`
      };

      console.log('🛒 Buyurtma Firebase ga yuborilmoqda:', orderData);

      const { dataService } = await import('../services/dataService');
      const orderId = await dataService.createOrder(orderData);

      console.log('✅ Buyurtma yaratildi, ID:', orderId);

      const operatorPhone = '+998 90 123 45 67';

      setOrderDetails({ 
        orderId: `ORD-${orderId.slice(-8).toUpperCase()}`, 
        operatorPhone 
      });
      setOrderConfirmed(true);

      try {
        const { notificationService } = await import('../services/notificationService');
        await notificationService.createNotification({
          userId: 'operator-1',
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

      {/* To'lov tanlash modali */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                💳 To'lov turini tanlang
              </h3>

              <p className="text-gray-600 mb-6">
                Bank kartasi orqali to'lov qilish uchun quyidagi variantlardan birini tanlang:
              </p>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handlePaymentTypeSelect('click')}
                  className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                >
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">🔵</span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Click</h4>
                    <p className="text-sm text-gray-600">Click orqali to'lov qilish</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePaymentTypeSelect('payme')}
                  className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-green-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200"
                >
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">🟢</span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Payme</h4>
                    <p className="text-sm text-gray-600">Payme orqali to'lov qilish</p>
                  </div>
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Jami to'lov:</span>
                  <span className="font-bold text-orange-600 text-lg">{totalPrice.toLocaleString()} so'm</span>
                </div>

                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    ℹ️ <strong>Muhim:</strong> Bank kartasi orqali to'lov qilingan buyurtmalar bekor qilinganda xizmat haqi ushlab qolinadi:
                  </p>
                  <ul className="text-xs text-blue-600 mt-1 ml-4 space-y-0.5">
                    <li>• Click: 2,000 so'm</li>
                    <li>• Payme: 1,500 so'm</li>
                    <li>• Visa/Mastercard: 3,000 so'm</li>
                  </ul>
                  <p className="text-xs text-blue-700 mt-1">
                    Qolgan mablag' 3-5 ish kuni ichida qaytariladi.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buyurtma tasdiqlash modali - yaxshilangan versiya */}
      {orderConfirmed && orderDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl transform animate-slideUp">
            <div className="text-center">
              {/* Animated Success Icon */}
              <div className="relative w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">🎉</span>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Buyurtma muvaffaqiyatli qabul qilindi!
              </h3>

              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                Sizning buyurtmangiz muvaffaqiyatli rasmiylashtirildi va operatorimizga yuborildi. 
                Tez orada siz bilan bog'lanishadi.
              </p>

              {/* Order Summary Card */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-5 mb-6 border border-orange-100">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 text-sm font-bold">#</span>
                      </div>
                      <span className="text-sm text-gray-600">Buyurtma raqami:</span>
                    </div>
                    <span className="font-mono font-bold text-orange-600 text-lg">{orderDetails.orderId}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm">💰</span>
                      </div>
                      <span className="text-sm text-gray-600">Jami summa:</span>
                    </div>
                    <span className="font-bold text-green-600 text-lg">{totalPrice.toLocaleString()} so'm</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm">🚚</span>
                      </div>
                      <span className="text-sm text-gray-600">Yetkazib berish:</span>
                    </div>
                    <span className="font-medium text-blue-600 text-sm">
                      {userInfo.deliveryTime === 'asap' ? 'Tez (2-3 soat)' :
                       userInfo.deliveryTime === 'today' ? 'Bugun (09:00-22:00)' :
                       userInfo.deliveryTime === 'tomorrow' ? 'Ertaga (09:00-22:00)' :
                       userInfo.deliveryTime === 'custom' ? `${userInfo.customDeliveryDate ? new Date(userInfo.customDeliveryDate).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }) : 'Kun tanlanmagan'} ${userInfo.customDeliveryTime || ''}` :
                       userInfo.deliveryTime}
                    </span>
                  </div>

                  {/* Payment Method */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 text-sm">💳</span>
                      </div>
                      <span className="text-sm text-gray-600">To'lov usuli:</span>
                    </div>
                    <span className="font-medium text-purple-600 text-sm">
                      {userInfo.paymentMethod === 'cash' ? '💵 Naqd pul' :
                       userInfo.paymentType === 'click' ? '🔵 Click' :
                       userInfo.paymentType === 'payme' ? '🟢 Payme' :
                       userInfo.paymentType === 'visa' ? '💳 Visa/MC' : 
                       '💳 Bank kartasi'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xs">📞</span>
                  </div>
                  <span className="text-sm font-medium text-blue-800">Operator bilan bog'lanish</span>
                </div>
                <a 
                  href={`tel:${orderDetails.operatorPhone}`}
                  className="font-bold text-blue-600 text-lg hover:text-blue-800 transition-colors"
                >
                  {orderDetails.operatorPhone}
                </a>
                <p className="text-xs text-blue-600 mt-1">Savollaringiz bo'lsa, qo'ng'iroq qiling</p>
              </div>

              {/* Status Timeline */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm">Keyingi qadamlar:</h4>
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Operator bog'lanadi</p>
                      <p className="text-xs text-gray-600">5-10 daqiqa ichida</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600 text-xs font-bold">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Buyurtma tasdiqlash</p>
                      <p className="text-xs text-gray-500">Ma'lumotlarni tekshirish</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600 text-xs font-bold">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tayyorlash boshlash</p>
                      <p className="text-xs text-gray-500">SMS xabar yuboramiz</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setOrderConfirmed(false);
                    setOrderDetails(null);
                    onOrderComplete();
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-2xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  🏠 Bosh sahifaga qaytish
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(orderDetails.orderId);
                      // Toast notification o'rniga yanada chiroyli alert
                      const notification = document.createElement('div');
                      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slideDown';
                      notification.textContent = '✅ ID nusxalandi!';
                      document.body.appendChild(notification);
                      setTimeout(() => {
                        notification.remove();
                      }, 2000);
                    }}
                    className="bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm"
                  >
                    📋 ID nusxalash
                  </button>

                  <a
                    href={`tel:${orderDetails.operatorPhone}`}
                    className="bg-blue-100 text-blue-700 py-3 px-4 rounded-xl font-medium hover:bg-blue-200 transition-colors text-sm text-center"
                  >
                    📞 Qo'ng'iroq
                  </a>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Buyurtma holatini Profile bo'limida kuzatib borishingiz mumkin. 
                  Muammolar bo'lsa, yuqoridagi raqamga qo'ng'iroq qiling.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;