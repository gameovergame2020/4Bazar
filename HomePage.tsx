<div className="fixed bottom-20 right-4 z-[9999]">
          <div 
            onClick={handleCheckout}
            className="bg-orange-500 text-white rounded-full p-3 shadow-lg hover:bg-orange-600 transition-colors cursor-pointer group"
          >
            <div className="relative">
              <ShoppingCart size={24} />
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {Object.values(cart).reduce((sum, qty) => sum + qty, 0)}
              </div>
            </div>
</div>