
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
  CheckCircle,
  Star,
  RefreshCw
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
    todayEarnings: 144000,
    averageRating: 4.8
  });

  useEffect(() => {
    loadDashboardData();
    initializeMap();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const mockActiveOrders: Order[] = [
        {
          id: 'ORD001',
          customerName: 'Aziz Karimov',
          customerPhone: '+998901234567',
          address: 'Yunusobod t., 15-mavze, 23-uy',
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
          address: 'Mirzo Ulugbek t., 8-mavze, 45-uy',
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
            center: [41.2995, 69.2401],
            zoom: 12,
            controls: ['zoomControl', 'geolocationControl']
          });

          const courierPlacemark = new window.ymaps.Placemark([41.2995, 69.2401], {
            balloonContent: `<strong>${userData?.name || 'Kuryer'}</strong>`,
            type: 'courier'
          }, {
            preset: 'islands#blueCircleDotIcon'
          });

          map.geoObjects.add(courierPlacemark);
          setYandexMap(map);
          setMapLoaded(true);

          setTimeout(() => {
            activeOrders.forEach((order) => {
              if (order.coordinates) {
                const orderPlacemark = new window.ymaps.Placemark(order.coordinates, {
                  balloonContent: `
                    <div style="padding: 8px;">
                      <div style="font-weight: bold; margin-bottom: 4px;">${order.customerName}</div>
                      <div style="color: #666; font-size: 12px; margin-bottom: 4px;">${order.address}</div>
                      <div style="font-weight: bold; color: #2563eb;">${formatPrice(order.total)}</div>
                    </div>
                  `,
                  type: 'order',
                  orderId: order.id
                }, {
                  preset: order.priority === 'urgent' ? 'islands#redIcon' : 'islands#greenIcon'
                });

                orderPlacemark.events.add('click', () => {
                  setSelectedOrder(order);
                  calculateAndShowRoute(order);
                });

                map.geoObjects.add(orderPlacemark);
              }
            });

            if (activeOrders.length > 0) {
              const bounds = [[41.2995, 69.2401]];
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

  const calculateAndShowRoute = async (order: Order) => {
    if (!yandexMap || !order.coordinates) return;

    try {
      yandexMap.geoObjects.each((geoObject: any) => {
        if (geoObject.properties && geoObject.properties.get('type') === 'route') {
          yandexMap.geoObjects.remove(geoObject);
        }
      });

      const courierLocation = [41.2995, 69.2401];

      const route = new window.ymaps.multiRouter.MultiRoute({
        referencePoints: [courierLocation, order.coordinates],
        params: { routingMode: 'auto' }
      }, {
        boundsAutoApply: true,
        routeActiveStrokeWidth: 4,
        routeActiveStrokeColor: '#4f46e5',
        wayPointVisible: false
      });

      route.model.events.add('requestsuccess', () => {
        const activeRoute = route.getActiveRoute();
        if (activeRoute) {
          const distance = Math.round(activeRoute.properties.get('distance').value / 1000 * 10) / 10;
          const duration = Math.round(activeRoute.properties.get('duration').value / 60);

          setActiveOrders(prev => prev.map(o => 
            o.id === order.id 
              ? { ...o, distance: `${distance} km`, estimatedTime: `${duration} min` }
              : o
          ));

          yandexMap.setBounds(route.getRoutes().get(0).getBounds(), {
            checkZoomRange: true,
            zoomMargin: 50
          });
        }
      });

      route.properties.set('type', 'route');
      yandexMap.geoObjects.add(route);
      setSelectedOrder(order);

    } catch (error) {
      console.error('Yo\'lni hisoblashda xato:', error);
    }
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    if (order.coordinates && yandexMap) {
      yandexMap.setCenter(order.coordinates, 16);
    }
  };

  const handleStatusToggle = () => {
    setIsOnline(!isOnline);
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    const updatedOrders = activeOrders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setActiveOrders(updatedOrders);

    if (newStatus === 'delivering') {
      const order = updatedOrders.find(o => o.id === orderId);
      if (order) {
        await calculateAndShowRoute(order);
      }
    }

    if (newStatus === 'delivered') {
      if (yandexMap) {
        yandexMap.geoObjects.each((geoObject: any) => {
          const properties = geoObject.properties;
          if (properties && 
              ((properties.get('type') === 'order' && properties.get('orderId') === orderId) ||
               properties.get('type') === 'route')) {
            yandexMap.geoObjects.remove(geoObject);
          }
        });
      }

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
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={userData?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100'}
              alt={userData?.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h2 className="font-bold text-gray-900">{userData?.name}</h2>
              <div className="flex items-center space-x-2 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {isOnline ? 'Faol' : 'Nofaol'}
                </span>
                <div className="flex items-center">
                  <Star size={12} className="text-yellow-400 fill-current mr-1" />
                  <span className="text-gray-600">{stats.averageRating}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleStatusToggle}
            className={`px-4 py-2 rounded-lg font-medium ${
              isOnline 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isOnline ? 'To\'xtatish' : 'Boshlash'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-lg font-bold text-blue-600">{stats.todayDeliveries}</div>
            <div className="text-xs text-blue-600">Bugungi yetkazish</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-lg font-bold text-green-600">{formatPrice(stats.todayEarnings)}</div>
            <div className="text-xs text-green-600">Bugungi daromad</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Map */}
        <div className="lg:col-span-3 h-96 bg-white rounded-xl overflow-hidden shadow-sm">
          <div 
            ref={mapRef} 
            className="w-full h-full"
          />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Xarita yuklanmoqda...</p>
              </div>
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Buyurtmalar ({activeOrders.length})</h3>
            <button
              onClick={loadDashboardData}
              className="p-1 text-gray-500 hover:text-blue-600"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activeOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Buyurtma yo'q</p>
              </div>
            ) : (
              activeOrders.map((order) => (
                <div 
                  key={order.id} 
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedOrder?.id === order.id 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleOrderSelect(order)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-xs text-gray-500">#{order.id}</div>
                      <div className="text-xs text-gray-600 mt-1 flex items-center">
                        <MapPin size={10} className="mr-1" />
                        {order.address}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{formatPrice(order.total)}</div>
                      {order.priority === 'urgent' && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          Shoshilinch
                        </span>
                      )}
                    </div>
                  </div>

                  {order.distance && (
                    <div className="text-xs text-gray-500 mb-2">
                      📍 {order.distance} • ⏱️ {order.estimatedTime}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="flex-1 flex items-center justify-center py-2 bg-green-500 text-white rounded text-xs font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone size={12} className="mr-1" />
                      Qo'ng'iroq
                    </a>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        calculateAndShowRoute(order);
                      }}
                      className="flex-1 flex items-center justify-center py-2 bg-blue-500 text-white rounded text-xs font-medium"
                    >
                      <Navigation size={12} className="mr-1" />
                      Yo'l
                    </button>

                    {order.status === 'ready' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          calculateAndShowRoute(order);
                          handleOrderStatusUpdate(order.id, 'delivering');
                        }}
                        className="flex-1 flex items-center justify-center py-2 bg-orange-500 text-white rounded text-xs font-medium"
                      >
                        <Play size={12} className="mr-1" />
                        Boshlash
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOrderStatusUpdate(order.id, 'delivered');
                        }}
                        className="flex-1 flex items-center justify-center py-2 bg-green-500 text-white rounded text-xs font-medium"
                      >
                        <CheckCircle size={12} className="mr-1" />
                        Tugallash
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourierDashboard;
