
import React from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Order } from '../../services/dataService';

interface EditingCustomerInfo {
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  userId?: string;
}

interface EditOrderModalProps {
  editingOrder: Order | null;
  orderItems: {[cakeId: string]: number};
  newProductSearchQuery: string;
  editingCustomerInfo: EditingCustomerInfo;
  availableCakes: any[];
  onClose: () => void;
  onSave: () => Promise<void>;
  onAddItem: (cakeId: string) => void;
  onRemoveItem: (cakeId: string) => void;
  setNewProductSearchQuery: (query: string) => void;
  setEditingCustomerInfo: React.Dispatch<React.SetStateAction<EditingCustomerInfo>>;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({
  editingOrder,
  orderItems,
  newProductSearchQuery,
  editingCustomerInfo,
  availableCakes,
  onClose,
  onSave,
  onAddItem,
  onRemoveItem,
  setNewProductSearchQuery,
  setEditingCustomerInfo
}) => {
  if (!editingOrder) return null;

  const calculateTotalPrice = () => {
    return Object.entries(orderItems).reduce((total, [cakeId, quantity]) => {
      const cake = availableCakes.find(c => c.id === cakeId);
      if (!cake) return total;
      const itemPrice = cake.discount 
        ? cake.price * (1 - cake.discount / 100) 
        : cake.price;
      return total + (itemPrice * quantity);
    }, 0);
  };

  const calculateTotalQuantity = () => {
    return Object.values(orderItems).reduce((sum, qty) => sum + qty, 0);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Buyurtmani tahrirlash</h3>
          <button
            onClick={() => {
              const hasChanges = Object.keys(orderItems).length > 0 || 
                editingCustomerInfo.customerName !== editingOrder?.customerName ||
                editingCustomerInfo.customerPhone !== editingOrder?.customerPhone ||
                editingCustomerInfo.deliveryAddress !== editingOrder?.deliveryAddress;

              if (hasChanges && !confirm('O\'zgarishlar saqlanmaydi. Davom etishni xohlaysizmi?')) {
                return;
              }
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Order Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Buyurtma ma'lumotlari</h4>
            <div className="space-y-4">
              <div>
                <span className="text-gray-600 text-sm">Buyurtma ID:</span>
                <span className="ml-2 font-medium">#{editingOrder.orderUniqueId || editingOrder.id?.slice(-8)}</span>
              </div>

              {/* Customer Information Editing */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Foydalanuvchi ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingCustomerInfo.userId || ''}
                      onChange={(e) => setEditingCustomerInfo(prev => ({
                        ...prev,
                        userId: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="user-12345"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mijoz ismi
                    </label>
                    <input
                      type="text"
                      value={editingCustomerInfo.customerName}
                      onChange={(e) => setEditingCustomerInfo(prev => ({
                        ...prev,
                        customerName: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Mijoz ismini kiriting"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon raqam
                    </label>
                    <input
                      type="tel"
                      value={editingCustomerInfo.customerPhone}
                      onChange={(e) => setEditingCustomerInfo(prev => ({
                        ...prev,
                        customerPhone: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yetkazib berish manzili
                  </label>
                  <textarea
                    value={editingCustomerInfo.deliveryAddress}
                    onChange={(e) => setEditingCustomerInfo(prev => ({
                      ...prev,
                      deliveryAddress: e.target.value
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                    placeholder="To'liq manzilni kiriting"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Current Products */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Buyurtmadagi mahsulotlar</h4>
            <div className="space-y-3">
              {Object.entries(orderItems).map(([cakeId, quantity]) => {
                const cake = availableCakes.find(c => c.id === cakeId);
                if (!cake) return null;

                const itemPrice = cake.discount 
                  ? cake.price * (1 - cake.discount / 100) 
                  : cake.price;

                return (
                  <div key={cakeId} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{cake.name}</h5>
                      <p className="text-sm text-gray-600">
                        {itemPrice.toLocaleString('uz-UZ')} so'm / dona
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onRemoveItem(cakeId)}
                          className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          -
                        </button>
                        <span className="font-medium min-w-[30px] text-center">{quantity}</span>
                        <button
                          onClick={() => onAddItem(cakeId)}
                          className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {(itemPrice * quantity).toLocaleString('uz-UZ')} so'm
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add New Product */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Yangi mahsulot qo'shish</h4>

            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Mahsulot nomini qidiring..."
                value={newProductSearchQuery}
                onChange={(e) => setNewProductSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto">
              {availableCakes
                .filter(cake => !orderItems[cake.id!])
                .filter(cake => 
                  cake.name.toLowerCase().includes(newProductSearchQuery.toLowerCase()) ||
                  cake.description.toLowerCase().includes(newProductSearchQuery.toLowerCase()) ||
                  cake.bakerName.toLowerCase().includes(newProductSearchQuery.toLowerCase()) ||
                  (cake.shopName && cake.shopName.toLowerCase().includes(newProductSearchQuery.toLowerCase()))
                )
                .map((cake) => {
                  const itemPrice = cake.discount 
                    ? cake.price * (1 - cake.discount / 100) 
                    : cake.price;

                  return (
                    <div key={cake.id} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{cake.name}</h5>
                        <p className="text-sm text-gray-600">
                          {itemPrice.toLocaleString('uz-UZ')} so'm / dona
                        </p>
                        {cake.discount && (
                          <span className="text-xs text-red-600">
                            -{cake.discount}% chegirma
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => onAddItem(cake.id!)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        + Qo'shish
                      </button>
                    </div>
                  );
                })
              }

              {availableCakes
                .filter(cake => !orderItems[cake.id!])
                .filter(cake => 
                  cake.name.toLowerCase().includes(newProductSearchQuery.toLowerCase()) ||
                  cake.description.toLowerCase().includes(newProductSearchQuery.toLowerCase()) ||
                  cake.bakerName.toLowerCase().includes(newProductSearchQuery.toLowerCase()) ||
                  (cake.shopName && cake.shopName.toLowerCase().includes(newProductSearchQuery.toLowerCase()))
                ).length === 0 && newProductSearchQuery.trim() !== '' && (
                <div className="text-center py-4 text-gray-500">
                  <Search size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">"{newProductSearchQuery}" bo'yicha mahsulot topilmadi</p>
                </div>
              )}

              {availableCakes.filter(cake => !orderItems[cake.id!]).length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <Plus size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Barcha mavjud mahsulotlar buyurtmaga qo'shilgan</p>
                </div>
              )}
            </div>
          </div>

          {/* Total Summary */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Jami summa:</span>
              <span className="text-xl font-bold text-green-600">
                {calculateTotalPrice().toLocaleString('uz-UZ')} so'm
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-600">Jami miqdor:</span>
              <span className="font-medium text-gray-900">
                {calculateTotalQuantity()} dona
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              onClick={onSave}
              disabled={
                Object.keys(orderItems).length === 0 || 
                !editingCustomerInfo.customerName.trim() ||
                !editingCustomerInfo.customerPhone.trim() ||
                !editingCustomerInfo.deliveryAddress.trim()
              }
              className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;
