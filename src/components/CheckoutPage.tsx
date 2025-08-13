import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { leafletMapService } from '../services/leafletMapService';
import UserInfoForm from './checkout/UserInfoForm';
import AddressForm from './checkout/AddressForm';
import OrderSummary from './checkout/OrderSummary';
import PaymentModal from './checkout/PaymentModal';
import OrderConfirmationModal from './checkout/OrderConfirmationModal';

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

// Global Maps tiplarini e'lon qilish
declare global {
  interface Window {
    ymaps: any;
    L: any; // Leaflet
    setSelectedCoordinates: (coords: [number, number]) => void;
    setDeliveryAddress: (address: string) => void;
    setUserInfo: (updater: (prev: any) => any) => void;
  }
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ cart, cakes, onBack, onOrderComplete, removeFromCart }) => {
  const { userData } = useAuth();
  const [userInfo, setUserInfo] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'cash',
    paymentType: '',
    deliveryTime: 'asap',
    customDeliveryDate: '',
    customDeliveryTime: ''
  });

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number] | null>(null);
  const [isLoadingGeocoding, setIsLoadingGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState<{
    orderId: string;
    operatorPhone: string;
  } | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  // Modal state'larini debug qilish
  useEffect(() => {
    console.log('🔄 CheckoutPage - orderConfirmed o\'zgardi:', orderConfirmed);
    console.log('🔄 CheckoutPage - orderDetails o\'zgardi:', orderDetails);
  }, [orderConfirmed, orderDetails]);

  // Mahsulotlar ro'yxatini yaratish
  const cartProducts = cart ? Object.entries(cart).map(([productId, quantity]) => {
    const product = cakes.find(p => p.id === productId);
    return product ? { ...product, quantity } : null;
  }).filter(Boolean) : [];

  const cartSubtotal = cartProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);

  // Yetkazib berish to'lovlari
  const getDeliveryFee = (deliveryTime: string) => {
    switch (deliveryTime) {
      case 'asap': return 15000;
      case 'custom': return 0;
      default: return 0;
    }
  };

  const deliveryFee = getDeliveryFee(userInfo.deliveryTime);
  const totalPrice = cartSubtotal + deliveryFee;

  // Global funksiyalarni o'rnatish (Leaflet uchun)
  useEffect(() => {
    window.setSelectedCoordinates = setSelectedCoordinates;
    window.setDeliveryAddress = setDeliveryAddress;
    window.setUserInfo = setUserInfo;

    return () => {
      delete window.setSelectedCoordinates;
      delete window.setDeliveryAddress;
      delete window.setUserInfo;
    };
  }, []);

  // Bepul manzil qidirish (Nominatim API)
  const searchAddressFree = async (query: string): Promise<string[]> => {
    try {
      console.log('🔍 Bepul Nominatim API orqali qidirish:', query);

      const searchQuery = `${query}, Tashkent, Uzbekistan`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=uz&accept-language=uz,en`
      );

      if (!response.ok) {
        throw new Error('Nominatim API xatosi');
      }

      const data = await response.json();
      console.log('📊 Nominatim qidiruv natijasi:', data);

      if (Array.isArray(data) && data.length > 0) {
        const suggestions = data
          .filter(item => item.display_name && item.display_name.includes('Tashkent'))
          .map(item => item.display_name)
          .slice(0, 5);

        console.log('✅ Bepul qidiruvdan topilgan manzillar:', suggestions);
        return suggestions;
      }

      return [];

    } catch (error) {
      console.error('❌ Bepul manzil qidirishda xato:', error);
      return [];
    }
  };

  // Cleanup function - xavfsiz DOM tozalash
  const cleanup = useCallback(() => {
    // Markerni xavfsiz o'chirish
    if (markerRef.current && mapInstanceRef.current) {
      try {
        mapInstanceRef.current.removeLayer(markerRef.current);
      } catch (error) {
        console.warn('Marker o\'chirishda xato:', error);
      }
      markerRef.current = null;
    }

    // Xaritani xavfsiz tozalash
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (error) {
        console.warn('Xaritani tozalashda xato:', error);
      }
      mapInstanceRef.current = null;
    }

    // DOM elementini xavfsiz tozalash
    if (mapRef.current) {
      try {
        mapRef.current.innerHTML = '';
      } catch (error) {
        console.warn('DOM elementini tozalashda xato:', error);
      }
    }
  }, []);

  // Component yuklanganida
  useEffect(() => {
    let isMounted = true;
    let cleanupTriggered = false;

    const initMap = async () => {
      if (isMounted && !cleanupTriggered) {
        await initializeLeafletMap();
      }
    };

    // Xaritani 500ms kechikish bilan ishga tushirish
    const initTimer = setTimeout(() => {
      if (isMounted && !cleanupTriggered) {
        initMap();
      }
    }, 500);

    return () => {
      isMounted = false;
      cleanupTriggered = true;

      if (initTimer) {
        clearTimeout(initTimer);
      }

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }

      // Xavfsiz cleanup
      setTimeout(() => {
        cleanup();
      }, 100);
    };
  }, []); // Dependencies olib tashlandi

  // Cart bo'sh bo'lganda avtomatik bosh sahifaga qaytish
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (cartProducts.length === 0 && !orderConfirmed) {
      timer = setTimeout(() => {
        onBack();
      }, 500);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [cartProducts.length, orderConfirmed, onBack]);

  // Agar cart bo'sh yoki mavjud bo'lmasa
  if (!cart || Object.keys(cart).length === 0) {
    return null;
  }

  // User info yangilash handler
  const handleUserInfoChange = (updates: Partial<typeof userInfo>) => {
    setUserInfo(prev => ({ ...prev, ...updates }));
  };

  // Leaflet xaritasini ishga tushirish
  const initializeLeafletMap = async () => {
    try {
      console.log('🚀 Leaflet xaritasi ishga tushirilmoqda...');
      setGeocodingError(null);

      // Leaflet kutubxonasini yuklash
      await leafletMapService.loadLeaflet();
      setIsLeafletLoaded(true);
      console.log('✅ Leaflet API yuklandi');

      // Xaritani yaratish
      if (mapRef.current && !mapInstanceRef.current) {
        try {
          console.log('🗺️ Leaflet xaritasi yaratilmoqda...');

          // Eski xarita kontentini tozalash
          mapRef.current.innerHTML = '';

          mapInstanceRef.current = leafletMapService.createMap(mapRef.current.id || 'leaflet-map', {
            center: [41.311158, 69.240562], // Toshkent koordinatalari
            zoom: 12
          });

          console.log('✅ Leaflet xaritasi muvaffaqiyatli yaratildi');
          setIsMapInitialized(true);
          setGeocodingError(null);

          // Xarita click hodisasini qo'shish
          mapInstanceRef.current.on('click', handleLeafletMapClick);

        } catch (mapError) {
          console.error('❌ Leaflet xaritani yaratishda xato:', mapError);
          setGeocodingError('Xaritani yaratishda xato yuz berdi: ' + mapError.message);
          await initSimpleMap();
        }
      }

    } catch (error) {
      console.error('❌ Leaflet ishga tushirishda xato:', error);

      let errorMessage = 'Xaritani yuklashda xato yuz berdi';
      if (error && typeof error === 'object' && error.message) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Internet aloqasi muammosi. Qaytadan urinib ko\'ring.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Xarita yuklash vaqti tugadi. Qaytadan urinib ko\'ring.';
        } else {
          errorMessage = `Xato: ${error.message}`;
        }
      }

      setGeocodingError(errorMessage);
      setIsLeafletLoaded(false);
      setIsMapInitialized(false);

      // Fallback - oddiy xarita
      await initSimpleMap();
    }
  };

  // Oddiy xarita (API kalitisiz)
  const initSimpleMap = async () => {
    try {
      if (mapRef.current && !mapInstanceRef.current) {
        // Xavfsiz kontentni tozalash
        mapRef.current.innerHTML = '';

        // Yangi div yaratish
        const mapPlaceholder = document.createElement('div');
        mapPlaceholder.style.cssText = `
          width: 100%; 
          height: 300px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: white; 
          font-size: 16px; 
          border-radius: 12px; 
          text-align: center; 
          padding: 20px;
        `;

        mapPlaceholder.innerHTML = `
          <div>
            <div style="font-size: 24px; margin-bottom: 10px;">🗺️</div>
            <div>Xarita yuklanmoqda...</div>
            <div style="font-size: 12px; margin-top: 10px; opacity: 0.8;">
              ${geocodingError || 'Bir necha soniyadan keyin qaytadan urinib ko\'ring'}
            </div>
          </div>
        `;

        try {
          mapRef.current.appendChild(mapPlaceholder);
          setIsMapInitialized(true);
        } catch (appendError) {
          console.warn('Map placeholder qo\'shishda xato:', appendError);
        }
      }
    } catch (error) {
      console.error('❌ Oddiy xarita yaratishda xato:', error);
    }
  };

  // Leaflet xarita bosilganda
  const handleLeafletMapClick = async (e: any) => {
    try {
      const { lat, lng } = e.latlng;
      const coords = [lat, lng];
      console.log('📍 Leaflet xaritada bosilgan koordinata:', coords);

      setSelectedCoordinates([lat, lng]);

      // Eski markerni o'chirish
      if (markerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }

      // Yangi marker qo'shish
      if (mapInstanceRef.current && window.L) {
        markerRef.current = window.L.marker([lat, lng])
          .addTo(mapInstanceRef.current)
          .bindPopup('Yetkazib berish manzili')
          .openPopup();
      }

      await reverseGeocodeLeaflet([lat, lng]);

    } catch (error) {
      console.error('❌ Leaflet xarita click xatosi:', error);
    }
  };

  // Leaflet reverse geocoding
  const reverseGeocodeLeaflet = async (coords: [number, number]) => {
    try {
      setIsLoadingGeocoding(true);
      setGeocodingError(null);

      console.log('🔄 Leaflet reverse geocoding boshlanmoqda:', coords);

      // Koordinatalarni tekshirish
      if (!coords || coords.length !== 2 || !coords[0] || !coords[1]) {
        throw new Error('Noto\'g\'ri koordinatalar');
      }

      console.log('📍 Reverse geocoding uchun koordinatalar:', coords);

      // Leaflet servisi orqali reverse geocoding
      const address = await leafletMapService.reverseGeocode(coords[0], coords[1]);

      console.log('✅ Manzil topildi:', address);

      if (address && address.trim()) {
        setDeliveryAddress(address);
        setUserInfo(prev => ({ ...prev, address }));
        setGeocodingError(null);
        return;
      }

      console.warn('⚠️ Ushbu koordinata uchun aniq manzil topilmadi');
      const fallbackAddress = `Koordinata: ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
      setDeliveryAddress(fallbackAddress);
      setUserInfo(prev => ({ ...prev, address: fallbackAddress }));
      setGeocodingError('Aniq manzil topilmadi, koordinata sifatida saqlandi');

    } catch (error) {
      console.error('❌ Leaflet reverse geocoding xatosi:', error);

      let errorMessage = 'Manzilni aniqlashda xato yuz berdi';

      if (error && typeof error === 'object') {
        if (error.message === 'Reverse geocoding xatosi') {
          errorMessage = '🌐 Nominatim xizmati vaqtincha mavjud emas. Qaytadan urinib ko\'ring.';
        } else if (error.message?.includes('timeout')) {
          errorMessage = '⏱️ Xizmat vaqti tugadi. Internetni tekshiring va qaytadan urinib ko\'ring.';
        } else if (error.message === 'Noto\'g\'ri koordinatalar') {
          errorMessage = '📍 Tanlangan koordinatalar noto\'g\'ri';
        } else if (error.message) {
          errorMessage = `Xato: ${error.message}`;
        }
      }

      setGeocodingError(errorMessage);

      // Koordinatani fallback sifatida saqlash
      if (coords && coords.length === 2) {
        const fallbackAddress = `Koordinata: ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
        setDeliveryAddress(fallbackAddress);
        setUserInfo(prev => ({ ...prev, address: fallbackAddress }));
      }

    } finally {
      setIsLoadingGeocoding(false);
    }
  };

  // Manzil qidirish (faqat bepul Nominatim API)
  const searchAddress = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      console.log('🔍 Manzil qidirilmoqda:', query);

      // Leaflet servisi orqali bepul Nominatim API dan foydalanish
      const results = await leafletMapService.searchAddress(query);

      if (results.length > 0) {
        const suggestions = results
          .filter(item => item.display_name && item.display_name.includes('Tashkent'))
          .map(item => item.display_name)
          .slice(0, 5);

        console.log('✅ Topilgan manzillar:', suggestions);
        setAddressSuggestions(suggestions);
      } else {
        console.log('⚠️ Hech qanday manzil topilmadi');
        setAddressSuggestions([]);
      }

    } catch (error) {
      console.error('❌ Manzil qidirishda xato:', error);
      setAddressSuggestions([]);

      if (error && typeof error === 'object') {
        if (error.message?.includes('timeout')) {
          setGeocodingError('Qidiruv vaqti tugadi. Qaytadan urinib ko\'ring');
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          setGeocodingError('Internet aloqasi muammosi. Qaytadan urinib ko\'ring');
        }
      }
    }
  };

  // Manzil tanlanganda
  const selectAddress = async (address: string) => {
    setDeliveryAddress(address);
    setUserInfo(prev => ({ ...prev, address }));
    setAddressSuggestions([]);

    try {
      console.log('📍 Tanlangan manzil uchun koordinata qidirilmoqda:', address);

      // Leaflet servisi orqali koordinata qidirish
      const results = await leafletMapService.searchAddress(address);

      if (results.length > 0) {
        const firstResult = results[0];
        const lat = parseFloat(firstResult.lat);
        const lon = parseFloat(firstResult.lon);
        const coords = [lat, lon];

        console.log('✅ Koordinata topildi:', coords);

        setSelectedCoordinates([lat, lon]);

        if (mapInstanceRef.current && window.L) {
          // Xaritani koordinataga yo'naltirish
          mapInstanceRef.current.setView([lat, lon], 16);

          // Eski markerni o'chirish
          if (markerRef.current) {
            mapInstanceRef.current.removeLayer(markerRef.current);
          }

          // Yangi marker qo'shish
          markerRef.current = window.L.marker([lat, lon])
            .addTo(mapInstanceRef.current)
            .bindPopup(address)
            .openPopup();
        }
      }

    } catch (error) {
      console.error('❌ Manzil uchun koordinata topishda xato:', error);
      setGeocodingError('Manzil uchun koordinata topishda xato yuz berdi');
    }
  };

  // Manzil input o'zgarganda
  const handleAddressChange = (value: string) => {
    setDeliveryAddress(value);
    setUserInfo(prev => ({ ...prev, address: value }));

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (mapInstanceRef.current && isMapInitialized && isLeafletLoaded) {
        searchAddress(value);
      }
    }, 500);
  };

  // Mahsulotni butunlay o'chirish
  const removeProductCompletely = (cakeId: string) => {
    removeFromCart(cakeId);

    const event = new CustomEvent('removeFromCartCompletely', {
      detail: { cakeId }
    });
    window.dispatchEvent(event);
  };

  // Formani validatsiya qilish
  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Asosiy maydonlarni tekshirish
    if (!userInfo.name || !userInfo.name.trim()) {
      errors.push('Ism va familiya');
    }

    if (!userInfo.phone || !userInfo.phone.trim()) {
      errors.push('Telefon raqami');
    }

    // To'lov usulini tekshirish
    if (!userInfo.paymentMethod) {
      errors.push('To\'lov usuli');
    }

    // Reverse geocoding xatosi bo'lsa, manzil majburiy emas
    const isReverseGeocodingError = geocodingError && geocodingError.includes('Reverse geocoding xatosi');
    const hasValidAddress = deliveryAddress && deliveryAddress.trim();
    const hasValidCoordinates = selectedCoordinates && selectedCoordinates.length === 2;

    if (!isReverseGeocodingError && !hasValidAddress && !hasValidCoordinates) {
      errors.push('Yetkazib berish manzili yoki xaritadan joy tanlash');
    }

    // Mahsulotlar mavjudligini tekshirish
    if (!cartProducts || cartProducts.length === 0) {
      errors.push('Savatda mahsulotlar');
    }

    if (errors.length > 0) {
      alert(`❌ Quyidagi maydonlarni to'ldiring:\n• ${errors.join('\n• ')}`);
      return false;
    }

    return true;
  };

  // Buyurtmani yuborish
  const handleSubmitOrder = async () => {
    if (isProcessingOrder) return;

    // Formani validatsiya qilish
    if (!validateForm()) {
      return;
    }

    if (userInfo.deliveryTime === 'custom' && (!userInfo.customDeliveryDate || !userInfo.customDeliveryTime)) {
      alert('Iltimos, yetkazib berish uchun kun va soatni tanlang');
      return;
    }

    if (userInfo.paymentMethod === 'card') {
      setShowPaymentModal(true);
      return;
    }

    setIsProcessingOrder(true);
    try {
      await processOrder();
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // To'lov turini tanlash va buyurtmani davom ettirish
  const handlePaymentTypeSelect = async (paymentType: string) => {
    setUserInfo(prev => ({ ...prev, paymentType }));
    setShowPaymentModal(false);
    setIsProcessingOrder(true);
    try {
      await processOrder(paymentType);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Buyurtmani qayta ishlash
  const processOrder = async (paymentType?: string) => {
    const finalPaymentType = paymentType || userInfo.paymentType;

    try {
      console.log('🚀 ProcessOrder boshlandi');
      console.log('📱 Customer telefon:', userInfo.phone);
      console.log('🛒 Cart mahsulotlari:', cartProducts);
      console.log('💰 Total Price:', totalPrice);

      // Buyurtma ma'lumotlarini tekshirish
      if (cartProducts.length === 0) {
        console.error('❌ Savatda mahsulotlar yo\'q');
        alert('Buyurtmada mahsulotlar mavjud emas');
        return;
      }

      if (!userInfo.name.trim() || !userInfo.phone.trim() || !deliveryAddress.trim()) {
        console.error('❌ Majburiy maydonlar to\'ldirilmagan');
        alert('Iltimos, barcha majburiy maydonlarni to\'ldiring');
        return;
      }

      const orderData: any = {
        customerId: userData?.id || userInfo.phone.trim(),
        customerName: userInfo.name.trim(),
        customerPhone: userInfo.phone.trim(),
        cakeId: cartProducts[0]?.id || '',
        cakeName: cartProducts.map(p => p.name).join(', '),
        quantity: cartProducts.reduce((sum, p) => sum + p.quantity, 0),
        totalPrice: totalPrice,
        status: 'pending',
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod: userInfo.paymentMethod,
        paymentType: finalPaymentType,
        deliveryFee: deliveryFee,
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

      if (selectedCoordinates && selectedCoordinates.length >= 2) {
        orderData.coordinates = { 
          lat: selectedCoordinates[0], 
          lng: selectedCoordinates[1] 
        };
      }

      console.log('🛒 Buyurtma Firebase ga yuborilmoqda:', orderData);

      const { dataService } = await import('../services/dataService');
      const orderResult = await dataService.createOrder(orderData);

      console.log('✅ Buyurtma yaratildi, Firebase ID:', orderResult.docId);
      console.log('🆔 Buyurtma raqami:', orderResult.orderUniqueId);

      // Buyurtma muvaffaqiyatli yaratilganini tekshirish
      if (!orderResult || !orderResult.orderUniqueId) {
        throw new Error('Buyurtma yaratishda xato: orderUniqueId yo\'q');
      }

      const operatorPhone = '+998 90 123 45 67';

      // Buyurtma ma'lumotlarini o'rnatish
      const newOrderDetails = { 
        orderId: orderResult.orderUniqueId,
        operatorPhone 
      };

      console.log('📋 OrderDetails o\'rnatilmoqda:', newOrderDetails);
      setOrderDetails(newOrderDetails);

      // Buyurtma tasdiqlash oynasini ko'rsatish
      console.log('🎯 setOrderConfirmed(true) chaqirilmoqda...');
      setOrderConfirmed(true);
      
      // Kichik kechikish bilan qayta tekshirish
      setTimeout(() => {
        console.log('🔍 OrderConfirmed holati:', orderConfirmed);
        console.log('🔍 OrderDetails holati:', orderDetails);
      }, 100);

      console.log('✅ Buyurtma tasdiqlash oynasi ochish buyrug\'i yuborildi');

      // Savatni tozalash
      Object.keys(cart).forEach(cakeId => {
        removeFromCart(cakeId);
      });

      console.log('🗑️ Savat tozalandi');

      try {
        const { notificationService } = await import('../services/notificationService');
        await notificationService.createNotification({
          userId: 'operator-1',
          type: 'order',
          title: 'Yangi buyurtma!',
          message: `${userInfo.name} tomonidan yangi buyurtma: ${cartProducts.map(p => p.name).join(', ')}`,
          data: { 
            orderId: orderResult.docId, 
            orderUniqueId: orderResult.orderUniqueId,
            customerName: userInfo.name,
            customerPhone: userInfo.phone,
            totalPrice 
          },
          read: false,
          priority: 'high',
          actionUrl: `/operator/orders/${orderResult.docId}`
        });
        console.log('📢 Operator bildirishnomasi yuborildi');
      } catch (notifError) {
        console.warn('⚠️ Operator bildirishnomasi yuborishda xato:', notifError);
      }

    } catch (error) {
      console.error('❌ Buyurtma yuborishda xato:', error);
      
      // Xato ma'lumotlarini batafsil ko'rsatish
      if (error && typeof error === 'object') {
        console.error('❌ Xato tafsilotlari:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      
      alert('Buyurtma yuborishda xato yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
      
      // Test uchun - xato bo'lganda ham modal ko'rsatish
      console.log('🧪 Test uchun - xato bo\'lganda ham modal ochish');
      setOrderDetails({ 
        orderId: 'TEST-' + Date.now(),
        operatorPhone: '+998 90 123 45 67'
      });
      setOrderConfirmed(true);
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
          <UserInfoForm
            userInfo={userInfo}
            onUserInfoChange={handleUserInfoChange}
            deliveryFee={deliveryFee}
          />

          {/* Yetkazib berish manzili */}
          <AddressForm
            deliveryAddress={deliveryAddress}
            onAddressChange={handleAddressChange}
            addressSuggestions={addressSuggestions}
            onSelectAddress={selectAddress}
            isLoadingGeocoding={isLoadingGeocoding}
            geocodingError={geocodingError}
            selectedCoordinates={selectedCoordinates}
            isMapInitialized={isMapInitialized}
            mapRef={mapRef}
          />
        </div>

        {/* Buyurtma xulasasi */}
        <OrderSummary
          cartProducts={cartProducts}
          cartSubtotal={cartSubtotal}
          deliveryFee={deliveryFee}
          totalPrice={totalPrice}
          onRemoveProduct={removeProductCompletely}
          onSubmitOrder={handleSubmitOrder}
        />
      </div>

      {/* To'lov tanlash modali */}
      <PaymentModal
        isVisible={showPaymentModal}
        totalPrice={totalPrice}
        onPaymentTypeSelect={handlePaymentTypeSelect}
        onClose={() => setShowPaymentModal(false)}
      />

      {/* Buyurtma tasdiqlash modali */}
      <OrderConfirmationModal
        isVisible={orderConfirmed}
        orderDetails={orderDetails}
        totalPrice={totalPrice}
        userInfo={userInfo}
        onClose={() => {
          setOrderConfirmed(false);
          setOrderDetails(null);
        }}
        onBackToHome={() => {
          setOrderConfirmed(false);
          setOrderDetails(null);
          onOrderComplete();
        }}
      />
    </div>
  );
};

export default CheckoutPage;