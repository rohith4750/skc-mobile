import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  TextInput,
  ScrollView,
} from 'react-native';
import { 
  LayoutDashboard, 
  Plus, 
  Search, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  Phone, 
  ChevronRight,
  Filter,
  Package, 
  Calendar, 
  User,
  ArrowLeft
} from 'lucide-react-native';
import Constants from 'expo-constants';
import { Colors, Shadows } from '../theme/colors';
import { useGetOrdersQuery } from '../services/orderApi';
import { Order } from '../types';

const STATUS_FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'DELIVERED'];

const OrdersScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  // New High-Performance Data Fetching
  const { 
    data: orders = [], 
    isLoading, 
    isFetching, 
    error: apiError, 
    refetch 
  } = useGetOrdersQuery(undefined, {
    pollingInterval: 30000, // Still auto-refreshing every 30s
    refetchOnMountOrArgChange: true
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleFilterChange = useCallback((filter: string) => {
    setActiveFilter(filter);
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = () => {
        if (activeFilter === 'ALL') return true;
        const status = order.status?.toLowerCase();
        if (activeFilter === 'DELIVERED') return status === 'completed';
        return status === activeFilter.toLowerCase();
      };
      
      return matchesSearch && matchesFilter();
    });
  }, [orders, searchQuery, activeFilter]);

  const getStatusStyle = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'DELIVERED':
      case 'COMPLETED': return { color: '#2E7D32', bg: '#E8F5E9' };
      case 'PENDING': return { color: '#E65100', bg: '#FFF3E0' };
      case 'CONFIRMED': return { color: '#1565C0', bg: '#E3F2FD' };
      case 'IN_PROGRESS': return { color: Colors.primary, bg: Colors.primary + '15' };
      case 'CANCELLED': return { color: Colors.error, bg: Colors.error + '15' };
      default: return { color: Colors.textSecondary, bg: '#F1F3F5' };
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusStyle = getStatusStyle(item.status);
    const date = item.createdAt ? new Date(item.createdAt) : null;
    
    return (
      <TouchableOpacity 
        style={styles.orderCard}
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
                 <Calendar size={12} color={Colors.textSecondary} />
                 <Text style={styles.dateText}>
                    {date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                 </Text>
              </View>
           </View>
        </View>

        <View style={styles.itemsBox}>
           <Package size={14} color={Colors.primary} />
           <Text style={styles.itemsText} numberOfLines={1}>
              {item.items.length} {item.items.length === 1 ? 'Item' : 'Items'} • {item.items.map((i: any) => i.menuItem?.name || i.name || 'Item').join(', ')}
           </Text>
        </View>

        <View style={styles.cardFooter}>
           <Text style={styles.priceLabel}>TOTAL AMOUNT</Text>
           <Text style={styles.priceValue}>₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}</Text>
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
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.mainTitle}>Order Dashboard</Text>
        </View>
        
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID or name..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {STATUS_FILTERS.map(filter => (
            <TouchableOpacity 
              key={filter}
              style={[styles.filterPill, activeFilter === filter && styles.activePill]}
              onPress={() => handleFilterChange(filter)}
            >
              <Text style={[styles.pillText, activeFilter === filter && styles.activePillText]}>
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
      ) : apiError ? (
        <View style={styles.centerBox}>
           <AlertTriangle size={60} color={Colors.error} />
           <Text style={styles.errorText}>
             {('status' in apiError) ? `Error ${apiError.status}: ` : ''}
             {('data' in apiError && (apiError.data as any)?.error) 
               ? (apiError.data as any).error 
               : ('message' in apiError) ? apiError.message : 'Connection failed. Check backend.'}
           </Text>
           <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
              <Text style={styles.retryBtnText}>Retry Connection</Text>
           </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollArea}
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
              <Package size={60} color="#E0E0E0" />
              <Text style={styles.emptyMsg}>No matching orders found</Text>
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
    backgroundColor: '#F3F4F6',
  },
  topSection: {
    backgroundColor: Colors.white,
    paddingTop: 75,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...Shadows.medium,
    zIndex: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  backBtn: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginRight: 15,
  },
  mainTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 25,
    paddingHorizontal: 15,
    borderRadius: 15,
    height: 50,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  filterScroll: {
    marginBottom: 20,
  },
  filterContent: {
    paddingHorizontal: 25,
    gap: 10,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  activePill: {
    backgroundColor: Colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activePillText: {
    color: Colors.white,
  },
  scrollArea: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    ...Shadows.small,
    borderWidth: 1,
    borderColor: '#F1F1F1',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  orderIdLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  idContainer: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  itemsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 14,
    gap: 8,
    marginBottom: 18,
  },
  itemsText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
  },
  centerBox: {
    flex: 1,
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMsg: {
    marginTop: 15,
    fontSize: 16,
    color: '#CCC',
    fontWeight: '700',
  },
  errorText: {
    marginTop: 15,
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: Colors.error + '15',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  retryBtnText: {
    color: Colors.error,
    fontWeight: '800',
    fontSize: 13,
  },
});

export default OrdersScreen;
