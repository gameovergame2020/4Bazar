
import React from 'react';
import { Order } from '../../services/dataService';

interface RecentOrdersCardProps {
  orders: Order[];
}

const RecentOrdersCard: React.FC<RecentOrdersCardProps> = ({ orders }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">So'nggi buyurtmalar</h3>
      <div className="space-y-3">
        {orders.slice(0, 5).map((order) => (
          <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <h4 className="font-medium text-gray-900">#{order.id?.slice(-6)}</h4>
              <p className="text-sm text-gray-600">{order.customerName}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">{formatPrice(order.totalPrice)}</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                order.status === 'preparing' ? 'bg-yellow-100 text-yellow-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {order.status === 'delivered' ? 'Yetkazildi' :
                 order.status === 'preparing' ? 'Tayyorlanmoqda' : 'Kutilmoqda'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentOrdersCard;
