
import React from 'react';
import { X, Save, Upload } from 'lucide-react';
import { Cake } from '../../services/dataService';

interface CakeFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  ingredients: string;
  image: File | null;
  available: boolean;
  quantity: string;
  discount: string;
}

interface ProductFormProps {
  isOpen: boolean;
  editingCake: Cake | null;
  cakeForm: CakeFormData;
  setCakeForm: React.Dispatch<React.SetStateAction<CakeFormData>>;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  categories: Array<{ value: string; label: string }>;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  isOpen,
  editingCake,
  cakeForm,
  setCakeForm,
  onSubmit,
  onCancel,
  loading,
  categories
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingCake ? 'Tortni tahrirlash' : 'Yangi tort qo\'shish'}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tort nomi *</label>
            <input
              type="text"
              value={cakeForm.name}
              onChange={(e) => setCakeForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Masalan: Shokoladli tort"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tavsif *</label>
            <textarea
              value={cakeForm.description}
              onChange={(e) => setCakeForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Tort haqida qisqacha ma'lumot"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Narx (so'm) *</label>
              <input
                type="number"
                value={cakeForm.price}
                onChange={(e) => setCakeForm(prev => ({ ...prev, price: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="250000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chegirma (%)</label>
              <input
                type="number"
                value={cakeForm.discount}
                onChange={(e) => {
                  const value = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                  setCakeForm(prev => ({ ...prev, discount: value.toString() }));
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategoriya</label>
            <select
              value={cakeForm.category}
              onChange={(e) => setCakeForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tarkibiy qismlar</label>
            <input
              type="text"
              value={cakeForm.ingredients}
              onChange={(e) => setCakeForm(prev => ({ ...prev, ingredients: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Shokolad, un, tuxum, shakar (vergul bilan ajrating)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rasm</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCakeForm(prev => ({ ...prev, image: e.target.files?.[0] || null }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="available"
                  checked={cakeForm.available}
                  onChange={(e) => setCakeForm(prev => ({ 
                    ...prev, 
                    available: e.target.checked,
                    quantity: e.target.checked ? prev.quantity : '0'
                  }))}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="available" className="ml-2 block text-sm text-gray-900">
                  Hozir mavjud
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="customOrder"
                  checked={!cakeForm.available}
                  onChange={(e) => setCakeForm(prev => ({ 
                    ...prev, 
                    available: !e.target.checked,
                    quantity: e.target.checked ? '0' : prev.quantity
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="customOrder" className="ml-2 block text-sm text-gray-900">
                  Buyurtma uchun
                </label>
              </div>
            </div>

            {cakeForm.available && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mavjud tortlar soni *</label>
                <input
                  type="number"
                  value={cakeForm.quantity}
                  onChange={(e) => setCakeForm(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Mavjud tortlar soni"
                  min="1"
                  required
                />
              </div>
            )}
          </div>

          {!cakeForm.available && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Buyurtma rejimi:</span> Tort mavjud emas, lekin mijozlar buyurtma bera olishadi. Siz buyurtmani qabul qilganingizdan keyin tortni tayyorlaysiz.
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onSubmit}
              disabled={loading}
              className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save size={16} />
                  <span>{editingCake ? 'Yangilash' : 'Saqlash'}</span>
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Bekor qilish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
