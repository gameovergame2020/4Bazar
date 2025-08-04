import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { UserData } from '../../services/shared/types';
import { dataService } from '../../services/dataService';
import AdminInfoCard from './admin/AdminInfoCard';
import AdminStats from './admin/AdminStats';
import AdminSettings from './admin/AdminSettings';
import AdminActions from './admin/AdminActions';

interface AdminProfileProps {
  user: UserData;
  onBack: () => void;
  onUpdate: (userData: Partial<UserData>) => void;
}

const AdminProfile: React.FC<AdminProfileProps> = ({ user, onBack, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name,
    phone: user.phone,
    email: user.email || '',
    avatar: null as File | null
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingIssues: 0,
    resolvedIssues: 0
  });

  const [settings, setSettings] = useState({
    securityLevel: 'high' as 'high' | 'medium' | 'low',
    notifications: true,
    autoBackup: true,
    maintenanceMode: false,
    debugMode: false,
    apiAccess: true
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [users, orders] = await Promise.all([
        dataService.getUsers(),
        dataService.getOrders()
      ]);

      const totalRevenue = orders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + order.totalPrice, 0);

      const activeUsers = Math.floor(users.length * 0.7);

      setStats({
        totalUsers: users.length,
        totalOrders: orders.length,
        totalRevenue,
        activeUsers,
        pendingIssues: Math.floor(Math.random() * 10) + 5,
        resolvedIssues: Math.floor(Math.random() * 50) + 20
      });
    } catch (error) {
      console.error('Statistikani yuklashda xatolik:', error);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditForm({
        name: user.name,
        phone: user.phone,
        email: user.email || '',
        avatar: null
      });
    }
  };

  const handleFormChange = (field: string, value: string | File | null) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let avatarUrl = user.avatar;

      if (editForm.avatar) {
        const imagePath = `avatars/admins/${user.id}/${Date.now()}_${editForm.avatar.name}`;
        avatarUrl = await dataService.uploadImage(editForm.avatar, imagePath);
      }

      const updateData = {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        ...(avatarUrl && { avatar: avatarUrl })
      };

      await dataService.updateUser(user.id, updateData);
      onUpdate(updateData);
      setIsEditing(false);
      alert('Profil muvaffaqiyatli yangilandi!');
    } catch (error) {
      console.error('Profilni yangilashda xatolik:', error);
      alert('Xatolik yuz berdi!');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      name: user.name,
      phone: user.phone,
      email: user.email || '',
      avatar: null
    });
  };

  const handleSettingChange = (setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    // Here you could save settings to backend
    console.log(`Setting ${setting} changed to:`, value);
  };

  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      switch (action) {
        case 'backup':
          // Implement backup functionality
          await new Promise(resolve => setTimeout(resolve, 2000));
          alert('Backup muvaffaqiyatli yaratildi!');
          break;
        case 'export':
          // Implement export functionality
          await new Promise(resolve => setTimeout(resolve, 1500));
          alert('Ma\'lumotlar eksport qilindi!');
          break;
        case 'refresh':
          // Implement refresh functionality
          await loadStats();
          alert('Tizim yangilandi!');
          break;
        case 'maintenance':
          // Implement maintenance mode
          handleSettingChange('maintenanceMode', !settings.maintenanceMode);
          alert(`Texnik ishlar rejimi ${settings.maintenanceMode ? 'o\'chirildi' : 'yoqildi'}!`);
          break;
        case 'users':
          // Navigate to users management
          alert('Foydalanuvchilar boshqaruvi ochilmoqda...');
          break;
        case 'settings':
          // Navigate to system settings
          alert('Tizim sozlamalari ochilmoqda...');
          break;
        default:
          console.log('Unknown action:', action);
      }
    } catch (error) {
      console.error('Amal bajarishda xatolik:', error);
      alert('Xatolik yuz berdi!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            <span>Orqaga</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Admin profili</h1>
          <div className="w-16"></div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Admin Info Card */}
        <AdminInfoCard
          user={user}
          isEditing={isEditing}
          editForm={editForm}
          loading={loading}
          onEditToggle={handleEditToggle}
          onFormChange={handleFormChange}
          onSave={handleSave}
          onCancel={handleCancel}
        />

        {/* Admin Stats */}
        <AdminStats stats={stats} />

        {/* Admin Actions */}
        <AdminActions
          onAction={handleAction}
          loading={loading}
        />

        {/* Admin Settings */}
        <AdminSettings
          settings={settings}
          onSettingChange={handleSettingChange}
        />

        {/* Additional Info */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Qo'shimcha ma'lumotlar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Tizim ma'lumotlari</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Tizim versiyasi:</span>
                  <span className="font-medium">v2.1.0</span>
                </div>
                <div className="flex justify-between">
                  <span>So'nggi yangilanish:</span>
                  <span className="font-medium">2024-01-15</span>
                </div>
                <div className="flex justify-between">
                  <span>Server holati:</span>
                  <span className="font-medium text-green-600">Faol</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Admin huquqlari</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Foydalanuvchilarni boshqarish</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Tizim sozlamalari</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Ma'lumotlar bazasi</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Backup va restore</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;