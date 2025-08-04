import React, { useState, useEffect } from 'react';
import { Plus, Clock, Package } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBakerOrders } from '../../hooks/useBakerOrders';
import { useProductStock } from '../../hooks/useProductStock';
import { useBakerStats } from '../../hooks/useBakerStats';
import { useBakerForm } from '../../hooks/useBakerForm';
import { dataService, Cake, Order } from '../../services/dataService';

// Components
import { StatsGrid } from '../baker/StatsGrid';
import { OrderCard } from '../baker/OrderCard';
import { ProductCard } from '../baker/ProductCard';
import { ProductForm } from '../baker/ProductForm';
import { OrderDetailsModal } from '../baker/OrderDetailsModal';

const BakerDashboard = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myCakes, setMyCakes] = useState<Cake[]>([]);

  const loadData = async () => {
    if (!userData?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const cakes = await dataService.getCakes({ 
        bakerId: userData.id,
        productType: 'baked'
      });

      setMyCakes(cakes || []);

      const allOrders = await dataService.getOrders();
      const bakerOrders = allOrders.filter(order => 
        cakes.some(cake => cake.id === order.cakeId)
      );
      setOrders(bakerOrders);

    } catch (error) {
      console.error('Ma\'lumotlarni yuklashda xatolik:', error);
      setMyCakes([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const cakeIds = myCakes.map(cake => cake.id!);
  const { orders, setOrders, selectedOrder, setSelectedOrder, handleOrderStatusUpdate } = useBakerOrders(userData?.id, cakeIds);
  const { updateProductQuantity } = useProductStock();
  const stats = useBakerStats(orders, myCakes);
  const {
    showAddCakeForm,
    setShowAddCakeForm,
    editingCake,
    cakeForm,
    setCakeForm,
    loading: formLoading,
    handleAddCake,
    handleEditCake,
    handleDeleteCake,
    startEditCake,
    resetForm
  } = useBakerForm(userData, loadData);

  const categories = [
    { value: 'birthday', label: "Tug'ilgan kun" },
    { value: 'wedding', label: 'Nikoh' },
    { value: 'anniversary', label: 'Yubiley' },
    { value: 'custom', label: 'Maxsus' },
    { value: 'cupcake', label: 'Cupcake' },
    { value: 'cheesecake', label: 'Cheesecake' }
  ];

  useEffect(() => {
    if (userData?.id) {
      loadData();

      const unsubscribe = dataService.subscribeToRealtimeCakes((updatedCakes) => {
        try {
          const bakerCakes = updatedCakes.filter(cake => cake.bakerId === userData.id);
          setMyCakes(bakerCakes);

          dataService.getOrders().then(allOrders => {
            const bakerOrders = allOrders.filter(order => 
              bakerCakes.some(cake => cake.id === order.cakeId)
            );
            setOrders(bakerOrders);
          }).catch(error => {
            console.error('Buyurtmalarni yangilashda xatolik:', error);
          });
        } catch (error) {
          console.error('Real-time ma\'lumotlarni yangilashda xatolik:', error);
        }
      }, { bakerId: userData.id });

      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } else {
      setLoading(false);
    }
  }, [userData?.id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-600';
      case 'accepted': return 'bg-blue-100 text-blue-600';
      case 'preparing': return 'bg-orange-100 text-orange-600';
      case 'ready': return 'bg-green-100 text-green-600';
      case 'delivering': return 'bg-purple-100 text-purple-600';
      case 'delivered': return 'bg-green-100 text-green-600';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Kutilmoqda';
      case 'accepted': return 'Qabul qilindi';
      case 'preparing': return 'Tayyorlanmoqda';
      case 'ready': return 'Tayyor';
      case 'delivering': return 'Yetkazilmoqda';
      case 'delivered': return 'Yetkazildi';
      case 'cancelled': return 'Bekor qilindi';
      default: return 'Noma\'lum';
    }
  };

  const handleProductQuantityUpdate = async (cakeId: string, quantity: number) => {
    try {
      await updateProductQuantity(cakeId, quantity, setMyCakes);
    } catch (error) {
      alert('Mahsulot miqdorini yangilashda xatolik yuz berdi');
    }
  };

  if (loading && orders.length === 0 && myCakes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">Ma'lumotlar yuklanmoqda</p>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Salom, {userData?.name}!</h2>
        <p className="text-orange-100">Tort tayyorlovchi panelingizga xush kelibsiz</p>
      </div>

      {/* Quick Stats */}
      <StatsGrid stats={stats} />

      {/* Pending Orders */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Kutilayotgan buyurtmalar</h3>
          <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
            {orders.filter(o => ['pending', 'accepted', 'preparing'].includes(o.status)).length} ta
          </span>
        </div>

        <div className="space-y-4">
          {orders
            .filter(order => ['accepted', 'preparing'].includes(order.status))
            .slice(0, 5)
            .map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={handleOrderStatusUpdate}
                onViewDetails={setSelectedOrder}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
                formatPrice={formatPrice}
              />
            ))}

          {orders.filter(o => ['accepted', 'preparing'].includes(o.status)).length === 0 && (
            <div className="text-center py-8">
              <Clock size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Kutilayotgan buyurtmalar yo'q</p>
              <p className="text-sm text-gray-400 mt-2">Operator tasdiqlagan buyurtmalar bu yerda ko'rsatiladi</p>
            </div>
          )}
        </div>
      </div>

      {/* My Products */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Mening tortlarim</h3>
          <button
            onClick={() => setShowAddCakeForm(true)}
            className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus size={16} />
            <span>Yangi tort</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myCakes.map((cake) => (
            <ProductCard
              key={cake.id}
              cake={cake}
              onEdit={startEditCake}
              onDelete={handleDeleteCake}
              onUpdateQuantity={handleProductQuantityUpdate}
              formatPrice={formatPrice}
            />
          ))}
        </div>

        {myCakes.length === 0 && (
          <div className="text-center py-8">
            <Package size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Hozircha tortlaringiz yo'q</p>
            <button
              onClick={() => setShowAddCakeForm(true)}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Birinchi tortingizni qo'shing
            </button>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      <ProductForm
        isOpen={showAddCakeForm}
        editingCake={editingCake}
        cakeForm={cakeForm}
        setCakeForm={setCakeForm}
        onSubmit={editingCake ? handleEditCake : handleAddCake}
        onCancel={resetForm}
        loading={formLoading}
        categories={categories}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
        formatPrice={formatPrice}
      />
    </div>
  );
};

export default BakerDashboard;