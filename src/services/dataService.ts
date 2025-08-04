// Centralized data service aggregator
// Re-exports all services for backward compatibility

// Import all services
import { productService } from './productService';
import { orderService } from './orderService';
import { userService } from './userService';
import { supportService } from './supportService';
import { storageService } from './storageService';
import { statisticsService } from './statisticsService';

// Export types
export * from './shared/types';

// Export individual services
export { productService } from './productService';
export { orderService, cancelOrder, getUserOrders } from './orderService';
export { userService } from './userService';
export { supportService } from './supportService';
export { storageService } from './storageService';
export { statisticsService } from './statisticsService';

// Main DataService class that aggregates all functionality
class DataService {
  // Product methods
  addCake = productService.addCake.bind(productService);
  getCakes = productService.getCakes.bind(productService);
  getCakeById = productService.getCakeById.bind(productService);
  updateCake = productService.updateCake.bind(productService);
  deleteCake = productService.deleteCake.bind(productService);
  processOrderQuantity = productService.processOrderQuantity.bind(productService);
  revertOrderQuantity = productService.revertOrderQuantity.bind(productService);
  addReview = productService.addReview.bind(productService);
  getReviews = productService.getReviews.bind(productService);
  subscribeToRealtimeCakes = productService.subscribeToRealtimeCakes.bind(productService);

  // Order methods
  createOrder = orderService.createOrder.bind(orderService);
  getOrdersByUserId = orderService.getOrdersByUserId.bind(orderService);
  getOrdersByCustomerId = orderService.getOrdersByCustomerId.bind(orderService);
  getOrders = orderService.getOrders.bind(orderService);
  cancelOrder = orderService.cancelOrder.bind(orderService);
  updateOrderStatus = orderService.updateOrderStatus.bind(orderService);
  processRefund = orderService.processRefund.bind(orderService);
  getRefunds = orderService.getRefunds.bind(orderService);
  updateRefundStatus = orderService.updateRefundStatus.bind(orderService);
  updateOrder = orderService.updateOrder.bind(orderService);
  subscribeToOrders = orderService.subscribeToOrders.bind(orderService);
  getOrderedQuantity = orderService.getOrderedQuantity.bind(orderService);

  // User methods
  getUsers = userService.getUsers.bind(userService);
  updateUserStatus = userService.updateUserStatus.bind(userService);
  updateUserRole = userService.updateUserRole.bind(userService);
  deleteUser = userService.deleteUser.bind(userService);
  createUser = userService.createUser.bind(userService);
  createDepartment = userService.createDepartment.bind(userService);
  getDepartments = userService.getDepartments.bind(userService);
  updateDepartment = userService.updateDepartment.bind(userService);
  deleteDepartment = userService.deleteDepartment.bind(userService);
  getDepartmentMembers = userService.getDepartmentMembers.bind(userService);
  assignUserToDepartment = userService.assignUserToDepartment.bind(userService);
  removeUserFromDepartment = userService.removeUserFromDepartment.bind(userService);

  // Support methods
  createSupportTicket = supportService.createSupportTicket.bind(supportService);
  getSupportTickets = supportService.getSupportTickets.bind(supportService);
  updateSupportTicketStatus = supportService.updateSupportTicketStatus.bind(supportService);
  addSupportResponse = supportService.addSupportResponse.bind(supportService);
  getSupportResponses = supportService.getSupportResponses.bind(supportService);
  subscribeSupportTickets = supportService.subscribeSupportTickets.bind(supportService);

  // Storage methods
  uploadImage = storageService.uploadImage.bind(storageService);
  deleteImage = storageService.deleteImage.bind(storageService);
  createInventoryEntry = storageService.createInventoryEntry.bind(storageService);
  updateInventoryQuantity = storageService.updateInventoryQuantity.bind(storageService);

  // Statistics methods
  getAvailableProductsStats = statisticsService.getAvailableProductsStats.bind(statisticsService);
  getOrderBasedProductsStats = statisticsService.getOrderBasedProductsStats.bind(statisticsService);
  getBusinessStats = statisticsService.getBusinessStats.bind(statisticsService);
  subscribeToStats = statisticsService.subscribeToStats.bind(statisticsService);

  // Legacy methods for backward compatibility
  updateProductQuantityAndAmount = async (cakeId: string, quantityChange: number, isOrder: boolean = false): Promise<void> => {
    console.warn('updateProductQuantityAndAmount is deprecated, use processOrderQuantity instead');
    if (isOrder) {
      await this.processOrderQuantity(cakeId, Math.abs(quantityChange));
    } else {
      // For adding product quantity, update the cake directly
      const cake = await this.getCakeById(cakeId);
      if (cake) {
        const newQuantity = (cake.quantity || 0) + Math.abs(quantityChange);
        await this.updateCake(cakeId, {
          quantity: newQuantity,
          available: newQuantity > 0
        });
      }
    }
  };

  // Bitta bo'limni olish (legacy support)
  async getDepartmentById(departmentId: string): Promise<any | null> {
    const departments = await this.getDepartments();
    return departments.find(dept => dept.id === departmentId) || null;
  }
}

// Export the main service instance
export const dataService = new DataService();

// Default export for backward compatibility
export default dataService;