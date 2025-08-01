import React, { useState } from 'react';
import { 
  ArrowLeft,
  Shield,
  Bell,
  Globe,
  Moon,
  Sun,
  Smartphone,
  Download,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  Key,
  Database,
  Activity,
  Wifi,
  Battery,
  Volume2,
  VolumeX
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

interface AdvancedSettingsPageProps {
  user: User;
  onBack: () => void;
}

const AdvancedSettingsPage: React.FC<AdvancedSettingsPageProps> = ({ user, onBack }) => {
  const [settings, setSettings] = useState({
    // Privacy & Security
    twoFactorAuth: false,
    biometricAuth: true,
    sessionTimeout: '30',
    dataCollection: false,
    locationTracking: true,
    
    // Notifications
    pushNotifications: true,
    emailNotifications: false,
    smsNotifications: true,
    orderUpdates: true,
    promotions: false,
    soundEnabled: true,
    vibrationEnabled: true,
    
    // Appearance
    darkMode: false,
    language: 'uz',
    fontSize: 'medium',
    
    // Performance
    dataUsage: 'normal',
    cacheSize: '150',
    autoDownload: false,
    
    // Advanced
    developerMode: false,
    debugMode: false,
    analytics: true,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);

  const toggleSetting = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExportData = () => {
    // Simulate data export
    const userData = {
      profile: user,
      settings: settings,
      exportDate: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tortbazar-data-${user.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setShowDataExport(false);
  };

  const handleDeleteAccount = () => {
    // This would normally make an API call
    console.log('Account deletion requested');
    setShowDeleteConfirm(false);
  };

  const clearCache = () => {
    // Simulate cache clearing
    console.log('Cache cleared');
    setSettings(prev => ({ ...prev, cacheSize: '0' }));
    setTimeout(() => {
      setSettings(prev => ({ ...prev, cacheSize: '15' }));
    }, 2000);
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
              <h1 className="text-xl font-bold text-gray-900">Kengaytirilgan sozlamalar</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Privacy & Security */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield size={20} className="text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Maxfiylik va xavfsizlik</h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Ikki bosqichli autentifikatsiya</h3>
                <p className="text-sm text-gray-600">Hisobingizni qo'shimcha himoyalash</p>
              </div>
              <button
                onClick={() => toggleSetting('twoFactorAuth')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.twoFactorAuth ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Biometrik autentifikatsiya</h3>
                <p className="text-sm text-gray-600">Barmoq izi yoki yuz tanish</p>
              </div>
              <button
                onClick={() => toggleSetting('biometricAuth')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.biometricAuth ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.biometricAuth ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sessiya tugash vaqti (daqiqa)
              </label>
              <select
                value={settings.sessionTimeout}
                onChange={(e) => updateSetting('sessionTimeout', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="15">15 daqiqa</option>
                <option value="30">30 daqiqa</option>
                <option value="60">1 soat</option>
                <option value="120">2 soat</option>
                <option value="never">Hech qachon</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Ma'lumot to'plash</h3>
                <p className="text-sm text-gray-600">Xizmatni yaxshilash uchun</p>
              </div>
              <button
                onClick={() => toggleSetting('dataCollection')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.dataCollection ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.dataCollection ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Joylashuv kuzatuvi</h3>
                <p className="text-sm text-gray-600">Yetkazib berish uchun</p>
              </div>
              <button
                onClick={() => toggleSetting('locationTracking')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.locationTracking ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.locationTracking ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell size={20} className="text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Bildirishnomalar</h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Push bildirishnomalar</h3>
                  <p className="text-sm text-gray-600">Mobil bildirishnomalar</p>
                </div>
                <button
                  onClick={() => toggleSetting('pushNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.pushNotifications ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Email bildirishnomalar</h3>
                  <p className="text-sm text-gray-600">Email orqali</p>
                </div>
                <button
                  onClick={() => toggleSetting('emailNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">SMS bildirishnomalar</h3>
                  <p className="text-sm text-gray-600">SMS orqali</p>
                </div>
                <button
                  onClick={() => toggleSetting('smsNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.smsNotifications ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Ovoz</h3>
                  <p className="text-sm text-gray-600">Bildirishnoma ovozi</p>
                </div>
                <button
                  onClick={() => toggleSetting('soundEnabled')}
                  className={`p-2 rounded-lg transition-colors ${
                    settings.soundEnabled ? 'text-orange-600 bg-orange-50' : 'text-gray-400 bg-gray-100'
                  }`}
                >
                  {settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe size={20} className="text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Ko'rinish</h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Tungi rejim</h3>
                <p className="text-sm text-gray-600">Qorong'i mavzu</p>
              </div>
              <button
                onClick={() => toggleSetting('darkMode')}
                className={`p-2 rounded-lg transition-colors ${
                  settings.darkMode ? 'text-yellow-600 bg-yellow-50' : 'text-gray-400 bg-gray-100'
                }`}
              >
                {settings.darkMode ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Til</label>
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="uz">O'zbekcha</option>
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shrift o'lchami</label>
              <select
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="small">Kichik</option>
                <option value="medium">O'rta</option>
                <option value="large">Katta</option>
                <option value="xlarge">Juda katta</option>
              </select>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity size={20} className="text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Ishlash</h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ma'lumot sarfi</label>
              <select
                value={settings.dataUsage}
                onChange={(e) => updateSetting('dataUsage', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="low">Kam</option>
                <option value="normal">Oddiy</option>
                <option value="high">Ko'p</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Avtomatik yuklab olish</h3>
                <p className="text-sm text-gray-600">Rasmlar va videolar</p>
              </div>
              <button
                onClick={() => toggleSetting('autoDownload')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoDownload ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoDownload ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Kesh hajmi</h3>
                <p className="text-sm text-gray-600">{settings.cacheSize} MB</p>
              </div>
              <button
                onClick={clearCache}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Tozalash
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Database size={20} className="text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Ma'lumotlar boshqaruvi</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <button
              onClick={() => setShowDataExport(true)}
              className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Download size={20} className="text-blue-600" />
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Ma'lumotlarni eksport qilish</h3>
                  <p className="text-sm text-gray-600">Barcha ma'lumotlaringizni yuklab oling</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Trash2 size={20} className="text-red-600" />
                <div className="text-left">
                  <h3 className="font-medium text-red-900">Hisobni o'chirish</h3>
                  <p className="text-sm text-red-600">Barcha ma'lumotlar o'chiriladi</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Advanced */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Key size={20} className="text-gray-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Kengaytirilgan</h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Dasturchi rejimi</h3>
                <p className="text-sm text-gray-600">Qo'shimcha sozlamalar</p>
              </div>
              <button
                onClick={() => toggleSetting('developerMode')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.developerMode ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.developerMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.developerMode && (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Debug rejimi</h3>
                  <p className="text-sm text-gray-600">Xatoliklarni aniqlash</p>
                </div>
                <button
                  onClick={() => toggleSetting('debugMode')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.debugMode ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.debugMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Analitika</h3>
                <p className="text-sm text-gray-600">Foydalanish statistikasi</p>
              </div>
              <button
                onClick={() => toggleSetting('analytics')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.analytics ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.analytics ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Data Export Modal */}
      {showDataExport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <Download size={24} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Ma'lumotlarni eksport qilish</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Barcha shaxsiy ma'lumotlaringiz, sozlamalar va buyurtma tarixi JSON formatida yuklab olinadi.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleExportData}
                className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Yuklab olish
              </button>
              <button
                onClick={() => setShowDataExport(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle size={24} className="text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Hisobni o'chirish</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Bu amalni bekor qilib bo'lmaydi. Barcha ma'lumotlaringiz, buyurtma tarixi va sozlamalar butunlay o'chiriladi.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors"
              >
                Ha, o'chirish
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSettingsPage;