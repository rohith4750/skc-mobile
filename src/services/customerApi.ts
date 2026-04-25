import { apiSlice } from './apiSlice';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  ordersCount?: number;
  totalSpent?: number;
}

export const customerApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getCustomers: builder.query<Customer[], void>({
      query: () => '/customers',
      providesTags: ['Customer'],
      transformResponse: (response: any) => {
        const data = response.data || response;
        return Array.isArray(data) ? data : [];
      },
    }),
    getCustomerById: builder.query<Customer, string>({
      query: (id) => `/customers/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Customer', id }],
    }),
    createCustomer: builder.mutation<Customer, Partial<Customer>>({
      query: (body) => ({
        url: '/customers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Customer'],
    }),
    updateCustomer: builder.mutation<Customer, { id: string; body: Partial<Customer> }>({
      query: ({ id, body }) => ({
        url: `/customers/${id}`,
        method: 'PUT',
        body,
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
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customerApi;
