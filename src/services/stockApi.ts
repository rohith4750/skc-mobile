import { apiSlice } from './apiSlice';

export interface StockItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
  unit: string;
}

export const stockApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getStock: builder.query<StockItem[], void>({
      query: () => '/stock',
      providesTags: ['Stock'],
      transformResponse: (response: any) => {
        const data = response.data || response;
        return Array.isArray(data) ? data : [];
      },
    }),
    getStockItemById: builder.query<StockItem, string>({
      query: (id) => `/stock/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Stock', id }],
    }),
    createStockItem: builder.mutation<StockItem, Partial<StockItem>>({
      query: (item) => ({
        url: '/stock',
        method: 'POST',
        body: item,
      }),
      invalidatesTags: ['Stock'],
    }),
    updateStockItem: builder.mutation<StockItem, Partial<StockItem> & { id: string }>({
      query: ({ id, ...patch }) => ({
        url: `/stock/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Stock', id }, 'Stock'],
    }),
    deleteStockItem: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/stock/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Stock'],
    }),
  }),
});

export const {
  useGetStockQuery,
  useGetStockItemByIdQuery,
  useCreateStockItemMutation,
  useUpdateStockItemMutation,
  useDeleteStockItemMutation,
} = stockApi;
