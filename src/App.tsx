import React, { useState } from 'react';
import { Home, MapPin, User, Bell, X, Clock, CheckCircle, Truck, Gift, Trash2, BookMarked as MarkAsRead } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import CustomerDashboard from './components/dashboards/CustomerDashboard';
import BakerDashboard from './components/dashboards/BakerDashboard';
import CourierDashboard from './components/dashboards/CourierDashboard';
import ShopDashboard from './components/dashboards/ShopDashboard';
import OperatorDashboard from './components/dashboards/OperatorDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import HomePage from './components/HomePage';
import RestaurantsPage from './components/RestaurantsPage';
import CommunityPage from './components/CommunityPage';
import ProfilePage from './components/ProfilePage';
import LoginPage from './components/LoginPage';
import PaymentAddressPage from './components/PaymentAddressPage';
import HelpPage from './components/HelpPage';
import AdvancedSettingsPage from './components/AdvancedSettingsPage';
import ProfileManager from './components/ProfileManager'; // Assuming ProfileManager component exists

type ActivePage = 'home' | 'restaurants' | 'community' | 'profile' | 'payment-address' | 'help' | 'advanced-settings';

function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { userData, isAuthenticated, logout, loading, updateUser } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading: notificationsLoading,
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    setActivePage('home');
  };

  // Show loading spinner while checking auth state
  if (loading || (isAuthenticated && !userData)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return CheckCircle;
      case 'delivery': return Truck;
      case 'promotion': return Gift;
      case 'reminder': return Clock;
      default: return Bell;
    }
  };

  const formatNotificationTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Hozir';
    if (diffInMinutes < 60) return `${diffInMinutes} daqiqa oldin`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} soat oldin`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} kun oldin`;

    return date.toLocaleDateString('uz-UZ');
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Agar actionUrl mavjud bo'lsa, o'sha sahifaga o'tish
    if (notification.actionUrl) {
      // Bu yerda routing logikasi qo'shilishi mumkin
      console.log('Navigate to:', notification.actionUrl);
    }
  };
  const renderPage = () => {
    // Role-based dashboard rendering
    if (isAuthenticated && userData?.role && activePage === 'home') {
      switch (userData.role) {
        case 'baker':
          return <BakerDashboard />;
        case 'courier':
          return <CourierDashboard />;
        case 'shop':
          return <ShopDashboard />;
        case 'operator':
          return <OperatorDashboard />;
        case 'admin':
          return <AdminDashboard />;
        default:
          return <HomePage />;
      }
    }

    switch (activePage) {
      case 'home':
        return <HomePage />;
      case 'restaurants':
        return <RestaurantsPage />;
      case 'community':
        return <CommunityPage />;
      case 'profile':
        return isAuthenticated ? (
          userData ? (
            <ProfileManager
              user={userData}
              profileType={userData.role as 'customer' | 'baker' | 'shop' | 'courier' | 'admin' | 'operator'}
              onBack={() => setActivePage('home')}
              onUpdate={updateUser}
            />
          ) : (
            <p>Foydalanuvchi ma'lumotlari yuklanmoqda...</p>
          )
        ) : (
          <LoginPage />
        );
      case 'payment-address':
        return <PaymentAddressPage user={userData} onBack={() => setActivePage('profile')} />;
      case 'help':
        return <HelpPage user={userData} onBack={() => setActivePage('profile')} />;
      case 'advanced-settings':
        return <AdvancedSettingsPage user={userData} onBack={() => setActivePage('profile')} />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      {/* Header */}
      {(activePage === 'home' || (isAuthenticated && userData?.role)) && (
        <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-base">TB</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Tort Bazar</h1>
                {isAuthenticated && userData?.role && (
                  <p className="text-xs text-gray-600">
                    {userData.role === 'baker' && 'Tort tayyorlovchi'}
                    {userData.role === 'shop' && 'Do\'kon'}
                    {userData.role === 'courier' && 'Kuryer'}
                    {userData.role === 'operator' && 'Operator'}
                    {userData.role === 'admin' && 'Administrator'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <Bell size={isMobile ? 18 : 20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
        </header>
      )}

      {/* Notifications Panel */}
      {showNotifications && (activePage === 'home' || (isAuthenticated && userData?.role)) && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowNotifications(false)}
          ></div>

          {/* Notifications Panel */}
          <div className={`fixed ${isMobile ? 'inset-x-4 top-16' : 'top-16 right-4 w-80'} bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-96 overflow-hidden`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Bildirishnomalar</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Barchasini o'qilgan deb belgilash"
                  >
                    <CheckCircle size={16} />
                  </button>
                )}
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {notificationsLoading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-500 text-sm">Yuklanmoqda...</p>
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => {
                    const IconComponent = getNotificationIcon(notification.type);
                    return (
                      <div 
                        key={notification.id!}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group ${
                          !notification.read ? 'bg-orange-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-full ${
                            notification.type === 'order' || notification.type === 'delivery' ? 'bg-blue-100 text-blue-600' :
                            notification.type === 'promotion' ? 'bg-green-100 text-green-600' :
                            'bg-orange-100 text-orange-600'
                          }`}>
                            <IconComponent size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`text-sm font-medium ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatNotificationTime(notification.createdAt)}
                            </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id!);
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                              title="O'chirish"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell size={32} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Bildirishnomalar yo'q</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-100 bg-gray-50">
                <button className="w-full text-center text-sm text-orange-600 hover:text-orange-700 font-medium" onClick={() => setShowNotifications(false)}>
                  Barchasini ko'rish
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden pb-20">
        {renderPage()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 sm:px-4 py-2 sm:py-3 z-50">
        <div className="flex justify-around max-w-6xl mx-auto">
          <button
            onClick={() => setActivePage('home')}
            className={`flex flex-col items-center py-1 sm:py-2 px-2 sm:px-4 rounded-lg transition-colors ${
              activePage === 'home'
                ? 'text-orange-600 bg-orange-50'
                : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <Home size={isMobile ? 18 : 20} />
            <span className="text-xs mt-0.5 sm:mt-1">
              {isAuthenticated && userData?.role && userData.role !== 'customer' ? 'Dashboard' : 'Bosh sahifa'}
            </span>
          </button>
          <button
            onClick={() => setActivePage(isAuthenticated && userData?.role && userData.role !== 'customer' ? 'community' : 'restaurants')}
            className={`flex flex-col items-center py-1 sm:py-2 px-2 sm:px-4 rounded-lg transition-colors ${
              (activePage === 'restaurants' || activePage === 'community')
                ? 'text-orange-600 bg-orange-50'
                : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <MapPin size={isMobile ? 18 : 20} />
            <span className="text-xs mt-0.5 sm:mt-1">
              {isAuthenticated && userData?.role && userData.role !== 'customer' ? 'Community' : 'Restoranlar'}
            </span>
          </button>
          <button
            onClick={() => setActivePage('profile')}
            className={`flex flex-col items-center py-1 sm:py-2 px-2 sm:px-4 rounded-lg transition-colors ${
              activePage === 'profile'
                ? 'text-orange-600 bg-orange-50'
                : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <User size={isMobile ? 18 : 20} />
            <span className="text-xs mt-0.5 sm:mt-1">Profil</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;