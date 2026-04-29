import { apiSlice } from './apiSlice';

export const adminApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getBills: builder.query<any[], void>({
      query: () => '/bills',
      providesTags: ['Order'], // Bills are often derived from orders
      transformResponse: (response: any) => response.data || response,
    }),
    getExpenses: builder.query<any[], void>({
      query: () => '/expenses',
      providesTags: ['Expense'],
      transformResponse: (response: any) => response.data || response,
    }),
    getMaterials: builder.query<any[], void>({
      query: () => '/stock', // Materials currently share the stock endpoint
      providesTags: ['Material'],
      transformResponse: (response: any) => response.data || response,
    }),
    getSupervisors: builder.query<any[], void>({
      query: () => '/supervisors',
      providesTags: ['Supervisor'],
      transformResponse: (response: any) => response.data || response,
    }),
    getWorkforce: builder.query<any[], void>({
      query: () => '/workforce',
      providesTags: ['Workforce' as any],
      transformResponse: (response: any) => {
        // The API returns { workforce: [...] }
        return response.workforce || response.data || response || [];
      },
    }),
    deleteExpense: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Expense'],
    }),
    deleteSupervisor: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/supervisors/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Supervisor'],
    }),
    getCustomers: builder.query<any[], void>({
      query: () => '/customers',
      providesTags: ['Customer'],
      transformResponse: (response: any) => response.data || response,
    }),
    createCustomer: builder.mutation<any, any>({
      query: (newCustomer) => ({
        url: '/customers',
        method: 'POST',
        body: newCustomer,
      }),
      invalidatesTags: ['Customer'],
    }),
    updateCustomer: builder.mutation<any, any>({
      query: ({ id, ...patch }) => ({
        url: `/customers/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Customer'],
    }),
    deleteCustomer: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/customers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customer'],
    }),
    createExpense: builder.mutation<any, any>({
      query: (newExpense) => ({
        url: '/expenses',
        method: 'POST',
        body: newExpense,
      }),
      invalidatesTags: ['Expense'],
    }),
    createWorkforce: builder.mutation<any, any>({
      query: (newMember) => ({
        url: '/workforce',
        method: 'POST',
        body: newMember,
      }),
      invalidatesTags: ['Workforce' as any],
    }),
    recordWorkforcePayment: builder.mutation<any, { workerId: string; amount: number; type: string }>({
      query: (payment) => ({
        url: '/workforce/payments',
        method: 'POST',
        body: payment,
      }),
      invalidatesTags: ['Workforce' as any],
    }),
    createStockItem: builder.mutation<any, any>({
      query: (newItem) => ({
        url: '/stock',
        method: 'POST',
        body: newItem,
      }),
      invalidatesTags: ['Stock', 'Material'],
    }),
    recordStockTransaction: builder.mutation<any, { id: string; type: 'IN' | 'OUT'; quantity: number }>({
      query: ({ id, ...body }) => ({
        url: `/stock/${id}/transactions`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Stock', 'Material'],
    }),
    getBillById: builder.query<any, string>({
      query: (id) => `/bills/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),
  }),
});

export const {
  useGetBillsQuery,
  useGetExpensesQuery,
  useGetMaterialsQuery,
  useGetSupervisorsQuery,
  useGetWorkforceQuery,
  useDeleteExpenseMutation,
  useDeleteSupervisorMutation,
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useCreateExpenseMutation,
  useCreateWorkforceMutation,
  useRecordWorkforcePaymentMutation,
  useCreateStockItemMutation,
  useRecordStockTransactionMutation,
  useGetBillByIdQuery,
} = adminApi;
