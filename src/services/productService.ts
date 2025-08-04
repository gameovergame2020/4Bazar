import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  db
} from './shared/firebaseConfig';
import { Cake, Review } from './shared/types';

class ProductService {
  // Yangi tort qo'shish
  async addCake(cake: Omit<Cake, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const cakeData: any = {
        ...cake,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Yangi tizim: inStockQuantity, amount va rejectAmount maydonlari
      if (cake.productType === 'baked') {
        // Baker mahsulotlari
        cakeData.inStockQuantity = cake.inStockQuantity !== undefined ? cake.inStockQuantity : 0;
        cakeData.amount = cake.amount !== undefined ? cake.amount : 0;
        cakeData.rejectAmount = cake.rejectAmount !== undefined ? cake.rejectAmount : 0;

        // Available holati: quantity mavjud va > 0 bo'lsa true
        if (cake.quantity !== undefined && cake.quantity > 0) {
          cakeData.available = true;
        } else {
          cakeData.available = false;
        }
      } else if (cake.productType === 'ready') {
        // Shop mahsulotlari
        cakeData.inStockQuantity = cake.inStockQuantity !== undefined ? cake.inStockQuantity : 0;
        cakeData.rejectAmount = cake.rejectAmount !== undefined ? cake.rejectAmount : 0;
        cakeData.available = (cakeData.inStockQuantity > 0);
      }

      // Legacy quantity field ni ham saqlash (backward compatibility)
      if (cake.quantity !== undefined) {
        cakeData.quantity = cake.quantity;
      }

      // undefined qiymatlarni olib tashlash
      Object.keys(cakeData).forEach(key => {
        if (cakeData[key] === undefined) {
          delete cakeData[key];
        }
      });

      console.log('🍰 Yangi mahsulot qo\'shilmoqda:', {
        productType: cakeData.productType,
        inStockQuantity: cakeData.inStockQuantity,
        amount: cakeData.amount,
        rejectAmount: cakeData.rejectAmount,
        available: cakeData.available
      });

      const docRef = await addDoc(collection(db, 'cakes'), cakeData);
      return docRef.id;
    } catch (error) {
      console.error('Tort qo\'shishda xatolik:', error);
      throw error;
    }
  }

  // Tortlarni olish
  async getCakes(filters?: { 
    category?: string; 
    bakerId?: string; 
    shopId?: string;
    available?: boolean;
    productType?: 'baked' | 'ready';
  }): Promise<Cake[]> {
    try {
      let q = query(collection(db, 'cakes'), orderBy('createdAt', 'desc'));

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

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as Cake));
    } catch (error) {
      console.error('Tortlarni olishda xatolik:', error);
      throw error;
    }
  }

  // Bitta tortning ma'lumotlarini olish
  async getCakeById(cakeId: string): Promise<Cake | null> {
    try {
      const docRef = doc(db, 'cakes', cakeId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt.toDate(),
          updatedAt: docSnap.data().updatedAt.toDate()
        } as Cake;
      }
      return null;
    } catch (error) {
      console.error('Tortni olishda xatolik:', error);
      throw error;
    }
  }

  // Tortni yangilash
  async updateCake(cakeId: string, updates: Partial<Cake>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await updateDoc(doc(db, 'cakes', cakeId), updateData);
    } catch (error) {
      console.error('Tortni yangilashda xatolik:', error);
      throw error;
    }
  }

  // Tortni o'chirish
  async deleteCake(cakeId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'cakes', cakeId));
    } catch (error) {
      console.error('Tortni o\'chirishda xatolik:', error);
      throw error;
    }
  }

  // Buyurtma berilganda mahsulot miqdorini kamaytirish va inStockQuantity oshirish
  async processOrderQuantity(cakeId: string, orderQuantity: number): Promise<{ fromStock: boolean }> {
    try {
      const cake = await this.getCakeById(cakeId);
      if (!cake) {
        console.error('❌ Mahsulot topilmadi:', cakeId);
        return { fromStock: false };
      }

      console.log('📦 Mahsulot quantity processing:', {
        cakeId,
        productType: cake.productType,
        available: cake.available,
        quantity: cake.quantity,
        amount: cake.amount,
        inStockQuantity: cake.inStockQuantity,
        rejectAmount: cake.rejectAmount,
        orderQuantity
      });

      const updateData: any = {};
      let fromStock = false;

      // Baker mahsulotlari uchun
      if (cake.productType === 'baked' || (cake.bakerId && !cake.shopId)) {
        const currentQuantity = cake.quantity || 0;

        if (currentQuantity >= orderQuantity) {
          // "Hozir mavjud" dan olish - quantity kamayadi, inStockQuantity oshadi
          const newQuantity = currentQuantity - orderQuantity;
          updateData.quantity = newQuantity;

          // Quantity dan inStockQuantity ga o'tkazish
          updateData.inStockQuantity = (cake.inStockQuantity || 0) + orderQuantity;

          // Agar quantity 0 bo'lsa, avtomatik "Buyurtma uchun" ga o'tish
          if (newQuantity === 0) {
            updateData.available = false;
            console.log('🔄 Baker mahsulot "Hozir mavjud" dan "Buyurtma uchun" ga o\'tdi');
          } else {
            updateData.available = true;
          }

          fromStock = true;
          console.log('✅ Baker "Hozir mavjud" dan sotildi - quantity -> inStockQuantity:', {
            oldQuantity: currentQuantity,
            newQuantity,
            oldInStockQuantity: cake.inStockQuantity || 0,
            newInStockQuantity: updateData.inStockQuantity,
            transferredAmount: orderQuantity,
            available: updateData.available,
            rule: 'Quantity kamaydi, inStockQuantity oshadi'
          });
        } else {
          // "Hozir mavjud" yetmaydi - "Buyurtma uchun" dan olish - FAQAT amount oshadi
          const currentAmount = cake.amount || 0;
          updateData.amount = currentAmount + orderQuantity;
          fromStock = false;
          console.log('🔄 Baker "Buyurtma uchun" dan olindi - FAQAT amount oshirildi:', {
            oldAmount: currentAmount,
            newAmount: updateData.amount,
            orderQuantity,
            amountIncrease: updateData.amount - currentAmount,
            quantityUnchanged: cake.quantity || 0,
            inStockQuantityUNTOUCHED: cake.inStockQuantity || 0,
            rule: 'Buyurtma uchun - faqat amount oshadi'
          });
        }

      } else if (cake.productType === 'ready') {
        // Shop mahsulotlari - quantity dan inStockQuantity ga o'tkazish
        const currentQuantity = cake.quantity || 0;
        const newQuantity = Math.max(0, currentQuantity - orderQuantity);

        updateData.quantity = newQuantity;

        // Quantity dan inStockQuantity ga o'tkazish
        updateData.inStockQuantity = (cake.inStockQuantity || 0) + orderQuantity;

        // Agar quantity 0 bo'lsa, mahsulot mavjud emas
        if (newQuantity === 0) {
          updateData.available = false;
          console.log('🔄 Shop mahsulot tugadi, available = false');
        } else {
          updateData.available = true;
        }

        fromStock = true; // Shop mahsulotlari doim stock dan

        console.log('✅ Shop mahsulot sotildi - quantity -> inStockQuantity:', {
          oldQuantity: currentQuantity,
          newQuantity,
          oldInStockQuantity: cake.inStockQuantity || 0,
          newInStockQuantity: updateData.inStockQuantity,
          transferredAmount: orderQuantity,
          available: updateData.available,
          rule: 'Quantity kamaydi, inStockQuantity oshadi'
        });
      }

      // Ma'lumotlarni yangilash
      if (Object.keys(updateData).length > 0) {
        await this.updateCake(cakeId, updateData);
        console.log('✅ Mahsulot quantity muvaffaqiyatli yangilandi:', updateData);
      }

      return { fromStock };

    } catch (error) {
      console.error('❌ processOrderQuantity xatosi:', error);
      throw error;
    }
  }

  // Buyurtma bekor qilinganda mahsulot miqdorini qaytarish va amount kamaytirish
  async revertOrderQuantity(cakeId: string, orderQuantity: number, fromStock: boolean = false): Promise<void> {
    try {
      console.log('🔄 Operator buyurtmani bekor qildi, mahsulot sonini qaytarish:', { cakeId, orderQuantity, fromStock });

      const cake = await this.getCakeById(cakeId);
      if (!cake) {
        console.error('❌ Mahsulot topilmadi:', cakeId);
        throw new Error('Mahsulot topilmadi');
      }

      console.log('📦 Joriy mahsulot holati:', {
        productType: cake.productType,
        available: cake.available,
        quantity: cake.quantity,
        amount: cake.amount,
        inStockQuantity: cake.inStockQuantity,
        rejectAmount: cake.rejectAmount
      });

      const updateData: any = {};

      // Baker mahsulotlari uchun
      if (cake.productType === 'baked' || (cake.bakerId && !cake.shopId)) {

        if (fromStock) {
          // "Hozir mavjud" dan sotilgan mahsulot operator tomonidan bekor qilindi
          // inStockQuantity dan quantity ga qaytarish
          const currentInStock = cake.inStockQuantity || 0;
          const newInStockQuantity = Math.max(0, currentInStock - orderQuantity);
          const newQuantity = (cake.quantity || 0) + orderQuantity;

          updateData.inStockQuantity = newInStockQuantity;
          updateData.quantity = newQuantity;

          // MUHIM: Quantity > 0 bo'lganda avtomatik "Hozir mavjud" ga qaytarish
          updateData.available = newQuantity > 0;

          console.log('✅ Baker "Hozir mavjud" dan bekor qilindi - inStockQuantity -> quantity:', {
            oldQuantity: cake.quantity || 0,
            newQuantity,
            oldInStock: currentInStock,
            newInStock: newInStockQuantity,
            transferredBack: orderQuantity,
            newAvailable: updateData.available,
            statusChange: newQuantity > 0 ? '"Buyurtma uchun" -> "Hozir mavjud"' : 'Mavjud emas'
          });
        } else {
          // Operator tomonidan bekor qilingan "Buyurtma uchun" mahsulot
          const currentAmount = cake.amount || 0;
          const currentRejectAmount = cake.rejectAmount || 0;

          // Amount dan kamayib rejectAmount ga o'tish
          const actualReduction = Math.min(orderQuantity, currentAmount);
          
          if (actualReduction > 0) {
            const newAmount = Math.max(0, currentAmount - actualReduction);
            const newRejectAmount = currentRejectAmount + actualReduction;

            updateData.amount = newAmount;
            updateData.rejectAmount = newRejectAmount;

            console.log('🚫 OPERATOR BEKOR QILISH "Buyurtma uchun" - amount kamaydi, rejectAmount oshadi:', {
              oldAmount: currentAmount,
              newAmount,
              oldRejectAmount: currentRejectAmount,
              newRejectAmount,
              orderQuantity,
              actualReduction,
              amountReduction: currentAmount - newAmount,
              rejectAmountIncrease: actualReduction,
              quantityUNTOUCHED: cake.quantity || 0,
              availableUNTOUCHED: cake.available,
              inStockUNTOUCHED: cake.inStockQuantity || 0,
              rule: 'OPERATOR BEKOR QILISH: amount kamaydi va rejectAmount oshadi'
            });

            // Operator bekor qilish ma'lumotini saqlash
            updateData.lastRejection = {
              rejectedQuantity: actualReduction,
              rejectedAt: Timestamp.now(),
              reason: 'order_cancelled_by_operator',
              operatorAction: 'cancelled_from_order_management'
            };
            console.log('📝 Operator bekor qilish ma\'lumoti qo\'shildi:', updateData.lastRejection);
          } else {
            console.warn('⚠️ Amount qiymati yetarli emas yoki 0:', {
              currentAmount,
              orderQuantity,
              actualReduction
            });
          }
        }

      } else if (cake.productType === 'ready') {
        // Shop mahsulotlari - faqat "Hozir mavjud" dan sotiladi (fromStock doim true)
        if (fromStock) {
          // inStockQuantity dan quantity ga qaytarish
          const currentInStock = cake.inStockQuantity || 0;
          const newInStockQuantity = Math.max(0, currentInStock - orderQuantity);
          const newQuantity = (cake.quantity || 0) + orderQuantity;

          updateData.inStockQuantity = newInStockQuantity;
          updateData.quantity = newQuantity;

          // MUHIM: Quantity > 0 bo'lganda avtomatik mavjud ga qaytarish
          updateData.available = newQuantity > 0;

          console.log('✅ Shop mahsulot bekor qilindi - inStockQuantity -> quantity:', {
            oldQuantity: cake.quantity || 0,
            newQuantity,
            oldInStock: currentInStock,
            newInStock: newInStockQuantity,
            transferredBack: orderQuantity,
            newAvailable: updateData.available,
            statusChange: newQuantity > 0 ? 'Tugagan -> Mavjud' : 'Tugagan'
          });
        } else {
          // Shop mahsulotlari uchun operator bekor qilish - rejectAmount ga qo'shish
          const currentRejectAmount = cake.rejectAmount || 0;
          updateData.rejectAmount = currentRejectAmount + orderQuantity;

          // Operator bekor qilish ma'lumotini saqlash
          updateData.lastRejection = {
            rejectedQuantity: orderQuantity,
            rejectedAt: Timestamp.now(),
            reason: 'order_cancelled_by_operator',
            operatorAction: 'cancelled_from_order_management'
          };

          console.log('🚫 OPERATOR BEKOR QILISH Shop mahsulot - rejectAmount oshdi:', {
            oldRejectAmount: currentRejectAmount,
            newRejectAmount: updateData.rejectAmount,
            rejectedQuantity: orderQuantity,
            rule: 'Operator bekor qilish: Shop mahsulot uchun faqat rejectAmount oshadi'
          });
        }
      }

      // CRITICAL VALIDATION: "Buyurtma uchun" mahsulotlar uchun quantity o'zgartirilmasligini tekshirish
      if (!fromStock && (updateData.hasOwnProperty('quantity') || updateData.hasOwnProperty('inStockQuantity'))) {
        console.error('❌ XATO: "Buyurtma uchun" mahsulot uchun quantity yoki inStockQuantity o\'zgartirilmoqda!');
        delete updateData.quantity;
        delete updateData.inStockQuantity;
        delete updateData.available;
        console.log('🔧 TUZATILDI: quantity va inStockQuantity o\'zgarishlari olib tashlandi');
      }

      // Ma'lumotlarni yangilash
      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = Timestamp.now();

        await this.updateCake(cakeId, updateData);
        console.log('✅ Operator rad etish/bekor qilish: mahsulot muvaffaqiyatli yangilandi:', updateData);

        // Status o'zgarishi haqida aniq log
        if (updateData.available === true && !cake.available) {
          console.log('🟢 OPERATOR BEKOR QILISH: Mahsulot "Hozir mavjud" holatiga qaytarildi');
        } else if (updateData.available === false && cake.available) {
          console.log('🔴 OPERATOR BEKOR QILISH: Mahsulot "Mavjud emas" holatiga o\'tdi');
        }

        // Operator bekor qilish holatlarini ajratish
        if (!fromStock && updateData.rejectAmount) {
          if (updateData.lastRejection?.reason === 'order_cancelled_by_operator') {
            console.log('🚫 OPERATOR BEKOR QILISH: amount kamaydi, rejectAmount oshdi');
          } else {
            console.log('🚫 OPERATOR RAD ETISH: amount kamaydi, rejectAmount oshdi');
          }
        }

        // MUHIM: Operator amaliyoti uchun maxsus force update
        try {
          const operatorActionData = {
            ...updateData,
            operatorProcessed: true,
            operatorProcessedAt: Timestamp.now(),
            lastOperatorAction: fromStock ? 'order_cancelled' : 'order_rejected',
            forceUpdate: Date.now(),
            statusChangeReason: fromStock ? 'operator_cancelled_order' : 'operator_rejected_order'
          };

          await this.updateCake(cakeId, operatorActionData);
          console.log('🔄 Operator amaliyoti: Real-time yangilanish trigger qilindi');

        } catch (triggerError) {
          console.warn('⚠️ Operator amaliyoti: Real-time trigger da xato:', triggerError);
        }
      } else {
        console.warn('⚠️ Operator amaliyoti: Yangilanishi kerak bo\'lgan ma\'lumotlar topilmadi');
      }

    } catch (error) {
      console.error('❌ Operator buyurtma rad etish/bekor qilishda xatolik:', error);
      throw error;
    }
  }

  // Buyurtmani rad etish (faqat "Buyurtma uchun" mahsulotlar uchun)
  async rejectOrderQuantity(cakeId: string, orderQuantity: number, rejectionReason?: string): Promise<void> {
    try {
      console.log('🚫 Buyurtma rad etilmoqda:', { cakeId, orderQuantity, rejectionReason });

      const cake = await this.getCakeById(cakeId);
      if (!cake) {
        console.error('❌ Mahsulot topilmadi:', cakeId);
        throw new Error('Mahsulot topilmadi');
      }

      // Faqat Baker mahsulotlari va "Buyurtma uchun" holatida rad etish mumkin
      if (cake.productType !== 'baked' && !cake.bakerId) {
        throw new Error('Faqat Baker mahsulotlarini rad etish mumkin');
      }

      console.log('📦 Rad etish oldidan mahsulot holati:', {
        productType: cake.productType,
        available: cake.available,
        quantity: cake.quantity,
        amount: cake.amount,
        inStockQuantity: cake.inStockQuantity,
        rejectAmount: cake.rejectAmount
      });

      const currentAmount = cake.amount || 0;
      const currentRejectAmount = cake.rejectAmount || 0;

      // Amount dan kamayib rejectAmount ga o'tish
      const actualRejection = Math.min(orderQuantity, currentAmount);

      if (actualRejection <= 0) {
        console.warn('⚠️ Rad etish uchun yetarli amount mavjud emas');
        throw new Error('Rad etish uchun yetarli buyurtma miqdori mavjud emas');
      }

      const updateData: any = {
        amount: Math.max(0, currentAmount - actualRejection),
        rejectAmount: currentRejectAmount + actualRejection,
        updatedAt: Timestamp.now(),
        lastRejection: {
          rejectedQuantity: actualRejection,
          rejectedAt: Timestamp.now(),
          reason: rejectionReason || 'operator_rejected',
          rejectionType: 'manual_rejection'
        }
      };

      console.log('🚫 RAD ETISH amaliyoti:', {
        oldAmount: currentAmount,
        newAmount: updateData.amount,
        oldRejectAmount: currentRejectAmount,
        newRejectAmount: updateData.rejectAmount,
        actualRejection,
        rejectionReason,
        rule: 'Amount kamaydi, rejectAmount oshadi'
      });

      await this.updateCake(cakeId, updateData);

      // Real-time yangilanish uchun force update
      try {
        const rejectionTriggerData = {
          ...updateData,
          manuallyRejected: true,
          rejectionTriggeredAt: Timestamp.now(),
          forceUpdate: Date.now(),
          statusChangeReason: 'manual_order_rejection'
        };

        await this.updateCake(cakeId, rejectionTriggerData);
        console.log('🔄 Rad etish: Real-time yangilanish trigger qilindi');

      } catch (triggerError) {
        console.warn('⚠️ Rad etish: Real-time trigger da xato:', triggerError);
      }

      console.log('✅ Buyurtma muvaffaqiyatli rad etildi');

    } catch (error) {
      console.error('❌ Buyurtmani rad etishda xatolik:', error);
      throw error;
    }
  }

  // SHARHLAR BILAN ISHLASH

  // Sharh qo'shish
  async addReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
    try {
      const reviewData = {
        ...review,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'reviews'), reviewData);

      // Tortning o'rtacha reytingini yangilash
      await this.updateCakeRating(review.cakeId);

      return docRef.id;
    } catch (error) {
      console.error('Sharh qo\'shishda xatolik:', error);
      throw error;
    }
  }

  // Tort uchun sharhlarni olish
  async getReviews(cakeId: string): Promise<Review[]> {
    try {
      const q = query(
        collection(db, 'reviews'), 
        where('cakeId', '==', cakeId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      } as Review));
    } catch (error) {
      console.error('Sharhlarni olishda xatolik:', error);
      throw error;
    }
  }

  // Tortning reytingini yangilash
  private async updateCakeRating(cakeId: string): Promise<void> {
    try {
      const reviews = await this.getReviews(cakeId);

      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        await updateDoc(doc(db, 'cakes', cakeId), {
          rating: Math.round(averageRating * 10) / 10, // 1 xona aniqlik bilan
          reviewCount: reviews.length,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Reytingni yangilashda xatolik:', error);
    }
  }

  // Tortlarni real-time kuzatish (BloomFilter optimized)
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
        // Reduce query complexity to avoid BloomFilter issues
        let q = query(
          collection(db, 'cakes'), 
          orderBy('updatedAt', 'desc'),
          limit(50) // Reduced limit to prevent BloomFilter errors
        );

        // Apply only one filter at a time to reduce complexity
        if (filters?.bakerId) {
          q = query(q, where('bakerId', '==', filters.bakerId));
        } else if (filters?.shopId) {
          q = query(q, where('shopId', '==', filters.shopId));
        } else if (filters?.category) {
          q = query(q, where('category', '==', filters.category));
        } else if (filters?.productType) {
          q = query(q, where('productType', '==', filters.productType));
        } else if (filters?.available !== undefined) {
          q = query(q, where('available', '==', filters.available));
        }

        return onSnapshot(q, 
          {
            includeMetadataChanges: false // Reduce unnecessary updates
          },
          (querySnapshot) => {
            if (!isActive) return;

            try {
              let cakes = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date()
              } as Cake));

              // Client-side filtering for multiple conditions to reduce server load
              if (filters) {
                cakes = cakes.filter(cake => {
                  if (filters.category && cake.category !== filters.category) return false;
                  if (filters.bakerId && cake.bakerId !== filters.bakerId) return false;
                  if (filters.shopId && cake.shopId !== filters.shopId) return false;
                  if (filters.available !== undefined && cake.available !== filters.available) return false;
                  if (filters.productType && cake.productType !== filters.productType) return false;
                  return true;
                });
              }

              retryCount = 0;
              callback(cakes);
            } catch (error) {
              console.error('❌ Cakes callback xatosi:', error);
              if (isActive) callback([]);
            }
          },
          (error) => {
            if (!isActive) return;

            // Handle BloomFilter errors specifically
            if (error.message?.includes('BloomFilter')) {
              console.warn('⚠️ BloomFilter xatosi, simple query bilan qayta urinish');
              // Fallback to simpler query
              const simpleQuery = query(
                collection(db, 'cakes'),
                orderBy('createdAt', 'desc'),
                limit(25)
              );

              return onSnapshot(simpleQuery, (snapshot) => {
                if (!isActive) return;
                const cakes = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data(),
                  createdAt: doc.data().createdAt?.toDate() || new Date(),
                  updatedAt: doc.data().updatedAt?.toDate() || new Date()
                } as Cake));
                callback(cakes);
              });
            }

            console.error('❌ Cakes subscription xatosi:', error);
            retryCount++;

            if (retryCount <= maxRetries) {
              const retryDelay = Math.min(2000 * retryCount, 10000);
              setTimeout(() => {
                if (isActive) createSubscription();
              }, retryDelay);
            } else {
              console.error('❌ Cakes subscription maksimal retry tugadi');
              if (isActive) callback([]);
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
}

export const productService = new ProductService();