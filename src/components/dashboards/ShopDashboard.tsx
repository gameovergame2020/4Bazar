import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Users, Star, DollarSign, ShoppingCart, Eye, Edit, Trash2, Plus, Save, X, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { dataService, Cake, Order } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';

const ShopDashboard = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<Cake[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    todaySales: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalCustomers: 0
  });

  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Cake | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'birthday',
    quantity: '',
    discount: '',
    image: null as File | null
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
      loadData();

      // Real-time inventory kuzatish
      const unsubscribe = dataService.subscribeToRealtimeCakes((updatedCakes) => {
        const shopCakes = updatedCakes.filter(cake => cake.shopId === userData.id);
        setInventory(shopCakes);

        // Statistikani yangilash
        setStats(prev => ({
          ...prev,
          totalProducts: shopCakes.length,
          lowStockItems: shopCakes.filter(cake => (cake.quantity || 0) < 5).length
        }));
      }, { shopId: userData.id });

      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [userData]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load shop's products
      const products = await dataService.getCakes({ 
        shopId: userData.id,
        productType: 'ready'
      });
      setInventory(products);

      // Load orders for shop's products
      const allOrders = await dataService.getOrders();
      const shopOrders = allOrders.filter(order => 
        products.some(product => product.id === order.cakeId)
      );
      setOrders(shopOrders);

      // Calculate stats
      const totalProducts = products.length;
      const lowStockItems = products.filter(p => p.quantity && p.quantity < 5).length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = shopOrders.filter(order => 
        order.createdAt >= today && order.status === 'delivered'
      );
      const todaySales = todayOrders.length;
      const totalRevenue = shopOrders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + order.totalPrice, 0);

      const averageRating = products.length > 0 
        ? products.reduce((sum, product) => sum + product.rating, 0) / products.length 
        : 0;

      const uniqueCustomers = new Set(shopOrders.map(order => order.customerId)).size;

      setStats({
        totalProducts,
        lowStockItems,
        todaySales,
        totalRevenue,
        averageRating: Math.round(averageRating * 10) / 10,
        totalCustomers: uniqueCustomers
      });

    } catch (error) {
      console.error('Ma\'lumotlarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!productForm.name || !productForm.description || !productForm.price || !productForm.quantity) {
      alert('Barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    try {
      setLoading(true);

      let imageUrl = 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400';

      if (productForm.image) {
        const imagePath = `cakes/${userData.id}/${Date.now()}_${productForm.image.name}`;
        imageUrl = await dataService.uploadImage(productForm.image, imagePath);
      }

      const quantity = parseInt(productForm.quantity);

      const newProduct: Omit<Cake, 'id' | 'createdAt' | 'updatedAt'> = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        image: imageUrl,
        category: productForm.category,
        bakerId: '', // Shop mahsulotlari uchun baker kerak emas
        bakerName: '',
        shopId: userData.id,
        shopName: userData.name,
        productType: quantity > 0 ? 'ready' : 'baked',
        rating: 0,
        reviewCount: 0,
        available: quantity > 0,
        ingredients: [],
        quantity: quantity,
        amount: undefined, // Shop mahsulotlari uchun amount kerak emas
        discount: parseFloat(productForm.discount) || 0,
        inStockQuantity: 0 // Dastlab 0 - hech narsa sotilmagan
      };

      await dataService.addCake(newProduct);

      setProductForm({
        name: '',
        description: '',
        price: '',
        category: 'birthday',
        quantity: '',
        discount: '',
        image: null
      });
      setShowAddProductForm(false);

      await loadData();

    } catch (error) {
      console.error('Mahsulot qo\'shishda xatolik:', error);
      alert('Mahsulot qo\'shishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (productId: string, newQuantity: number) => {
    try {
      await dataService.updateCake(productId, { 
        quantity: newQuantity,
        available: newQuantity > 0
      });
      await loadData();
    } catch (error) {
      console.error('Zaxirani yangilashda xatolik:', error);
      alert('Zaxirani yangilashda xatolik yuz berdi');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Mahsulotni o\'chirishni xohlaysizmi?')) return;

    try {
      setLoading(true);
      await dataService.deleteCake(productId);
      await loadData();
    } catch (error) {
      console.error('Mahsulotni o\'chirishda xatolik:', error);
      alert('Mahsulotni o\'chirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const getStockStatus = (quantity?: number) => {
    if (!quantity || quantity === 0) return { text: 'Tugagan', color: 'text-red-600 bg-red-50' };
    if (quantity < 5) return { text: 'Kam qoldi', color: 'text-yellow-600 bg-yellow-50' };
    return { text: 'Mavjud', color: 'text-green-600 bg-green-50' };
  };

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    try {
      await dataService.updateCake(productId, { quantity: newQuantity });
    } catch (error) {
      console.error("Quantityni yangilashda xatolik", error);
    }
  };

  if (loading && inventory.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Do'kon boshqaruvi</h2>
        <p className="text-green-100">Mahsulotlar va sotuvlarni boshqaring</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              <p className="text-sm text-gray-600">Mahsulotlar</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
              <p className="text-sm text-gray-600">Kam qoldi</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingCart size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.todaySales}</p>
              <p className="text-sm text-gray-600">Bugungi sotuvlar</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{Math.round(stats.totalRevenue / 1000)}K</p>
              <p className="text-sm text-gray-600">Jami daromad</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Star size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
              <p className="text-sm text-gray-600">Reyting</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Users size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              <p className="text-sm text-gray-600">Mijozlar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Management */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Mahsulotlar zaxirasi</h3>
          <button
            onClick={() => setShowAddProductForm(true)}
            className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            <Plus size={16} />
            <span>Yangi mahsulot</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Mahsulot</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Kategoriya</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Narx</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Qoldi</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Sotilgan</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Holat</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((product) => {
                const stockStatus = getStockStatus(product.quantity);
                return (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <p className="text-sm text-gray-600 line-clamp-1">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                        {categories.find(cat => cat.value === product.category)?.label || product.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {formatPrice(product.price)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={product.quantity || 0}
                          onChange={async (e) => {
                            const newQuantity = parseInt(e.target.value) || 0;

                            try {
                              const updates = {
                                quantity: newQuantity,
                                // Quantity > 0 bo'lsa avtomatik mavjud, aks holda mavjud emas
                                available: newQuantity > 0
                              };

                              await dataService.updateCake(product.id!, updates);

                              // Local state ni yangilash
                              setInventory(prev => 
                                prev.map(item => 
                                  item.id === product.id 
                                    ? { ...item, ...updates }
                                    : item
                                )
                              );

                              // Status o'zgarishi haqida log
                              if (newQuantity > 0 && !product.available) {
                                console.log('✅ Shop mahsulot mavjud holatiga o\'tdi');
                              } else if (newQuantity === 0 && product.available) {
                                console.log('⚠️ Shop mahsulot tugadi');
                              }

                            } catch (error) {
                              console.error('Mahsulot holatini yangilashda xatolik:', error);
                            }
                          }}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                          min="0"
                        />
                        <span className="text-sm text-gray-500">ta</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <span className="font-medium text-orange-600">{product.inStockQuantity || 0} ta</span>
                        {(product.inStockQuantity || 0) > 0 && (
                          <div className="text-xs text-gray-500">yetkazilmagan</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.text}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button className="p-1 text-blue-600 hover:text-blue-700">
                          <Eye size={16} />
                        </button>
                        <button className="p-1 text-green-600 hover:text-green-700">
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id!)}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {inventory.length === 0 && (
            <div className="text-center py-8">
              <Package size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Hozircha mahsulotlar yo'q</p>
              <button
                onClick={() => setShowAddProductForm(true)}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Birinchi mahsulotingizni qo'shing
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">So'nggi buyurtmalar</h3>
        <div className="space-y-4">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">#{order.id?.slice(-6)} - {order.cakeName}</h4>
                  <p className="text-sm text-gray-600">Mijoz: {order.customerName}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                  order.status === 'preparing' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {order.status === 'delivered' ? 'Yetkazildi' :
                   order.status === 'preparing' ? 'Tayyorlanmoqda' : 'Kutilmoqda'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Miqdor: {order.quantity}</span>
                <span>Narx: {formatPrice(order.totalPrice)}</span>
                <span>Sana: {order.createdAt.toLocaleDateString('uz-UZ')}</span>
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-8">
              <ShoppingCart size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Hozircha buyurtmalar yo'q</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Form Modal */}
      {showAddProductForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Yangi mahsulot qo'shish</h3>
              <button
                onClick={() => setShowAddProductForm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mahsulot nomi *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Masalan: Shokoladli tort"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tavsif *</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Mahsulot haqida qisqacha ma'lumot"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Narx (so'm) *</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="250000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Miqdor *</label>
                  <input
                    type="number"
                    value={productForm.quantity}
                    onChange={(e) => setProductForm(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="10"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategoriya</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chegirma (%)</label>
                  <input
                    type="number"
                    value={productForm.discount}
                    onChange={(e) => setProductForm(prev => ({ ...prev, discount: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rasm</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.files?.[0] || null }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleAddProduct}
                  disabled={loading}
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Saqlash</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowAddProductForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopDashboard;