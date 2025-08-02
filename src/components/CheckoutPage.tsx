import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MapPin, Phone, User, CreditCard, Truck, Clock, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';

interface CheckoutPageProps {
  cart: {[key: string]: number};
  cakes: any[];
  onBack: () => void;
  onOrderComplete: () => void;
  removeFromCart: (cakeId: string) => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ cart, cakes, onBack, onOrderComplete, removeFromCart }) => {
  const { userData, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [formData, setFormData] = useState({
    customerName: userData?.name || '',
    customerPhone: userData?.phone || '',
    deliveryAddress: '',
    notes: '',
    paymentMethod: 'cash',
    deliveryTime: 'asap',
    coordinates: null,
  });

  const mapRef = useRef<HTMLDivElement>(null);

  // Savat bo'sh bo'lganda asosiy sahifaga qaytish
  React.useEffect(() => {
    if (Object.keys(cart).length === 0 && !orderPlaced) {
      onBack();
    }
  }, [cart, onBack, orderPlaced]);

  // Foydalanuvchi tizimga kirmagan bo'lsa login oynasini ko'rsatish
  React.useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
    } else {
      setShowLoginPrompt(false);
    }
  }, [isAuthenticated]);

  const cartItems = Object.entries(cart).map(([cakeId, quantity]) => {
    const cake = cakes.find(c => c.id === cakeId);
    if (!cake) return null;

    const price = cake.discount ? cake.price * (1 - cake.discount / 100) : cake.price;
    return {
      cake,
      quantity,
      price,
      total: price * quantity
    };
  }).filter(Boolean);

  const totalAmount = cartItems.reduce((sum, item) => sum + item!.total, 0);
  const deliveryFee = totalAmount > 100000 ? 0 : 15000; // Bepul yetkazib berish 100,000 so'mdan yuqori
  const finalTotal = totalAmount + deliveryFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerPhone || !formData.deliveryAddress) {
      alert('Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    // Mavjud mahsulot miqdorini tekshirish
    for (const item of cartItems) {
      if (item && item.cake.productType === 'ready' && item.cake.quantity !== undefined) {
        if (item.quantity > item.cake.quantity) {
          alert(`"${item.cake.name}" mahsulotidan faqat ${item.cake.quantity} ta mavjud. Savatingizda ${item.quantity} ta bor.`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      // Har bir tort uchun alohida buyurtma yaratamiz
      for (const item of cartItems) {
        if (item) {
          // Buyurtma yaratish
          const orderId = await dataService.createOrder({
            customerId: userData?.id?.toString() || 'guest',
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            cakeId: item.cake.id!,
            cakeName: item.cake.name,
            quantity: item.quantity,
            amount: item.quantity, // Amount qo'shildi
            totalPrice: item.total,
            status: 'pending',
            deliveryAddress: formData.deliveryAddress,
            notes: formData.notes
          });

          // Mahsulot quantity va amount'ini yangilash
          await dataService.processOrderQuantity(item.cake.id!, item.quantity);
        }
      }

      setOrderPlaced(true);
      setTimeout(() => {
        onOrderComplete();
      }, 2000);
    } catch (error) {
      console.error('Buyurtma berish xatoligi:', error);
      alert('Buyurtma berishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

    // Yandex Maps integratsiyasi
    useEffect(() => {
      const initializeYandexMap = async () => {
        if (typeof window === 'undefined' || !mapRef.current) return;
  
        const YMaps = await window.ymaps3.ready;
  
        const map = new YMaps.Map(mapRef.current, {
          location: {
            center: [69.240562, 41.290748], // Toshkent markazi
            zoom: 12
          }
        });
  
        // Placemark qo'shish
        const marker = new YMaps.Placemark({
          location: { value: [69.240562, 41.290748] },
        });
        map.addChild(marker);
  
        // Xarita bo'ylab harakatlanishni kuzatish
        map.on('move', (e) => {
          const center = map.center;
          marker.location.setValue(center);
          setFormData(prev => ({
            ...prev,
            coordinates: center,
          }));
  
          // Manzilni aniqlash
          ymaps3.geocode({
            plainText: center[0] + ',' + center[1],
            lang: 'uz_UZ',
            apikey: 'ваш API key', // API keyni almashtiring
          }).then(result => {
            if (result.geoObjects.length > 0) {
              const address = result.geoObjects[0].properties.get('name') + ', ' + result.geoObjects[0].properties.get('description');
              setFormData(prev => ({
                ...prev,
                deliveryAddress: address,
              }));
            } else {
              setFormData(prev => ({
                ...prev,
                deliveryAddress: 'Manzil topilmadi',
              }));
            }
          });
        });
      };
  
      if (typeof window !== 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://api.maps.yandex.ru/3.0/?apikey=ваш API key&lang=uz_UZ'; // API keyni almashtiring
        script.type = 'text/javascript';
        script.async = true;
        script.onload = initializeYandexMap;
        document.head.appendChild(script);
      }
  
      return () => {
        // Tozalash (agar kerak bo'lsa)
      };
    }, []);

  // Login talab qilish modali
  if (showLoginPrompt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Buyurtma berish uchun tizimga kiring</h2>
          <p className="text-gray-600 mb-6">
            Buyurtma berish uchun avval ro'yhatdan o'tishingiz yoki tizimga kirishingiz kerak
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                // Login sahifasiga o'tish logikasi
                window.location.href = '/login';
              }}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Tizimga kirish
            </button>
            <button
              onClick={onBack}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Orqaga qaytish
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Buyurtma muvaffaqiyatli qabul qilindi!</h2>
          <p className="text-gray-600 mb-4">
            Buyurtmangiz raqami: #{Date.now().toString().slice(-6)}
          </p>
          <p className="text-sm text-gray-500">
            Tez orada operatorlarimiz siz bilan bog'lanishadi
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-3"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Buyurtma berish</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Order Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6" id="checkout-form">
            {/* Contact Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User size={20} className="mr-2" />
                Aloqa ma'lumotlari
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To'liq ism *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ismingizni kiriting"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon raqam *
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="+998 90 123 45 67"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin size={20} className="mr-2" />
                Yetkazib berish ma'lumotlari
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yetkazib berish manzili *
                  </label>
                  <textarea
                    name="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="To'liq manzilni kiriting (ko'cha, uy raqami, kvartira)"
                    onClick={() => setShowLocationPicker(true)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yetkazib berish vaqti
                  </label>
                  <select
                    name="deliveryTime"
                    value={formData.deliveryTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="asap">Imkon qadar tez</option>
                    <option value="today">Bugun</option>
                    <option value="tomorrow">Ertaga</option>
                    <option value="custom">Boshqa vaqt</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard size={20} className="mr-2" />
                To'lov usuli
              </h3>
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <span className="text-gray-900">Naqd pul (yetkazib berishda)</span>
                </label>
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <span className="text-gray-900">Plastik karta (yetkazib berishda)</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Qo'shimcha eslatma
              </h3>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Maxsus talablar yoki eslatmalar (ixtiyoriy)"
              />
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyurtma xulosasi</h3>

            <div className="space-y-3 mb-4">
              {cartItems.map((item) => item && (
                <div key={item.cake.id} className="flex justify-between items-start group">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{item.cake.name}</h4>
                     <p className="text-xs text-gray-500 mb-2">
                  {item.cake.productType === 'baked' 
                    ? item.cake.available 
                      ? item.cake.quantity !== undefined 
                        ? `Qoldi: ${item.cake.quantity} ta`
                        : 'Miqdor: cheklanmagan'
                      : `Buyurtma qilingan: ${item.cake.amount || 0} ta` 
                    : item.cake.quantity !== undefined 
                      ? `Qoldi: ${item.cake.quantity} ta`
                      : 'Miqdor: cheklanmagan'
                  }</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} x {item.price.toLocaleString('uz-UZ')} so'm
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {item.total.toLocaleString('uz-UZ')} so'm
                    </span>
                    <button
                        onClick={() => removeFromCart(item.cake.id!)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors p-2 rounded-lg cursor-pointer"
                        title="Savatdan olib tashlash"
                      >
                        <Trash2 size={16} />
                      </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mahsulotlar:</span>
                <span className="text-gray-900">{totalAmount.toLocaleString('uz-UZ')} so'm</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Yetkazib berish:</span>
                <span className="text-gray-900">
                  {deliveryFee === 0 ? 'Bepul' : `${deliveryFee.toLocaleString('uz-UZ')} so'm`}
                </span>
              </div>
              {deliveryFee === 0 && (
                <p className="text-xs text-green-600">100,000 so'mdan yuqori buyurtmalar uchun bepul yetkazib berish</p>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span className="text-gray-900">Jami:</span>
                  <span className="text-gray-900">{finalTotal.toLocaleString('uz-UZ')} so'm</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Buyurtma berilmoqda...
                </div>
              ) : (
                'Buyurtma berish'
              )}
            </button>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <AlertCircle size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Buyurtmangiz qabul qilingandan so'ng, operatorlarimiz siz bilan bog'lanib, 
                  buyurtma tafsilotlarini tasdiqlaydi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Yetkazib berish manzilini tanlang</h3>
              <button
                onClick={() => setShowLocationPicker(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  📍 Xaritada nuqtani siljiting yoki kerakli joyni bosing. Sizning joriy joylashuvingiz avtomatik aniqlanadi.
                </p>
              </div>

              <div 
                ref={mapRef}
                className="w-full h-96 rounded-lg border border-gray-300"
                style={{ minHeight: '400px' }}
              >
                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin size={48} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Xarita yuklanmoqda...</p>
                  </div>
                </div>
              </div>

              {formData.deliveryAddress && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Tanlangan manzil:</p>
                  <p className="text-sm text-gray-600">{formData.deliveryAddress}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLocationPicker(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={() => {
                    if (formData.coordinates && formData.deliveryAddress) {
                      setShowLocationPicker(false);
                    } else {
                      alert('Iltimos, avval manzilni tanlang');
                    }
                  }}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Tanlash
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