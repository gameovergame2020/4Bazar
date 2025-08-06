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
            controls: ['zoomControl', 'fullscreenControl', 'geolocationControl']
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
            activeOrders.forEach((order, index) => {
              if (order.coordinates) {
                const orderPlacemark = new window.ymaps.Placemark(order.coordinates, {
                  balloonContent: `
                    <div style="padding: 12px; min-width: 200px;">
                      <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">${order.customerName}</div>
                      <div style="color: #666; font-size: 12px; margin-bottom: 5px;">ID: ${order.orderUniqueId || order.id}</div>
                      <div style="margin-bottom: 8px; font-size: 13px;">${order.deliveryAddress || 'Manzil ko\'rsatilmagan'}</div>
                      <div style="font-weight: bold; color: #2563eb; margin-bottom: 5px;">${formatPrice(order.totalPrice)}</div>
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="
                          padding: 2px 8px; 
                          border-radius: 12px; 
                          font-size: 11px; 
                          font-weight: 500;
                          color: ${order.priority === 'urgent' ? '#ef4444' : '#059669'};
                          background: ${order.priority === 'urgent' ? '#fef2f2' : '#f0fdf4'};
                        ">
                          ${order.priority === 'urgent' ? 'Shoshilinch' : 'Oddiy'}
                        </span>
                        <span style="
                          padding: 2px 8px; 
                          border-radius: 12px; 
                          font-size: 11px; 
                          font-weight: 500;
                          color: ${order.status === 'ready' ? '#059669' : '#2563eb'};
                          background: ${order.status === 'ready' ? '#f0fdf4' : '#eff6ff'};
                        ">
                          ${order.status === 'ready' ? 'Tayyor' : 'Yetkazilmoqda'}
                        </span>
                      </div>
                      ${order.distance ? `<div style="margin-top: 5px; font-size: 12px; color: #666;">📍 ${order.distance}${order.estimatedTime ? ` • ⏱️ ${order.estimatedTime}` : ''}</div>` : ''}
                    </div>
                  `,
                  type: 'order',
                  orderId: order.id,
                  orderIndex: index
                }, {
                  preset: order.priority === 'urgent' ? 'islands#redIcon' : 'islands#greenIcon',
                  iconColor: order.status === 'delivering' ? '#2563eb' : (order.priority === 'urgent' ? '#ef4444' : '#059669')
                });

                // Buyurtma belgisini bosganda tanlash
                orderPlacemark.events.add('click', () => {
                  setSelectedOrder(order);
                  // Yo'lni ko'rsatish
                  calculateAndShowRoute(order);
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
      // Faqat yo'llarni tozalash (buyurtma belgilarini saqlab qolish)
      yandexMap.geoObjects.each((geoObject: any) => {
        if (geoObject.properties && geoObject.properties.get('type') === 'route') {
          yandexMap.geoObjects.remove(geoObject);
        }
      });

      // Xaritani buyurtma joylashuviga yo'naltirish
      yandexMap.setCenter(order.coordinates, 16);

      console.log(`📍 Buyurtma xaritada ko'rsatildi: ${order.customerName} - ${order.deliveryAddress}`);
    }
  };

  const calculateAndShowRoute = async (order: Order) => {
    if (!yandexMap || !order.coordinates) return;

    try {
      // Avval eski yo'llarni tozalash
      yandexMap.geoObjects.each((geoObject: any) => {
        if (geoObject.properties && geoObject.properties.get('type') === 'route') {
          yandexMap.geoObjects.remove(geoObject);
        }
      });

      // Kuryer joylashuvi (demo - haqiqatda GPS dan olinadi)
      const courierLocation = [41.2995, 69.2401];

      console.log(`🚗 Yo'l hisoblanmoqda: Kuryer [${courierLocation}] → Buyurtmachi [${order.coordinates}]`);

      // Yo'lni hisoblash
      const route = new window.ymaps.multiRouter.MultiRoute({
        referencePoints: [
          courierLocation,
          order.coordinates
        ],
        params: {
          routingMode: 'auto',
          avoidTrafficJams: false
        }
      }, {
        boundsAutoApply: true,
        routeActiveStrokeWidth: 6,
        routeActiveStrokeColor: '#4f46e5',
        routeActiveStrokeOpacity: 0.8,
        wayPointVisible: false,
        balloonContentLayout: 'islands#balloonTemplate'
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

          console.log(`✅ Yo'l hisoblandi: ${distance} km, ${duration} daqiqa`);
          
          // Xaritani yo'lga moslashtirish
          yandexMap.setBounds(route.getRoutes().get(0).getBounds(), {
            checkZoomRange: true,
            zoomMargin: 50
          });
        }
      });

      route.model.events.add('requestfail', (error: any) => {
        console.error('❌ Yo\'l hisoblashda xato:', error);
        alert('Yo\'lni hisoblashda xatolik yuz berdi. Internet aloqasini tekshiring.');
      });

      // Xaritaga yo'lni qo'shish
      route.properties.set('type', 'route');
      yandexMap.geoObjects.add(route);

      // Tanlangan buyurtmani yangilash
      setSelectedOrder(order);

    } catch (error) {
      console.error('❌ Yo\'lni hisoblashda umumiy xato:', error);
      alert('Yo\'lni ko\'rsatishda xatolik yuz berdi.');
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
      // Xaritadan buyurtma belgilarini va yo'llarini olib tashlash
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
        
        // Agar qolgan buyurtmalar bo'lsa, xaritani ularni ko'rsatish uchun sozlash
        if (remainingOrders.length > 0 && yandexMap) {
          const bounds = [[41.2995, 69.2401]]; // Kuryer joylashuvi
          remainingOrders.forEach(order => {
            if (order.coordinates) {
              bounds.push(order.coordinates);
            }
          });

          if (bounds.length > 1) {
            yandexMap.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 });
          }
        }
      }

      console.log(`✅ Buyurtma bajarildi va xaritadan olib tashlandi: ${orderId}`);
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
                      
                      {/* Mahsulotlar ro'yxati */}
                      <div className="mb-2">
                        <div className="text-xs text-slate-700 font-medium mb-1">Mahsulotlar:</div>
                        <div className="space-y-0.5">
                          {order.items.slice(0, 2).map((item, index) => (
                            <div key={item.id} className="text-xs text-slate-600 flex justify-between">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="text-blue-600 font-medium">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className="text-xs text-slate-500">+{order.items.length - 2} ta yana...</div>
                          )}
                        </div>
                      </div>

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
                      <div className="text-sm font-bold text-slate-900">{formatPrice(order.total)}</div>
                      <div className="text-xs text-green-600 font-medium">+{formatPrice(order.deliveryFee)} yetkazish</div>
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
                        if (order.coordinates && yandexMap) {
                          // Xaritada yo'lni ko'rsatish
                          calculateAndShowRoute(order);
                        } else if (order.coordinates) {
                          // Fallback - Yandex Maps saytida ochish
                          const coords = `${order.coordinates[0]},${order.coordinates[1]}`;
                          window.open(`https://yandex.uz/maps/?text=${encodeURIComponent(order.address)}&ll=${coords}&z=16`, '_blank');
                        } else {
                          window.open(`https://yandex.uz/maps/?text=${encodeURIComponent(order.address)}`, '_blank');
                        }
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
              <h4 className="font-medium text-slate-900 mb-3 text-sm">Buyurtma tafsilotlari</h4>
              
              {/* Mijoz ma'lumotlari */}
              <div className="mb-3 p-2 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700">Mijoz:</span>
                  <span className="text-xs text-slate-900 font-medium">{selectedOrder.customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">Telefon:</span>
                  <span className="text-xs text-blue-600">{selectedOrder.customerPhone}</span>
                </div>
              </div>

              {/* Manzil */}
              <div className="mb-3 p-2 bg-white rounded-lg border">
                <div className="text-xs font-medium text-slate-700 mb-1">Yetkazish manzili:</div>
                <div className="text-xs text-slate-600 flex items-start">
                  <MapPin size={10} className="mr-1 mt-0.5 flex-shrink-0" />
                  <span>{selectedOrder.address}</span>
                </div>
              </div>

              {/* Mahsulotlar tafsiloti */}
              <div className="mb-3 p-2 bg-white rounded-lg border">
                <div className="text-xs font-medium text-slate-700 mb-2">Buyurtma tarkibi:</div>
                <div className="space-y-1.5">
                  {selectedOrder.items.map((item, index) => (
                    <div key={item.id} className="flex justify-between items-center text-xs border-b border-slate-100 pb-1 last:border-b-0">
                      <div className="flex items-center space-x-2">
                        <Package size={10} className="text-slate-400" />
                        <span className="text-slate-700">{item.name}</span>
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-medium">
                          {item.quantity}x
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-900 font-medium">{formatPrice(item.price * item.quantity)}</div>
                        <div className="text-slate-500">{formatPrice(item.price)} /ta</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Narxlar tafsiloti */}
              <div className="p-2 bg-white rounded-lg border">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Mahsulotlar:</span>
                    <span className="text-slate-900">{formatPrice(selectedOrder.total - selectedOrder.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Yetkazish xizmati:</span>
                    <span className="text-green-600">{formatPrice(selectedOrder.deliveryFee)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-1 mt-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-700">Jami summa:</span>
                      <span className="text-slate-900 font-bold">{formatPrice(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buyurtma ma'lumotlari */}
              <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-blue-700 font-medium">Vaqt:</span>
                    <div className="text-blue-600">{new Date(selectedOrder.orderTime).toLocaleString('uz-UZ')}</div>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Holat:</span>
                    <div className={`font-medium ${selectedOrder.status === 'ready' ? 'text-green-600' : 'text-blue-600'}`}>
                      {selectedOrder.status === 'ready' ? 'Tayyor' : 'Yetkazilmoqda'}
                    </div>
                  </div>
                  {selectedOrder.distance && (
                    <div>
                      <span className="text-blue-700 font-medium">Masofa:</span>
                      <div className="text-blue-600">{selectedOrder.distance}</div>
                    </div>
                  )}
                  {selectedOrder.estimatedTime && (
                    <div>
                      <span className="text-blue-700 font-medium">Vaqt:</span>
                      <div className="text-blue-600">{selectedOrder.estimatedTime}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourierDashboard;