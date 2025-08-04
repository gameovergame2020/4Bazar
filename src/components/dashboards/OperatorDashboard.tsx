import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useOperatorData } from '../../hooks/useOperatorData';
import { useOrderManagement } from '../../hooks/useOrderManagement';
import { useOrderSearch } from '../../hooks/useOrderSearch';
import StatsCards from '../operator/StatsCards';
import SupportTicketsSection from '../operator/SupportTicketsSection';
import OrdersManagementSection from '../operator/OrdersManagementSection';
import EditOrderModal from '../operator/EditOrderModal';

const OperatorDashboard = () => {
  const { userData } = useAuth();

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

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Operator paneli</h2>
        <p className="text-yellow-100">Tizimni nazorat qiling va muammolarni hal qiling</p>
      </div>

      {/* Quick Stats */}
      <StatsCards stats={stats} onActiveIssuesClick={handleActiveIssuesClick} />

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
        editingOrder={editingOrder}
        orderItems={orderItems}
        newProductSearchQuery={newProductSearchQuery}
        editingCustomerInfo={editingCustomerInfo}
        availableCakes={availableCakes}
        onClose={() => {
          setEditingOrder(null);
          setOrderItems({});
          setNewProductSearchQuery('');
          setEditingCustomerInfo({
            customerId: '',
            customerName: '',
            customerPhone: '',
            deliveryAddress: ''
          });
        }}
        onSave={(availableCakes) => handleSaveOrderChanges(availableCakes)}
        onAddItem={(cakeId, availableCakes) => handleAddItemToOrder(cakeId, availableCakes)}
        onRemoveItem={handleRemoveItemFromOrder}
        setNewProductSearchQuery={setNewProductSearchQuery}
        setEditingCustomerInfo={setEditingCustomerInfo}
      />
    </div>
  );
};

export default OperatorDashboard;