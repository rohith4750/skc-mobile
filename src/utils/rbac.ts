export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  TRANSPORT_ADMIN = 'transport_admin',
  CUSTOMER = 'customer',
}

export const hasPermission = (userRole: any, allowedRoles: UserRole[]) => {
  if (!userRole || typeof userRole !== 'string') return false;
  if (!Array.isArray(allowedRoles)) return false;
  
  // Normalize roles (e.g. handle case-sensitivity or naming variations)
  const normalizedRole = userRole.toLowerCase()
    .trim()
    .replace('superadmin', 'super_admin')
    .replace('transportadmin', 'transport_admin');
    
  // Check both direct match and normalized match
  return allowedRoles.includes(normalizedRole as UserRole) || 
         allowedRoles.includes(userRole.toLowerCase() as UserRole);
};

export const Permissions = {
  // Navigation & Tabs
  VIEW_BILLS_TAB: [UserRole.SUPER_ADMIN],
  VIEW_ORDERS_TAB: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  VIEW_DELIVERY_TAB: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRANSPORT_ADMIN],
  VIEW_MORE_TAB: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRANSPORT_ADMIN],

  // Modules & Actions
  MANAGE_CUSTOMERS: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  MANAGE_MENU_STOCK: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  MANAGE_INVENTORY: [UserRole.SUPER_ADMIN], // Vessels/Hardware
  MANAGE_EXPENSES: [UserRole.SUPER_ADMIN],
  MANAGE_WORKFORCE: [UserRole.SUPER_ADMIN, UserRole.TRANSPORT_ADMIN],
  MANAGE_DELIVERY: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRANSPORT_ADMIN],

  // Specific Dashboard & Order Actions
  CREATE_ORDER: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  CREATE_BILL: [UserRole.SUPER_ADMIN],
  VIEW_DASHBOARD_STATS: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  VIEW_REAL_TIME_TRACKING: [UserRole.SUPER_ADMIN, UserRole.TRANSPORT_ADMIN],
};
