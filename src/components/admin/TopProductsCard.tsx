
import React from 'react';
import { Cake } from '../../services/dataService';

interface TopProductsCardProps {
  cakes: Cake[];
}

const TopProductsCard: React.FC<TopProductsCardProps> = ({ cakes }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top mahsulotlar</h3>
      <div className="space-y-3">
        {cakes.slice(0, 5).map((cake) => (
          <div key={cake.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
            <img
              src={cake.image}
              alt={cake.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{cake.name}</h4>
              <p className="text-sm text-gray-600">
                {cake.productType === 'baked' ? cake.bakerName : cake.shopName}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">{formatPrice(cake.price)}</p>
              <div className="flex items-center space-x-1">
                <span className="text-yellow-400">★</span>
                <span className="text-sm text-gray-600">{cake.rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopProductsCard;
