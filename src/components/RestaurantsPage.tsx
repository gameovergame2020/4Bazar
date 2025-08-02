import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Star, Clock, Filter, Search, Home, Navigation, Plus, Minus } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  distance: string;
  image: string;
  address: string;
  specialties: string[];
  coordinates: [number, number];
}

const RestaurantsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [showFilters, setShowFilters] = useState(false);
  const [yandexMap, setYandexMap] = useState<YandexMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [ymapsReady, setYmapsReady] = useState<boolean>(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Sample restaurant data
  const restaurants: Restaurant[] = [
    {
      id: '1',
      name: 'Bella Italia',
      cuisine: 'Italian',
      rating: 4.5,
      deliveryTime: '25-35 min',
      distance: '1.2 km',
      image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=400',
      address: 'Amir Temur ko\'chasi, 15',
      specialties: ['Pizza', 'Pasta', 'Risotto'],
      coordinates: [41.3045, 69.2401]
    },
    {
      id: '2',
      name: 'Sushi Master',
      cuisine: 'Japanese',
      rating: 4.7,
      deliveryTime: '30-40 min',
      distance: '2.1 km',
      image: 'https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg?auto=compress&cs=tinysrgb&w=400',
      address: 'Mustaqillik ko\'chasi, 28',
      specialties: ['Sushi', 'Ramen', 'Tempura'],
      coordinates: [41.2945, 69.2501]
    },
    {
      id: '3',
      name: 'Burger House',
      cuisine: 'American',
      rating: 4.2,
      deliveryTime: '20-30 min',
      distance: '0.8 km',
      image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400',
      address: 'Shota Rustaveli ko\'chasi, 42',
      specialties: ['Burgers', 'Fries', 'Milkshakes'],
      coordinates: [41.3095, 69.2301]
    },
    {
      id: '4',
      name: 'Osh Markazi',
      cuisine: 'Uzbek',
      rating: 4.8,
      deliveryTime: '35-45 min',
      distance: '1.5 km',
      image: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400',
      address: 'Navoi ko\'chasi, 67',
      specialties: ['Osh', 'Manti', 'Shashlik'],
      coordinates: [41.2895, 69.2451]
    }
  ];

  const cuisines = ['All', 'Italian', 'Japanese', 'American', 'Uzbek', 'Chinese', 'Indian'];

  // Yandex Maps API ni yuklash
  const loadYandexMaps = (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      // Agar allaqachon yuklangan bo'lsa
      if (window.ymaps) {
        setYmapsReady(true);
        resolve();
        return;
      }

      // Script allaqachon mavjud bo'lsa
      if (scriptRef.current) {
        return;
      }

      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=40496c4d-9fd2-450a-bea8-9a78d5955593&lang=uz_UZ`;
      script.async = true;
      script.onload = (): void => {
        setYmapsReady(true);
        resolve();
      };
      script.onerror = (): void => {
        console.error('Yandex Maps yuklanmadi');
        reject(new Error('Yandex Maps yuklanmadi'));
      };
      
      document.head.appendChild(script);
      scriptRef.current = script;
    });
  };

  // Xaritani ishga tushirish
  const initYandexMap = async (): Promise<void> => {
    if (!ymapsReady || !mapRef.current || !window.ymaps) return;

    try {
      await new Promise<void>((resolve) => {
        window.ymaps!.ready(() => {
          if (yandexMap) {
            yandexMap.destroy();
          }

          const map = new window.ymaps!.Map(mapRef.current!, {
            center: [41.2995, 69.2401], // Toshkent markazi
            zoom: 12,
            controls: ['zoomControl', 'fullscreenControl', 'geolocationControl']
          });

          // Restoranlar uchun placemarklar qo'shish
          restaurants.forEach((restaurant: Restaurant) => {
            const placemark = new window.ymaps!.Placemark(
              restaurant.coordinates,
              {
                balloonContentHeader: `<strong>${restaurant.name}</strong>`,
                balloonContentBody: `
                  <div style="max-width: 250px;">
                    <img src="${restaurant.image}" alt="${restaurant.name}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">
                    <p style="margin: 4px 0; color: #666; font-size: 14px;">${restaurant.cuisine}</p>
                    <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0; font-size: 14px;">
                      <span style="color: #f59e0b;">⭐ ${restaurant.rating}</span>
                      <span style="color: #666;">🕒 ${restaurant.deliveryTime}</span>
                      <span style="color: #666;">📍 ${restaurant.distance}</span>
                    </div>
                    <p style="margin: 4px 0; color: #666; font-size: 12px;">${restaurant.address}</p>
                    <div style="margin-top: 8px;">
                      ${restaurant.specialties.map((specialty: string) => 
                        `<span style="background: #f3f4f6; color: #374151; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">${specialty}</span>`
                      ).join('')}
                    </div>
                  </div>
                `,
                balloonContentFooter: `<small style="color: #9ca3af;">Batafsil ma'lumot uchun bosing</small>`
              },
              {
                preset: 'islands#redFoodIcon',
                iconColor: '#ff6b35'
              }
            );

            map.geoObjects.add(placemark);
          });

          setYandexMap(map);
          setMapLoaded(true);
          resolve();
        });
      });
    } catch (error) {
      console.error('Xaritani ishga tushirishda xatolik:', error);
    }
  };

  // View mode o'zgarganda
  useEffect(() => {
    if (viewMode === 'map') {
      if (!ymapsReady) {
        loadYandexMaps().then(() => {
          setTimeout(() => initYandexMap(), 100);
        });
      } else {
        setTimeout(() => initYandexMap(), 100);
      }
    }
  }, [viewMode, ymapsReady]);

  // Xarita konteynerini qayta o'lchamlash
  useEffect(() => {
    if (viewMode === 'map' && yandexMap && mapRef.current) {
      setTimeout(() => {
        yandexMap.container.fitToViewport();
      }, 300);
    }
  }, [viewMode, yandexMap]);

  const handleMapZoomIn = (): void => {
    if (yandexMap) {
      const currentZoom: number = yandexMap.getZoom();
      yandexMap.setZoom(currentZoom + 1);
    }
  };

  const handleMapZoomOut = (): void => {
    if (yandexMap) {
      const currentZoom: number = yandexMap.getZoom();
      yandexMap.setZoom(currentZoom - 1);
    }
  };

  const handleGoHome = (): void => {
    if (yandexMap) {
      yandexMap.setCenter([41.2995, 69.2401]);
      yandexMap.setZoom(12);
    }
  };

  const handleMyLocation = (): void => {
    if (navigator.geolocation && yandexMap && window.ymaps) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          yandexMap.setCenter(coords);
          yandexMap.setZoom(15);
          
          // Foydalanuvchi joylashuvi uchun placemark qo'shish
          const userPlacemark = new window.ymaps!.Placemark(
            coords,
            {
              balloonContent: 'Sizning joylashuvingiz'
            },
            {
              preset: 'islands#blueCircleDotIcon'
            }
          );
          yandexMap.geoObjects.add(userPlacemark);
        },
        (error: GeolocationPositionError) => {
          console.error('Geolokatsiya xatoligi:', error);
        }
      );
    }
  };

  const filteredRestaurants: Restaurant[] = restaurants.filter((restaurant: Restaurant) => {
    const matchesSearch: boolean = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCuisine: boolean = selectedCuisine === '' || selectedCuisine === 'All' || restaurant.cuisine === selectedCuisine;
    return matchesSearch && matchesCuisine;
  });

  const sortedRestaurants: Restaurant[] = [...filteredRestaurants].sort((a: Restaurant, b: Restaurant) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'deliveryTime':
        return parseInt(a.deliveryTime) - parseInt(b.deliveryTime);
      case 'distance':
      default:
        return parseFloat(a.distance) - parseFloat(b.distance);
    }
  });

  // Component unmount bo'lganda tozalash
  useEffect(() => {
    return (): void => {
      if (yandexMap) {
        yandexMap.destroy();
      }
      if (scriptRef.current && scriptRef.current.parentNode) {
        document.head.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, [yandexMap]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">Restoranlar</h1>
            
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Ro'yxat
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'map'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Xarita
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Restoran yoki taom qidiring..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filtr
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Oshxona turi
                  </label>
                  <select
                    value={selectedCuisine}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCuisine(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {cuisines.map((cuisine: string) => (
                      <option key={cuisine} value={cuisine === 'All' ? '' : cuisine}>
                        {cuisine === 'All' ? 'Barchasi' : cuisine}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Saralash
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="distance">Masofa bo'yicha</option>
                    <option value="rating">Reyting bo'yicha</option>
                    <option value="deliveryTime">Yetkazish vaqti bo'yicha</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'list' ? (
          /* List View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedRestaurants.map((restaurant: Restaurant) => (
              <div key={restaurant.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="relative">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-sm font-medium">
                    {restaurant.distance}
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{restaurant.rating}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2">{restaurant.cuisine}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {restaurant.deliveryTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {restaurant.distance}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {restaurant.specialties.slice(0, 3).map((specialty: string) => (
                      <span
                        key={specialty}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500">{restaurant.address}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Map View */
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Xarita konteyner */}
            <div className="relative h-[600px]">
              <div 
                ref={mapRef}
                className="w-full h-full"
                style={{ minHeight: '600px' }}
              >
                {(!mapLoaded || !ymapsReady) && viewMode === 'map' && (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Xarita yuklanmoqda...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Custom Map Controls */}
              {viewMode === 'map' && mapLoaded && (
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                  <button
                    onClick={handleMapZoomIn}
                    className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors border"
                    title="Kattalashtirish"
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={handleMapZoomOut}
                    className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors border"
                    title="Kichiklashtirish"
                  >
                    <Minus className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={handleGoHome}
                    className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors border"
                    title="Toshkent markaziga qaytish"
                  >
                    <Home className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={handleMyLocation}
                    className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors border"
                    title="Mening joylashuvim"
                  >
                    <Navigation className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              )}

              {/* Map Legend */}
              {viewMode === 'map' && mapLoaded && (
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 border z-10">
                  <h4 className="font-semibold text-sm mb-2">Belgilar</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 bg-red-500 rounded-full border border-white flex items-center justify-center">
                        <span className="text-white text-xs">🍽️</span>
                      </div>
                      <span>Restoran</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 bg-blue-500 rounded-full border border-white"></div>
                      <span>Sizning joylashuvingiz</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Restaurant Cards Below Map */}
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Yaqin atrofdagi restoranlar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedRestaurants.slice(0, 6).map(restaurant => (
                  <div key={restaurant.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold">{restaurant.name}</h4>
                        <p className="text-sm text-gray-600">{restaurant.cuisine}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            {restaurant.rating}
                          </div>
                          <span>•</span>
                          <span>{restaurant.distance}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {restaurant.specialties.slice(0, 2).map(specialty => (
                        <span
                          key={specialty}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Global namespace uchun window object extend qilish
declare global {
  interface Window {
    ymaps: any;
  }
}

export default RestaurantsPage;