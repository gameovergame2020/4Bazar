
import { useState } from 'react';
import { Cake } from '../services/dataService';
import { dataService } from '../services/dataService';

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

export const useBakerForm = (userData: any, loadData: () => Promise<void>) => {
  const [showAddCakeForm, setShowAddCakeForm] = useState(false);
  const [editingCake, setEditingCake] = useState<Cake | null>(null);
  const [loading, setLoading] = useState(false);

  const [cakeForm, setCakeForm] = useState<CakeFormData>({
    name: '',
    description: '',
    price: '',
    category: 'birthday',
    ingredients: '',
    image: null,
    available: false,
    quantity: '',
    discount: ''
  });

  const resetForm = () => {
    setCakeForm({
      name: '',
      description: '',
      price: '',
      category: 'birthday',
      ingredients: '',
      image: null,
      available: false,
      quantity: '',
      discount: ''
    });
    setShowAddCakeForm(false);
    setEditingCake(null);
  };

  const startEditCake = (cake: Cake) => {
    setEditingCake(cake);
    setCakeForm({
      name: cake.name || '',
      description: cake.description || '',
      price: cake.price ? cake.price.toString() : '',
      category: cake.category || 'birthday',
      ingredients: cake.ingredients ? cake.ingredients.join(', ') : '',
      image: null,
      available: cake.available || false,
      quantity: cake.quantity !== undefined ? cake.quantity.toString() : '',
      discount: cake.discount !== undefined ? cake.discount.toString() : '0'
    });
    setShowAddCakeForm(true);
  };

  const handleAddCake = async () => {
    if (!cakeForm.name || !cakeForm.description || !cakeForm.price || (cakeForm.available && !cakeForm.quantity)) {
      alert('Barcha majburiy maydonlarni to\'ldiring (mavjud bo\'lsa soni ham kiritish kerak)');
      return;
    }

    if (!userData?.id || !userData?.name) {
      alert('Foydalanuvchi ma\'lumotlari topilmadi');
      return;
    }

    try {
      setLoading(true);

      let imageUrl = 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400';

      if (cakeForm.image) {
        const imagePath = `cakes/${userData.id}/${Date.now()}_${cakeForm.image.name}`;
        imageUrl = await dataService.uploadImage(cakeForm.image, imagePath);
      }

      const quantity = cakeForm.available ? parseInt(cakeForm.quantity) || 0 : undefined;

      const newCake: Omit<Cake, 'id' | 'createdAt' | 'updatedAt'> = {
        name: cakeForm.name,
        description: cakeForm.description,
        price: parseFloat(cakeForm.price),
        image: imageUrl,
        category: cakeForm.category,
        bakerId: userData.id,
        bakerName: userData.name,
        productType: 'baked' as const,
        rating: 0,
        reviewCount: 0,
        available: cakeForm.available,
        ingredients: cakeForm.ingredients.split(',').map(i => i.trim()).filter(i => i),
        discount: parseFloat(cakeForm.discount) || 0,
        amount: 0,
        inStockQuantity: 0
      };

      // Quantity ni to'g'ri belgilash
      if (cakeForm.available && quantity !== undefined && quantity > 0) {
        newCake.quantity = quantity;
        newCake.available = true;
      } else if (cakeForm.available && (!quantity || quantity <= 0)) {
        // Foydalanuvchi "Hozir mavjud" tanlagan, lekin quantity 0 yoki bo'sh
        alert('Diqqat: "Hozir mavjud" uchun kamida 1 ta mahsulot soni kiritish kerak!');
        return;
      } else {
        // "Buyurtma uchun" rejimi
        newCake.quantity = undefined;
        newCake.available = false;
      }

      await dataService.addCake(newCake);
      resetForm();
      await loadData();

    } catch (error) {
      console.error('Tort qo\'shishda xatolik:', error);
      alert('Tort qo\'shishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCake = async () => {
    if (!editingCake || !userData?.id) {
      alert('Tahrirlash uchun tort tanlanmagan yoki foydalanuvchi ma\'lumotlari topilmadi');
      return;
    }

    if (!cakeForm.name.trim() || !cakeForm.description.trim() || !cakeForm.price || parseFloat(cakeForm.price) <= 0) {
      alert('Barcha majburiy maydonlarni to\'g\'ri to\'ldiring');
      return;
    }

    if (cakeForm.available && (!cakeForm.quantity || parseInt(cakeForm.quantity) <= 0)) {
      alert('Mavjud mahsulot uchun to\'g\'ri son kiriting');
      return;
    }

    try {
      setLoading(true);

      let imageUrl = editingCake.image;

      if (cakeForm.image) {
        try {
          const imagePath = `cakes/${userData.id}/${Date.now()}_${cakeForm.image.name}`;
          imageUrl = await dataService.uploadImage(cakeForm.image, imagePath);
        } catch (uploadError) {
          console.error('Rasm yuklashda xatolik:', uploadError);
          alert('Rasm yuklashda muammo bo\'ldi, eski rasm saqlanadi');
        }
      }

      const quantity = cakeForm.available ? parseInt(cakeForm.quantity) || 0 : undefined;
      const price = parseFloat(cakeForm.price);
      const discount = parseFloat(cakeForm.discount) || 0;

      const ingredients = cakeForm.ingredients 
        ? cakeForm.ingredients.split(',').map(i => i.trim()).filter(i => i.length > 0)
        : [];

      const updates: Partial<Cake> = {
        name: cakeForm.name.trim(),
        description: cakeForm.description.trim(),
        price: price,
        image: imageUrl,
        category: cakeForm.category,
        available: cakeForm.available && quantity !== undefined && quantity > 0,
        ingredients: ingredients,
        discount: discount,
        updatedAt: new Date()
      };

      if (quantity !== undefined) {
        updates.quantity = quantity;
        updates.inStockQuantity = quantity;
      }

      if (cakeForm.available && quantity !== undefined && quantity <= 0) {
        alert('Diqqat: Mahsulot soni 0 yoki kamroq bo\'lgani uchun avtomatik "Buyurtma uchun" rejimiga o\'tkazildi.');
        updates.available = false;
      }

      await dataService.updateCake(editingCake.id!, updates);
      alert('Tort muvaffaqiyatli yangilandi!');
      resetForm();
      await loadData();

    } catch (error) {
      console.error('Tortni yangilashda xatolik:', error);
      alert(`Tortni yangilashda xatolik yuz berdi: ${error.message || 'Noma\'lum xatolik'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCake = async (cakeId: string) => {
    if (!confirm('Tortni o\'chirishni xohlaysizmi?')) return;

    try {
      setLoading(true);
      await dataService.deleteCake(cakeId);
      await loadData();
    } catch (error) {
      console.error('Tortni o\'chirishda xatolik:', error);
      alert('Tortni o\'chirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return {
    showAddCakeForm,
    setShowAddCakeForm,
    editingCake,
    cakeForm,
    setCakeForm,
    loading,
    handleAddCake,
    handleEditCake,
    handleDeleteCake,
    startEditCake,
    resetForm
  };
};
