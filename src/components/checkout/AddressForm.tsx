import React, { useRef, useEffect, useState } from 'react';
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
            onChange={(e) => onAddressChange(e.target.value)}
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
          <div 
            ref={mapRef}
            className="w-full h-64 bg-gray-100 rounded-lg border border-gray-200"
            style={{ minHeight: '300px' }}
          >
            {!isMapInitialized && (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                  <p>Xarita yuklanmoqda...</p>
                  <p className="text-xs mt-2 text-gray-400">
                    Agar xarita yuklanmasa, manzilni qo'lda kiriting
                  </p>
                </div>
              </div>
            )}
          </div>

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