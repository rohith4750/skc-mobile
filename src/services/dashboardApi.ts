import { apiSlice } from './apiSlice';

export interface DashboardStats {
  customers: number;
  stock: number;
  orders: number;
  bills: number;
  todayOrders: number;
  activeOrders: number;
  todayRevenue: number;
  todayTotalAmount: number;
  todayPendingAmount: number;
  outstanding: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentOrders: any[];
}

export const dashboardApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getMobileDashboard: builder.query<DashboardData, void>({
      query: () => 'mobile/dashboard',
      providesTags: ['Order', 'Customer', 'Stock'],
    }),
  }),
});

export const { useGetMobileDashboardQuery } = dashboardApi;
