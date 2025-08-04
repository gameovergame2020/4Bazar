
import React from 'react';
import { Star, Edit, Trash2 } from 'lucide-react';
import { Cake } from '../../services/dataService';

interface ProductCardProps {
  cake: Cake;
  onEdit: (cake: Cake) => void;
  onDelete: (cakeId: string) => void;
  onUpdateQuantity: (cakeId: string, quantity: number) => void;
  formatPrice: (price: number) => string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  cake,
  onEdit,
  onDelete,
  onUpdateQuantity,
  formatPrice
}) => {
  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="relative mb-3">
        <img 
          src={cake.image}
          alt={cake.name}
          className="w-full h-32 rounded-lg object-cover"
        />
        <div className="absolute top-2 right-2 flex flex-col items-end space-y-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            cake.available ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {cake.available ? 'Mavjud' : 'Buyurtma'}
          </span>
          {cake.available && cake.quantity !== undefined && cake.quantity <= 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
              Tugadi
            </span>
          )}
        </div>
      </div>

      <h4 className="font-medium text-gray-900 mb-1">{cake.name}</h4>
      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{cake.description}</p>

      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-gray-900">{formatPrice(cake.price)}</span>
        <div className="flex items-center space-x-1">
          <Star size={14} className="text-yellow-400 fill-current" />
          <span className="text-sm text-gray-600">{cake.rating}</span>
          <span className="text-sm text-gray-500">({cake.reviewCount})</span>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-sm mb-2">
          <span className="text-gray-600">Hozir mavjud: </span>
          <div className="flex items-center space-x-2 mt-1">
            <input
              type="number"
              value={cake.quantity || 0}
              onChange={async (e) => {
                const newQuantity = parseInt(e.target.value) || 0;
                onUpdateQuantity(cake.id!, newQuantity);
              }}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
              min="0"
            />
            <span className="text-sm text-gray-500">ta</span>
          </div>
        </div>

        <div className="text-sm mb-2">
          <span className="text-gray-600">Buyurtma qilingan: </span>
          <span className="font-medium text-blue-600">{cake.amount || 0} ta</span>
        </div>

        <div className="text-sm mb-2">
          <span className="text-gray-600">Sotilgan/band: </span>
          <span className="font-medium text-orange-600">{cake.inStockQuantity || 0} ta</span>
          {(cake.inStockQuantity || 0) > 0 && (
            <span className="text-xs text-gray-500 ml-1">
              (yetkazilmagan)
            </span>
          )}
        </div>

        <div className="text-xs">
          {cake.available && (cake.quantity || 0) > 0 ? (
            <span className={`font-medium ${
              (cake.quantity || 0) <= 5 
                ? 'text-orange-600' 
                : 'text-green-600'
            }`}>
              🟢 Hozir mavjud
            </span>
          ) : (
            <span className="text-blue-600 font-medium">
              🔵 Buyurtma uchun
            </span>
          )}
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(cake)}
          className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1"
        >
          <Edit size={14} />
          <span>Tahrirlash</span>
        </button>
        <button
          onClick={() => onDelete(cake.id!)}
          className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 transition-colors flex items-center justify-center space-x-1"
        >
          <Trash2 size={14} />
          <span>O'chirish</span>
        </button>
      </div>
    </div>
  );
};
