departments', departmentId), {
        memberCount: departmentMembers.length + 1,
        updatedAt: Timestamp.now()
      });

      console.log('✅ Foydalanuvchi bo\'limga tayinlandi');
    } catch (error) {
      console.error('❌ Foydalanuvchini bo\'limga tayinlashda xatolik:', error);
      throw error;
    }
  }

  // Foydalanuvchini bo'limdan chiqarish
  async removeUserFromDepartment(userId: string, departmentId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        departmentId: null,
        updatedAt: Timestamp.now()
      });

      // Bo'limdagi xodimlar sonini yangilash
      const departmentMembers = await this.getDepartmentMembers(departmentId);
      await updateDoc(doc(db, 'departments', departmentId), {
        memberCount: Math.max(0, departmentMembers.length - 1),
        updatedAt: Timestamp.now()
      });

      console.log('✅ Foydalanuvchi bo\'limdan chiqarildi');
    } catch (error) {
      console.error('❌ Foydalanuvchini bo\'limdan chiqarishda xatolik:', error);
      throw error;
    }
  }

  // REAL-TIME YANGILANISHLAR

  // Tortlarni real-time kuzatish
  subscribeToRealtimeCakes(callback: (cakes: Cake[]) => void, filters?: { 
    category?: string; 
    bakerId?: string; 
    shopId?: string;
    available?: boolean;
    productType?: 'baked' | 'ready';
  }) {
    let isActive = true;
    let retryCount = 0;
    const maxRetries = 3;

    const createSubscription = () => {
      if (!isActive) return null;

      try {
        let q = query(
          collection(db, 'cakes'), 
          orderBy('createdAt', 'desc'),
          limit(100) // Limit qo'shish BloomFilter xatosini kamaytirish uchun
        );

        if (filters?.category) {
          q = query(q, where('category', '==', filters.category));
        }
        if (filters?.bakerId) {
          q = query(q, where('bakerId', '==', filters.bakerId));
        }
        if (filters?.shopId) {
          q = query(q, where('shopId', '==', filters.shopId));
        }
        if (filters?.productType) {
          q = query(q, where('productType', '==', filters.productType));
        }
        if (filters?.available !== undefined) {
          q = query(q, where('available', '==', filters.available));
        }

        return onSnapshot(q, 
          (querySnapshot) => {
            if (!isActive) return;

            try {
              const cakes = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate(),
                updatedAt: doc.data().updatedAt.toDate()
              } as Cake));

              retryCount = 0; // Reset retry count on success
              callback(cakes);
            } catch (error) {
              console.error('❌ Cakes callback xatosi:', error);
              if (isActive) {
                callback([]);
              }
            }
          },
          (error) => {
            if (!isActive) return;

            console.error('❌ Cakes subscription xatosi:', error);
            retryCount++;

            if (retryCount <= maxRetries) {
              const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
              console.log(`🔄 Cakes subscription qayta urinish... (${retryCount}/${maxRetries})`);

              setTimeout(() => {
                if (isActive) {
                  createSubscription();
                }
              }, retryDelay);
            } else {
              console.error('❌ Cakes subscription maksimal retry tugadi');
              if (isActive) {
                callback([]);
              }
            }
          }
        );
      } catch (error) {
        console.error('❌ Cakes subscription yaratishda xatolik:', error);
        return null;
      }
    };

    const unsubscribe = createSubscription();

    return () => {
      isActive = false;
      try {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (error) {
        console.warn('⚠️ Cakes subscription o\'chirishda xato:', error);
      }
    };
  }

  // Buyurtmalar holatini real-time kuzatish (User ID bo'yicha optimized)
  subscribeToOrders(callback: (orders: Order[]) => void, filters?: { customerId?: string }) {
    let isSubscriptionActive = true;
    let retryCount = 0;
    const maxRetries = 3;

    const createSubscription = () => {
      if (!isSubscriptionActive) return null;

      let q;

      try {
        if (filters?.customerId) {
          console.log('🔄 Real-time subscription: Customer ID bo\'yicha', filters.customerId);
          // Faqat specific customer uchun
          q = query(
            collection(db, 'orders'), 
            where('customerId', '==', filters.customerId),
            orderBy('createdAt', 'desc'),
            limit(100) // Kamroq limit
          );
        } else {
          console.log('🔄 Real-time subscription: Umumiy buyurtmalar');
          // Umumiy buyurtmalar uchun
          q = query(
            collection(db, 'orders'), 
            orderBy('createdAt', 'desc'), 
            limit(100) // Limit oshirildi
          );
        }

        return onSnapshot(q, 
          (querySnapshot) => {
            if (!isSubscriptionActive) return;

            try {
              const filterText = filters?.customerId ? `Customer ID (${filters.customerId})` : 'Umumiy';
              console.log(`📥 Real-time Orders (${filterText}): ${querySnapshot.docs.length} ta hujjat keldi`);

              const orders: Order[] = [];
              const changedDocs = querySnapshot.docChanges();

              // Change log
              changedDocs.forEach((change) => {
                if (change.type === 'modified') {
                  const data = change.doc.data();
                  console.log(`🔄 Order status changed: ${change.doc.id} -> ${data.status}`);
                }
              });

              querySnapshot.docs.forEach((doc) => {
                try {
                  const data = doc.data();

                  // Customer filter bo'lsa, yana bir marta tekshirish
                  if (filters?.customerId && data.customerId !== filters.customerId) {
                    return; // Skip this order
                  }

                  const order: Order = {
                    id: doc.id,
                    orderUniqueId: data.orderUniqueId,
                    customerId: data.customerId || '',
                    customerName: data.customerName || 'Noma\'lum',
                    customerPhone: data.customerPhone || '',
                    cakeId: data.cakeId || '',
                    cakeName: data.cakeName || '',
                    quantity: Math.max(1, data.quantity || 1),
                    amount: data.amount,
                    totalPrice: Math.max(0, data.totalPrice || 0),
                    status: data.status || 'pending',
                    deliveryAddress: data.deliveryAddress || '',
                    coordinates: data.coordinates,
                    paymentMethod: data.paymentMethod,
                    paymentType: data.paymentType,
                    notes: data.notes,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    deliveryTime: data.deliveryTime?.toDate()
                  };

                  orders.push(order);
                } catch (parseError) {
                  console.warn('⚠️ Hujjat parse qilishda xato:', doc.id, parseError);
                }
              });

              console.log(`✅ Real-time Orders (${filterText}): ${orders.length} ta buyurtma qayta ishlandi`);
              retryCount = 0; // Reset retry count on success
              callback(orders);

            } catch (error) {
              console.error('❌ Real-time orders callback xatosi:', error);
              if (isSubscriptionActive) {
                callback([]);
              }
            }
          }, 
          (error) => {
            if (!isSubscriptionActive) return;

            console.error('❌ Real-time orders subscription xatosi:', error);
            retryCount++;

            if (retryCount <= maxRetries) {
              // Retry with exponential backoff
              const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
              console.log(`🔄 Orders subscription qayta urinish... (${retryCount}/${maxRetries}) - ${retryDelay}ms kutish`);

              setTimeout(() => {
                if (isSubscriptionActive) {
                  try {
                    createSubscription();
                  } catch (retryError) {
                    console.error('❌ Retry orders subscription xatosi:', retryError);
                  }
                }
              }, retryDelay);
            } else {
              console.error('❌ Orders subscription maksimal retry tugadi');
              if (isSubscriptionActive) {
                callback([]);
              }
            }
          }
        );
      } catch (error) {
        console.error('❌ Orders subscription yaratishda xatolik:', error);
        return null;
      }
    };

    const unsubscribe = createSubscription();

    return () => {
      isSubscriptionActive = false;
      try {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (error) {
        console.warn('⚠️ Orders subscription o\'chirishda xato:', error);
      }
    };
  }
}

export const dataService = new DataService();

// Buyurtmani bekor qilish uchun alohida export
export const cancelOrder = (orderId: string) => dataService.cancelOrder(orderId);

// Foydalanuvchi buyurtmalarini olish uchun alohida export
export const getUserOrders = (userId: string) => dataService.getOrdersByUserId(userId);