
import React, { useState } from 'react';
import { Search, RefreshCw, Monitor, Eye, MessageCircle, AlertTriangle, CheckCircle, Phone, MapPin } from 'lucide-react';
import { Order } from '../../services/dataService';

interface OrdersManagementSectionProps {
  orders: Order[];
  onStatusUpdate: (orderId: string, status: Order['status']) => Promise<void>;
  onOrderEdit: (order: Order) => void;
  onRemoveOrder: (orderId: string) => Promise<void>;
  onAddNote: (orderId: string, note: string) => Promise<void>;
  onRefresh: () => void;
  searchOrderId: string;
  setSearchOrderId: (value: string) => void;
  isSearching: boolean;
  searchResult: { type: 'success' | 'error' | null; message: string; count: number };
  onSearchByOrderId: () => void;
}

const OrdersManagementSection: React.FC<OrdersManagementSectionProps> = ({
  orders,
  onStatusUpdate,
  onOrderEdit,
  onRemoveOrder,
  onAddNote,
  onRefresh,
  searchOrderId,
  setSearchOrderId,
  isSearching,
  searchResult,
  onSearchByOrderId
}) => {
  const [selectedOrderFilter, setSelectedOrderFilter] = useState('all');
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const getOrderStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-600';
      case 'accepted': return 'bg-blue-100 text-blue-600';
      case 'preparing': return 'bg-purple-100 text-purple-600';
      case 'ready': return 'bg-green-100 text-green-600';
      case 'delivering': return 'bg-indigo-100 text-indigo-600';
      case 'delivered': return 'bg-gray-100 text-gray-600';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getOrderStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Kutilmoqda';
      case 'accepted': return 'Qabul qilindi';
      case 'preparing': return 'Tayyorlanmoqda';
      case 'ready': return 'Tayyor';
      case 'delivering': return 'Yetkazilmoqda';
      case 'delivered': return 'Yetkazildi';
      case 'cancelled': return 'Bekor qilindi';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (selectedOrderFilter === 'all') return true;
    return order.status === selectedOrderFilter;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to first page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedOrderFilter, itemsPerPage]);

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Buyurtmalar boshqaruvi</h3>
        <div className="flex items-center space-x-3">
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value={10}>10 ta ko'rsatish</option>
            <option value={20}>20 ta ko'rsatish</option>
            <option value={50}>50 ta ko'rsatish</option>
          </select>
          <select
            value={selectedOrderFilter}
            onChange={(e) => setSelectedOrderFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="all">Barchasi</option>
            <option value="pending">Kutilmoqda</option>
            <option value="accepted">Qabul qilindi</option>
            <option value="preparing">Tayyorlanmoqda</option>
            <option value="ready">Tayyor</option>
            <option value="delivering">Yetkazilmoqda</option>
            <option value="delivered">Yetkazildi</option>
            <option value="cancelled">Bekor qilindi</option>
          </select>
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RefreshCw size={16} />
            <span>Yangilash</span>
          </button>
        </div>
      </div>

      {/* Search Orders */}
      <div className="mb-4 flex items-center space-x-2">
        <input
          type="text"
          value={searchOrderId}
          onChange={(e) => setSearchOrderId(e.target.value)}
          placeholder="Buyurtma ID sini kiriting (masalan: D9OAHZ7Z)..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => e.key === 'Enter' && onSearchByOrderId()}
        />
        <button
          onClick={onSearchByOrderId}
          disabled={isSearching}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
        >
          {isSearching ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Qidirilmoqda...</span>
            </>
          ) : (
            <>
              <Search size={16} />
              <span>ID bo'yicha qidirish</span>
            </>
          )}
        </button>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center space-x-2"
          title="Barcha buyurtmalarni ko'rsatish"
        >
          <RefreshCw size={16} />
          <span>Barchasi</span>
        </button>
      </div>

      {/* Search Result Message */}
      {searchResult.type && (
        <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
          searchResult.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {searchResult.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          <span className="text-sm font-medium">{searchResult.message}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">ID</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Mijoz</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Tort</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Summa</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Holat</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Sana</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Manzil</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map((order) => (
              <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">#{order.orderUniqueId || order.id?.slice(-6)}</td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-sm text-gray-600">{order.customerPhone}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-gray-900">{order.cakeName}</p>
                    <p className="text-sm text-gray-600">Miqdor: {order.quantity}</p>
                  </div>
                </td>
                <td className="py-3 px-4 font-medium text-gray-900">
                  {order.totalPrice.toLocaleString('uz-UZ')} so'm
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                    {getOrderStatusText(order.status)}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600 text-sm">
                  {order.createdAt.toLocaleDateString('uz-UZ')}
                  <br />
                  <span className="text-xs text-gray-500">
                    {order.createdAt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {order.deliveryAddress}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <button
                      onClick={() => setSelectedOrderForDetails(order)}
                      className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                      title="Tafsilotlar"
                    >
                      <Eye size={16} />
                    </button>

                    {order.status === 'accepted' && (
                      <button
                        onClick={() => onStatusUpdate(order.id!, 'preparing')}
                        className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors"
                      >
                        Tayyorlashga yuborish
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => onStatusUpdate(order.id!, 'delivering')}
                        className="px-2 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600 transition-colors"
                      >
                        Yetkazishga yuborish
                      </button>
                    )}

                    <button
                      onClick={() => {
                        const note = prompt('Buyurtmaga eslatma qo\'shing:');
                        if (note && note.trim()) {
                          onAddNote(order.id!, note.trim());
                        }
                      }}
                      className="p-1 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded transition-colors"
                      title="Eslatma qo'shish"
                    >
                      <MessageCircle size={16} />
                    </button>

                    {['pending', 'accepted', 'preparing'].includes(order.status) && (
                      <button
                        onClick={() => onRemoveOrder(order.id!)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Buyurtmani o'chirish"
                      >
                        <AlertTriangle size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-8">
            <Monitor size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {selectedOrderFilter !== 'all' 
                ? `${getOrderStatusText(selectedOrderFilter as Order['status'])} buyurtmalar topilmadi` 
                : 'Hozircha buyurtmalar yo\'q'
              }
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredOrders.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4 py-3 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} / {filteredOrders.length} buyurtma
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Oldingi
            </button>
            
            <div className="flex items-center space-x-1">
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                const isCurrentPage = pageNumber === currentPage;
                
                // Show first page, last page, current page, and pages around current page
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-3 py-1 text-sm font-medium rounded-md ${
                        isCurrentPage
                          ? 'bg-yellow-500 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (
                  pageNumber === currentPage - 2 ||
                  pageNumber === currentPage + 2
                ) {
                  return (
                    <span key={pageNumber} className="px-2 py-1 text-sm text-gray-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Keyingi
            </button>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrderForDetails && (
        <OrderDetailsModal 
          order={selectedOrderForDetails}
          onClose={() => setSelectedOrderForDetails(null)}
          onStatusUpdate={onStatusUpdate}
          onEdit={onOrderEdit}
          getOrderStatusColor={getOrderStatusColor}
          getOrderStatusText={getOrderStatusText}
        />
      )}
    </div>
  );
};

// Order Details Modal Component
interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: Order['status']) => Promise<void>;
  onEdit: (order: Order) => void;
  getOrderStatusColor: (status: Order['status']) => string;
  getOrderStatusText: (status: Order['status']) => string;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  onStatusUpdate,
  onEdit,
  getOrderStatusColor,
  getOrderStatusText
}) => {
  const [userOrders, setUserOrders] = React.useState<Order[]>([]);
  const [loadingUserOrders, setLoadingUserOrders] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'order' | 'customer'>('order');
  const [yandexMap, setYandexMap] = React.useState<any>(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const mapRef = React.useRef<HTMLDivElement>(null);

  // Foydalanuvchining boshqa buyurtmalarini yuklash
  React.useEffect(() => {
    const loadUserOrders = async () => {
      if (!order.customerId || activeTab !== 'customer') return;
      
      setLoadingUserOrders(true);
      try {
        const { orderService } = await import('../../services/orderService');
        const orders = await orderService.getOrdersByUserId(order.customerId);
        
        // Hozirgi buyurtmani chiqarib tashlash
        const otherOrders = orders.filter(o => o.id !== order.id);
        setUserOrders(otherOrders);
      } catch (error) {
        console.error('Foydalanuvchi buyurtmalarini yuklashda xato:', error);
        setUserOrders([]);
      } finally {
        setLoadingUserOrders(false);
      }
    };

    loadUserOrders();
  }, [order.customerId, order.id, activeTab]);

  // Xaritani yuklash
  const initializeMap = async () => {
    if (!order.coordinates || !mapRef.current || mapLoaded) return;

    try {
      const { yandexMapsService } = await import('../../services/yandexMapsService');
      await yandexMapsService.loadYandexMaps();

      if (!window.ymaps) return;

      window.ymaps.ready(() => {
        if (!mapRef.current) return;

        const map = new window.ymaps.Map(mapRef.current, {
          center: [order.coordinates.lat, order.coordinates.lng],
          zoom: 16,
          controls: ['zoomControl']
        });

        const placemark = new window.ymaps.Placemark(
          [order.coordinates.lat, order.coordinates.lng],
          {
            hintContent: 'Yetkazib berish manzili',
            balloonContent: `
              <div style="padding: 10px;">
                <strong>Yetkazib berish manzili:</strong><br>
                ${order.deliveryAddress}<br><br>
                <strong>Mijoz:</strong> ${order.customerName}<br>
                <strong>Telefon:</strong> ${order.customerPhone}
              </div>
            `
          },
          {
            preset: 'islands#redIcon'
          }
        );

        map.geoObjects.add(placemark);
        setYandexMap(map);
        setMapLoaded(true);
      });
    } catch (error) {
      console.error('Xaritani yuklashda xato:', error);
    }
  };

  // Xaritani yuklash
  React.useEffect(() => {
    if (activeTab === 'order' && order.coordinates) {
      setTimeout(initializeMap, 100);
    }
  }, [activeTab, order.coordinates]);

  // Component o'chirilganda xaritani tozalash
  React.useEffect(() => {
    return () => {
      if (yandexMap) {
        try {
          yandexMap.destroy();
        } catch (error) {
          console.warn('Xaritani tozalashda xato:', error);
        }
      }
    };
  }, [yandexMap]);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Buyurtma tafsilotlari</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('order')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'order'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Buyurtma ma'lumotlari
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'customer'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Mijoz haqida
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'order' ? (
            // Buyurtma ma'lumotlari tab
            <>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{order.cakeName}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Buyurtma ID:</span>
                <span className="font-medium">#{order.orderUniqueId || order.id?.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mijoz:</span>
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Telefon:</span>
                <span className="font-medium">{order.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Miqdor:</span>
                <span className="font-medium">{order.quantity} dona</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Jami summa:</span>
                <span className="font-medium">{order.totalPrice.toLocaleString('uz-UZ')} so'm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Holat:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                  {getOrderStatusText(order.status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Yaratildi:</span>
                <span className="font-medium">
                  {order.createdAt.toLocaleDateString('uz-UZ')} {order.createdAt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-gray-900">Yetkazib berish manzili:</h5>
              {order.coordinates && (
                <button
                  onClick={() => {
                    const coords = order.coordinates;
                    if (coords && coords.lat && coords.lng) {
                      window.open(`https://yandex.uz/maps/?pt=${coords.lng},${coords.lat}&z=16&l=map`, '_blank');
                    }
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                  title="Xaritada ko'rish"
                >
                  <MapPin size={14} />
                  <span>Xaritada ko'rish</span>
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {order.deliveryAddress}
            </p>
            {order.coordinates && (
              <div className="mt-2 text-xs text-gray-500">
                📍 Koordinatalar: {order.coordinates.lat?.toFixed(6)}, {order.coordinates.lng?.toFixed(6)}
              </div>
            )}

            {/* Xarita */}
            {order.coordinates && (
              <div className="mt-4">
                <h6 className="font-medium text-gray-900 mb-3">Xaritada joylashuv:</h6>
                <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <div 
                    ref={mapRef}
                    className="w-full h-64"
                    style={{ minHeight: '256px' }}
                  />
                  {!mapLoaded && order.coordinates && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Xarita yuklanmoqda...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {order.notes && (
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Qo'shimcha eslatma:</h5>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {order.notes}
              </p>
            </div>
          )}

          <div className="space-y-2 pt-4">
            {/* Status-specific buttons */}
            {order.status === 'pending' && (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onEdit(order);
                    onClose();
                  }}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  ✎ Buyurtmani tahrirlash
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      onStatusUpdate(order.id!, 'accepted');
                      onClose();
                    }}
                    className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Tasdiqlash</span>
                  </button>
                  <button
                    onClick={() => {
                      onStatusUpdate(order.id!, 'cancelled');
                      onClose();
                    }}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Rad etish</span>
                  </button>
                </div>
              </div>
            )}

            {order.status === 'accepted' && (
              <button 
                onClick={() => {
                  onStatusUpdate(order.id!, 'preparing');
                  onClose();
                }}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Tayyorlanishga yuborish
              </button>
            )}

            {order.status === 'preparing' && (
              <button 
                onClick={() => {
                  onStatusUpdate(order.id!, 'ready');
                  onClose();
                }}
                className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors"
              >
                Tayyor deb belgilash
              </button>
            )}

            {order.status === 'ready' && (
              <button 
                onClick={() => {
                  onStatusUpdate(order.id!, 'delivering');
                  onClose();
                }}
                className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Yetkazib berishga yuborish
              </button>
            )}

            <button 
              onClick={() => window.open(`tel:${order.customerPhone}`, '_self')}
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-1"
            >
              <Phone size={16} />
              <span>Qo'ng'iroq</span>
            </button>
          </div>
            </>
          ) : (
            // Mijoz haqida tab
            <div className="space-y-6">
              {/* Mijoz ma'lumotlari */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{order.customerName}</h3>
                    <p className="text-blue-600 font-medium">{order.customerPhone}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <div className="text-sm text-gray-600 mb-1">Mijoz ID</div>
                    <div className="font-mono text-sm text-gray-800">{order.customerId?.slice(-8) || 'N/A'}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <div className="text-sm text-gray-600 mb-1">Oxirgi buyurtma</div>
                    <div className="font-medium text-gray-800">
                      {order.createdAt.toLocaleDateString('uz-UZ')}
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-white rounded-lg p-4 border border-blue-100">
                  <div className="text-sm text-gray-600 mb-1">Yetkazib berish manzili</div>
                  <div className="text-gray-800">{order.deliveryAddress}</div>
                  {order.coordinates && (
                    <button
                      onClick={() => {
                        const coords = order.coordinates;
                        if (coords && coords.lat && coords.lng) {
                          window.open(`https://yandex.uz/maps/?pt=${coords.lng},${coords.lat}&z=16&l=map`, '_blank');
                        }
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <MapPin size={14} />
                      <span>Xaritada ko'rish</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Boshqa buyurtmalar */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Boshqa buyurtmalar</h4>
                  {loadingUserOrders && (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                      <span className="text-sm">Yuklanmoqda...</span>
                    </div>
                  )}
                </div>

                {loadingUserOrders ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto"></div>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m-2 0v5a2 2 0 002 2h2" />
                    </svg>
                    <p className="text-gray-500 font-medium">Boshqa buyurtmalar topilmadi</p>
                    <p className="text-sm text-gray-400 mt-1">Bu mijozning birinchi buyurtmasi</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {userOrders.slice(0, 10).map((userOrder) => (
                      <div key={userOrder.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="font-medium text-gray-900">#{userOrder.orderUniqueId || userOrder.id?.slice(-6)}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(userOrder.status)}`}>
                                {getOrderStatusText(userOrder.status)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 font-medium">{userOrder.cakeName}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm text-gray-600">{userOrder.quantity} ta</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {userOrder.totalPrice.toLocaleString('uz-UZ')} so'm
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              {userOrder.createdAt.toLocaleDateString('uz-UZ')}
                            </div>
                            <div className="text-xs text-gray-400">
                              {userOrder.createdAt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {userOrders.length > 10 && (
                      <div className="text-center py-2">
                        <span className="text-sm text-gray-500">
                          Yana {userOrders.length - 10} ta buyurtma bor...
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Mijoz statistikasi */}
                {userOrders.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                      <div className="text-sm text-green-600 font-medium">Jami buyurtmalar</div>
                      <div className="text-2xl font-bold text-green-800">{userOrders.length + 1}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="text-sm text-blue-600 font-medium">Jami sarflanma</div>
                      <div className="text-2xl font-bold text-blue-800">
                        {(userOrders.reduce((sum, o) => sum + o.totalPrice, 0) + order.totalPrice).toLocaleString('uz-UZ')} so'm
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                      <div className="text-sm text-purple-600 font-medium">O'rtacha buyurtma</div>
                      <div className="text-2xl font-bold text-purple-800">
                        {Math.round((userOrders.reduce((sum, o) => sum + o.totalPrice, 0) + order.totalPrice) / (userOrders.length + 1)).toLocaleString('uz-UZ')} so'm
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersManagementSection;
