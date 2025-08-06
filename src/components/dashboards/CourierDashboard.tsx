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
  paymentMethod: 'cash' | 'card';
  paymentType?: 'click' | 'payme' | 'visa' | 'mastercard';
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
  }, []);

  // Xarita va buyurtmalarni birgalikda yuklash
  useEffect(() => {
    if (activeOrders.length > 0) {
      initializeMap();
    }
  }, [activeOrders]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Demo ma'lumotlar
      const mockActiveOrders: Order[] = [
        {
          id: 'ORD001',
          orderUniqueId: 'D9OAHZ7Z',
          customerId: 'customer001',
          customerName: 'Aziz Karimov',
          customerPhone: '+998901234567',
          cakeId: 'cake001',
          cakeName: 'Shokoladli tort',
          quantity: 1,
          amount: 250000,
          totalPrice: 268000,
          status: 'ready',
          deliveryAddress: 'Toshkent sh., Yunusobod t., 15-mavze, 23-uy',
          coordinates: [41.3158, 69.2798],
          paymentMethod: 'cash',
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          // Legacy properties for compatibility
          address: 'Toshkent sh., Yunusobod t., 15-mavze, 23-uy',
          items: [
            { id: '1', name: 'Shokoladli tort', quantity: 1, price: 250000 }
          ],
          total: 268000,
          orderTime: new Date().toISOString(),
          priority: 'urgent',
          distance: '2.5 km',
          deliveryFee: 18000
        },
        {
          id: 'ORD002',
          orderUniqueId: 'M8KBVC3X',
          customerId: 'customer002',
          customerName: 'Malika Toshmatova',
          customerPhone: '+998901234568',
          cakeId: 'cake002',
          cakeName: 'Mevali tort',
          quantity: 2,
          amount: 360000,
          totalPrice: 378000,
          status: 'delivering',
          deliveryAddress: 'Toshkent sh., Mirzo Ulugbek t., 8-mavze, 45-uy',
          coordinates: [41.2856, 69.2034],
          paymentMethod: 'card',
          paymentType: 'click',
          notes: '',
          createdAt: new Date(Date.now() - 3600000),
          updatedAt: new Date(),
          // Legacy properties for compatibility
          address: 'Toshkent sh., Mirzo Ulugbek t., 8-mavze, 45-uy',
          items: [
            { id: '2', name: 'Mevali tort', quantity: 2, price: 180000 }
          ],
          total: 378000,
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

      console.log(`✅ ${mockActiveOrders.length} ta faol buyurtma yuklandi`);

    } catch (error) {
      console.error('Ma\'lumotlarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = async () => {
    try {
      if (!mapRef.current) {
        console.warn('⚠️ Map container not found');
        return;
      }

      await yandexMapsService.loadYandexMaps();

      if (window.ymaps) {
        window.ymaps.ready(() => {
          console.log('🗺️ Yandex Maps ready, initializing...');
          
          const map = new window.ymaps.Map(mapRef.current, {
            center: [41.2995, 69.2401], // Toshkent markazi
            zoom: 12,
            controls: ['zoomControl', 'fullscreenControl', 'geolocationControl']
          });

          console.log('✅ Map created successfully');

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

          console.log(`🔍 Adding ${activeOrders.length} orders to map...`);

          // Barcha faol buyurtmalarni xaritaga qo'shish
          activeOrders.forEach((order, index) => {
            if (order.coordinates && Array.isArray(order.coordinates) && order.coordinates.length === 2) {
              console.log(`📍 Adding order ${index + 1}: ${order.customerName} at [${order.coordinates}]`);
              
              const orderPlacemark = new window.ymaps.Placemark(order.coordinates, {
                balloonContent: `
                  <div style="padding: 12px; min-width: 200px;">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">${order.customerName}</div>
                    <div style="color: #666; font-size: 12px; margin-bottom: 5px;">ID: ${order.orderUniqueId || order.id}</div>
                    <div style="margin-bottom: 8px; font-size: 13px;">${order.deliveryAddress || order.address || 'Manzil ko\'rsatilmagan'}</div>
                    <div style="font-weight: bold; color: #2563eb; margin-bottom: 5px;">${formatPrice(order.totalPrice || order.total)}</div>
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
              console.log(`✅ Order ${index + 1} marker added successfully`);
            } else {
              console.warn(`⚠️ Invalid coordinates for order ${order.id}:`, order.coordinates);
            }
          });

          // Xaritani barcha buyurtmalarni qamrab olish uchun sozlash
          if (activeOrders.length > 0) {
            const bounds = [[41.2995, 69.2401]]; // Kuryer joylashuvi
            activeOrders.forEach(order => {
              if (order.coordinates && Array.isArray(order.coordinates)) {
                bounds.push(order.coordinates);
              }
            });

            if (bounds.length > 1) {
              map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 });
              console.log(`🎯 Map bounds set for ${bounds.length - 1} orders + courier`);
            }
          }

          console.log('🎉 Map initialization completed');
        });
      }
    } catch (error) {
      console.error('❌ Xaritani yuklashda xatolik:', error);
    }
  };

  const addOrderToMap = (order: Order) => {
    if (yandexMap && order.coordinates && Array.isArray(order.coordinates)) {
      // Faqat yo'llarni tozalash (buyurtma belgilarini saqlab qolish)
      yandexMap.geoObjects.each((geoObject: any) => {
        if (geoObject.properties && geoObject.properties.get('type') === 'route') {
          yandexMap.geoObjects.remove(geoObject);
        }
      });

      // Xaritani buyurtma joylashuviga yo'naltirish
      yandexMap.setCenter(order.coordinates, 16);

      console.log(`📍 Buyurtma xaritada ko'rsatildi: ${order.customerName} - ${order.deliveryAddress || order.address}`);
    } else {
      console.warn('⚠️ Cannot show order on map - invalid coordinates:', order.coordinates);
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
      let route;
      try {
        route = new window.ymaps.multiRouter.MultiRoute({
          referencePoints: [
            courierLocation,
            order.coordinates
          ],
          params: {
            routingMode: 'auto',
            avoidTrafficJams: false
          }
        }, {
          boundsAutoApply: false, // Manual bounds control
          routeActiveStrokeWidth: 6,
          routeActiveStrokeColor: '#4f46e5',
          routeActiveStrokeOpacity: 0.8,
          wayPointVisible: false,
          balloonContentLayout: 'islands#balloonTemplate'
        });
      } catch (routeError) {
        console.error('❌ Route yaratishda xato:', routeError);
        return;
      }

      // Yo'l ma'lumotlarini olish
      route.model.events.add('requestsuccess', () => {
        try {
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
            const routes = route.getRoutes();
            if (routes && routes.get(0)) {
              yandexMap.setBounds(routes.get(0).getBounds(), {
                checkZoomRange: true,
                zoomMargin: 50
              });
            }
          }
        } catch (err) {
          console.error('❌ Yo\'l ma\'lumotlarini olishda xato:', err);
        }
      });

      route.model.events.add('requestfail', (error: any) => {
        console.error('❌ Yo\'l hisoblashda xato:', error);
        
        // Xato turini aniqlash
        let errorMessage = 'Yo\'lni hisoblashda xatolik yuz berdi.';
        
        if (error && error.originalEvent) {
          const originalError = error.originalEvent;
          if (originalError.message && originalError.message.includes('API')) {
            errorMessage = 'API kaliti muammosi. Administrator bilan bog\'laning.';
          } else if (originalError.status === 403) {
            errorMessage = 'API ruxsati yo\'q. Administrator bilan bog\'laning.';
          } else if (originalError.status >= 500) {
            errorMessage = 'Server xatosi. Keyinroq urinib ko\'ring.';
          }
        }
        
        console.warn('⚠️ ' + errorMessage);
        // alert o'rniga console warning ishlatish
      });

      // Xaritaga yo'lni qo'shish
      if (route) {
        try {
          route.properties.set('type', 'route');
          yandexMap.geoObjects.add(route);
        } catch (addError) {
          console.error('❌ Yo\'lni xaritaga qo\'shishda xato:', addError);
        }
      }

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
        const objectsToRemove: any[] = [];
        
        yandexMap.geoObjects.each((geoObject: any) => {
          const properties = geoObject.properties;
          if (properties) {
            const objType = properties.get('type');
            const objOrderId = properties.get('orderId');
            
            // Buyurtma belgisini yoki barcha yo'llarni olib tashlash
            if ((objType === 'order' && objOrderId === orderId) || objType === 'route') {
              objectsToRemove.push(geoObject);
            }
          }
        });

        // Obyektlarni xaritadan olib tashlash
        objectsToRemove.forEach(obj => {
          yandexMap.geoObjects.remove(obj);
        });

        console.log(`🗑️ Xaritadan ${objectsToRemove.length} ta obyekt olib tashlandi`);
      }

      // Buyurtmani ro'yxatdan olib tashlash
      const remainingOrders = activeOrders.filter(order => order.id !== orderId);
      setActiveOrders(remainingOrders);
      
      // Agar tanlangan buyurtma olib tashlangan bo'lsa, boshqasini tanlash
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(remainingOrders.length > 0 ? remainingOrders[0] : null);
      }

      // Agar qolgan buyurtmalar bo'lsa, xaritani ularni ko'rsatish uchun sozlash
      if (remainingOrders.length > 0 && yandexMap) {
        setTimeout(() => {
          const bounds = [[41.2995, 69.2401]]; // Kuryer joylashuvi
          remainingOrders.forEach(order => {
            if (order.coordinates && Array.isArray(order.coordinates)) {
              bounds.push(order.coordinates);
            }
          });

          if (bounds.length > 1) {
            yandexMap.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 });
          }
        }, 300); // Xaritani yangilanishini kutish
      }

      console.log(`✅ Buyurtma bajarildi va xaritadan olib tashlandi: ${orderId}`);
      console.log(`📊 Qolgan buyurtmalar: ${remainingOrders.length} ta`);
      
      return; // Qolgan kodning ishlamasligini ta'minlash
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

        {/* Buyurtmalar paneli - Minimal dizayn */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-slate-900">Faol buyurtmalar</h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                {activeOrders.length}
              </span>
            </div>
            <button
              onClick={loadDashboardData}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto">
            {activeOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Buyurtma yo'q</p>
              </div>
            ) : (
              activeOrders.map((order) => (
                <div 
                  key={order.id} 
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedOrder?.id === order.id 
                      ? 'border-blue-300 bg-blue-50/50' 
                      : 'border-slate-200 hover:border-blue-200'
                  }`}
                  onClick={() => handleOrderSelect(order)}
                >
                  {/* Asosiy ma'lumotlar */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{order.customerName}</h4>
                        <p className="text-xs text-slate-500">#{order.id}</p>
                      </div>
                      {order.priority === 'urgent' && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          Shoshilinch
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{formatPrice(order.total)}</div>
                      <div className="text-xs text-green-600">+{formatPrice(order.deliveryFee)}</div>
                    </div>
                  </div>

                  {/* Manzil va telefon */}
                  <div className="mb-3 space-y-2">
                    <div className="flex items-start space-x-2">
                      <MapPin size={14} className="text-slate-400 mt-0.5" />
                      <span className="text-sm text-slate-600 flex-1">{order.address}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone size={14} className="text-slate-400" />
                      <span className="text-sm text-slate-600">{order.customerPhone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400">To'lov:</span>
                      {order.paymentMethod === 'card' && order.paymentType ? (
                        <span className="text-xs font-medium">
                          {order.paymentType === 'click' ? '🔵 Click' :
                           order.paymentType === 'payme' ? '🟢 Payme' :
                           order.paymentType === 'visa' ? '💳 Visa/MC' : 
                           '💳 Bank kartasi'}
                        </span>
                      ) : order.paymentMethod === 'cash' ? (
                        <span className="text-xs font-medium text-green-600">💵 Naqd pul</span>
                      ) : (
                        <span className="text-xs font-medium text-yellow-600">⏳ Aniqlanmagan</span>
                      )}
                    </div>
                  </div>

                  {/* Mahsulotlar (qisqa ko'rinish) */}
                  <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs font-medium text-slate-700 mb-2">Buyurtma:</div>
                    <div className="space-y-1">
                      {order.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <span className="text-slate-700">{item.name} x{item.quantity}</span>
                          <span className="font-medium text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="text-xs text-slate-500">va yana {order.items.length - 2} ta mahsulot...</div>
                      )}
                    </div>
                  </div>

                  {/* Holat va vaqt */}
                  <div className="flex items-center justify-between mb-3 text-sm">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'ready' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status === 'ready' ? 'Tayyor' : 'Yetkazilmoqda'}
                      </span>
                      {order.distance && (
                        <div className="flex items-center space-x-1 text-xs text-slate-500">
                          <span>{order.distance}</span>
                          {order.estimatedTime && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600">{order.estimatedTime}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(order.orderTime).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute: '2-digit'})}
                    </div>
                  </div>

                  {/* Tugmalar */}
                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="flex items-center justify-center space-x-2 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone size={14} />
                      <span>Qo'ng'iroq</span>
                    </a>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (order.coordinates) {
                          calculateAndShowRoute(order);
                        }
                      }}
                      className="flex items-center justify-center space-x-2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      <Navigation size={14} />
                      <span>Yo'nalish</span>
                    </button>

                    {order.status === 'ready' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          calculateAndShowRoute(order);
                          handleOrderStatusUpdate(order.id, 'delivering');
                        }}
                        className="flex items-center justify-center space-x-2 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all"
                      >
                        <Play size={14} />
                        <span>Boshlash</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOrderStatusUpdate(order.id, 'delivered');
                        }}
                        className="flex items-center justify-center space-x-2 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all"
                      >
                        <CheckCircle size={14} />
                        <span>Tayyor</span>
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