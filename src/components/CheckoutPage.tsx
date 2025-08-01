
import React, { useState } from 'react';
import { ArrowLeft, MapPin, Phone, User, CreditCard, Truck, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';

interface CheckoutPageProps {
  cart: {[key: string]: number};
  cakes: any[];
  onBack: () => void;
  onOrderComplete: () => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ cart, cakes, onBack, onOrderComplete }) => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [formData, setFormData] = useState({
    customerName: userData?.name || '',
    customerPhone: userData?.phone || '',
    deliveryAddress: '',
    notes: '',
    paymentMethod: 'cash',
    deliveryTime: 'asap'
  });

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

    setLoading(true);
    try {
      // Har bir tort uchun alohida buyurtma yaratamiz
      for (const item of cartItems) {
        if (item) {
          await dataService.createOrder({
            customerId: userData?.id?.toString() || 'guest',
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            cakeId: item.cake.id!,
            cakeName: item.cake.name,
            quantity: item.quantity,
            totalPrice: item.total,
            status: 'pending',
            deliveryAddress: formData.deliveryAddress,
            notes: formData.notes
          });
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
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <div key={item.cake.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{item.cake.name}</h4>
                    <p className="text-xs text-gray-500">
                      {item.quantity} x {item.price.toLocaleString('uz-UZ')} so'm
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {item.total.toLocaleString('uz-UZ')} so'm
                  </span>
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
    </div>
  );
};

export default CheckoutPage;
