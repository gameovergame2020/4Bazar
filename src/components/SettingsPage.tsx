import React, { useState } from 'react';
import { 
  ArrowLeft,
  User,
  Lock,
  Bell,
  CreditCard,
  MapPin,
  Moon,
  Sun,
  ChevronRight,
  ChevronDown,
  Edit,
  Plus,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff
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

interface SettingsPageProps {
  user: User;
  onBack: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, onBack }) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    push: true,
    email: false,
    orderUpdates: true,
    promotions: false,
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const savedAddresses = [
    {
      id: 1,
      type: 'Uy',
      address: 'Toshkent shahar, Yunusobod tumani, Amir Temur ko\'chasi 15',
      isDefault: true,
    },
    {
      id: 2,
      type: 'Ish',
      address: 'Toshkent shahar, Mirzo Ulug\'bek tumani, Buyuk Ipak Yo\'li 45',
      isDefault: false,
    },
  ];

  const savedCards = [
    {
      id: 1,
      type: 'Visa',
      lastFour: '4532',
      expiryDate: '12/26',
      isDefault: true,
    },
    {
      id: 2,
      type: 'Mastercard',
      lastFour: '8901',
      expiryDate: '08/25',
      isDefault: false,
    },
  ];

  const sections = [
    {
      id: 'profile',
      title: 'Profil sozlamalari',
      icon: User,
      items: [
        { id: 'edit-profile', title: 'Profilni tahrirlash', icon: Edit },
        { id: 'change-password', title: 'Parolni o\'zgartirish', icon: Lock },
      ]
    },
    {
      id: 'notifications',
      title: 'Bildirishnomalar',
      icon: Bell,
      items: []
    },
    {
      id: 'payment-address',
      title: 'To\'lov va manzillar',
      icon: CreditCard,
      items: []
    },
  ];

  const renderProfileSection = () => (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Shaxsiy ma'lumotlar</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To'liq ism
            </label>
            <input
              type="text"
              defaultValue={user.name}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              defaultValue={user.email}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Telefon raqam
            </label>
            <input
              type="tel"
              defaultValue={user.phone}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        
        <button className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium">
          O'zgarishlarni saqlash
        </button>
      </div>
      
      <button 
        onClick={() => setShowPasswordForm(!showPasswordForm)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Lock size={20} className="text-orange-500" />
          <span className="font-medium text-gray-900 dark:text-white">Parolni o'zgartirish</span>
        </div>
        <ChevronDown 
          size={18} 
          className={`text-gray-400 transition-transform ${showPasswordForm ? 'rotate-180' : ''}`}
        />
      </button>

      {showPasswordForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Joriy parol
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Joriy parolingizni kiriting"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Yangi parol
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Yangi parolingizni kiriting"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex space-x-3">
            <button className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium">
              Saqlash
            </button>
            <button 
              onClick={() => setShowPasswordForm(false)}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Bekor qilish
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Bildirishnoma turlari</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white">Push bildirishnomalar</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Mobil qurilmangizga bildirishnomalar</p>
            </div>
            <button
              onClick={() => toggleNotification('push')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.push ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.push ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white">Email bildirishnomalar</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email orqali bildirishnomalar</p>
            </div>
            <button
              onClick={() => toggleNotification('email')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.email ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.email ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white">Buyurtma yangiliklari</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Buyurtma holati haqida xabarlar</p>
            </div>
            <button
              onClick={() => toggleNotification('orderUpdates')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.orderUpdates ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.orderUpdates ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white">Aksiyalar va chegirmalar</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Maxsus takliflar haqida xabarlar</p>
            </div>
            <button
              onClick={() => toggleNotification('promotions')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.promotions ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.promotions ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentAddressSection = () => (
    <div className="space-y-6">
      {/* Addresses */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <MapPin size={18} className="text-orange-500" />
            <span>Manzillarim</span>
          </h4>
          <button className="flex items-center space-x-1 text-orange-500 hover:text-orange-600 font-medium">
            <Plus size={16} />
            <span>Qo'shish</span>
          </button>
        </div>
        <div className="space-y-3">
          {savedAddresses.map((address) => (
            <div key={address.id} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">{address.type}</span>
                  {address.isDefault && (
                    <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-full">
                      Asosiy
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{address.address}</p>
              </div>
              <div className="flex items-center space-x-2 ml-3">
                <button className="p-1 text-gray-400 hover:text-orange-500 transition-colors">
                  <Edit size={16} />
                </button>
                <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <CreditCard size={18} className="text-orange-500" />
            <span>To'lov usullari</span>
          </h4>
          <button className="flex items-center space-x-1 text-orange-500 hover:text-orange-600 font-medium">
            <Plus size={16} />
            <span>Qo'shish</span>
          </button>
        </div>
        <div className="space-y-3">
          {savedCards.map((card) => (
            <div key={card.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {card.type === 'Visa' ? 'V' : 'MC'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      •••• •••• •••• {card.lastFour}
                    </span>
                    {card.isDefault && (
                      <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-full">
                        Asosiy
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{card.expiryDate}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-1 text-gray-400 hover:text-orange-500 transition-colors">
                  <Edit size={16} />
                </button>
                <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'profile':
        return renderProfileSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'payment-address':
        return renderPaymentAddressSection();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button 
                onClick={onBack}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Sozlamalar</h1>
            </div>
            
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="space-y-3 sm:space-y-4">
          {sections.map((section) => {
            const IconComponent = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <div key={section.id} className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-4 sm:p-6 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg sm:rounded-xl">
                      <IconComponent size={20} className="text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                        {section.id === 'profile' && 'Shaxsiy ma\'lumotlaringizni boshqaring'}
                        {section.id === 'notifications' && 'Bildirishnoma sozlamalarini o\'zgartiring'}
                        {section.id === 'payment-address' && 'To\'lov usullari va manzillarni boshqaring'}
                      </p>
                    </div>
                  </div>
                  <ChevronDown 
                    size={18} 
                    className={`text-gray-400 transition-transform duration-300 ${
                      isActive ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                <div className={`transition-all duration-300 ease-in-out ${
                  isActive ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                } overflow-hidden`}>
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    {renderSectionContent(section.id)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;