
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
  AlertCircle,
  Star,
  Settings,
  Shield,
  Target,
  Zap,
  Activity,
  Users,
  Timer,
  FileText,
  Camera,
  X,
  Upload
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
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'settings' | 'activity'>('overview');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [stats, setStats] = useState({
    totalTickets: 0,
    resolvedTickets: 0,
    pendingTickets: 0,
    avgResponseTime: '15 min',
    satisfactionRate: 95,
    workingHours: 8,
    totalOrders: 0,
    todayResolved: 0,
    weeklyTarget: 100,
    efficiency: 92,
    responseTime: 12,
    escalatedTickets: 3
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
    avatar: null as File | null,
    skills: user.skills || ['Customer Service', 'Problem Solving'],
    experience: user.experience || '1 year',
    specialty: user.specialty || 'General Support'
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const orders = await dataService.getOrders();
      const tickets = await dataService.getSupportTickets();
      
      const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
      const todayResolved = tickets.filter(t => 
        t.status === 'resolved' && 
        t.updatedAt && 
        t.updatedAt.toDateString() === new Date().toDateString()
      ).length;
      
      setStats({
        totalTickets: tickets.length,
        resolvedTickets,
        pendingTickets: tickets.filter(t => t.status === 'open').length,
        avgResponseTime: '12 min',
        satisfactionRate: 96,
        workingHours: 8,
        totalOrders: orders.length,
        todayResolved,
        weeklyTarget: 100,
        efficiency: Math.round((resolvedTickets / tickets.length) * 100) || 92,
        responseTime: 12,
        escalatedTickets: tickets.filter(t => t.priority === 'high').length
      });
    } catch (error) {
      console.error('Statistikalarni yuklashda xatolik:', error);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditForm(prev => ({ ...prev, avatar: file }));
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
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
        skills: editForm.skills,
        experience: editForm.experience,
        specialty: editForm.specialty,
        avatar: avatarUrl
      };

      await dataService.updateUser(user.id, updates);
      onUpdate(updates);
      setIsEditing(false);
      setAvatarPreview(null);
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
    'Quality Assurance',
    'Escalation Team'
  ];

  const shiftOptions = [
    { value: 'day', label: 'Kunduzgi (09:00 - 18:00)', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'evening', label: 'Kechki (18:00 - 02:00)', color: 'bg-orange-100 text-orange-800' },
    { value: 'night', label: 'Tungi (02:00 - 09:00)', color: 'bg-blue-100 text-blue-800' },
    { value: 'flexible', label: 'Moslashuvchan', color: 'bg-green-100 text-green-800' }
  ];

  const languageOptions = ['Uzbek', 'Russian', 'English', 'Kazakh', 'Tajik'];
  const skillOptions = ['Customer Service', 'Problem Solving', 'Technical Support', 'Order Management', 'Complaint Resolution', 'Product Knowledge'];

  const performanceData = [
    { label: 'Muvaffaqiyat', value: stats.efficiency, color: 'bg-green-500', icon: Target },
    { label: 'Javob tezligi', value: 100 - (stats.responseTime / 60 * 100), color: 'bg-blue-500', icon: Zap },
    { label: 'Mijoz mamnunligi', value: stats.satisfactionRate, color: 'bg-purple-500', icon: Star },
    { label: 'Haftalik maqsad', value: (stats.resolvedTickets / stats.weeklyTarget) * 100, color: 'bg-yellow-500', icon: Award }
  ];

  const recentActivities = [
    { id: 1, action: 'Buyurtma #12345 muammosi hal qilindi', time: '15 daqiqa oldin', type: 'success' },
    { id: 2, action: 'Yangi ticket qabul qilindi', time: '30 daqiqa oldin', type: 'info' },
    { id: 3, action: 'Mijoz bilan suhbat yakunlandi', time: '1 soat oldin', type: 'neutral' },
    { id: 4, action: 'Texnik yordam so\'raldi', time: '2 soat oldin', type: 'warning' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <button 
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Operator Profili</h1>
                <p className="text-sm text-gray-600">Shaxsiy ma'lumotlar va ish ko'rsatkichlari</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={loading}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                  isEditing 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg' 
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
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8">
          <div className="h-40 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative">
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
          <div className="px-8 pb-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:space-x-8 -mt-20">
              {/* Avatar */}
              <div className="relative mb-6 lg:mb-0">
                <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-200">
                  {isEditing ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={avatarPreview || user.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150'}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                      <label className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </label>
                    </div>
                  ) : (
                    <img 
                      src={user.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150'}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 p-3 bg-blue-500 text-white rounded-full shadow-lg">
                  <Headphones size={20} />
                </div>
              </div>
              
              {/* Profile Info */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="text-3xl font-bold bg-transparent border-b-2 border-blue-300 focus:border-blue-500 outline-none w-full"
                      placeholder="Ismingiz"
                    />
                    <select
                      value={editForm.department}
                      onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                      className="text-xl bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full p-4 border border-gray-300 rounded-xl resize-none"
                      rows={3}
                      placeholder="Ish vazifalaringiz haqida..."
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {user.department || 'Customer Support'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        shiftOptions.find(s => s.value === user.shift)?.color || 'bg-gray-100 text-gray-700'
                      }`}>
                        {shiftOptions.find(s => s.value === user.shift)?.label.split(' ')[0] || 'Kunduzgi'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">{user.bio || 'Professional operator sifatida mijozlarga yordam beraman'}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Calendar size={16} />
                        <span>{new Date(user.joinDate).toLocaleDateString('uz-UZ')} dan faoliyat</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star size={16} className="text-yellow-500" />
                        <span className="text-yellow-600 font-medium">{stats.satisfactionRate}% mamnunlik</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Timer size={16} className="text-green-500" />
                        <span className="text-green-600 font-medium">{stats.avgResponseTime} o'rtacha javob</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="px-6 py-4">
            <div className="flex space-x-1">
              {[
                { id: 'overview', label: 'Umumiy', icon: User },
                { id: 'performance', label: 'Samaradorlik', icon: BarChart3 },
                { id: 'settings', label: 'Sozlamalar', icon: Settings },
                { id: 'activity', label: 'Faoliyat', icon: Activity }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats Cards */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageCircle size={24} className="text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalTickets}</div>
                  <div className="text-sm text-gray-600">Jami murojaatlar</div>
                </div>
                
                <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={24} className="text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.resolvedTickets}</div>
                  <div className="text-sm text-gray-600">Hal qilingan</div>
                </div>
                
                <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Clock size={24} className="text-yellow-600" />
                  </div>
                  <div className="text-lg font-bold text-gray-900">{stats.avgResponseTime}</div>
                  <div className="text-sm text-gray-600">O'rtacha javob</div>
                </div>
                
                <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <TrendingUp size={24} className="text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.efficiency}%</div>
                  <div className="text-sm text-gray-600">Samaradorlik</div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Ko'rsatkichlar</h3>
                <div className="space-y-4">
                  {performanceData.map((metric, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className={`p-3 ${metric.color} rounded-xl`}>
                        <metric.icon size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{metric.label}</span>
                          <span className="font-bold text-gray-900">{Math.round(metric.value)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${metric.color}`}
                            style={{ width: `${Math.min(metric.value, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tezkor ma'lumot</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Bugungi hal qilingan</span>
                    <span className="font-semibold text-green-600">{stats.todayResolved}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Escalated tickets</span>
                    <span className="font-semibold text-red-600">{stats.escalatedTickets}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Haftalik maqsad</span>
                    <span className="font-semibold text-blue-600">{stats.resolvedTickets}/{stats.weeklyTarget}</span>
                  </div>
                </div>
              </div>

              {/* Languages & Skills */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ko'nikmalar</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Tillar</h4>
                    <div className="flex flex-wrap gap-2">
                      {(user.languages || ['Uzbek', 'Russian']).map((language, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Mutaxassislik</h4>
                    <div className="flex flex-wrap gap-2">
                      {(user.skills || ['Customer Service', 'Problem Solving']).map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Performance Chart Placeholder */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Haftalik natijalar</h3>
              <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Grafik ma'lumotlari</p>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Yutuqlar</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                  <Award size={32} className="text-yellow-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">Professional</div>
                  <div className="text-xs text-gray-600">100+ ticket</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <Star size={32} className="text-green-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">5 yulduzli</div>
                  <div className="text-xs text-gray-600">95%+ mamnunlik</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <Zap size={32} className="text-blue-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">Tezkor</div>
                  <div className="text-xs text-gray-600">15 min javob</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <Target size={32} className="text-purple-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">Maqsadga yo'nalgan</div>
                  <div className="text-xs text-gray-600">90%+ samaradorlik</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Settings */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Shaxsiy ma'lumotlar</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <Mail size={16} className="text-gray-400" />
                        <span>{user.email || 'Belgilanmagan'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ish smena</label>
                  {isEditing ? (
                    <select
                      value={editForm.shift}
                      onChange={(e) => setEditForm(prev => ({ ...prev, shift: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {shiftOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span>{shiftOptions.find(option => option.value === user.shift)?.label || 'Belgilanmagan'}</span>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ko'nikmalar</label>
                    <div className="space-y-2">
                      {skillOptions.map((skill) => (
                        <label key={skill} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={editForm.skills.includes(skill)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditForm(prev => ({ 
                                  ...prev, 
                                  skills: [...prev.skills, skill] 
                                }));
                              } else {
                                setEditForm(prev => ({ 
                                  ...prev, 
                                  skills: prev.skills.filter(s => s !== skill) 
                                }));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{skill}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Work Preferences */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Ish sozlamalari</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mutaxassislik</label>
                  {isEditing ? (
                    <select
                      value={editForm.specialty}
                      onChange={(e) => setEditForm(prev => ({ ...prev, specialty: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="General Support">Umumiy yordam</option>
                      <option value="Technical Support">Texnik yordam</option>
                      <option value="Order Issues">Buyurtma muammolari</option>
                      <option value="Payment Issues">To'lov muammolari</option>
                      <option value="Delivery Issues">Yetkazish muammolari</option>
                    </select>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span>{editForm.specialty}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tajriba</label>
                  {isEditing ? (
                    <select
                      value={editForm.experience}
                      onChange={(e) => setEditForm(prev => ({ ...prev, experience: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="< 6 months">6 oydan kam</option>
                      <option value="6 months - 1 year">6 oy - 1 yil</option>
                      <option value="1-2 years">1-2 yil</option>
                      <option value="2-5 years">2-5 yil</option>
                      <option value="5+ years">5 yildan ortiq</option>
                    </select>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <span>{editForm.experience}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">So'nggi faoliyat</h3>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'warning' ? 'bg-yellow-500' :
                      activity.type === 'info' ? 'bg-blue-500' : 'bg-gray-400'
                    }`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Notifications */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Tizim xabarlari</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-xl border border-red-200">
                  <AlertCircle size={20} className="text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">3 ta kritik ticket</p>
                    <p className="text-sm text-red-700">24 soatdan ortiq kutilmoqda</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">Haftalik hisobot</p>
                    <p className="text-sm text-yellow-700">Juma kuni taqdim etish kerak</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Yangi funksiya</p>
                    <p className="text-sm text-blue-700">Chatbot yordamchisi qo'shildi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex justify-end space-x-4 mt-8">
            <button
              onClick={() => {
                setIsEditing(false);
                setAvatarPreview(null);
                setEditForm({
                  name: user.name || '',
                  phone: user.phone || '',
                  email: user.email || '',
                  address: user.address || '',
                  bio: user.bio || '',
                  department: user.department || 'Customer Support',
                  languages: user.languages || ['Uzbek', 'Russian'],
                  shift: user.shift || 'day',
                  avatar: null,
                  skills: user.skills || ['Customer Service', 'Problem Solving'],
                  experience: user.experience || '1 year',
                  specialty: user.specialty || 'General Support'
                });
              }}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorProfile;
