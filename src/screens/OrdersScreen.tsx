import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  ChevronRight,
  Package, 
  Calendar, 
  ArrowLeft,
  Edit3,
  Trash2
} from 'lucide-react-native';
import { Colors, Shadows, Radii } from '../theme/colors';
import { useGetOrdersQuery, useDeleteOrderMutation } from '../services/orderApi';
import { useToast } from '../components/Toast';
import { Order } from '../types';

const STATUS_FILTERS = ['ALL', 'QUOTATION', 'PENDING', 'IN PROGRESS', 'COMPLETED', 'CANCELLED'];

const OrdersScreen = ({ navigation }: any) => {
  const { showToast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { 
    data: orders = [], 
    isLoading, 
    isFetching, 
    error,
    refetch 
  } = useGetOrdersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation();

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleDeleteOrder = (order: Order) => {
    Alert.alert(
      'Delete Order',
      `Are you sure you want to delete Order #${order.id.slice(-6).toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteOrder(order.id).unwrap();
              showToast('Order deleted successfully', 'success');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete order');
            }
          }
        }
      ]
    );
  };

  const getStatusStyle = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'COMPLETED':
      case 'DELIVERED': return { bg: Colors.successLight, color: Colors.success };
      case 'PENDING': return { bg: Colors.warningLight, color: Colors.warning };
      case 'QUOTATION': return { bg: Colors.infoLight, color: Colors.info };
      case 'IN_PROGRESS':
      case 'IN PROGRESS':
      case 'PREPARING': return { bg: Colors.primaryLight, color: Colors.primaryDark };
      case 'CANCELLED': return { bg: Colors.errorLight, color: Colors.error };
      default: return { bg: Colors.surfaceSubtle, color: Colors.textSecondary };
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchSearch = searchQuery === '' || 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer?.phone?.includes(searchQuery);

      const status = order.status?.toUpperCase() || '';
      let matchFilter = true;
      if (selectedFilter !== 'ALL') {
        if (selectedFilter === 'IN PROGRESS') {
          matchFilter = status === 'IN_PROGRESS' || status === 'IN PROGRESS' || status === 'PREPARING';
        } else if (selectedFilter === 'COMPLETED') {
          matchFilter = status === 'COMPLETED' || status === 'DELIVERED';
        } else {
          matchFilter = status === selectedFilter;
        }
      }

      return matchSearch && matchFilter;
    });
  }, [orders, searchQuery, selectedFilter]);

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusStyle = getStatusStyle(item.status);
    const date = item.createdAt ? new Date(item.createdAt) : null;
    
    return (
      <TouchableOpacity 
        style={[styles.orderCard, Shadows.small]}
        onPress={() => navigation.navigate('OrderDetail', { order: item })}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.idContainer}>
            <Text style={styles.orderIdLabel}>ORDER ID</Text>
            <Text style={styles.orderNumber}>#{item.id.slice(-6).toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusStyle.color }]} />
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status || 'UNSET'}</Text>
          </View>
        </View>

        <View style={styles.customerCard}>
           <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.customer?.name?.charAt(0) || '?'}</Text>
           </View>
           <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{item.customer?.name || 'Standard Customer'}</Text>
              <View style={styles.dateRow}>
                 <Calendar size={12} color={Colors.textTertiary} />
                 <Text style={styles.dateText}>
                    {date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                 </Text>
              </View>
           </View>
        </View>

        <View style={styles.itemsBox}>
           <Package size={14} color={Colors.primary} />
           <Text style={styles.itemsText} numberOfLines={1}>
              {item.items.length} {item.items.length === 1 ? 'item' : 'items'} • {item.items.map((i: any) => i.menuItem?.name || i.name || 'Item').join(', ')}
           </Text>
        </View>

        <View style={styles.cardFooter}>
           <View>
             <Text style={styles.priceLabel}>TOTAL</Text>
             <Text style={styles.priceValue}>₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}</Text>
           </View>

           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
             <TouchableOpacity 
               style={styles.editCardBtn}
               onPress={(e) => {
                 e.stopPropagation?.();
                 navigation.navigate('NewOrder', { orderToEdit: item });
               }}
               activeOpacity={0.7}
             >
               <Edit3 size={13} color={Colors.primaryDark} />
               <Text style={styles.editCardText}>Edit</Text>
             </TouchableOpacity>

             <TouchableOpacity 
               style={styles.deleteCardBtn}
               onPress={(e) => {
                 e.stopPropagation?.();
                 handleDeleteOrder(item);
               }}
               activeOpacity={0.7}
             >
               <Trash2 size={13} color={Colors.error} />
             </TouchableOpacity>

             <ChevronRight size={18} color={Colors.textTertiary} />
           </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.mainTitle}>Orders</Text>
            <Text style={styles.subtitleText}>Showing {filteredOrders.length} of {orders.length} orders</Text>
          </View>
          <TouchableOpacity 
            style={styles.createBtn}
            onPress={() => navigation.navigate('NewOrder')}
            activeOpacity={0.8}
          >
            <Plus size={18} color={Colors.white} />
            <Text style={styles.createBtnText}>New</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID or customer..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScroll}
        >
          {STATUS_FILTERS.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(filter)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterChipText,
                selectedFilter === filter && styles.filterChipTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <AlertTriangle size={36} color={Colors.error} />
          <Text style={styles.errorText}>Failed to load orders</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isFetching} 
              onRefresh={onRefresh} 
              tintColor={Colors.primary} 
            />
          }
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Package size={48} color={Colors.border} />
              <Text style={styles.emptyMsg}>No orders found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topSection: {
    backgroundColor: Colors.white,
    paddingTop: 52,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: Radii.md,
    gap: 4,
    ...Shadows.small,
  },
  createBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    marginHorizontal: 18,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    height: 44,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  filterScroll: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  listContainer: {
    padding: 18,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  orderIdLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 1,
  },
  idContainer: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.primaryDark,
    fontSize: 16,
    fontWeight: '800',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  itemsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: Radii.md,
    gap: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  itemsText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  editCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  editCardText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  deleteCardBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBox: {
    flex: 1,
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMsg: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: Colors.errorLight,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  retryBtnText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 13,
  },
});

export default OrdersScreen;
