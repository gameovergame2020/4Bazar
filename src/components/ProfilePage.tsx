<>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-xs sm:text-sm truncate">{cake.name}</h4>
                          <p className="text-gray-400 text-xs">{cake.restaurant}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-orange-400 text-xs sm:text-sm font-medium">{cake.price} so'm</span>
                            <div className="flex items-center space-x-1">
                              <Star size={10} className="text-yellow-400 fill-current" />
                              <span className="text-gray-300 text-xs">{cake.rating}</span>
                            </div>
                          </div>
                        </div>
                        <button className="p-0.5 sm:p-1 text-pink-400 hover:text-pink-300 transition-colors">
                          <Heart size={12} className="fill-current" />
                        </button>
                      </>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>



        {/* Menu Items */}
        <div className="backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 shadow-sm border transition-colors duration-300 bg-gray-800/90 border-gray-700 mb-20">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Sozlamalar</h2>
          <div className="space-y-1 sm:space-y-2">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl transition-colors ${
                    item.isLogout 
                      ? 'hover:bg-red-500/10 text-red-400 hover:text-red-300' 
                      : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <IconComponent size={18} />
                    <span className="font-medium text-sm sm:text-base">{item.label}</span>
                  </div>
                  {item.hasChevron && (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Buyurtmani bekor qilish modal oynasi */}
        {showCancelModal && orderToCancel && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700 shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <span className="text-2xl">⚠️</span>
                  <span>Buyurtmani bekor qilish</span>
                </h3>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setOrderToCancel(null);
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Buyurtma ma'lumotlari */}
              <div className="bg-gray-700/50 rounded-xl p-4 mb-6 border border-gray-600">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">{orderToCancel.cakeName}</h4>
                    <p className="text-gray-400 text-xs">#{orderToCancel.id?.slice(-8).toUpperCase()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">Narx:</span>
                    <div className="text-orange-400 font-medium">{orderToCancel.totalPrice.toLocaleString()} so'm</div>
                  </div>
                  <div>
                    <span className="text-gray-400">To'lov:</span>
                    <div className="text-white font-medium">
                      {orderToCancel.paymentMethod === 'card' ? (
                        orderToCancel.paymentType === 'click' ? '🔵 Click' :
                        orderToCancel.paymentType === 'payme' ? '🟢 Payme' :
                        orderToCancel.paymentType === 'visa' ? '💳 Visa/MC' : '💳 Bank kartasi'
                      ) : '💵 Naqd pul'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ogohlantirish matni */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-400 text-lg">💡</span>
                  <div className="text-sm">
                    <h4 className="font-medium text-yellow-400 mb-2">Muhim ma'lumot:</h4>
                    <ul className="text-gray-300 space-y-1 text-xs">
                      <li>• Bu amalni ortga qaytarib bo'lmaydi</li>
                      <li>• Buyurtma bekor qilinadi va holati o'zgaradi</li>
                      {orderToCancel.paymentMethod === 'card' && (
                        <>
                          <li>• Bank kartasi orqali to'lov qilingan</li>
                          <li>• Xizmat haqi ushlab qolinadi</li>
                          <li>• Qolgan mablag' 3-5 ish kuni ichida qaytariladi</li>
                        </>
                      )}
                      {orderToCancel.paymentMethod === 'cash' && (
                        <li>• Naqd to'lov uchun qaytarish kerak emas</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Refund hisob-kitobi (agar bank kartasi bo'lsa) */}
              {orderToCancel.paymentMethod === 'card' && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                  <h4 className="font-medium text-blue-400 mb-3 text-sm">💰 To'lov qaytarish hisobi:</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Buyurtma summasi:</span>
                      <span className="text-white">{orderToCancel.totalPrice.toLocaleString()} so'm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Xizmat haqi:</span>
                      <span className="text-red-300">
                        -{(orderToCancel.paymentType === 'click' ? 2000 : 
                           orderToCancel.paymentType === 'payme' ? 1500 :
                           orderToCancel.paymentType === 'visa' ? 3000 : 2500).toLocaleString()} so'm
                      </span>
                    </div>
                    <div className="border-t border-gray-600 pt-2">
                      <div className="flex justify-between font-medium">
                        <span className="text-blue-400">Qaytariladi:</span>
                        <span className="text-blue-300">
                          {(orderToCancel.totalPrice - (
                            orderToCancel.paymentType === 'click' ? 2000 : 
                            orderToCancel.paymentType === 'payme' ? 1500 :
                            orderToCancel.paymentType === 'visa' ? 3000 : 2500
                          )).toLocaleString()} so'm
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tasdiq soruvi */}
              <div className="mb-6">
                <p className="text-gray-300 text-sm text-center">
                  Haqiqatan ham bu buyurtmani bekor qilishni xohlaysizmi?
                </p>
              </div>

              {/* Action tugmalari */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setOrderToCancel(null);
                  }}
                  className="flex-1 bg-gray-700 text-gray-300 py-3 px-4 rounded-xl font-medium hover:bg-gray-600 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancellingOrderId === orderToCancel.id}
                  className="flex-1 bg-red-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {cancellingOrderId === orderToCancel.id ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Bekor qilinmoqda...</span>
                    </>
                  ) : (
                    <>
                      <span>🚫</span>
                      <span>Ha, bekor qilish</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
// Cleanup function
    return () => {
      isActive = false;
      if (loadingTimeout) clearTimeout(loadingTimeout);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user.id]); // Faqat customer ID - prioritetli qidiruv