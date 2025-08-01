import React, { useState } from 'react';
import { 
  ArrowLeft,
  MapPin,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Home,
  Building,
  MapPinIcon,
  Check,
  X,
  Star
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinDate: string;
  totalOrders: number;
  favoriteCount: number;
}

interface PaymentAddressPageProps {
  user: User;
  onBack: () => void;
}

const PaymentAddressPage: React.FC<PaymentAddressPageProps> = ({ user, onBack }) => {
  const [activeTab, setActiveTab] = useState<'addresses' | 'payments'>('addresses');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);

  const [addresses, setAddresses] = useState([
    {
      id: 1,
      type: 'Uy',
      title: 'Uyim',
      address: 'Toshkent shahar, Yunusobod tumani, Amir Temur ko\'chasi 15, 12-uy',
      isDefault: true,
      coordinates: { lat: 41.2995, lng: 69.2401 },
    },
    {
      id: 2,
      type: 'Ish',
      title: 'Ish joyi',
      address: 'Toshkent shahar, Mirzo Ulug\'bek tumani, Buyuk Ipak Yo\'li 45, 3-qavat',
      isDefault: false,
      coordinates: { lat: 41.3111, lng: 69.2797 },
    },
  ]);

  const [payments, setPayments] = useState([
    {
      id: 1,
      type: 'Visa',
      cardNumber: '**** **** **** 4532',
      holderName: 'AZIZA KARIMOVA',
      expiryDate: '12/26',
      isDefault: true,
    },
    {
      id: 2,
      type: 'Mastercard',
      cardNumber: '**** **** **** 8901',
      holderName: 'AZIZA KARIMOVA',
      expiryDate: '08/25',
      isDefault: false,
    },
  ]);

  const [addressForm, setAddressForm] = useState({
    type: 'Uy',
    title: '',
    address: '',
    isDefault: false,
  });

  const [paymentForm, setPaymentForm] = useState({
    type: 'Visa',
    cardNumber: '',
    holderName: '',
    expiryDate: '',
    cvv: '',
    isDefault: false,
  });

  const addressTypes = [
    { value: 'Uy', label: 'Uy', icon: Home },
    { value: 'Ish', label: 'Ish joyi', icon: Building },
    { value: 'Boshqa', label: 'Boshqa', icon: MapPinIcon },
  ];

  const handleAddAddress = () => {
    if (!addressForm.title || !addressForm.address) return;

    const newAddress = {
      id: Date.now(),
      ...addressForm,
      coordinates: { lat: 41.2995 + Math.random() * 0.1, lng: 69.2401 + Math.random() * 0.1 },
    };

    if (addressForm.isDefault) {
      setAddresses(prev => prev.map(addr => ({ ...addr, isDefault: false })));
    }

    setAddresses(prev => [...prev, newAddress]);
    setAddressForm({ type: 'Uy', title: '', address: '', isDefault: false });
    setShowAddressForm(false);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address.id);
    setAddressForm(address);
    setShowAddressForm(true);
  };

  const handleUpdateAddress = () => {
    if (!addressForm.title || !addressForm.address) return;

    if (addressForm.isDefault) {
      setAddresses(prev => prev.map(addr => ({ ...addr, isDefault: false })));
    }

    setAddresses(prev => prev.map(addr => 
      addr.id === editingAddress ? { ...addr, ...addressForm } : addr
    ));
    
    setEditingAddress(null);
    setAddressForm({ type: 'Uy', title: '', address: '', isDefault: false });
    setShowAddressForm(false);
  };

  const handleDeleteAddress = (id) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id));
  };

  const handleAddPayment = () => {
    if (!paymentForm.cardNumber || !paymentForm.holderName || !paymentForm.expiryDate || !paymentForm.cvv) return;

    const newPayment = {
      id: Date.now(),
      ...paymentForm,
      cardNumber: `**** **** **** ${paymentForm.cardNumber.slice(-4)}`,
    };

    if (paymentForm.isDefault) {
      setPayments(prev => prev.map(payment => ({ ...payment, isDefault: false })));
    }

    setPayments(prev => [...prev, newPayment]);
    setPaymentForm({ type: 'Visa', cardNumber: '', holderName: '', expiryDate: '', cvv: '', isDefault: false });
    setShowPaymentForm(false);
  };

  const handleDeletePayment = (id) => {
    setPayments(prev => prev.filter(payment => payment.id !== id));
  };

  const setDefaultAddress = (id) => {
    setAddresses(prev => prev.map(addr => ({ ...addr, isDefault: addr.id === id })));
  };

  const setDefaultPayment = (id) => {
    setPayments(prev => prev.map(payment => ({ ...payment, isDefault: payment.id === id })));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center space-x-3">
              <button 
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold text-gray-900">To'lov va manzillar</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('addresses')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'addresses'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MapPin size={16} />
                <span>Manzillar</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'payments'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CreditCard size={16} />
                <span>To'lov usullari</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'addresses' ? (
          <div className="space-y-6">
            {/* Add Address Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Saqlangan manzillar</h2>
              <button
                onClick={() => {
                  setShowAddressForm(true);
                  setEditingAddress(null);
                  setAddressForm({ type: 'Uy', title: '', address: '', isDefault: false });
                }}
                className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus size={16} />
                <span>Yangi manzil</span>
              </button>
            </div>

            {/* Address Form */}
            {showAddressForm && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingAddress ? 'Manzilni tahrirlash' : 'Yangi manzil qo\'shish'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manzil turi</label>
                    <div className="grid grid-cols-3 gap-3">
                      {addressTypes.map((type) => {
                        const IconComponent = type.icon;
                        return (
                          <button
                            key={type.value}
                            onClick={() => setAddressForm(prev => ({ ...prev, type: type.value }))}
                            className={`flex items-center justify-center space-x-2 p-3 rounded-lg border transition-colors ${
                              addressForm.type === type.value
                                ? 'border-orange-500 bg-orange-50 text-orange-600'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <IconComponent size={16} />
                            <span className="text-sm font-medium">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manzil nomi</label>
                    <input
                      type="text"
                      value={addressForm.title}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Masalan: Uyim, Ish joyi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To'liq manzil</label>
                    <textarea
                      value={addressForm.address}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Shahar, tuman, ko'cha, uy raqami va boshqa ma'lumotlar"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="defaultAddress"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="defaultAddress" className="ml-2 block text-sm text-gray-900">
                      Asosiy manzil sifatida belgilash
                    </label>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
                      className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                    >
                      {editingAddress ? 'Yangilash' : 'Saqlash'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddressForm(false);
                        setEditingAddress(null);
                        setAddressForm({ type: 'Uy', title: '', address: '', isDefault: false });
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Address List */}
            <div className="space-y-4">
              {addresses.map((address) => {
                const TypeIcon = addressTypes.find(type => type.value === address.type)?.icon || MapPinIcon;
                return (
                  <div key={address.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-orange-100 rounded-lg">
                          <TypeIcon size={20} className="text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{address.title}</h3>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full font-medium">
                                Asosiy
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">{address.address}</p>
                          <div className="flex items-center space-x-4">
                            {!address.isDefault && (
                              <button
                                onClick={() => setDefaultAddress(address.id)}
                                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                              >
                                Asosiy qilish
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Add Payment Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">To'lov usullari</h2>
              <button
                onClick={() => {
                  setShowPaymentForm(true);
                  setEditingPayment(null);
                  setPaymentForm({ type: 'Visa', cardNumber: '', holderName: '', expiryDate: '', cvv: '', isDefault: false });
                }}
                className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus size={16} />
                <span>Yangi karta</span>
              </button>
            </div>

            {/* Payment Form */}
            {showPaymentForm && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingPayment ? 'Kartani tahrirlash' : 'Yangi karta qo\'shish'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Karta turi</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Visa', 'Mastercard'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setPaymentForm(prev => ({ ...prev, type }))}
                          className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
                            paymentForm.type === type
                              ? 'border-orange-500 bg-orange-50 text-orange-600'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <span className="font-medium">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Karta raqami</label>
                    <input
                      type="text"
                      value={paymentForm.cardNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                        const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                        setPaymentForm(prev => ({ ...prev, cardNumber: formatted }));
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Karta egasining ismi</label>
                    <input
                      type="text"
                      value={paymentForm.holderName}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, holderName: e.target.value.toUpperCase() }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="AZIZA KARIMOVA"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amal qilish muddati</label>
                      <input
                        type="text"
                        value={paymentForm.expiryDate}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          const formatted = value.replace(/(\d{2})(?=\d)/, '$1/');
                          setPaymentForm(prev => ({ ...prev, expiryDate: formatted }));
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                      <input
                        type="text"
                        value={paymentForm.cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                          setPaymentForm(prev => ({ ...prev, cvv: value }));
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="123"
                        maxLength={3}
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="defaultPayment"
                      checked={paymentForm.isDefault}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="defaultPayment" className="ml-2 block text-sm text-gray-900">
                      Asosiy to'lov usuli sifatida belgilash
                    </label>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleAddPayment}
                      className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                    >
                      Saqlash
                    </button>
                    <button
                      onClick={() => {
                        setShowPaymentForm(false);
                        setEditingPayment(null);
                        setPaymentForm({ type: 'Visa', cardNumber: '', holderName: '', expiryDate: '', cvv: '', isDefault: false });
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Payment List */}
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-8 rounded flex items-center justify-center text-white font-bold text-sm ${
                        payment.type === 'Visa' ? 'bg-blue-600' : 'bg-red-500'
                      }`}>
                        {payment.type === 'Visa' ? 'VISA' : 'MC'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-900">{payment.cardNumber}</span>
                          {payment.isDefault && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full font-medium">
                              Asosiy
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{payment.holderName}</p>
                        <p className="text-sm text-gray-500">Amal qilish: {payment.expiryDate}</p>
                        {!payment.isDefault && (
                          <button
                            onClick={() => setDefaultPayment(payment.id)}
                            className="text-sm text-orange-600 hover:text-orange-700 font-medium mt-1"
                          >
                            Asosiy qilish
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDeletePayment(payment.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PaymentAddressPage;