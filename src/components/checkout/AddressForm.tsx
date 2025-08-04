
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
}

const AddressForm: React.FC<AddressFormProps> = ({
  deliveryAddress,
  onAddressChange,
  addressSuggestions,
  onSelectAddress,
  isLoadingGeocoding,
  geocodingError,
  selectedCoordinates,
  isMapInitialized
}) => {
  const mapRef = useRef<HTMLDivElement>(null);

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
      <div className="mt-4">
        <div 
          ref={mapRef}
          className="w-full h-64 rounded-lg border border-gray-200"
          style={{ minHeight: '256px' }}
        />
        {!isMapInitialized && (
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border border-gray-200">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-600">Xarita yuklanmoqda...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressForm;
