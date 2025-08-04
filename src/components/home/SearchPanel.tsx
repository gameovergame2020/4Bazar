
import React from 'react';
import { Search } from 'lucide-react';

interface SearchPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="relative">
      <div className="flex items-center bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 px-3 sm:px-4 py-2.5 sm:py-3">
        <Search size={18} className="text-gray-400 mr-2 sm:mr-3" />
        <input
          type="text"
          placeholder="Tort nomi, tavsif yoki oshpaz ismini qidiring..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 outline-none text-gray-700 placeholder-gray-400 text-sm sm:text-base"
        />
      </div>
    </div>
  );
};

export default SearchPanel;
