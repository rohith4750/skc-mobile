import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const LOGO = require('../assets/icon.png');
import {
  Users,
  ShoppingBag,
  TrendingUp,
  Clock,
  ChevronRight,
  ArrowUpRight,
  Wallet,
  Activity,
  Truck,
  Edit3
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, Radii } from '../theme/colors';
import { useGetMobileDashboardQuery } from '../services/dashboardApi';
import { useGetOrdersQuery } from '../services/orderApi';
import { useAuth } from '../services/AuthContext';
import * as RBAC from '../utils/rbac';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, subValue, icon: Icon, color, isLoading }: any) => (
  <View style={[styles.statCard, Shadows.small]}>
    <View style={styles.statHeader}>
      <View style={[styles.iconBadge, { backgroundColor: color + '15' }]}>
        <Icon size={18} color={color} strokeWidth={2} />
      </View>
      {subValue && (
        <View style={styles.subBadge}>
          <Text style={styles.subBadgeText}>{subValue}</Text>
        </View>
      )}
    </View>
    <Text style={styles.statTitle}>{title}</Text>
    {isLoading ? (
      <ActivityIndicator size="small" color={color} style={styles.loader} />
    ) : (
      <Text style={styles.statValue}>{value}</Text>
    )}
  </View>
);

const QuickAction = ({ title, icon: Icon, color, onPress }: any) => (
  <TouchableOpacity 
    style={[styles.actionCard, Shadows.small]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.actionIconContainer, { backgroundColor: color + '15' }]}>
      <Icon size={20} color={color} strokeWidth={2} />
    </View>
    <Text style={styles.actionTitle} numberOfLines={1}>{title}</Text>
  </TouchableOpacity>
);

const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'today' | 'month' | 'all'>('today');

  const { 
    data: dashboardData, 
    isLoading: loadingDashboard, 
    isFetching: fetchingDashboard, 
    refetch: refetchDashboard 
  } = useGetMobileDashboardQuery(undefined, {
    refetchOnMountOrArgChange: true
  });

  const { data: allOrders = [], refetch: refetchOrders } = useGetOrdersQuery(undefined, {
    refetchOnMountOrArgChange: true
  });

  const onRefresh = () => {
    refetchDashboard();
    refetchOrders();
  };

  const stats = (dashboardData as any)?.data?.overview || (dashboardData as any)?.overview;
  const recentOrders = (dashboardData as any)?.data?.recentOrders || (dashboardData as any)?.recentOrders;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const displayTodayOrders = stats?.todayOrders !== undefined ? stats.todayOrders : (stats?.activeOrders || 0);

  // Month-level calculations
  const monthStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthOrders = allOrders.filter((o: any) => {
      if (o.status === 'cancelled') return false;
      const dateVal = o.eventDate || o.createdAt;
      if (!dateVal) return false;
      const d = new Date(dateVal);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    let monthTotalAmount = 0;
    let monthCollected = 0;
    let monthPending = 0;

    currentMonthOrders.forEach((o: any) => {
      const total = Number(o.totalAmount || 0);
      const advance = Number(o.advancePaid || 0);
      const remaining = Number(o.remainingAmount || Math.max(0, total - advance));

      monthTotalAmount += total;
      monthCollected += advance;
      monthPending += remaining;
    });

    return {
      totalAmount: monthTotalAmount,
      collected: monthCollected,
      pending: monthPending,
      count: currentMonthOrders.length,
    };
  }, [allOrders]);

  // All time calculations
  const allTimeStats = useMemo(() => {
    let totalAmount = 0;
    let collected = 0;
    let pending = 0;

    allOrders.forEach((o: any) => {
      if (o.status === 'cancelled') return;
      const total = Number(o.totalAmount || 0);
      const advance = Number(o.advancePaid || 0);
      const remaining = Number(o.remainingAmount || Math.max(0, total - advance));

      totalAmount += total;
      collected += advance;
      pending += remaining;
    });

    return {
      totalAmount,
      collected,
      pending,
      count: allOrders.length,
    };
  }, [allOrders]);

  // Dynamic values depending on selected timeframe
  const activeHeroData = useMemo(() => {
    if (timeframe === 'month') {
      return {
        label: "THIS MONTH'S REVENUE",
        totalAmount: monthStats.totalAmount,
        ordersCount: monthStats.count,
        collected: monthStats.collected,
        pending: monthStats.pending,
        ordersLabel: "Month Orders",
      };
    } else if (timeframe === 'all') {
      return {
        label: "ALL TIME REVENUE",
        totalAmount: allTimeStats.totalAmount,
        ordersCount: allTimeStats.count,
        collected: allTimeStats.collected,
        pending: allTimeStats.pending,
        ordersLabel: "Total Orders",
      };
    } else {
      return {
        label: "TODAY'S REVENUE",
        totalAmount: stats?.todayTotalAmount || 0,
        ordersCount: displayTodayOrders,
        collected: stats?.todayRevenue || 0,
        pending: stats?.todayPendingAmount || 0,
        ordersLabel: "Today's Orders",
      };
    }
  }, [timeframe, stats, displayTodayOrders, monthStats, allTimeStats]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={fetchingDashboard}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Custom Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBadge}>
               <Image source={LOGO} style={styles.headerLogo} />
            </View>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.username || 'Manager'}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
             <View style={styles.dateChip}>
                <Clock size={12} color={Colors.textSecondary} />
                <Text style={styles.dateText}>{today}</Text>
             </View>
          </View>
        </View>

        {/* Hero Revenue Banner with Timeframe Filter */}
        <LinearGradient
          colors={['#0F172A', '#1E293B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, Shadows.medium]}
        >
          {/* Timeframe Filter Selector */}
          <View style={styles.timeframeRow}>
            <TouchableOpacity 
              style={[styles.timeframeChip, timeframe === 'today' && styles.timeframeChipActive]}
              onPress={() => setTimeframe('today')}
              activeOpacity={0.7}
            >
              <Text style={[styles.timeframeText, timeframe === 'today' && styles.timeframeTextActive]}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.timeframeChip, timeframe === 'month' && styles.timeframeChipActive]}
              onPress={() => setTimeframe('month')}
              activeOpacity={0.7}
            >
              <Text style={[styles.timeframeText, timeframe === 'month' && styles.timeframeTextActive]}>This Month</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.timeframeChip, timeframe === 'all' && styles.timeframeChipActive]}
              onPress={() => setTimeframe('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.timeframeText, timeframe === 'all' && styles.timeframeTextActive]}>All Time</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroSubtitle}>
                {RBAC.hasPermission(user?.role, RBAC.Permissions.VIEW_BILLS_TAB) ? activeHeroData.label : "OPERATIONS OVERVIEW"}
              </Text>
              <Text style={styles.heroTitle}>
                {RBAC.hasPermission(user?.role, RBAC.Permissions.VIEW_BILLS_TAB) 
                  ? (loadingDashboard ? '...' : `₹${Number(activeHeroData.totalAmount).toLocaleString('en-IN')}`)
                  : "Tracking Live"}
              </Text>
            </View>
            <View style={styles.trendBadge}>
              <Activity size={12} color={Colors.success} />
              <Text style={styles.trendText}>Live Update</Text>
            </View>
          </View>
          
          <View style={styles.heroDivider} />
          
          <View style={styles.heroBottom}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>{activeHeroData.ordersLabel}</Text>
              <Text style={styles.heroStatText}>{loadingDashboard ? '...' : activeHeroData.ordersCount}</Text>
            </View>
            
            {RBAC.hasPermission(user?.role, RBAC.Permissions.VIEW_BILLS_TAB) ? (
              <>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>Collected</Text>
                  <Text style={styles.heroStatText}>₹{loadingDashboard ? '...' : Number(activeHeroData.collected).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>Pending</Text>
                  <Text style={styles.heroStatText}>₹{loadingDashboard ? '...' : Number(activeHeroData.pending).toLocaleString('en-IN')}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>On Duty</Text>
                  <Text style={styles.heroStatText}>{loadingDashboard ? '...' : stats?.activeOrders || 0}</Text>
                </View>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>Clients</Text>
                  <Text style={styles.heroStatText}>{loadingDashboard ? '...' : stats?.customers || 0}</Text>
                </View>
              </>
            )}
          </View>
        </LinearGradient>

        {/* Overview Stats */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {RBAC.hasPermission(user?.role, RBAC.Permissions.MANAGE_CUSTOMERS) && (
            <StatCard
              title="Total Customers"
              value={stats?.customers?.toString() || '0'}
              icon={Users}
              color={Colors.info}
              isLoading={loadingDashboard}
            />
          )}
          
          <StatCard
            title={RBAC.hasPermission(user?.role, RBAC.Permissions.MANAGE_MENU_STOCK) ? "Menu Items" : "Delivery Staff"}
            value={(stats?.menuItems || stats?.stock || 0).toString()}
            icon={ShoppingBag}
            color={Colors.success}
            isLoading={loadingDashboard}
          />

          {RBAC.hasPermission(user?.role, RBAC.Permissions.VIEW_BILLS_TAB) && (
            <StatCard
              title="Pending Bills"
              value={`₹${((stats?.outstanding || 0) / 1000).toFixed(1)}k`}
              icon={Wallet}
              color={Colors.error}
              subValue="Unpaid invoices"
              isLoading={loadingDashboard}
            />
          )}

          <StatCard
            title="Active Orders"
            value={stats?.activeOrders?.toString() || '0'}
            icon={Activity}
            color={Colors.warning}
            subValue="In progress"
            isLoading={loadingDashboard}
          />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {RBAC.hasPermission(user?.role, RBAC.Permissions.CREATE_ORDER) && (
            <QuickAction
              title="New Order"
              icon={ShoppingBag}
              color={Colors.primary}
              onPress={() => navigation.navigate('Orders', { screen: 'NewOrder' })}
            />
          )}
          {RBAC.hasPermission(user?.role, RBAC.Permissions.VIEW_BILLS_TAB) && (
            <QuickAction
              title="Create Bill"
              icon={ArrowUpRight}
              color={Colors.info}
              onPress={() => navigation.navigate('Bills')}
            />
          )}
          {RBAC.hasPermission(user?.role, RBAC.Permissions.MANAGE_EXPENSES) && (
            <QuickAction
              title="Add Expense"
              icon={TrendingUp}
              color={Colors.error}
              onPress={() => navigation.navigate('MoreStack', { screen: 'Expenses' })}
            />
          )}
          <QuickAction
            title="Stock"
            icon={Users}
            color={Colors.secondary}
            onPress={() => navigation.navigate('MoreStack', { screen: 'Stock' })}
          />
        </View>

        {/* Recent Orders Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')} activeOpacity={0.7}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {(recentOrders && recentOrders.length > 0) ? (
          recentOrders.map((order: any) => {
            const statusConfig: any = {
              'COMPLETED': { bg: Colors.successLight, text: Colors.success },
              'DELIVERED': { bg: Colors.successLight, text: Colors.success },
              'PENDING': { bg: Colors.warningLight, text: Colors.warning },
              'QUOTATION': { bg: Colors.infoLight, text: Colors.info },
              'IN PROGRESS': { bg: Colors.primaryLight, text: Colors.primaryDark },
              'IN_PROGRESS': { bg: Colors.primaryLight, text: Colors.primaryDark },
              'CANCELLED': { bg: Colors.errorLight, text: Colors.error },
            };
            const s = order.status?.toUpperCase() || 'PENDING';
            const st = statusConfig[s] || { bg: Colors.surfaceSubtle, text: Colors.textSecondary };

            return (
              <TouchableOpacity
                key={order.id || order._id || Math.random().toString()}
                style={[styles.orderItem, Shadows.small]}
                onPress={() => navigation.navigate('Orders', { screen: 'OrderDetail', params: { order } })}
                activeOpacity={0.7}
              >
                <View style={styles.orderInfo}>
                  <Text style={styles.customerName}>{order.customer?.name || 'Standard Order'}</Text>
                  <Text style={styles.orderMeta}>
                    {order.items?.length || 0} items · {order.address || 'Standard Delivery'}
                  </Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount}>₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.statusText, { color: st.text }]}>{order.status || 'Pending'}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation?.();
                        navigation.navigate('Orders', { screen: 'NewOrder', params: { orderToEdit: order } });
                      }}
                      style={styles.editIconBtn}
                      activeOpacity={0.7}
                    >
                      <Edit3 size={13} color={Colors.primaryDark} />
                    </TouchableOpacity>
                  </View>
                </View>
                <ChevronRight size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
            );
          })
        ) : !loadingDashboard ? (
          <View style={styles.emptyContainer}>
            <ShoppingBag size={32} color={Colors.border} />
            <Text style={styles.emptyText}>No recent orders recorded</Text>
          </View>
        ) : null}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 52,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: Radii.md,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  headerLogo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  greeting: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  heroCard: {
    borderRadius: Radii.xl,
    padding: 18,
    marginBottom: 24,
  },
  timeframeRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radii.pill,
    padding: 3,
    marginBottom: 14,
    gap: 4,
  },
  timeframeChip: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: Radii.pill,
  },
  timeframeChipActive: {
    backgroundColor: Colors.white,
  },
  timeframeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  timeframeTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.white,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  trendText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '700',
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(226, 232, 240, 0.1)',
    marginVertical: 14,
  },
  heroBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStatItem: {},
  heroStatLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  heroStatText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 48) / 2,
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subBadge: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  subBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  loader: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  orderItem: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  orderMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  editIconBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
});

export default HomeScreen;
