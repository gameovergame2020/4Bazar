
import React from 'react';
import { X, Phone } from 'lucide-react';
import { Order } from '../../services/dataService';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  getStatusColor: (status: Order['status']) => string;
  getStatusText: (status: Order['status']) => string;
  formatPrice: (price: number) => string;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  getStatusColor,
  getStatusText,
  formatPrice
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Buyurtma tafsilotlari</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">{order.cakeName}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Buyurtma ID:</span>
                <span className="font-medium">#{order.id?.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mijoz:</span>
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Telefon:</span>
                <span className="font-medium">{order.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Miqdor:</span>
                <span className="font-medium">{order.quantity} ta</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Narx:</span>
                <span className="font-medium">{formatPrice(order.totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sana:</span>
                <span className="font-medium">{order.createdAt.toLocaleDateString('uz-UZ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Holat:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h5 className="font-medium text-gray-900 mb-2">Yetkazib berish manzili:</h5>
            <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
          </div>

          {order.notes && (
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Qo'shimcha eslatma:</h5>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Yopish
            </button>
            <button className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1">
              <Phone size={16} />
              <span>Qo'ng'iroq</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
