
import { 
  collection, 
  query, 
  where, 
  orderBy,
  getDocs,
  db
} from './shared/firebaseConfig';
import { Cake, Order } from './shared/types';
import { productService } from './productService';
import { orderService } from './orderService';
import { storageService } from './storageService';

class StatisticsService {
  // Mavjud mahsulotlar statistikasi (shop mahsulotlari - available: true)
  async getAvailableProductsStats(): Promise<{
    totalAvailable: number;
    totalQuantity: number;
    lowStock: number; // 5 ta va undan kam
    outOfStock: number; // 0 ta
    categoryBreakdown: { [category: string]: number };
  }> {
    try {
      const allCakes = await productService.getCakes();
      const availableProducts = allCakes.filter(cake => 
        cake.productType === 'ready' && cake.available === true
      );

      // Inventory collection'dan miqdorlarni olish
      const inventoryPromises = availableProducts.map(async (cake) => {
        const q = query(
          collection(db, 'inventory'),
          where('productId', '==', cake.id),
          where('type', '==', 'available')
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          return querySnapshot.docs[0].data().quantity;
        }
        return cake.quantity || 0;
      });

      const quantities = await Promise.all(inventoryPromises);

      const stats = {
        totalAvailable: availableProducts.length,
        totalQuantity: quantities.reduce((sum, qty) => sum + qty, 0),
        lowStock: quantities.filter(qty => qty <= 5 && qty > 0).length,
        outOfStock: quantities.filter(qty => qty === 0).length,
        categoryBreakdown: {} as { [category: string]: number }
      };

      // Kategoriya bo'yicha taqsimlash
      availableProducts.forEach(cake => {
        stats.categoryBreakdown[cake.category] = (stats.categoryBreakdown[cake.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Mavjud mahsulotlar statistikasini olishda xatolik:', error);
      throw error;
    }
  }

  // Buyurtma berish uchun mahsulotlar statistikasi (baker mahsulotlari)
  async getOrderBasedProductsStats(): Promise<{
    totalOrderBased: number;
    totalOrdered: number;
    activeOrders: number; // pending, accepted, preparing
    completedOrders: number; // ready, delivered
    cancelledOrders: number;
    categoryBreakdown: { [category: string]: number };
    monthlyOrdersGrowth: number;
  }> {
    try {
      const allCakes = await productService.getCakes();
      const allOrders = await orderService.getOrders();

      const orderBasedProducts = allCakes.filter(cake => 
        cake.productType === 'baked' || (cake.bakerId && !cake.shopId)
      );

      // Buyurtmalar bo'yicha statistika
      const activeOrderStatuses = ['pending', 'accepted', 'preparing'];
      const completedOrderStatuses = ['ready', 'delivered'];
      const cancelledOrderStatuses = ['cancelled'];

      const activeOrders = allOrders.filter(order => activeOrderStatuses.includes(order.status));
      const completedOrders = allOrders.filter(order => completedOrderStatuses.includes(order.status));
      const cancelledOrders = allOrders.filter(order => cancelledOrderStatuses.includes(order.status));

      // Oylik o'sish hisobi (oxirgi 2 oy)
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const currentMonthOrders = allOrders.filter(order => 
        order.createdAt >= currentMonth
      ).length;

      const lastMonthOrders = allOrders.filter(order => 
        order.createdAt >= lastMonth && order.createdAt < currentMonth
      ).length;

      const monthlyOrdersGrowth = lastMonthOrders > 0 
        ? ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 
        : 0;

      const stats = {
        totalOrderBased: orderBasedProducts.length,
        totalOrdered: allOrders.reduce((sum, order) => sum + order.quantity, 0),
        activeOrders: activeOrders.length,
        completedOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
        categoryBreakdown: {} as { [category: string]: number },
        monthlyOrdersGrowth: Math.round(monthlyOrdersGrowth * 100) / 100
      };

      // Kategoriya bo'yicha taqsimlash
      orderBasedProducts.forEach(cake => {
        stats.categoryBreakdown[cake.category] = (stats.categoryBreakdown[cake.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Buyurtma asosidagi mahsulotlar statistikasini olishda xatolik:', error);
      throw error;
    }
  }

  // Umumiy biznes statistikasi
  async getBusinessStats(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    topSellingProducts: Array<{ cakeId: string; cakeName: string; totalSold: number; revenue: number }>;
    dailyOrdersThisWeek: Array<{ date: string; orders: number }>;
  }> {
    try {
      const allOrders = await orderService.getOrders();
      const completedOrders = allOrders.filter(order => 
        ['delivered', 'ready'].includes(order.status)
      );

      const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
      const totalOrders = completedOrders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Eng ko'p sotilgan mahsulotlar
      const productSales: { [cakeId: string]: { name: string; sold: number; revenue: number } } = {};

      completedOrders.forEach(order => {
        if (!productSales[order.cakeId]) {
          productSales[order.cakeId] = {
            name: order.cakeName,
            sold: 0,
            revenue: 0
          };
        }
        productSales[order.cakeId].sold += order.quantity;
        productSales[order.cakeId].revenue += order.totalPrice;
      });

      const topSellingProducts = Object.entries(productSales)
        .map(([cakeId, data]) => ({
          cakeId,
          cakeName: data.name,
          totalSold: data.sold,
          revenue: data.revenue
        }))
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 5);

      // Haftalik buyurtmalar
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const dailyOrdersThisWeek: Array<{ date: string; orders: number }> = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(oneWeekAgo.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const ordersOnDate = allOrders.filter(order => {
          const orderDate = order.createdAt.toISOString().split('T')[0];
          return orderDate === dateStr;
        }).length;

        dailyOrdersThisWeek.push({
          date: dateStr,
          orders: ordersOnDate
        });
      }

      return {
        totalRevenue: Math.round(totalRevenue),
        totalOrders,
        averageOrderValue: Math.round(averageOrderValue),
        topSellingProducts,
        dailyOrdersThisWeek
      };
    } catch (error) {
      console.error('Biznes statistikasini olishda xatolik:', error);
      throw error;
    }
  }

  // Real-time statistika kuzatish (optimized)
  subscribeToStats(callback: (stats: {
    available: any;
    orderBased: any;
    business: any;
  }) => void) {
    let isActive = true;
    let unsubscribeCakes: (() => void) | null = null;
    let unsubscribeOrders: (() => void) | null = null;
    let debounceTimer: NodeJS.Timeout | null = null;

    const debouncedUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        if (!isActive) return;
        
        try {
          const [available, orderBased, business] = await Promise.all([
            this.getAvailableProductsStats(),
            this.getOrderBasedProductsStats(),
            this.getBusinessStats()
          ]);

          if (isActive) {
            callback({ available, orderBased, business });
          }
        } catch (error) {
          console.error('Statistikani yangilashda xatolik:', error);
        }
      }, 1000); // 1 second debounce
    };

    try {
      // Less frequent updates to reduce BloomFilter load
      unsubscribeCakes = productService.subscribeToRealtimeCakes(debouncedUpdate);
      unsubscribeOrders = orderService.subscribeToOrders(debouncedUpdate);
    } catch (error) {
      console.error('Subscription yaratishda xatolik:', error);
    }

    return () => {
      isActive = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      try {
        if (typeof unsubscribeCakes === 'function') {
          unsubscribeCakes();
        }
        if (typeof unsubscribeOrders === 'function') {
          unsubscribeOrders();  
        }
      } catch (error) {
        console.warn('Subscription o\'chirishda xatolik:', error);
      }
    };
  }
}

export const statisticsService = new StatisticsService();
