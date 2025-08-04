
import React from 'react';

const HeroBanner: React.FC = () => {
  return (
    <div className="relative bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white overflow-hidden">
      <div className="relative z-10">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Eng mazali tortlar!</h2>
        <p className="text-orange-100 mb-3 sm:mb-4 text-sm sm:text-base">Professional oshpazlarimizdan buyurtma qiling</p>
        <button className="bg-white text-purple-600 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors text-sm sm:text-base">
          Hoziroq buyurtma bering
        </button>
      </div>
      <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
      <div className="absolute bottom-0 right-4 sm:right-8 w-16 sm:w-20 h-16 sm:h-20 bg-white/5 rounded-full"></div>
    </div>
  );
};

export default HeroBanner;
