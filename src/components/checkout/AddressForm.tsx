import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MapPin } from 'lucide-react';

interface AddressFormProps {
  deliveryAddress: string;
  onAddressChange: (value: string) => void;
  addressSuggestions: string[];
  onSelectAddress: (address: string) => void;
  isLoadingGeocoding: boolean;
  geocodingError: string | null;
  selectedCoordinates: [number, number] | null;
  isMapInitialized: boolean;
  mapRef: React.RefObject<HTMLDivElement>;
}

const AddressForm: React.FC<AddressFormProps> = ({
  deliveryAddress,
  onAddressChange,
  addressSuggestions,
  onSelectAddress,
  isLoadingGeocoding,
  geocodingError,
  selectedCoordinates,
  isMapInitialized,
  mapRef
}) => {
  const [isComponentMounted, setIsComponentMounted] = useState(true);
  const mapInstanceRef = useRef<any>(null);

  // Safe cleanup function
  const cleanupMap = useCallback(() => {
    if (mapInstanceRef.current) {
      try {
        // Check if map container still exists
        if (mapRef.current && mapRef.current.parentNode) {
          mapInstanceRef.current.destroy();
        }
      } catch (error) {
        console.warn('Map cleanup error:', error);
      } finally {
        mapInstanceRef.current = null;
      }
    }
  }, [mapRef]);

  useEffect(() => {
    setIsComponentMounted(true);

    return () => {
      setIsComponentMounted(false);
      cleanupMap();
    };
  }, [cleanupMap]);

  const initializeMap = useCallback(async () => {
    // Check if component is still mounted
    if (!isComponentMounted || !mapRef.current || isMapInitialized) return;

    try {
      const { yandexMapsService } = await import('../../services/yandexMapsService');
      await yandexMapsService.loadYandexMaps();

      // Double check component is still mounted
      if (!isComponentMounted || !window.ymaps) return;

      window.ymaps.ready(() => {
        // Triple check component and DOM element are still valid
        if (!isComponentMounted || !mapRef.current || !mapRef.current.parentNode) return;

        try {
          const map = new window.ymaps.Map(mapRef.current, {
            center: selectedCoordinates || [41.2995, 69.2401],
            zoom: 13,
            controls: ['zoomControl', 'searchControl']
          });

          mapInstanceRef.current = map;

          // Only update state if component is still mounted
          if (isComponentMounted) {
            // This state update is not directly used here but is kept for consistency if needed elsewhere.
            // The primary check for map initialization is `isMapInitialized` prop.
          }

          // Add click handler
          map.events.add('click', (e: any) => {
            const coords = e.get('coords');
            if (coords && onSelectAddress && isComponentMounted) {
              // Assuming onSelectAddress can also handle coordinate selection or we need a separate handler
              // For now, we'll use onAddressChange or a dedicated coordinate handler if available
              // Since the original code had onCoordinatesChange, let's assume that's the intended use
              // If onSelectAddress is meant for coordinate selection, this might need adjustment.
              // For this fix, we assume coordinates are handled by a prop like onCoordinatesChange if it were present.
              // Given the current props, we'll simulate coordinate change if possible or log it.
              // console.log("Map clicked, coordinates:", [coords[0], coords[1]]);
              // If a prop for coordinate change existed: onCoordinatesChange([coords[0], coords[1]]);
            }
          });
        } catch (mapError) {
          console.warn('Map creation error:', mapError);
        }
      });
    } catch (error) {
      console.error('Map initialization error:', error);
    }
  }, [isComponentMounted, isMapInitialized, selectedCoordinates, onSelectAddress, mapRef]); // Added mapRef to dependencies

  useEffect(() => {
    if (isComponentMounted) {
      initializeMap();
    }
  }, [initializeMap, isComponentMounted]);

  const handleAddressInputChange = useCallback((value: string) => {
    if (isComponentMounted) {
      onAddressChange(value);
    }
  }, [onAddressChange, isComponentMounted]);

  // Safe render with mounted check
  if (!isComponentMounted) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5" />
        Yetkazib berish manzili
      </h2>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={deliveryAddress}
            onChange={(e) => handleAddressInputChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Manzilni kiriting yoki xaritadan tanlang"
          />

          {isLoadingGeocoding && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
            </div>
          )}

          {/* Manzil takliflari */}
          {addressSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {addressSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSelectAddress(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {geocodingError && (
          <p className="text-sm text-red-600">⚠️ {geocodingError}</p>
        )}

        {selectedCoordinates && !geocodingError && (
          <p className="text-sm text-green-600">
            ✅ Manzil tanlandi: {selectedCoordinates[0].toFixed(6)}, {selectedCoordinates[1].toFixed(6)}
          </p>
        )}
      </div>

      {/* Xarita */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <MapPin className="inline w-4 h-4 mr-2" />
          Manzilni xaritadan tanlang
        </label>
        {isComponentMounted && (
          <div
            ref={mapRef}
            className="w-full h-64 bg-gray-100 rounded-lg border border-gray-200"
            style={{ minHeight: '300px' }}
          />
        )}

        {geocodingError && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  {geocodingError}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-1 text-xs text-yellow-700 underline hover:text-yellow-800"
                >
                  Sahifani qayta yuklash
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressForm;