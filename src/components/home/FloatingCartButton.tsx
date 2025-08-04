
import React from 'react';
import { ShoppingCart } from 'lucide-react';

interface FloatingCartButtonProps {
  isVisible: boolean;
  cartItemsCount: number;
  onClick: () => void;
}

const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({
  isVisible,
  cartItemsCount,
  onClick
}) => {
  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-6 right-6 z-[9999]"
      style={{ zIndex: 9999 }}
    >
      <button 
        onClick={onClick}
        className="bg-orange-500 text-white p-4 rounded-full shadow-2xl hover:bg-orange-600 transition-all duration-200 hover:scale-110 border-2 border-white"
        style={{ 
          boxShadow: '0 10px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)' 
        }}
      >
        <div className="relative">
          <ShoppingCart size={24} />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse">
            {cartItemsCount}
          </span>
        </div>
      </button>
    </div>
  );
};

export default FloatingCartButton;
