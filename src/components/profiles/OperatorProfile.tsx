
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Headphones, 
  MapPin, 
  Phone, 
  Mail,
  MessageCircle,
  Clock,
  CheckCircle,
  Calendar,
  Edit2,
  Save,
  User,
  Award,
  TrendingUp,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { UserData } from '../../services/authService';
import { dataService } from '../../services/dataService';

interface OperatorProfileProps {
  user: UserData;
  onBack: () => void;
  onUpdate: (userData: Partial<UserData>) => void;
}

const OperatorProfile: React.FC<OperatorProfileProps> = ({ user, onBack, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTickets: 0,
    resolvedTickets: 0,
    pendingTickets: 0,
    avgResponseTime: '15 min',
    satisfactionRate: 95,
    workingHours: 8,
    totalOrders: 0
  });

  const [editForm, setEditForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    email: user.email || '',
    address: user.address || '',
    bio: user.bio || '',
    department: user.department || 'Customer Support',
    languages: user.languages || ['Uzbek', 'Russian'],
    shift: user.shift || 'day',
    avatar: null as File | null
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Operator statistikasini yuklash (demo data)
      const orders = await dataService.getOrders();
      
      setStats({
        totalTickets: 89,
        resolvedTickets: 84,
        pendingTickets: 5,
        avgResponseTime: '12 min',
        satisfactionRate: 96,
        workingHours: 8,
        totalOrders: orders.length
      });
    } catch (error) {
      console.error('Statistikalarni yuklashda xatolik:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let avatarUrl = user.avatar;
      
      if (editForm.avatar) {
        const imagePath = `avatars/operators/${user.id}/${Date.now()}_${editForm.avatar.name}`;
        avatarUrl = await dataService.uploadImage(editForm.avatar, imagePath);
      }

      const updates = {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
        bio: editForm.bio,
        department: editForm.department,
        languages: editForm.languages,
        shift: editForm.shift,
        avatar: avatarUrl
      };

      await dataService.updateUser(user.id, updates);
      onUpdate(updates);
      setIsEditing(false);
    } catch (error) {
      console.error('Profilni yangilashda xatolik:', error);
      alert('Profilni yangilashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const departments = [
    'Customer Support',
    'Technical Support',
    'Order Management',
    'Quality Assurance'
  ];

  const shiftOptions = [
    { value: 'day', label: 'Kunduzgi (09:00 - 18:00)' },
    { value: 'evening', label: 'Kechki (18:00 - 02:00)' },
    { value: 'night', label: 'Tungi (02:00 - 09:00)' },
    { value: 'flexible', label: 'Moslashuvchan' }
  ];

  const languageOptions = ['Uzbek', 'Russian', 'English', 'Kazakh', 'Tajik'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center space-x-3">
              <button 
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Operator profili</h1>
            </div>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isEditing 
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {loading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : isEditing ? (
                <Save size={16} />
              ) : (
                <Edit2 size={16} />
              )}
              <span>{loading ? 'Saqlanmoqda...' : isEditing ? 'Saqlash' : 'Tahrirlash'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end md:space-x-6 -mt-16">
              <div className="relative">
                {isEditing ? (
                  <div className="w-32 h-32 bg-gray-200 rounded-full border-4 border-white flex items-center justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditForm(prev => ({ ...prev, avatar: e.target.files?.[0] || null }))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Headphones size={40} className="text-gray-400" />
                  </div>
                ) : (
                  <img 
                    src={user.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150'}
                    alt={user.name}
                    className="w-32 h-32 rounded-full border-4 border-white object-cover"
                  />
                )}
                <div className="absolute -bottom-2 -right-2 p-2 bg-yellow-500 text-white rounded-full">
                  <Headphones size={16} />
                </div>
              </div>
              
              <div className="flex-1 mt-4 md:mt-0">
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="text-2xl font-bold bg-transparent border-b-2 border-yellow-300 focus:border-yellow-500 outline-none"
                      placeholder="Ismingiz"
                    />
                    <select
                      value={editForm.department}
                      onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                      className="text-lg bg-transparent border-b border-gray-300 focus:border-yellow-500 outline-none"
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                      rows={3}
                      placeholder="Ish vazifalaringiz haqida..."
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                    <h2 className="text-lg text-yellow-600 font-medium">{user.department || 'Customer Support Operator'}</h2>
                    <p className="text-gray-600 mt-1">{user.bio || 'Mijozlarga professional yordam ko\'rsataman'}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{new Date(user.joinDate).toLocaleDateString('uz-UZ')} dan faoliyat</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle size={14} className="text-green-500" />
                        <span className="text-green-600">{stats.satisfactionRate}% mamnunlik</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageCircle size={24} className="text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalTickets}</div>
            <div className="text-sm text-gray-600">Jami murojaatlar</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.resolvedTickets}</div>
            <div className="text-sm text-gray-600">Hal qilingan</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock size={24} className="text-blue-600" />
            </div>
            <div className="text-lg font-bold text-gray-900">{stats.avgResponseTime}</div>
            <div className="text-sm text-gray-600">O'rtacha javob</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={24} className="text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.satisfactionRate}%</div>
            <div className="text-sm text-gray-600">Mamnunlik</div>
          </div>
        </div>

        {/* Work Information */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ish ma'lumotlari</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ish smena</label>
              {isEditing ? (
                <select
                  value={editForm.shift}
                  onChange={(e) => setEditForm(prev => ({ ...prev, shift: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {shiftOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span>{shiftOptions.find(option => option.value === user.shift)?.label || 'Belgilanmagan'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ish soatlari</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span>{stats.workingHours} soat/kun</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tillar</label>
            {isEditing ? (
              <div className="space-y-2">
                {languageOptions.map((language) => (
                  <label key={language} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editForm.languages.includes(language)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditForm(prev => ({ 
                            ...prev, 
                            languages: [...prev.languages, language] 
                          }));
                        } else {
                          setEditForm(prev => ({ 
                            ...prev, 
                            languages: prev.languages.filter(l => l !== language) 
                          }));
                        }
                      }}
                      className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="text-sm">{language}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(user.languages || ['Uzbek', 'Russian']).map((language, index) => (
                  <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full text-sm">
                    {language}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance Stats */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ish samaradorligi</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{stats.resolvedTickets}</div>
              <div className="text-sm text-green-700">Hal qilingan</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingTickets}</div>
              <div className="text-sm text-yellow-700">Kutilayotgan</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{Math.round((stats.resolvedTickets / stats.totalTickets) * 100)}%</div>
              <div className="text-sm text-blue-700">Hal qilish %</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-2xl font-bold text-purple-600">{Math.round(stats.totalTickets / 30)}</div>
              <div className="text-sm text-purple-700">Kunlik o'rtacha</div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aloqa ma'lumotlari</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefon raqam</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Phone size={16} className="text-gray-400" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Mail size={16} className="text-gray-400" />
                  <span>{user.email || 'Belgilanmagan'}</span>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Manzil</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Ish manzili"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin size={16} className="text-gray-400" />
                  <span>{user.address || 'Belgilanmagan'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Achievement Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Yutuqlar</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <Headphones size={32} className="text-yellow-600 mx-auto mb-2" />
              <div className="font-semibold text-gray-900">Yangi operator</div>
              <div className="text-xs text-gray-600">Birinchi kun</div>
            </div>
            
            {stats.totalTickets >= 50 && (
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <BarChart3 size={32} className="text-blue-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Faol operator</div>
                <div className="text-xs text-gray-600">50+ murojaat</div>
              </div>
            )}

            {stats.satisfactionRate >= 95 && (
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <CheckCircle size={32} className="text-green-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Sifatli xizmat</div>
                <div className="text-xs text-gray-600">95%+ mamnunlik</div>
              </div>
            )}

            {stats.resolvedTickets >= 75 && (
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <Award size={32} className="text-purple-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Professional</div>
                <div className="text-xs text-gray-600">75+ hal qilingan</div>
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
            >
              Saqlash
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorProfile;
