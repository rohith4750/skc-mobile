import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Package, 
  Calendar, 
  ArrowLeft,
  Edit3,
  Trash2,
  Filter,
  X,
  RotateCcw,
  User
} from 'lucide-react-native';
import { Colors, Shadows, Radii } from '../theme/colors';
import { useGetOrdersQuery, useDeleteOrderMutation } from '../services/orderApi';
import { useGetCustomersQuery } from '../services/customerApi';
import { useToast } from '../components/Toast';
import { Order } from '../types';

const STATUS_FILTERS = ['ALL', 'QUOTATION', 'PENDING', 'IN PROGRESS', 'COMPLETED', 'CANCELLED'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PAYMENT_FILTERS = [
  { label: 'All Payments', value: 'ALL' },
  { label: 'Fully Paid', value: 'PAID' },
  { label: 'Partial / Due', value: 'PARTIAL' },
  { label: 'Unpaid', value: 'UNPAID' }
];
const TYPE_FILTERS = [
  { label: 'All Types', value: 'ALL' },
  { label: 'Event Catering', value: 'EVENT' },
  { label: 'Lunch Pack', value: 'LUNCH_PACK' }
];

const OrdersScreen = ({ navigation }: any) => {
  const { showToast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID'>('ALL');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'ALL' | 'EVENT' | 'LUNCH_PACK'>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});

  const toggleMonthCollapse = useCallback((monthTitle: string) => {
    setCollapsedMonths(prev => ({
      ...prev,
      [monthTitle]: !prev[monthTitle]
    }));
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Immediately reset month collapse toggles and filter drawer when entering/changing screen
      setCollapsedMonths({});
      setIsFiltersVisible(false);
    }, [])
  );

  const { 
    data: orders = [], 
    isLoading, 
    isFetching, 
    error,
    refetch 
  } = useGetOrdersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const { data: customers = [] } = useGetCustomersQuery();

  const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation();

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedFilter !== 'ALL') count++;
    if (selectedMonth > 0) count++;
    if (selectedYear !== new Date().getFullYear()) count++;
    if (paymentFilter !== 'ALL') count++;
    if (orderTypeFilter !== 'ALL') count++;
    if (selectedCustomerId) count++;
    if (selectedDate) count++;
    return count;
  }, [selectedFilter, selectedMonth, selectedYear, paymentFilter, orderTypeFilter, selectedCustomerId, selectedDate]);

  const resetFilters = () => {
    setSelectedFilter('ALL');
    setSelectedMonth(0);
    setSelectedYear(new Date().getFullYear());
    setPaymentFilter('ALL');
    setOrderTypeFilter('ALL');
    setSelectedCustomerId('');
    setSelectedDate('');
    setSearchQuery('');
  };

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
      // 1. Search Query
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchId = order.id?.toLowerCase().includes(query);
        const matchCustomer = order.customer?.name?.toLowerCase().includes(query);
        const matchPhone = order.customer?.phone?.includes(query);
        const matchVenue = (order as any).venue?.toLowerCase().includes(query) || (order as any).eventName?.toLowerCase().includes(query);
        if (!matchId && !matchCustomer && !matchPhone && !matchVenue) return false;
      }

      // 2. Specific Customer Filter
      if (selectedCustomerId) {
        const custId = order.customerId || order.customer?.id;
        if (custId !== selectedCustomerId) return false;
      }

      // 3. Exact Event Date Filter
      if (selectedDate) {
        const dateVal = (order as any).eventDate || order.createdAt;
        if (!dateVal) return false;
        const orderDateStr = new Date(dateVal).toISOString().split('T')[0];
        if (orderDateStr !== selectedDate) return false;
      }

      // 4. Status Filter
      const status = (order.status || '').toUpperCase();
      if (selectedFilter !== 'ALL') {
        if (selectedFilter === 'IN PROGRESS') {
          if (status !== 'IN_PROGRESS' && status !== 'IN PROGRESS' && status !== 'PREPARING') return false;
        } else if (selectedFilter === 'COMPLETED') {
          if (status !== 'COMPLETED' && status !== 'DELIVERED') return false;
        } else if (status !== selectedFilter) {
          return false;
        }
      }

      // 5. Month & Year Filter (if exact date is not picked)
      if (!selectedDate) {
        const dateVal = (order as any).eventDate || order.createdAt;
        if (dateVal) {
          const eventDate = new Date(dateVal);
          if (selectedMonth > 0 && (eventDate.getMonth() + 1) !== selectedMonth) return false;
          if (selectedYear > 0 && eventDate.getFullYear() !== selectedYear) return false;
        }
      }

      // 6. Payment Status Filter
      if (paymentFilter !== 'ALL') {
        const total = Number(order.totalAmount || 0);
        const advance = Number((order as any).advancePaid || 0);
        const remaining = Number((order as any).remainingAmount || Math.max(0, total - advance));

        if (paymentFilter === 'PAID') {
          if (remaining > 0 || total === 0) return false;
        } else if (paymentFilter === 'PARTIAL') {
          if (advance <= 0 || remaining <= 0) return false;
        } else if (paymentFilter === 'UNPAID') {
          if (advance > 0) return false;
        }
      }

      // 7. Order Type Filter
      if (orderTypeFilter !== 'ALL') {
        const type = ((order as any).orderType || 'EVENT').toUpperCase();
        if (type !== orderTypeFilter) return false;
      }

      return true;
    });
  }, [orders, searchQuery, selectedFilter, selectedMonth, selectedYear, paymentFilter, orderTypeFilter, selectedCustomerId, selectedDate]);

  const groupedOrdersByMonth = useMemo(() => {
    // Sort orders descending by event date (or createdAt)
    const sorted = [...filteredOrders].sort((a, b) => {
      const dA = new Date((a as any).eventDate || a.createdAt || 0).getTime();
      const dB = new Date((b as any).eventDate || b.createdAt || 0).getTime();
      return dB - dA;
    });

    const now = new Date();
    const map: Record<string, { title: string; monthName: string; yearName: string; shortMonth: string; isCurrentMonth: boolean; data: Order[] }> = {};

    sorted.forEach(order => {
      const dVal = (order as any).eventDate || order.createdAt;
      let monthName = 'Other';
      let yearName = '';
      let shortMonth = 'DATE';
      let isCurrentMonth = false;

      if (dVal) {
        const d = new Date(dVal);
        if (!isNaN(d.getTime())) {
          monthName = d.toLocaleDateString('en-IN', { month: 'long' });
          yearName = `${d.getFullYear()}`;
          shortMonth = d.toLocaleDateString('en-IN', { month: 'short' });
          isCurrentMonth = (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth());
        }
      }

      const title = `${monthName} ${yearName}`.trim();

      if (!map[title]) {
        map[title] = {
          title,
          monthName,
          yearName,
          shortMonth,
          isCurrentMonth,
          data: [],
        };
      }
      map[title].data.push(order);
    });

    return Object.values(map);
  }, [filteredOrders]);

  const sectionListItems = useMemo(() => {
    return groupedOrdersByMonth.map(group => {
      const isCollapsed = !!collapsedMonths[group.title];
      return {
        ...group,
        data: isCollapsed ? [] : group.data,
        rawOrders: group.data,
        totalCount: group.data.length,
        isCollapsed
      };
    });
  }, [groupedOrdersByMonth, collapsedMonths]);

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusStyle = getStatusStyle(item.status);
    const eventDateVal = (item as any).eventDate || item.createdAt;
    const formattedEventDate = eventDateVal 
      ? new Date(eventDateVal).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Date N/A';
    const eventTitle = (item as any).eventName;
    
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
                 <Calendar size={13} color={Colors.primary} />
                 <Text style={styles.eventDateText}>
                   Event Date: <Text style={styles.eventDateBold}>{formattedEventDate}</Text>
                   {eventTitle ? ` · ${eventTitle}` : ''}
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
        
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={18} color={Colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search ID, client, or venue..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor={Colors.textTertiary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                <X size={14} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.filterToggleBtn, (isFiltersVisible || activeFilterCount > 0) && styles.filterToggleBtnActive]}
            onPress={() => setIsFiltersVisible(!isFiltersVisible)}
            activeOpacity={0.7}
          >
            <Filter size={18} color={isFiltersVisible || activeFilterCount > 0 ? Colors.white : Colors.textSecondary} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Primary Status Filters */}
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

        {/* Collapsible Advanced Filters Drawer */}
        {isFiltersVisible && (
          <View style={styles.advancedFiltersPanel}>
            {/* Specific Exact Event Date Filter */}
            <Text style={styles.filterGroupLabel}>EXACT EVENT DATE</Text>
            <View style={styles.datePickerFilterRow}>
              <TouchableOpacity 
                style={[styles.dateFilterBtn, !!selectedDate && styles.dateFilterBtnActive]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Calendar size={14} color={selectedDate ? Colors.white : Colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.dateFilterBtnText, !!selectedDate && styles.dateFilterBtnTextActive]}>
                  {selectedDate ? `Date: ${selectedDate}` : 'Select Exact Date...'}
                </Text>
              </TouchableOpacity>

              {selectedDate ? (
                <TouchableOpacity onPress={() => setSelectedDate('')} style={styles.clearDateBtn} activeOpacity={0.7}>
                  <X size={14} color={Colors.error} />
                  <Text style={styles.clearDateText}>Clear Date</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate ? new Date(selectedDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event: any, date?: Date) => {
                  if (Platform.OS === 'android') setShowDatePicker(false);
                  if (date && event.type !== 'dismissed') {
                    const formatted = date.toISOString().split('T')[0];
                    setSelectedDate(formatted);
                    if (Platform.OS === 'ios') setShowDatePicker(false);
                  }
                }}
              />
            )}

            {/* Client / Customer Filter */}
            {customers && customers.length > 0 && (
              <>
                <Text style={styles.filterGroupLabel}>FILTER BY CLIENT / CUSTOMER</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subFilterScroll}>
                  <TouchableOpacity
                    onPress={() => setSelectedCustomerId('')}
                    style={[styles.subFilterChip, !selectedCustomerId && styles.subFilterChipActive]}
                  >
                    <Text style={[styles.subFilterChipText, !selectedCustomerId && styles.subFilterChipTextActive]}>All Clients</Text>
                  </TouchableOpacity>
                  {customers.map((c: any) => {
                    const isSel = selectedCustomerId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => setSelectedCustomerId(isSel ? '' : c.id)}
                        style={[styles.subFilterChip, isSel && styles.subFilterChipActive]}
                      >
                        <Text style={[styles.subFilterChipText, isSel && styles.subFilterChipTextActive]}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Month & Year Filter */}
            <Text style={styles.filterGroupLabel}>FILTER BY EVENT MONTH & YEAR</Text>
            <View style={styles.yearRow}>
              <TouchableOpacity onPress={() => setSelectedYear(y => y - 1)} style={styles.yearNavBtn}>
                <ChevronLeft size={14} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.yearNavText}>{selectedYear}</Text>
              <TouchableOpacity onPress={() => setSelectedYear(y => y + 1)} style={styles.yearNavBtn}>
                <ChevronRight size={14} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subFilterScroll}>
              <TouchableOpacity
                onPress={() => setSelectedMonth(0)}
                style={[styles.subFilterChip, selectedMonth === 0 && styles.subFilterChipActive]}
              >
                <Text style={[styles.subFilterChipText, selectedMonth === 0 && styles.subFilterChipTextActive]}>All Months</Text>
              </TouchableOpacity>
              {MONTH_NAMES.map((m, idx) => {
                const mNum = idx + 1;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setSelectedMonth(mNum)}
                    style={[styles.subFilterChip, selectedMonth === mNum && styles.subFilterChipActive]}
                  >
                    <Text style={[styles.subFilterChipText, selectedMonth === mNum && styles.subFilterChipTextActive]}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Payment Status Filter */}
            <Text style={styles.filterGroupLabel}>PAYMENT STATUS</Text>
            <View style={styles.chipGridRow}>
              {PAYMENT_FILTERS.map(pf => (
                <TouchableOpacity
                  key={pf.value}
                  onPress={() => setPaymentFilter(pf.value as any)}
                  style={[styles.subFilterChip, paymentFilter === pf.value && styles.subFilterChipActive]}
                >
                  <Text style={[styles.subFilterChipText, paymentFilter === pf.value && styles.subFilterChipTextActive]}>
                    {pf.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Order Type Filter */}
            <Text style={styles.filterGroupLabel}>CATERING TYPE</Text>
            <View style={styles.chipGridRow}>
              {TYPE_FILTERS.map(tf => (
                <TouchableOpacity
                  key={tf.value}
                  onPress={() => setOrderTypeFilter(tf.value as any)}
                  style={[styles.subFilterChip, orderTypeFilter === tf.value && styles.subFilterChipActive]}
                >
                  <Text style={[styles.subFilterChipText, orderTypeFilter === tf.value && styles.subFilterChipTextActive]}>
                    {tf.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Reset Filters Button */}
            {(activeFilterCount > 0 || searchQuery.length > 0) && (
              <TouchableOpacity onPress={resetFilters} style={styles.resetFiltersBtn} activeOpacity={0.7}>
                <RotateCcw size={13} color={Colors.error} />
                <Text style={styles.resetFiltersText}>Reset All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

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
        <SectionList
          sections={sectionListItems}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }: any) => {
            const { title, monthName, yearName, isCurrentMonth, rawOrders, totalCount, isCollapsed } = section;
            const totalMonthRevenue = rawOrders.reduce((acc: number, order: any) => acc + Number(order.totalAmount || 0), 0);

            return (
              <TouchableOpacity 
                style={[
                  styles.monthSummaryBar, 
                  isCurrentMonth && styles.currentMonthSummaryBar,
                  Shadows.small
                ]}
                onPress={() => toggleMonthCollapse(title)}
                activeOpacity={0.7}
              >
                <View style={styles.monthHeaderLeft}>
                  <Text style={[styles.monthBarTitle, isCurrentMonth && styles.currentMonthBarTitle]}>
                    {monthName} {yearName}
                  </Text>
                  <View style={[styles.monthCountBadge, isCurrentMonth && styles.monthCountBadgeActive]}>
                    <Text style={[styles.monthCountText, isCurrentMonth && styles.monthCountTextActive]}>
                      {totalCount} {totalCount === 1 ? 'order' : 'orders'}
                    </Text>
                  </View>
                </View>

                <View style={styles.monthHeaderRight}>
                  <Text style={styles.monthTotalAmount}>
                    + ₹{totalMonthRevenue.toLocaleString('en-IN')}
                  </Text>
                  {isCollapsed ? (
                    <ChevronRight size={18} color={Colors.textTertiary} />
                  ) : (
                    <ChevronDown size={18} color={Colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 12,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    marginLeft: 6,
  },
  filterToggleBtn: {
    width: 42,
    height: 42,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterToggleBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  advancedFiltersPanel: {
    backgroundColor: Colors.background,
    marginHorizontal: 18,
    marginBottom: 14,
    borderRadius: Radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterGroupLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 6,
  },
  datePickerFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  dateFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateFilterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateFilterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  dateFilterBtnTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  clearDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.errorLight,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radii.pill,
  },
  clearDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.error,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  yearNavBtn: {
    padding: 4,
    backgroundColor: Colors.white,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  yearNavText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  subFilterScroll: {
    gap: 6,
    paddingBottom: 4,
  },
  chipGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subFilterChipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  subFilterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  subFilterChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  resetFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: Colors.errorLight,
    borderRadius: Radii.md,
  },
  resetFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.error,
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
  monthSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    marginTop: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currentMonthSummaryBar: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primary,
    borderWidth: 1.5,
    ...Shadows.goldGlow,
  },
  monthHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthBarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  currentMonthBarTitle: {
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  monthCountBadge: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  monthCountBadgeActive: {
    backgroundColor: Colors.primaryLight,
  },
  monthCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  monthCountTextActive: {
    color: Colors.primaryDark,
  },
  monthHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthTotalAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.success,
    letterSpacing: -0.3,
  },
  orderCountPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  orderCountPillTextActive: {
    color: Colors.white,
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
  eventDateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  eventDateBold: {
    fontWeight: '700',
    color: Colors.text,
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
