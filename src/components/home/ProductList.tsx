
import React from 'react';
import { Cake as CakeIcon } from 'lucide-react';
import { Cake } from '../../services/dataService';
import ProductCard from './ProductCard';

interface ProductListProps {
  title: string;
  cakes: Cake[];
  loading?: boolean;
  searchQuery?: string;
  cartQuantities: {[key: string]: number};
  favoriteIds: string[];
  favoritesLoading: boolean;
  isAuthenticated: boolean;
  onAddToCart: (cakeId: string) => void;
  onRemoveFromCart: (cakeId: string) => void;
  onToggleFavorite: (cake: Cake) => void;
  onProductClick: (cake: Cake) => void;
  formatPrice: (price: number, discount?: number) => string;
  getOriginalPrice: (price: number) => string;
  isFavorite: (cakeId: string) => boolean;
}

const ProductList: React.FC<ProductListProps> = ({
  title,
  cakes,
  loading,
  searchQuery,
  cartQuantities,
  favoriteIds,
  favoritesLoading,
  isAuthenticated,
  onAddToCart,
  onRemoveFromCart,
  onToggleFavorite,
  onProductClick,
  formatPrice,
  getOriginalPrice,
  isFavorite
}) => {
  return (
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
        {title}
        {loading && <span className="ml-2 text-sm text-gray-500">(Yuklanmoqda...)</span>}
      </h3>

      {cakes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {cakes.map((cake) => (
            <ProductCard
              key={cake.id}
              cake={cake}
              cartQuantity={cartQuantities[cake.id!] || 0}
              isFavorite={isFavorite(cake.id!)}
              favoritesLoading={favoritesLoading}
              isAuthenticated={isAuthenticated}
              onAddToCart={onAddToCart}
              onRemoveFromCart={onRemoveFromCart}
              onToggleFavorite={onToggleFavorite}
              onProductClick={onProductClick}
              formatPrice={formatPrice}
              getOriginalPrice={getOriginalPrice}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <CakeIcon size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchQuery ? 'Qidiruv bo\'yicha tortlar topilmadi' : 'Hozircha tortlar mavjud emas'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductList;
