import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProfileManager } from '../../hooks/useProfileManager';
import ProfileManager from '../ProfileManager';
import SettingsPage from '../SettingsPage';
import { User, LogOut, Settings } from 'lucide-react';
import { useOperatorData } from '../../hooks/useOperatorData';
import { useOrderManagement } from '../../hooks/useOrderManagement';
import { useOrderSearch } from '../../hooks/useOrderSearch';
import StatsCards from '../operator/StatsCards';
import SupportTicketsSection from '../operator/SupportTicketsSection';
import OrdersManagementSection from '../operator/OrdersManagementSection';
import EditOrderModal from '../operator/EditOrderModal';
import UserRatingModal from '../operator/UserRatingModal';

const OperatorDashboard = () => {
  const { userData, logout, updateUser } = useAuth();
  const { showProfile, profileType, openUserProfile, closeProfile } = useProfileManager();
  const [showSettings, setShowSettings] = useState(false);

  const {
    loading,
    orders,
    setOrders,
    systemAlerts,
    supportTickets,
    setSupportTickets,
    availableCakes,
    stats,
    loadData,
    handleResolveAlert,
    handleTicketStatusUpdate,
    handleOrderStatusUpdate
  } = useOperatorData(userData?.id);

  const {
    editingOrder,
    setEditingOrder,
    orderItems,
    setOrderItems,
    newProductSearchQuery,
    setNewProductSearchQuery,
    editingCustomerInfo,
    setEditingCustomerInfo,
    handleRemoveOrderItem,
    handleAddOrderNote,
    handleEditOrder,
    handleAddItemToOrder,
    handleRemoveItemFromOrder,
    handleSaveOrderChanges
  } = useOrderManagement(orders, setOrders, loadData);

  const {
    searchOrderId,
    setSearchOrderId,
    isSearching,
    searchResult,
    setSearchResult,
    handleSearchByOrderId
  } = useOrderSearch(setOrders);

  const [activeTab, setActiveTab] = useState<'orders' | 'support'>('orders');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showUserRatingModal, setShowUserRatingModal] = useState(false);

  const handleActiveIssuesClick = () => {
    const supportSection = document.getElementById('support-tickets-section');
    if (supportSection) {
      supportSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // Profil ko'rsatilsa, ProfileManager ni render qilish
  if (showProfile && profileType && userData) {
    return (
      <ProfileManager
        user={userData}
        profileType={profileType}
        onBack={closeProfile}
        onUpdate={updateUser}
      />
    );
  }

  // Sozlamalar ko'rsatilsa, SettingsPage ni render qilish  
  if (showSettings && userData) {
    return (
      <SettingsPage
        user={{
          id: userData.id,
          name: userData.name,
          email: userData.email || '',
          phone: userData.phone,
          avatar: userData.avatar || '',
          joinDate: userData.joinDate,
          totalOrders: 0,
          favoriteCount: 0
        }}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Operator paneli</h2>
            <p className="text-yellow-100">Tizimni nazorat qiling va muammolarni hal qiling</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => openUserProfile(userData)}
              className="flex items-center space-x-2 px-4 py-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
            >
              <User size={16} />
              <span>Profil</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center space-x-2 px-4 py-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
            >
              <Settings size={16} />
              <span>Sozlamalar</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>Chiqish</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <StatsCards 
          stats={stats} 
          onActiveIssuesClick={() => setActiveTab('support')}
          onUserRatingClick={() => setShowUserRatingModal(true)}
        />

      {/* Support Tickets */}
      <SupportTicketsSection 
        supportTickets={supportTickets}
        onTicketStatusUpdate={handleTicketStatusUpdate}
      />

      {/* Orders Management */}
      <OrdersManagementSection
        orders={orders}
        onStatusUpdate={handleOrderStatusUpdate}
        onOrderEdit={handleEditOrder}
        onRemoveOrder={handleRemoveOrderItem}
        onAddNote={handleAddOrderNote}
        onRefresh={loadData}
        searchOrderId={searchOrderId}
        setSearchOrderId={setSearchOrderId}
        isSearching={isSearching}
        searchResult={searchResult}
        onSearchByOrderId={handleSearchByOrderId}
      />

      {/* Edit Order Modal */}
      <EditOrderModal
        isOpen={!!editingOrder}
        order={editingOrder}
        onClose={() => setEditingOrder(null)}
        onSave={handleEditOrder}
      />

      <UserRatingModal
        isOpen={showUserRatingModal}
        onClose={() => setShowUserRatingModal(false)}
      />
    </div>
  );
};

export default OperatorDashboard;