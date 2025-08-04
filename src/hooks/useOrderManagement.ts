
import { useState } from 'react';
import { dataService, Order } from '../services/dataService';

interface EditingCustomerInfo {
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  userId?: string;
}

export const useOrderManagement = (orders: Order[], setOrders: React.Dispatch<React.SetStateAction<Order[]>>, loadData: () => Promise<void>) => {
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<{[cakeId: string]: number}>({});
  const [newProductSearchQuery, setNewProductSearchQuery] = useState('');
  const [editingCustomerInfo, setEditingCustomerInfo] = useState<EditingCustomerInfo>({
    customerId: '',
    customerName: '',
    customerPhone: '',
    deliveryAddress: ''
  });

  const handleRemoveOrderItem = async (orderId: string) => {
    if (confirm('Bu buyurtmani o\'chirishni tasdiqlaysizmi?')) {
      try {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          console.log('🚫 Operator buyurtmani bekor qilmoqda:', {
            orderId,
            cakeId: order.cakeId,
            quantity: order.quantity,
            fromStock: order.fromStock,
            status: order.status,
            customerName: order.customerName
          });

          // MUHIM: Buyurtma holatini cancelled qilib o'zgartirish
          await dataService.updateOrderStatus(orderId, 'cancelled');
          
          // MUHIM: Mahsulot miqdorini qaytarish va inStockQuantity ni to'g'ri boshqarish
          const fromStockStatus = order.fromStock !== undefined ? order.fromStock : true;
          
          console.log('🔄 Operator bekor qilish: mahsulot quantity va inStockQuantity ni qaytarish:', {
            cakeId: order.cakeId,
            orderQuantity: order.quantity,
            fromStock: fromStockStatus
          });
          
          await dataService.revertOrderQuantity(order.cakeId, order.quantity, fromStockStatus);
          
          console.log('✅ Operator: buyurtma bekor qilindi, mahsulot quantity va inStockQuantity to\'g\'ri qaytarildi');
        }
        
        // Local state ni yangilash
        setOrders(prev => prev.filter(order => order.id !== orderId));
        
        // Ma'lumotlarni qayta yuklash
        await loadData();
        
      } catch (error) {
        console.error('❌ Operator buyurtmani bekor qilishda xatolik:', error);
        alert('Buyurtmani o\'chirishda xatolik yuz berdi. Qaytadan urinib ko\'ring.');
      }
    }
  };

  const handleAddOrderNote = async (orderId: string, note: string) => {
    try {
      await dataService.updateOrder(orderId, { notes: note });
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, notes: note, updatedAt: new Date() } : order
        )
      );
    } catch (error) {
      console.error('Eslatma qo\'shishda xatolik:', error);
      alert('Eslatma qo\'shishda xatolik yuz berdi');
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setOrderItems({ [order.cakeId]: order.quantity });
    setEditingCustomerInfo({
      customerId: '',
      customerName: '',
      customerPhone: '',
      deliveryAddress: ''
    });
    setNewProductSearchQuery('');
  };

  const handleAddItemToOrder = (cakeId: string, availableCakes: any[]) => {
    const cake = availableCakes.find(c => c.id === cakeId);
    if (!cake) return;

    setOrderItems(prev => {
      const currentQuantity = prev[cakeId] || 0;

      if (cake.quantity !== undefined && currentQuantity >= cake.quantity) {
        alert(`Bu mahsulotdan faqat ${cake.quantity} ta mavjud`);
        return prev;
      }

      return {
        ...prev,
        [cakeId]: currentQuantity + 1
      };
    });
  };

  const handleRemoveItemFromOrder = (cakeId: string) => {
    setOrderItems(prev => {
      const newItems = { ...prev };
      if (newItems[cakeId] > 1) {
        newItems[cakeId]--;
      } else {
        delete newItems[cakeId];
      }
      return newItems;
    });
  };

  const handleSaveOrderChanges = async (availableCakes: any[]) => {
    if (!editingOrder) return;

    if (Object.keys(orderItems).length === 0) {
      alert('Buyurtmada kamida bitta mahsulot bo\'lishi kerak');
      return;
    }

    if (!editingCustomerInfo.customerName.trim()) {
      alert('Mijoz ismini kiriting');
      return;
    }

    if (!editingCustomerInfo.customerPhone.trim()) {
      alert('Telefon raqamini kiriting');
      return;
    }

    if (!editingCustomerInfo.deliveryAddress.trim()) {
      alert('Yetkazib berish manzilini kiriting');
      return;
    }

    try {
      let totalPrice = 0;
      let totalQuantity = 0;
      const itemNames: string[] = [];

      Object.entries(orderItems).forEach(([cakeId, quantity]) => {
        const cake = availableCakes.find(c => c.id === cakeId);
        if (cake) {
          const itemPrice = cake.discount 
            ? cake.price * (1 - cake.discount / 100) 
            : cake.price;
          totalPrice += itemPrice * quantity;
          totalQuantity += quantity;
          itemNames.push(`${cake.name} (${quantity}x)`);
        }
      });

      const isSimpleOrder = Object.keys(orderItems).length === 1;
      const firstCakeId = Object.keys(orderItems)[0];

      const updates: any = {
        quantity: totalQuantity,
        totalPrice: totalPrice,
        customerName: editingCustomerInfo.customerName.trim(),
        customerPhone: editingCustomerInfo.customerPhone.trim(),
        deliveryAddress: editingCustomerInfo.deliveryAddress.trim(),
        updatedAt: new Date()
      };

      if (isSimpleOrder) {
        updates.cakeId = firstCakeId;
        updates.cakeName = itemNames[0];
      } else {
        updates.cakeName = itemNames.join(', ');
      }

      await dataService.updateOrder(editingOrder.id!, updates);

      setOrders(prev => 
        prev.map(order => 
          order.id === editingOrder.id 
            ? { ...order, ...updates }
            : order
        )
      );

      setEditingOrder(null);
      setOrderItems({});
      setNewProductSearchQuery('');
      setEditingCustomerInfo({
        customerId: '',
        customerName: '',
        customerPhone: '',
        deliveryAddress: ''
      });

      alert('Buyurtma muvaffaqiyatli yangilandi');
    } catch (error) {
      console.error('Buyurtmani yangilashda xatolik:', error);
      alert('Buyurtmani yangilashda xatolik yuz berdi');
    }
  };

  return {
    editingOrder,
    setEditingOrder,
    orderItems,
    setOrderItems,
    newProductSearchQuery,
    setNewProductSearchQuery,
    editingCustomerInfo,
    setEditingCustomerInfo,
    handleRemoveOrderItem,
    handleAddOrderNote,
    handleEditOrder,
    handleAddItemToOrder,
    handleRemoveItemFromOrder,
    handleSaveOrderChanges
  };
};
