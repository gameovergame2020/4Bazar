
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { dataService } from '../../services/dataService';
import { yandexMapsService } from '../../services/yandexMapsService';
import {
  Package,
  MapPin,
  Navigation,
  Phone,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Star,
  User,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  coordinates?: [number, number];
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'ready' | 'delivering' | 'delivered';
  orderTime: string;
  priority: 'normal' | 'urgent';
  distance?: string;
  estimatedTime?: string;
  deliveryFee: number;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

const CourierDashboard = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [yandexMap, setYandexMap] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState({
    todayDeliveries: 8,
    activeOrders: 2,
    averageRating: 4.8,
    todayEarnings: 144000
  });

  // Ma'lumotlarni yuklash
  useEffect(() => {
    loadDashboardData();
    initializeMap();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Demo ma'lumotlar
      const mockActiveOrders: Order[] = [
        {
          id: 'ORD001',
          customerName: 'Aziz Karimov',
          customerPhone: '+998901234567',
          address: 'Toshkent sh., Yunusobod t., 15-mavze, 23-uy',
          coordinates: [41.3158, 69.2798],
          items: [
            { id: '1', name: 'Shokoladli tort', quantity: 1, price: 250000 }
          ],
          total: 268000,
          status: 'ready',
          orderTime: new Date().toISOString(),
          priority: 'urgent',
          distance: '2.5 km',
          deliveryFee: 18000
        },
        {
          id: 'ORD002',
          customerName: 'Malika Toshmatova',
          customerPhone: '+998901234568',
          address: 'Toshkent sh., Mirzo Ulugbek t., 8-mavze, 45-uy',
          coordinates: [41.2856, 69.2034],
          items: [
            { id: '2', name: 'Mevali tort', quantity: 2, price: 180000 }
          ],
          total: 378000,
          status: 'delivering',
          orderTime: new Date(Date.now() - 3600000).toISOString(),
          priority: 'normal',
          distance: '4.1 km',
          deliveryFee: 18000
        }
      ];

      setActiveOrders(mockActiveOrders);
      if (mockActiveOrders.length > 0) {
        setSelectedOrder(mockActiveOrders[0]);
      }

    } catch (error) {
      console.error('Ma\'lumotlarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = async () => {
    try {
      await yandexMapsService.loadYandexMaps();
      
      if (mapRef.current && window.ymaps) {
        window.ymaps.ready(() => {
          const map = new window.ymaps.Map(mapRef.current, {
            center: [41.2995, 69.2401], // Toshkent markazi
            zoom: 12,
            controls: ['zoomControl', 'fullscreenControl', 'geolocationControl', 'routeButtonControl']
          });

          // Kuryer joylashuvi (demo)
          const courierPlacemark = new window.ymaps.Placemark([41.2995, 69.2401], {
            balloonContent: `<strong>${userData?.name || 'Kuryer'}</strong><br/>Hozirgi joylashuv`,
            type: 'courier'
          }, {
            preset: 'islands#blueCircleDotIcon'
          });

          map.geoObjects.add(courierPlacemark);
          setYandexMap(map);
          setMapLoaded(true);

          // Barcha faol buyurtmalarni xaritaga qo'shish
          setTimeout(() => {
            activeOrders.forEach(order => {
              if (order.coordinates) {
                const orderPlacemark = new window.ymaps.Placemark(order.coordinates, {
                  balloonContent: `
                    <div style="padding: 10px;">
                      <strong>${order.customerName}</strong><br/>
                      <small>${order.id}</small><br/>
                      ${order.address}<br/>
                      <strong>${formatPrice(order.total)}</strong><br/>
                      <span style="color: ${order.priority === 'urgent' ? '#ef4444' : '#059669'};">
                        ${order.priority === 'urgent' ? 'Shoshilinch' : 'Oddiy'}
                      </span>
                    </div>
                  `,
                  type: 'order'
                }, {
                  preset: order.priority === 'urgent' ? 'islands#redIcon' : 'islands#greenIcon'
                });

                map.geoObjects.add(orderPlacemark);
              }
            });

            // Xaritani barcha buyurtmalarni qamrab olish uchun sozlash
            if (activeOrders.length > 0) {
              const bounds = [[41.2995, 69.2401]]; // Kuryer joylashuvi
              activeOrders.forEach(order => {
                if (order.coordinates) {
                  bounds.push(order.coordinates);
                }
              });
              
              if (bounds.length > 1) {
                map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 });
              }
            }
          }, 500);
        });
      }
    } catch (error) {
      console.error('Xaritani yuklashda xatolik:', error);
    }
  };

  const addOrderToMap = (order: Order) => {
    if (yandexMap && order.coordinates) {
      // Eski belgilarni tozalash (buyurtma belgilari va yo'llarni)
      yandexMap.geoObjects.each((geoObject: any) => {
        if (geoObject.properties && (geoObject.properties.get('type') === 'order' || geoObject.properties.get('type') === 'route')) {
          yandexMap.geoObjects.remove(geoObject);
        }
      });

      // Yangi buyurtma belgisini qo'shish
      const orderPlacemark = new window.ymaps.Placemark(order.coordinates, {
        balloonContent: `
          <div style="padding: 10px;">
            <strong>${order.customerName}</strong><br/>
            <small>${order.id}</small><br/>
            ${order.address}<br/>
            <strong>${formatPrice(order.total)}</strong><br/>
            <span style="color: ${order.priority === 'urgent' ? '#ef4444' : '#059669'};">
              ${order.priority === 'urgent' ? 'Shoshilinch' : 'Oddiy'}
            </span>
          </div>
        `,
        type: 'order'
      }, {
        preset: order.priority === 'urgent' ? 'islands#redIcon' : 'islands#greenIcon'
      });

      yandexMap.geoObjects.add(orderPlacemark);
      
      // Xaritani buyurtma joylashuviga yo'naltirish
      yandexMap.setCenter(order.coordinates, 15);
    }
  };

  const calculateAndShowRoute = async (order: Order) => {
    if (!yandexMap || !order.coordinates) return;

    try {
      // Kuryer joylashuvi (demo - haqiqatda GPS dan olinadi)
      const courierLocation = [41.2995, 69.2401];
      
      // Yo'lni hisoblash
      const route = new window.ymaps.multiRouter.MultiRoute({
        referencePoints: [
          courierLocation,
          order.coordinates
        ],
        params: {
          routingMode: 'auto'
        }
      }, {
        boundsAutoApply: true,
        routeActiveStrokeWidth: 6,
        routeActiveStrokeColor: '#4f46e5'
      });

      // Yo'l ma'lumotlarini olish
      route.model.events.add('requestsuccess', () => {
        const activeRoute = route.getActiveRoute();
        if (activeRoute) {
          const distance = Math.round(activeRoute.properties.get('distance').value / 1000 * 10) / 10;
          const duration = Math.round(activeRoute.properties.get('duration').value / 60);
          
          // Buyurtma ma'lumotlarini yangilash
          setActiveOrders(prev => prev.map(o => 
            o.id === order.id 
              ? { ...o, distance: `${distance} km`, estimatedTime: `${duration} min` }
              : o
          ));

          console.log(`Masofa: ${distance} km, Vaqt: ${duration} daqiqa`);
        }
      });

      // Xaritaga yo'lni qo'shish
      route.properties.set('type', 'route');
      yandexMap.geoObjects.add(route);

    } catch (error) {
      console.error('Yo\'lni hisoblashda xato:', error);
    }
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    addOrderToMap(order);
  };

  const handleStatusToggle = () => {
    setIsOnline(!isOnline);
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    const updatedOrders = activeOrders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setActiveOrders(updatedOrders);

    // Agar buyurtma "delivering" holatiga o'tkazilsa, yo'lni hisoblash
    if (newStatus === 'delivering') {
      const order = updatedOrders.find(o => o.id === orderId);
      if (order) {
        await calculateAndShowRoute(order);
      }
    }

    if (newStatus === 'delivered') {
      setActiveOrders(prev => prev.filter(order => order.id !== orderId));
      if (selectedOrder?.id === orderId) {
        const remainingOrders = updatedOrders.filter(order => order.id !== orderId);
        setSelectedOrder(remainingOrders.length > 0 ? remainingOrders[0] : null);
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Xarita yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-white to-slate-50 rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img 
                  src={userData?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100'}
                  alt={userData?.name}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md"
                />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}>
                  {isOnline && <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{userData?.name}</h2>
                <div className="flex items-center space-x-2 text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isOnline ? 'Faol' : 'Nofaol'}
                  </span>
                  <span className="text-slate-500">•</span>
                  <div className="flex items-center space-x-1">
                    <Star size={12} className="text-yellow-400 fill-current" />
                    <span className="text-slate-600">{stats.averageRating}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleStatusToggle}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isOnline 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isOnline ? <Pause size={16} /> : <Play size={16} />}
              <span className="hidden sm:inline">{isOnline ? 'To\'xtatish' : 'Boshlash'}</span>
            </button>
          </div>
        </div>

        {/* Asosiy kontent - Map va Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Xarita */}
          <div className="lg:col-span-2 h-96 lg:h-[600px] relative bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div 
              ref={mapRef} 
              className="w-full h-full"
              style={{ minHeight: '400px' }}
            />
            
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-slate-600 text-sm">Xarita yuklanmoqda...</p>
                </div>
              </div>
            )}
          </div>

          {/* Buyurtmalar paneli */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Faol buyurtmalar</h3>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {activeOrders.length}
                </span>
                <button
                  onClick={loadDashboardData}
                  className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {activeOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Buyurtma yo'q</p>
                </div>
              ) : (
                activeOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedOrder?.id === order.id 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                    onClick={() => handleOrderSelect(order)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-slate-900 text-sm">{order.customerName}</h4>
                          {order.priority === 'urgent' && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                              Shoshilinch
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mb-1">#{order.id}</p>
                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          <MapPin size={10} />
                          <span>{order.distance}</span>
                          {order.estimatedTime && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600">{order.estimatedTime}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className={order.status === 'ready' ? 'text-green-600' : 'text-blue-600'}>
                            {order.status === 'ready' ? 'Tayyor' : 'Yetkazilmoqda'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900">{Math.round(order.total / 1000)}K</span>
                      </div>
                    </div>

                    {/* Buyurtma amallar */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="flex items-center justify-center space-x-1 px-2 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone size={12} />
                        <span>Tel</span>
                      </a>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://maps.google.com/maps?q=${encodeURIComponent(order.address)}`, '_blank');
                        }}
                        className="flex items-center justify-center space-x-1 px-2 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-all"
                      >
                        <Navigation size={12} />
                        <span>Yo'l</span>
                      </button>

                      {order.status === 'ready' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            calculateAndShowRoute(order);
                            handleOrderStatusUpdate(order.id, 'delivering');
                          }}
                          className="flex items-center justify-center space-x-1 px-2 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-medium transition-all"
                        >
                          <Play size={12} />
                          <span>Start</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderStatusUpdate(order.id, 'delivered');
                          }}
                          className="flex items-center justify-center space-x-1 px-2 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition-all"
                        >
                          <CheckCircle size={12} />
                          <span>Done</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tanlangan buyurtma tafsilotlari */}
            {selectedOrder && (
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border">
                <h4 className="font-medium text-slate-900 mb-2 text-sm">Buyurtma tafsilotlari</h4>
                <div className="space-y-1 text-xs text-slate-600">
                  <p><MapPin size={10} className="inline mr-1" />{selectedOrder.address}</p>
                  <p><Package size={10} className="inline mr-1" />
                    {selectedOrder.items.map((item, index) => (
                      <span key={item.id}>
                        {item.quantity}x {item.name}
                        {index < selectedOrder.items.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>
                  <p className="font-medium text-slate-900">{formatPrice(selectedOrder.total)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        
      </div>
    </div>
  );
          <div className="bg-gradient-to-r from-white to-slate-50 rounded-2xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img 
                    src={userData?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100'}
                    alt={userData?.name}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md"
                  />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}>
                    {isOnline && <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>}
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{userData?.name}</h2>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isOnline ? 'Faol' : 'Nofaol'}
                    </span>
                    <span className="text-slate-500">•</span>
                    <div className="flex items-center space-x-1">
                      <Star size={12} className="text-yellow-400 fill-current" />
                      <span className="text-slate-600">{stats.averageRating}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleStatusToggle}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isOnline 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isOnline ? <Pause size={16} /> : <Play size={16} />}
                <span className="hidden sm:inline">{isOnline ? 'To\'xtatish' : 'Boshlash'}</span>
              </button>
            </div>
          </div>
        )}

        
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Faol buyurtmalar</h3>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {activeOrders.length}
                </span>
                <button
                  onClick={loadDashboardData}
                  className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {activeOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Buyurtma yo'q</p>
                </div>
              ) : (
                activeOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedOrder?.id === order.id 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                    onClick={() => handleOrderSelect(order)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-slate-900 text-sm">{order.customerName}</h4>
                          {order.priority === 'urgent' && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                              Shoshilinch
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mb-1">#{order.id}</p>
                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          <MapPin size={10} />
                          <span>{order.distance}</span>
                          {order.estimatedTime && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600">{order.estimatedTime}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className={order.status === 'ready' ? 'text-green-600' : 'text-blue-600'}>
                            {order.status === 'ready' ? 'Tayyor' : 'Yetkazilmoqda'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900">{Math.round(order.total / 1000)}K</span>
                      </div>
                    </div>

                    {/* Buyurtma amallar */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="flex items-center justify-center space-x-1 px-2 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone size={12} />
                        <span>Tel</span>
                      </a>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://maps.google.com/maps?q=${encodeURIComponent(order.address)}`, '_blank');
                        }}
                        className="flex items-center justify-center space-x-1 px-2 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-all"
                      >
                        <Navigation size={12} />
                        <span>Yo'l</span>
                      </button>

                      {order.status === 'ready' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            calculateAndShowRoute(order);
                            handleOrderStatusUpdate(order.id, 'delivering');
                          }}
                          className="flex items-center justify-center space-x-1 px-2 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-medium transition-all"
                        >
                          <Play size={12} />
                          <span>Start</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderStatusUpdate(order.id, 'delivered');
                          }}
                          className="flex items-center justify-center space-x-1 px-2 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition-all"
                        >
                          <CheckCircle size={12} />
                          <span>Done</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tanlangan buyurtma tafsilotlari */}
            {selectedOrder && (
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border">
                <h4 className="font-medium text-slate-900 mb-2 text-sm">Buyurtma tafsilotlari</h4>
                <div className="space-y-1 text-xs text-slate-600">
                  <p><MapPin size={10} className="inline mr-1" />{selectedOrder.address}</p>
                  <p><Package size={10} className="inline mr-1" />
                    {selectedOrder.items.map((item, index) => (
                      <span key={item.id}>
                        {item.quantity}x {item.name}
                        {index < selectedOrder.items.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>
                  <p className="font-medium text-slate-900">{formatPrice(selectedOrder.total)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-500 rounded-lg">
                  <Package size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-blue-900">{stats.todayDeliveries}</p>
                  <p className="text-blue-700 text-xs font-medium">Bugun</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 border border-orange-200">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-orange-500 rounded-lg">
                  <AlertCircle size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-orange-900">{stats.activeOrders}</p>
                  <p className="text-orange-700 text-xs font-medium">Faol</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 border border-purple-200">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-purple-500 rounded-lg">
                  <Star size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-purple-900">{stats.averageRating}</p>
                  <p className="text-purple-700 text-xs font-medium">Reyting</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 border border-green-200">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-green-500 rounded-lg">
                  <span className="text-white text-sm font-bold">₿</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-900">{Math.round(stats.todayEarnings / 1000)}K</p>
                  <p className="text-green-700 text-xs font-medium">Daromad</p>
                </div>
              </div>
            </div>
          </div>
        
  );
};

export default CourierDashboard;
