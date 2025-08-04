
import React from 'react';
import { Order } from '../../services/dataService';

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, status: Order['status']) => void;
  onViewDetails: (order: Order) => void;
  getStatusColor: (status: Order['status']) => string;
  getStatusText: (status: Order['status']) => string;
  formatPrice: (price: number) => string;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onStatusUpdate,
  onViewDetails,
  getStatusColor,
  getStatusText,
  formatPrice
}) => {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{order.cakeName}</h4>
          <p className="text-sm text-gray-600">Mijoz: {order.customerName}</p>
          <p className="text-sm text-gray-500">#{order.id?.slice(-6)}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
          {getStatusText(order.status)}
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Miqdor: {order.quantity}</span>
          <span>Narx: {formatPrice(order.totalPrice)}</span>
          <span>Sana: {order.createdAt.toLocaleDateString('uz-UZ')}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => onViewDetails(order)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Batafsil
        </button>
        <div className="flex space-x-2">
          {order.status === 'accepted' && (
            <button
              onClick={() => onStatusUpdate(order.id!, 'preparing')}
              className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-orange-600 transition-colors"
            >
              Tayyorlashni boshlash
            </button>
          )}
          {order.status === 'preparing' && (
            <button
              onClick={() => onStatusUpdate(order.id!, 'ready')}
              className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              Tayyor
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
