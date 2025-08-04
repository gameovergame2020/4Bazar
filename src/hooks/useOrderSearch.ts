
import { useState } from 'react';
import { dataService, Order } from '../services/dataService';

export const useOrderSearch = (setOrders: React.Dispatch<React.SetStateAction<Order[]>>) => {
  const [searchOrderId, setSearchOrderId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ type: 'success' | 'error' | null; message: string; count: number }>({
    type: null,
    message: '',
    count: 0
  });

  const handleSearchByOrderId = async () => {
    if (!searchOrderId.trim()) {
      setSearchResult({ type: 'error', message: 'Buyurtma ID sini kiriting', count: 0 });
      return;
    }

    try {
      setIsSearching(true);

      const cleanSearchId = searchOrderId.trim().replace(/^#/, '').toUpperCase();
      console.log('🔍 Order ID bo\'yicha qidiruv:', cleanSearchId);

      const allOrders = await dataService.getOrders();
      const foundOrders = allOrders.filter(order => {
        const orderUniqueId = order.orderUniqueId?.toUpperCase() || '';
        const orderId = order.id?.toUpperCase() || '';

        return orderUniqueId.includes(cleanSearchId) || 
               orderId.includes(cleanSearchId) ||
               orderUniqueId === cleanSearchId ||
               orderId.slice(-6) === cleanSearchId;
      });

      if (foundOrders.length > 0) {
        console.log(`✅ ${foundOrders.length} ta buyurtma topildi`);
        setOrders(foundOrders);
        setSearchResult({ 
          type: 'success', 
          message: 'Topildi', 
          count: foundOrders.length 
        });
      } else {
        setSearchResult({ 
          type: 'error', 
          message: 'Topilmadi', 
          count: 0 
        });
      }
    } catch (error) {
      console.error('❌ Qidirishda xato:', error);
      setSearchResult({ type: 'error', message: 'Xatolik yuz berdi', count: 0 });
    } finally {
      setIsSearching(false);
    }
  };

  return {
    searchOrderId,
    setSearchOrderId,
    isSearching,
    searchResult,
    setSearchResult,
    handleSearchByOrderId
  };
};
