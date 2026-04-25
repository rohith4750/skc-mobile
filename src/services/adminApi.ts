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
  }),
});

export const {
  useGetBillsQuery,
  useGetExpensesQuery,
  useGetMaterialsQuery,
  useGetSupervisorsQuery,
  useDeleteExpenseMutation,
  useDeleteSupervisorMutation,
} = adminApi;
