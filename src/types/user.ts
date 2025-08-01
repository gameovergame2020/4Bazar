export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinDate: string;
  role: UserRole;
  // Customer specific
  totalOrders?: number;
  favoriteCount?: number;
  // Baker specific
  bakeryName?: string;
  specialties?: string[];
  rating?: number;
  // Shop specific
  shopName?: string;
  location?: string;
  // Courier specific
  vehicleType?: string;
  deliveryZone?: string;
  // Operator/Admin specific
  permissions?: string[];
}

export type UserRole = 'customer' | 'baker' | 'shop' | 'courier' | 'operator' | 'admin';

export interface RoleConfig {
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  color: string;
  icon: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  customer: {
    name: 'customer',
    displayName: 'Buyurtmachi',
    description: 'Tort tanlaydi va buyurtma qiladi',
    permissions: ['order', 'favorite', 'review'],
    color: 'blue',
    icon: 'User'
  },
  baker: {
    name: 'baker',
    displayName: 'Tort tayyorlovchi',
    description: 'Tortlar qo\'shadi va buyurtmalarni qabul qiladi',
    permissions: ['add_product', 'manage_orders', 'view_analytics'],
    color: 'orange',
    icon: 'ChefHat'
  },
  shop: {
    name: 'shop',
    displayName: 'Do\'kon',
    description: 'Tayyor tortlarni sotadi',
    permissions: ['sell_products', 'manage_inventory', 'view_sales'],
    color: 'green',
    icon: 'Store'
  },
  courier: {
    name: 'courier',
    displayName: 'Kuryer',
    description: 'Tortlarni manzilga yetkazadi',
    permissions: ['view_deliveries', 'update_status', 'navigate'],
    color: 'purple',
    icon: 'Truck'
  },
  operator: {
    name: 'operator',
    displayName: 'Operator',
    description: 'Jarayonlarni nazorat qiladi va muammolarni hal qiladi',
    permissions: ['monitor_system', 'resolve_issues', 'manage_support'],
    color: 'yellow',
    icon: 'Headphones'
  },
  admin: {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Barcha tizimni boshqaradi',
    permissions: ['full_access', 'manage_users', 'system_settings'],
    color: 'red',
    icon: 'Shield'
  }
};