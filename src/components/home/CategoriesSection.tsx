
import React from 'react';
import { Cake, Gift, Heart, Cookie, ChefHat } from 'lucide-react';

interface CategoriesSectionProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const CategoriesSection: React.FC<CategoriesSectionProps> = ({ selectedCategory, onCategorySelect }) => {
  const categories = [
    { name: 'Hammasi', icon: Cake, value: '' },
    { name: "Tug'ilgan kun", icon: Gift, value: 'birthday' },
    { name: 'Nikoh', icon: Heart, value: 'wedding' },
    { name: 'Cupcake', icon: Cookie, value: 'cupcake' },
    { name: 'Cheesecake', icon: ChefHat, value: 'cheesecake' },
  ];

  return (
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Kategoriyalar</h3>
      <div className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <button
              key={category.name}
              onClick={() => onCategorySelect(category.name)}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full whitespace-nowrap transition-all text-sm sm:text-base ${
                selectedCategory === category.name
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-gray-100'
              }`}
            >
              <IconComponent size={16} />
              <span className="font-medium">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoriesSection;
