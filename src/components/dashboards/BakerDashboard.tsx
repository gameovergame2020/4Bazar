import React, { useState, useEffect } from 'react';
import { Plus, Package, Clock, TrendingUp, Users, Star, Edit, Trash2, Eye, EyeOff, CheckCircle, XCircle, Phone, MapPin, Calendar, DollarSign, Camera, Upload, Save, X, ShoppingBasket, Minus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { dataService, Cake, Order } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';

const BakerDashboard = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [myCakes, setMyCakes] = useState<Cake[]>([]);
  const [stats, setStats] = useState({
    pendingOrders: 0,
    totalProducts: 0,
    averageRating: 0,
    totalCustomers: 0,
    todayEarnings: 0,
    monthlyEarnings: 0
  });

  // Form states
  const [showAddCakeForm, setShowAddCakeForm] = useState(false);
  const [editingCake, setEditingCake] = useState<Cake | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [cakeForm, setCakeForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'birthday',
    ingredients: '',
    image: null as File | null,
    available: false,
    quantity: '',
    discount: ''
  });

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
      // Dastlab ma'lumotlarni yuklash
      loadData();

      // Real-time subscription o'rnatish
      let unsubscribe: (() => void) | undefined;
      let timeoutId: NodeJS.Timeout;
      
      // 3 soniyadan keyin real-time subscription o'rnatish
      timeoutId = setTimeout(() => {
        try {
          unsubscribe = dataService.subscribeToRealtimeCakes((updatedCakes) => {
            try {
              const bakerCakes = updatedCakes.filter(cake => cake.bakerId === userData.id);
              setMyCakes(bakerCakes);
              
              // Loading holatini to'xtatish
              setLoading(false);

              // Statistikani yangilash
              const pendingOrders = orders.filter(order => 
                ['pending', 'accepted', 'preparing'].includes(order.status) &&
                bakerCakes.some(cake => cake.id === order.cakeId)
              ).length;

              setStats(prev => ({
                ...prev,
                pendingOrders: pendingOrders,
                totalProducts: bakerCakes.length,
                averageRating: bakerCakes.length > 0 
                  ? Math.round((bakerCakes.reduce((sum, cake) => sum + (cake.rating || 0), 0) / bakerCakes.length) * 10) / 10
                  : 0
              }));
            } catch (error) {
              console.error('Real-time ma\'lumotlarni yangilashda xatolik:', error);
              setLoading(false);
            }
          }, { bakerId: userData.id });
        } catch (error) {
          console.error('Real-time obuna qilishda xatolik:', error);
          setLoading(false);
        }
      }, 3000);

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } else {
      setLoading(false);
    }
  }, [userData?.id]);

  const loadData = async () => {
    if (!userData?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Baker tortlarini yuklash
      const cakes = await dataService.getCakes({ 
        bakerId: userData.id,
        productType: 'baked'
      });
      
      setMyCakes(cakes || []);

      // Buyurtmalarni yuklash
      const allOrders = await dataService.getOrders();
      const bakerOrders = allOrders.filter(order => 
        cakes.some(cake => cake.id === order.cakeId)
      );
      setOrders(bakerOrders);

      // Statistikani hisoblash
      const pendingOrders = bakerOrders.filter(order => 
        ['pending', 'accepted', 'preparing'].includes(order.status)
      ).length;

      const totalProducts = cakes.length;
      const averageRating = cakes.length > 0 
        ? cakes.reduce((sum, cake) => sum + (cake.rating || 0), 0) / cakes.length 
        : 0;

      const uniqueCustomers = new Set(bakerOrders.map(order => order.customerId)).size;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = bakerOrders.filter(order => 
        order.createdAt >= today && order.status === 'delivered'
      );
      const todayEarnings = todayOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthlyOrders = bakerOrders.filter(order => 
        order.createdAt >= monthStart && order.status === 'delivered'
      );
      const monthlyEarnings = monthlyOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

      setStats({
        pendingOrders,
        totalProducts,
        averageRating: Math.round(averageRating * 10) / 10,
        totalCustomers: uniqueCustomers,
        todayEarnings,
        monthlyEarnings
      });

    } catch (error) {
      console.error('Ma\'lumotlarni yuklashda xatolik:', error);
      // Xatolik bo'lsa ham default qiymatlar o'rnatish
      setMyCakes([]);
      setOrders([]);
      setStats({
        pendingOrders: 0,
        totalProducts: 0,
        averageRating: 0,
        totalCustomers: 0,
        todayEarnings: 0,
        monthlyEarnings: 0
      });
    } finally {
      // 2 soniyadan keyin loading ni to'xtatish
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  };

  const handleAddCake = async () => {
    if (!cakeForm.name || !cakeForm.description || !cakeForm.price || (cakeForm.available && !cakeForm.quantity)) {
      alert('Barcha majburiy maydonlarni to\'ldiring (mavjud bo\'lsa soni ham kiritish kerak)');
      return;
    }

    if (!userData?.id || !userData?.name) {
      alert('Foydalanuvchi ma\'lumotlari topilmadi');
      return;
    }

    try {
      setLoading(true);

      let imageUrl = 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400';

      // Upload image if provided
      if (cakeForm.image) {
        const imagePath = `cakes/${userData.id}/${Date.now()}_${cakeForm.image.name}`;
        imageUrl = await dataService.uploadImage(cakeForm.image, imagePath);
      }

      const quantity = cakeForm.available ? parseInt(cakeForm.quantity) || 0 : 0;

      const newCake: Omit<Cake, 'id' | 'createdAt' | 'updatedAt'> = {
        name: cakeForm.name,
        description: cakeForm.description,
        price: parseFloat(cakeForm.price),
        image: imageUrl,
        category: cakeForm.category,
        bakerId: userData.id,
        bakerName: userData.name,
        productType: 'baked' as const,
        rating: 0,
        reviewCount: 0,
        available: quantity > 0 ? cakeForm.available : false, // Quantity 0 bo'lsa available = false  
        ingredients: cakeForm.ingredients.split(',').map(i => i.trim()).filter(i => i),
        quantity: quantity,
        discount: parseFloat(cakeForm.discount) || 0
      };

      // Agar quantity 0 bo'lsa, ogohlantirishni ko'rsatish
      if (cakeForm.available && quantity <= 0) {
        alert('Diqqat: Mahsulot soni 0 yoki kamroq bo\'lgani uchun avtomatik "Buyurtma uchun" rejimiga o\'tkazildi.');
      }

      await dataService.addCake(newCake);

      // Reset form
      setCakeForm({
        name: '',
        description: '',
        price: '',
        category: 'birthday',
        ingredients: '',
        image: null,
        available: false,
        quantity: '',
        discount: ''
      });
      setShowAddCakeForm(false);

      // Reload data
      await loadData();

    } catch (error) {
      console.error('Tort qo\'shishda xatolik:', error);
      alert('Tort qo\'shishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCake = async () => {
    if (!editingCake || !cakeForm.name || !cakeForm.description || !cakeForm.price || (cakeForm.available && !cakeForm.quantity)) {
      alert('Barcha majburiy maydonlarni to\'ldiring (mavjud bo\'lsa soni ham kiritish kerak)');
      return;
    }

    if (!userData?.id) {
      alert('Foydalanuvchi ma\'lumotlari topilmadi');
      return;
    }

    try {
      setLoading(true);

      let imageUrl = editingCake.image;

      // Upload new image if provided
      if (cakeForm.image) {
        const imagePath = `cakes/${userData.id}/${Date.now()}_${cakeForm.image.name}`;
        imageUrl = await dataService.uploadImage(cakeForm.image, imagePath);
      }

      const quantity = cakeForm.available ? parseInt(cakeForm.quantity) || 0 : 0;

      const updates: Partial<Cake> = {
        name: cakeForm.name,
        description: cakeForm.description,
        price: parseFloat(cakeForm.price),
        image: imageUrl,
        category: cakeForm.category,
        available: quantity > 0 ? cakeForm.available : false, // Quantity 0 bo'lsa available = false
        ingredients: cakeForm.ingredients.split(',').map(i => i.trim()).filter(i => i),
        quantity: quantity,
        discount: parseFloat(cakeForm.discount) || 0
      };

      // Agar quantity 0 bo'lsa, ogohlantirishni ko'rsatish
      if (cakeForm.available && quantity <= 0) {
        alert('Diqqat: Mahsulot soni 0 yoki kamroq bo\'lgani uchun avtomatik "Buyurtma uchun" rejimiga o\'tkazildi.');
      }

      await dataService.updateCake(editingCake.id!, updates);

      // Reset form
      setEditingCake(null);
      setCakeForm({
        name: '',
        description: '',
        price: '',
        category: 'birthday',
        ingredients: '',
        image: null,
        available: true,
        quantity: '',
        discount: ''
      });

      // Reload data
      await loadData();

    } catch (error) {
      console.error('Tortni yangilashda xatolik:', error);
      alert('Tortni yangilashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCake = async (cakeId: string) => {
    if (!confirm('Tortni o\'chirishni xohlaysizmi?')) return;

    try {
      setLoading(true);
      await dataService.deleteCake(cakeId);
      await loadData();
    } catch (error) {
      console.error('Tortni o\'chirishda xatolik:', error);
      alert('Tortni o\'chirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, status: Order['status']) => {
    try {
      await dataService.updateOrderStatus(orderId, status);

      const order = orders.find(o => o.id === orderId);

      // Agar buyurtma rad etilsa va mahsulot mavjud bo'lsa, sonini qaytarish
      if (status === 'cancelled' && order) {
        const cake = myCakes.find(c => c.id === order.cakeId);
        if (cake && cake.available && cake.quantity !== undefined) {
          await dataService.updateCake(order.cakeId, {
            quantity: cake.quantity + order.quantity
          });

          // Local state'dagi tort ma'lumotlarini yangilash
          setMyCakes(prev => 
            prev.map(c => 
              c.id === order.cakeId 
                ? { ...c, quantity: (c.quantity || 0) + order.quantity }
                : c
            )
          );
        }
      }

      // Agar buyurtma "Tayyor" holatiga o'tkazilsa, Baker mahsulotlari uchun buyurtma qilingan miqdorni kamaytirish
      if (status === 'ready' && order) {
        const cake = myCakes.find(c => c.id === order.cakeId);
        if (cake && (cake.productType === 'baked' || (cake.bakerId && !cake.shopId))) {
          // Baker mahsulotlari uchun buyurtma qilingan miqdorni kamaytirish
          // Bu real-time da avtomatik yangilanadi, chunki orders ro'yxati o'zgaradi
          console.log(`Buyurtma ${orderId} tayyor bo'ldi. Cake: ${cake.name}, Order quantity: ${order.quantity}`);
        }
      }

      // Buyurtma holatini local state'da yangilash
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status, updatedAt: new Date() } : order
        )
      );

      // Bildirishnoma yuborish
      if (order) {
        await notificationService.createOrderNotification(
          order.customerId,
          orderId,
          status,
          order.cakeName
        );
      }
    } catch (error) {
      console.error('Buyurtma holatini yangilashda xatolik:', error);
      alert('Buyurtma holatini yangilashda xatolik yuz berdi');
    }
  };

  const startEditCake = (cake: Cake) => {
    setEditingCake(cake);
    setCakeForm({
      name: cake.name,
      description: cake.description,
      price: cake.price.toString(),
      category: cake.category,
      ingredients: cake.ingredients.join(', '),
      image: null,
      available: cake.available,
      quantity: cake.quantity?.toString() || '0',
      discount: cake.discount?.toString() || '0'
    });
    setShowAddCakeForm(true);
  };

  const cancelEdit = () => {
    setEditingCake(null);
    setCakeForm({
      name: '',
      description: '',
      price: '',
      category: 'birthday',
      ingredients: '',
      image: null,
      available: false,
      quantity: '',
      discount: ''
    });
    setShowAddCakeForm(false);
  };

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

  // Loading holatini boshqarish
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        setLoading(false);
        console.warn('Loading timeout - ma\'lumotlar yuklash to\'xtatildi');
      }, 5000); // 5 soniya timeout

      return () => clearTimeout(timeoutId);
    }
  }, [loading]);

  if (loading && orders.length === 0 && myCakes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Ma'lumotlar yuklanmoqda...</p>
          <p className="text-sm text-gray-500 mt-2">Internet aloqasini tekshiring</p>
          <div className="flex space-x-2 mt-4">
            <button 
              onClick={() => {
                setLoading(false);
                setTimeout(() => loadData(), 100);
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Qayta urinish
            </button>
            <button 
              onClick={() => setLoading(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Bekor qilish
            </button>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              <p className="text-sm text-gray-600">Kutilayotgan</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              <p className="text-sm text-gray-600">Tortlar</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Star size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
              <p className="text-sm text-gray-600">Reyting</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              <p className="text-sm text-gray-600">Mijozlar</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{Math.round(stats.todayEarnings / 1000)}K</p>
              <p className="text-sm text-gray-600">Bugungi</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{Math.round(stats.monthlyEarnings / 1000)}K</p>
              <p className="text-sm text-gray-600">Oylik</p>
            </div>
          </div>
        </div>
      </div>

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
            .filter(order => ['pending', 'accepted', 'preparing'].includes(order.status))
            .slice(0, 5)
            .map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{order.cakeName}</h4>
                  <p className="text-sm text-gray-600">Mijoz: {order.customerName}</p>
                  <p className="text-sm text-gray-500">#{order.id?.slice(-6)}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Miqdor: {order.quantity}</span>
                  <span>Narx: {formatPrice(order.totalPrice)}</span>
                  <span>Sana: {order.createdAt.toLocaleDateString('uz-UZ')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Batafsil
                </button>
                <div className="flex space-x-2">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleOrderStatusUpdate(order.id!, 'accepted')}
                        className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition-colors"
                      >
                        Qabul qilish
                      </button>
                      <button
                        onClick={() => handleOrderStatusUpdate(order.id!, 'cancelled')}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors"
                      >
                        Rad etish
                      </button>
                    </>
                  )}
                  {order.status === 'accepted' && (
                    <button
                      onClick={() => handleOrderStatusUpdate(order.id!, 'preparing')}
                      className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-orange-600 transition-colors"
                    >
                      Tayyorlashni boshlash
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleOrderStatusUpdate(order.id!, 'ready')}
                      className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                    >
                      Tayyor
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {orders.filter(o => ['pending', 'accepted', 'preparing'].includes(o.status)).length === 0 && (
            <div className="text-center py-8">
              <Clock size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Kutilayotgan buyurtmalar yo'q</p>
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
            <div key={cake.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="relative mb-3">
                <img 
                  src={cake.image}
                  alt={cake.name}
                  className="w-full h-32 rounded-lg object-cover"
                />
                <div className="absolute top-2 right-2 flex flex-col items-end space-y-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    cake.available ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {cake.available ? 'Mavjud' : 'Buyurtma'}
                  </span>
                  {cake.available && cake.quantity !== undefined && cake.quantity <= 0 && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                      Tugagan
                    </span>
                  )}
                </div>
              </div>

              <h4 className="font-medium text-gray-900 mb-1">{cake.name}</h4>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{cake.description}</p>

              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900">{formatPrice(cake.price)}</span>
                <div className="flex items-center space-x-1">
                  <Star size={14} className="text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">{cake.rating}</span>
                  <span className="text-sm text-gray-500">({cake.reviewCount})</span>
                </div>
              </div>

              <div className="mb-3">
                {cake.available ? (
                  <div className="text-sm">
                    <span className="text-gray-600">
                      {cake.productType === 'baked' ? 'Buyurtma qilingan: ' : 'Qoldi: '}
                    </span>
                    <span className={`font-medium ${
                      cake.quantity !== undefined && cake.quantity <= 0 
                        ? 'text-red-600' 
                        : cake.quantity !== undefined && cake.quantity <= 5 
                          ? 'text-orange-600' 
                          : 'text-green-600'
                    }`}>
                      {cake.quantity !== undefined ? `${cake.quantity} ta` : 'Cheksiz'}
                    </span>
                    {cake.quantity !== undefined && cake.quantity <= 0 && (
                      <span className="block text-xs text-red-600 mt-1">
                        Avtomatik "Buyurtma uchun" ga o'tkazildi
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-sm">
                    <span className="text-blue-600 font-medium">Buyurtma uchun mavjud</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">

                <button
                  onClick={() => startEditCake(cake)}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1"
                >
                  <Edit size={14} />
                  <span>Tahrirlash</span>
                </button>
                <button
                  onClick={() => handleDeleteCake(cake.id!)}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 transition-colors flex items-center justify-center space-x-1"
                >
                  <Trash2 size={14} />
                  <span>O'chirish</span>
                </button>
              </div>
            </div>
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

      {/* Add/Edit Cake Form Modal */}
      {showAddCakeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCake ? 'Tortni tahrirlash' : 'Yangi tort qo\'shish'}
              </h3>
              <button
                onClick={cancelEdit}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tort nomi *</label>
                <input
                  type="text"
                  value={cakeForm.name}
                  onChange={(e) => setCakeForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Masalan: Shokoladli tort"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tavsif *</label>
                <textarea
                  value={cakeForm.description}
                  onChange={(e) => setCakeForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Tort haqida qisqacha ma'lumot"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Narx (so'm) *</label>
                  <input
                    type="number"
                    value={cakeForm.price}
                    onChange={(e) => setCakeForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="250000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chegirma (%)</label>
                  <input
                    type="number"
                    value={cakeForm.discount}
                    onChange={(e) => {
                      const value = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                      setCakeForm(prev => ({ ...prev, discount: value.toString() }));
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategoriya</label>
                  <select
                    value={cakeForm.category}
                    onChange={(e) => setCakeForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tarkibiy qismlar</label>
                <input
                  type="text"
                  value={cakeForm.ingredients}
                  onChange={(e) => setCakeForm(prev => ({ ...prev, ingredients: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Shokolad, un, tuxum, shakar (vergul bilan ajrating)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rasm</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCakeForm(prev => ({ ...prev, image: e.target.files?.[0] || null }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="available"
                      checked={cakeForm.available}
                      onChange={(e) => setCakeForm(prev => ({ 
                        ...prev, 
                        available: e.target.checked,
                        quantity: e.target.checked ? prev.quantity : '0'
                      }))}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="available" className="ml-2 block text-sm text-gray-900">
                      Hozir mavjud
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="customOrder"
                      checked={!cakeForm.available}
                      onChange={(e) => setCakeForm(prev => ({ 
                        ...prev, 
                        available: !e.target.checked,
                        quantity: e.target.checked ? '0' : prev.quantity
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="customOrder" className="ml-2 block text-sm text-gray-900">
                      Buyurtma uchun
                    </label>
                  </div>
                </div>

                {cakeForm.available && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mavjud tortlar soni *</label>
                    <input
                      type="number"
                      value={cakeForm.quantity}
                      onChange={(e) => setCakeForm(prev => ({ ...prev, quantity: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Mavjud tortlar soni"
                      min="1"
                      required
                    />
                  </div>
                )}
              </div>

              {!cakeForm.available && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Buyurtma rejimi:</span> Tort mavjud emas, lekin mijozlar buyurtma bera olishadi. Siz buyurtmani qabul qilganingizdan keyin tortni tayyorlaysiz.
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={editingCake ? handleEditCake : handleAddCake}
                  disabled={loading}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{editingCake ? 'Yangilash' : 'Saqlash'}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Buyurtma tafsilotlari</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{selectedOrder.cakeName}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Buyurtma ID:</span>
                    <span className="font-medium">#{selectedOrder.id?.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mijoz:</span>
                    <span className="font-medium">{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telefon:</span>
                    <span className="font-medium">{selectedOrder.customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Miqdor:</span>
                    <span className="font-medium">{selectedOrder.quantity} ta</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Narx:</span>
                    <span className="font-medium">{formatPrice(selectedOrder.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sana:</span>
                    <span className="font-medium">{selectedOrder.createdAt.toLocaleDateString('uz-UZ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Holat:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-2">Yetkazib berish manzili:</h5>
                <p className="text-sm text-gray-600">{selectedOrder.deliveryAddress}</p>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Qo'shimcha eslatma:</h5>
                  <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Yopish
                </button>
                <button className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1">
                  <Phone size={16} />
                  <span>Qo'ng'iroq</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BakerDashboard;