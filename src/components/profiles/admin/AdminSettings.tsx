
import React from 'react';
import { Shield, Bell, Lock, Globe, Database, Server } from 'lucide-react';

interface AdminSettingsProps {
  settings: {
    securityLevel: 'high' | 'medium' | 'low';
    notifications: boolean;
    autoBackup: boolean;
    maintenanceMode: boolean;
    debugMode: boolean;
    apiAccess: boolean;
  };
  onSettingChange: (setting: string, value: any) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ settings, onSettingChange }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tizim sozlamalari</h3>
      
      <div className="space-y-4">
        {/* Security Level */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield size={20} className="text-red-600" />
            <div>
              <h4 className="font-medium text-gray-900">Xavfsizlik darajasi</h4>
              <p className="text-sm text-gray-600">Tizim xavfsizlik sozlamalari</p>
            </div>
          </div>
          <select
            value={settings.securityLevel}
            onChange={(e) => onSettingChange('securityLevel', e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="high">Yuqori</option>
            <option value="medium">O'rta</option>
            <option value="low">Past</option>
          </select>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell size={20} className="text-blue-600" />
            <div>
              <h4 className="font-medium text-gray-900">Bildirishnomalar</h4>
              <p className="text-sm text-gray-600">Tizim hodisalari haqida xabar olish</p>
            </div>
          </div>
          <button
            onClick={() => onSettingChange('notifications', !settings.notifications)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.notifications ? 'bg-red-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.notifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Auto Backup */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database size={20} className="text-green-600" />
            <div>
              <h4 className="font-medium text-gray-900">Avtomatik backup</h4>
              <p className="text-sm text-gray-600">Kunlik ma'lumotlar zaxirasi</p>
            </div>
          </div>
          <button
            onClick={() => onSettingChange('autoBackup', !settings.autoBackup)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.autoBackup ? 'bg-red-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.autoBackup ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Maintenance Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Server size={20} className="text-orange-600" />
            <div>
              <h4 className="font-medium text-gray-900">Texnik ishlar rejimi</h4>
              <p className="text-sm text-gray-600">Tizimni vaqtincha to'xtatish</p>
            </div>
          </div>
          <button
            onClick={() => onSettingChange('maintenanceMode', !settings.maintenanceMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Debug Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Lock size={20} className="text-purple-600" />
            <div>
              <h4 className="font-medium text-gray-900">Debug rejimi</h4>
              <p className="text-sm text-gray-600">Tafsilotli log yozish</p>
            </div>
          </div>
          <button
            onClick={() => onSettingChange('debugMode', !settings.debugMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.debugMode ? 'bg-red-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.debugMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* API Access */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Globe size={20} className="text-indigo-600" />
            <div>
              <h4 className="font-medium text-gray-900">API kirish huquqi</h4>
              <p className="text-sm text-gray-600">Tashqi ilovalar uchun API</p>
            </div>
          </div>
          <button
            onClick={() => onSettingChange('apiAccess', !settings.apiAccess)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.apiAccess ? 'bg-red-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.apiAccess ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
