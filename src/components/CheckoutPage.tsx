import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
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

// Global Yandex Maps tiplarini e'lon qilish
declare global {
  interface Window {
    ymaps: any;
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

  const [isLoadingMap, setIsLoadingMap] = useState(false);

  // Component yuklanganida
  useEffect(() => {
    initializeSimpleYandexMap();

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      if (mapInstanceRef.current) {
        try {
          if (mapInstanceRef.current.destroy) {
            mapInstanceRef.current.destroy();
          }
          mapInstanceRef.current = null;
        } catch (error) {
          console.warn('Xaritani tozalashda xato:', error);
        }
      }
    };
  }, []);

  // Cart bo'sh bo'lganda avtomatik bosh sahifaga qaytish
  useEffect(() => {
    if (cartProducts.length === 0 && !orderConfirmed) {
      const timer = setTimeout(() => {
        onBack();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [cartProducts.length, orderConfirmed, onBack]);

  // Agar cart bo'sh yoki mavjud bo'lmasa
  if (!cart || Object.keys(cart).length === 0) {
    return null;
  }

  // User info yangilash handler
  const handleUserInfoChange = (updates: Partial<typeof userInfo>) => {
    setUserInfo(prev => ({ ...prev, ...updates }));
  };

  // Yandex Maps-ni oddiy ko'rsatish uchun (hudud nomlari bilan)
  const initializeSimpleYandexMap = async () => {
    if (!mapRef.current) {
      console.warn('⚠️ Map container topilmadi');
      return;
    }

    try {
      console.log('🗺️ Oddiy Yandex Maps ishga tushirilmoqda...');
      setIsLoadingMap(true);
      setGeocodingError(null);

      // Yandex Maps skriptini yuklash (API kalitisiz)
      await loadSimpleYandexMaps();

      // Xaritani yaratish
      if (window.ymaps) {
        window.ymaps.ready(() => {
          if (!mapRef.current) return;

          mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
            center: [41.2995, 69.2401], // Toshkent markazi
            zoom: 12,
            controls: ['zoomControl', 'fullscreenControl']
          });

          // Xarita bosilganda hudud nomini olish
          mapInstanceRef.current.events.add('click', async (e: any) => {
            const coords = e.get('coords');
            await handleSimpleMapClick(coords);
          });

          console.log('✅ Oddiy Yandex Maps muvaffaqiyatli yaratildi');
          setIsMapInitialized(true);
          setIsYmapsLoaded(true);
          setGeocodingError(null);
        });
      }

    } catch (error) {
      console.error('❌ Yandex Maps ishga tushirishda xato:', error);
      setGeocodingError('Xaritani yuklashda xato yuz berdi: ' + error.message);
      setIsYmapsLoaded(false);
      setIsMapInitialized(false);
    } finally {
      setIsLoadingMap(false);
    }
  };

  // Oddiy Yandex Maps skriptini yuklash (API kalitisiz)
  const loadSimpleYandexMaps = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.ymaps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?lang=uz_UZ&load=package.full';
      script.async = true;

      script.onload = () => {
        console.log('✅ Yandex Maps skripti yuklandi');
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Yandex Maps skriptini yuklashda xato'));
      };

      document.head.appendChild(script);
    });
  };

  // Oddiy xarita (API kalitisiz)
  const initSimpleMap = async () => {
    try {
      if (mapRef.current && !mapInstanceRef.current) {
        // Oddiy div bilan xarita taqlidi
        mapRef.current.innerHTML = `
          <div style="width: 100%; height: 300px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; 
                      border-radius: 12px; text-align: center; padding: 20px;">
            <div>
              <div style="font-size: 24px; margin-bottom: 10px;">🗺️</div>
              <div>Xarita yuklanmoqda...</div>
              <div style="font-size: 12px; margin-top: 10px; opacity: 0.8;">
                ${geocodingError || 'Bir necha soniyadan keyin qaytadan urinib ko\'ring'}
              </div>
            </div>
          </div>
        `;
        setIsMapInitialized(true);
      }
    } catch (error) {
      console.error('❌ Oddiy xarita yaratishda xato:', error);
    }
  };

  // Xarita bosilganda hudud nomini olish (oddiy)
  const handleSimpleMapClick = async (coordinates: [number, number]) => {
    if (isLoadingGeocoding) return;

    setIsLoadingGeocoding(true);
    setGeocodingError(null);

    try {
      setSelectedCoordinates(coordinates);
      console.log('📍 Tanlangan koordinatalar:', coordinates);

      // Oddiy hudud nomini olish (API kalitisiz)
      if (window.ymaps && window.ymaps.geocode) {
        try {
          const result = await window.ymaps.geocode(coordinates, {
            kind: 'locality',
            results: 1
          });

          const firstGeoObject = result.geoObjects.get(0);
          if (firstGeoObject) {
            const regionName = firstGeoObject.getAddressLine();
            setUserInfo(prev => ({
              ...prev,
              address: regionName || 'Tanlangan hudud'
            }));

            // Xaritada belgi qo'yish
            if (placemarkRef.current) {
              mapInstanceRef.current.geoObjects.remove(placemarkRef.current);
            }

            placemarkRef.current = new window.ymaps.Placemark(coordinates, {
              hintContent: 'Tanlangan joylashuv',
              balloonContent: regionName || 'Tanlangan hudud'
            }, {
              preset: 'islands#redDotIcon'
            });

            mapInstanceRef.current.geoObjects.add(placemarkRef.current);
            console.log('✅ Hudud nomi topildi:', regionName);
          } else {
            setUserInfo(prev => ({
              ...prev,
              address: 'Tanlangan hudud'
            }));
          }
        } catch (geoError) {
          console.warn('⚠️ Hudud nomini olishda xato:', geoError);
          setUserInfo(prev => ({
            ...prev,
            address: 'Tanlangan hudud'
          }));
        }
      } else {
        setUserInfo(prev => ({
          ...prev,
          address: 'Tanlangan hudud'
        }));
      }

    } catch (error) {
      console.error('❌ Xaritada ishda xato:', error);
      setGeocodingError('Xarita bilan ishlashda xato');
    } finally {
      setIsLoadingGeocoding(false);
    }
  };

  // Manzil qidirish (oddiy, faqat matn kiritish)
  const searchAddress = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    // Oddiy tavsiyalar
    const commonAreas = [
      'Chilonzor tumani',
      'Yunusobod tumani', 
      'Mirobod tumani',
      'Shayxontoxur tumani',
      'Olmazor tumani',
      'Uchtepa tumani',
      'Yakkasaroy tumani',
      'Sergeli tumani',
      'Bektemir tumani',
      'Almazar tumani',
      'Yashnobod tumani'
    ];

    const filtered = commonAreas.filter(area => 
      area.toLowerCase().includes(query.toLowerCase())
    );

    setAddressSuggestions(filtered);
  };

  // Manzil tanlanganda
  const selectAddress = async (address: string) => {
    setDeliveryAddress(address);
    setUserInfo(prev => ({ ...prev, address }));
    setAddressSuggestions([]);

    console.log('✅ Manzil tanlandi:', address);
  };

  // Manzil input o'zgarganda
  const handleAddressChange = (value: string) => {
    setDeliveryAddress(value);
    setUserInfo(prev => ({ ...prev, address: value }));

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (isMapInitialized && isYmapsLoaded) {
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

  // Buyurtmani yuborish
  const handleSubmitOrder = async () => {
    if (!userInfo.name || !userInfo.phone || !deliveryAddress) {
      alert('Iltimos, barcha maydonlarni to\'ldiring');
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

    await processOrder();
  };

  // To'lov turini tanlash va buyurtmani davom ettirish
  const handlePaymentTypeSelect = async (paymentType: string) => {
    setUserInfo(prev => ({ ...prev, paymentType }));
    setShowPaymentModal(false);
    await processOrder(paymentType);
  };

  // Buyurtmani qayta ishlash
  const processOrder = async (paymentType?: string) => {
    const finalPaymentType = paymentType || userInfo.paymentType;

    try {
      console.log('📱 Customer telefon:', userInfo.phone);

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

      const operatorPhone = '+998 90 123 45 67';

      setOrderDetails({ 
        orderId: orderResult.orderUniqueId,
        operatorPhone 
      });
      setOrderConfirmed(true);

      Object.keys(cart).forEach(cakeId => {
        removeFromCart(cakeId);
      });

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