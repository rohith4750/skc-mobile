import { apiSlice } from './apiSlice';
import { Order } from '../types';

export const orderApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getOrders: builder.query<Order[], void>({
      query: () => 'orders',
      providesTags: ['Order'],
      transformResponse: (response: any) => {
        // Handle both {data: [...]} and direct array responses
        const data = response.data || response;
        return Array.isArray(data) ? data : [];
      },
    }),
    getOrderById: builder.query<Order, string>({
      query: (id) => `orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),
    updateOrderStatus: builder.mutation<Order, { id: string; status: string }>({
      query: ({ id, ...patch }) => ({
        url: `orders/${id}/status`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Order', id },
        'Order',
      ],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useUpdateOrderStatusMutation,
} = orderApi;
