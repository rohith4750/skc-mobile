import { apiSlice } from './apiSlice';

export interface MenuItem {
  id: string;
  name: string;
  nameTelugu?: string;
  type: string[];
  description?: string;
  descriptionTelugu?: string;
  price?: number;
  unit?: string;
  isCommon: boolean;
  isActive: boolean;
}

export const menuApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getMenu: builder.query<MenuItem[], void>({
      query: () => '/menu',
      providesTags: ['Product'],
      transformResponse: (response: any) => {
        const data = response.data || response;
        return Array.isArray(data) ? data : [];
      },
    }),
    createMenuItem: builder.mutation<MenuItem, Partial<MenuItem>>({
      query: (item) => ({
        url: '/menu',
        method: 'POST',
        body: item,
      }),
      invalidatesTags: ['Product'],
    }),
    updateMenuItem: builder.mutation<MenuItem, Partial<MenuItem> & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `/menu/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Product', id }, 'Product'],
    }),
    deleteMenuItem: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/menu/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),
  }),
});

export const {
  useGetMenuQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
} = menuApi;
