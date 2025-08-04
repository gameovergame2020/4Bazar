
import { useState } from 'react';
import { Cake } from '../services/dataService';
import { dataService } from '../services/dataService';

export const useProductStock = () => {
  const [loading, setLoading] = useState(false);

  const updateProductQuantity = async (
    productId: string, 
    quantity: number, 
    setMyCakes: React.Dispatch<React.SetStateAction<Cake[]>>
  ) => {
    try {
      setLoading(true);
      
      const updates = {
        quantity: quantity,
        available: quantity > 0
      };

      await dataService.updateCake(productId, updates);

      setMyCakes(prev => 
        prev.map(item => 
          item.id === productId 
            ? { ...item, ...updates }
            : item
        )
      );

      if (quantity > 0) {
        console.log('✅ Mahsulot "Buyurtma uchun" dan "Hozir mavjud" ga o\'tdi');
      } else {
        console.log('⚠️ Mahsulot "Hozir mavjud" dan "Buyurtma uchun" ga o\'tdi');
      }

    } catch (error) {
      console.error('Mahsulot holatini yangilashda xatolik:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (
    productId: string, 
    newValue: number, 
    field: 'inStockQuantity' | 'amount' = 'inStockQuantity',
    myCakes: Cake[],
    setMyCakes: React.Dispatch<React.SetStateAction<Cake[]>>,
    loadData: () => Promise<void>
  ) => {
    try {
      const updateData: any = {};

      if (field === 'amount') {
        updateData.amount = newValue;
        const cake = myCakes.find(c => c.id === productId);
        const currentQuantity = cake?.quantity || 0;
        updateData.available = currentQuantity > 0;
      } else if (field === 'inStockQuantity') {
        updateData.inStockQuantity = newValue;
        const cake = myCakes.find(c => c.id === productId);
        const currentQuantity = cake?.quantity || 0;
        updateData.available = currentQuantity > 0;
      } else {
        updateData.quantity = newValue;
        updateData.available = newValue > 0;
      }

      await dataService.updateCake(productId, updateData);
      await loadData();
    } catch (error) {
      console.error('Zaxirani yangilashda xatolik:', error);
      throw error;
    }
  };

  return {
    loading,
    updateProductQuantity,
    handleUpdateStock
  };
};
