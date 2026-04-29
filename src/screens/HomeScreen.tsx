import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  InteractionManager,
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
  Calendar,
  Wallet,
  Activity,
  AlertTriangle,
  Truck
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows } from '../theme/colors';
import Constants from 'expo-constants';
import { useGetMobileDashboardQuery } from '../services/dashboardApi';
import { apiSlice } from '../services/apiSlice';
import { useAuth } from '../services/AuthContext';
import * as RBAC from '../utils/rbac';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, icon: Icon, color, subValue, isLoading }: any) => (
  <View style={[styles.statCard, Shadows.small]}>
    <LinearGradient
      colors={[color + '20', color + '05']}
      style={styles.iconContainer}
    >
      <Icon size={20} color={color} />
    </LinearGradient>
    <View style={styles.statInfo}>
      <Text style={styles.statTitle}>{title}</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={color} style={{ alignSelf: 'flex-start', marginTop: 5 }} />
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
      {subValue && !isLoading && <Text style={styles.statSubValue}>{subValue}</Text>}
    </View>
  </View>
);

const QuickAction = ({ title, icon: Icon, color, onPress }: any) => (
  <TouchableOpacity
    style={[styles.quickAction, Shadows.small]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.actionIcon, { backgroundColor: color }]}>
      <Icon size={24} color={Colors.white} />
    </View>
    <Text style={styles.actionTitle}>{title}</Text>
  </TouchableOpacity>
);

const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const isAdmin = ['admin', 'superadmin'].includes(user?.role?.toLowerCase() || '');

  // High-performance single dashboard call
  const { 
    data, 
    isLoading, 
    isFetching, 
    error,
    refetch 
  } = useGetMobileDashboardQuery(undefined, {
    pollingInterval: 30000, // Refresh every 30 seconds
  });

  const onRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const stats = data?.stats;
  const recentOrders = data?.recentOrders || [];

  // SMART COUNTING: Improved date parsing
  const todayOrdersFromList = React.useMemo(() => {
    try {
      const today = new Date().toDateString();
      return recentOrders.filter((o: any) => {
        if (!o.createdAt) return false;
        const orderDate = new Date(o.createdAt).toDateString();
        return orderDate === today;
      }).length;
    } catch (e) {
      return 0;
    }
  }, [recentOrders]);

  const displayTodayOrders = (stats?.todayOrders && stats.todayOrders > 0) ? stats.todayOrders : todayOrdersFromList;

  // Debugging order visibility
  React.useEffect(() => {
    if (data) {
      console.log('📊 Dashboard Data Received:', {
        serverStatsCount: stats?.todayOrders,
        computedTodayCount: todayOrdersFromList,
        recentOrdersCount: recentOrders.length,
        userRole: user?.role
      });
    }
  }, [data, todayOrdersFromList, user]);

  if (isLoading && !data) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
         <ActivityIndicator size="large" color={Colors.primary} />
         <Text style={{ marginTop: 20, color: Colors.textSecondary }}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (error || (!isLoading && !data)) {
    const isAuthError = (error as any)?.status === 401;
    const status = (error as any)?.status;
    const errorMsg = (error as any)?.data?.error || (error as any)?.message || 'Check if server is live';
    
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 30 }]}>
         <AlertTriangle size={60} color={Colors.error} />
         <Text style={[styles.sectionTitle, { textAlign: 'center', marginTop: 20 }]}>
           {isAuthError ? 'Session Expired' : 'Server Connection Error'}
         </Text>
         <Text style={{ textAlign: 'center', color: Colors.textSecondary, marginTop: 10, marginBottom: 10 }}>
           {isAuthError 
             ? 'Your session has ended due to an environment switch.' 
             : `Technical Details: Status ${status}\n${errorMsg}`}
         </Text>
         <Text style={{ textAlign: 'center', color: Colors.textTertiary, fontSize: 10, marginBottom: 30 }}>
            URL: https://www.skccaterers.in/api/mobile/dashboard
         </Text>
         <TouchableOpacity 
            style={{ backgroundColor: Colors.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15 }} 
            onPress={isAuthError ? () => navigation.navigate('MoreStack') : onRefresh}
         >
            <Text style={{ color: Colors.white, fontWeight: '700' }}>
               {isAuthError ? 'Go to Login' : 'Try Again'}
            </Text>
         </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.username || 'Rohith'}</Text>
            <Text style={styles.subGreeting}>Here's what's happening today</Text>
          </View>
          <TouchableOpacity style={styles.logoButton} onPress={() => navigation.navigate('MoreStack')}>
            <Image source={LOGO} style={styles.headerLogo} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {/* Hero Section - Role Specific Summary */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, Shadows.medium]}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>
                {RBAC.hasPermission(user?.role, RBAC.Permissions.VIEW_BILLS_TAB) ? "Today's Sales" : "Active Logistics"}
              </Text>
              <Text style={styles.heroValue}>
                {RBAC.hasPermission(user?.role, RBAC.Permissions.VIEW_BILLS_TAB) 
                  ? (isLoading ? '...' : `₹${Number(stats?.todayTotalAmount || 0).toLocaleString('en-IN')}`)
                  : "Tracking Live"}
              </Text>
            </View>
            <View style={styles.trendBadge}>
              <Activity size={14} color={Colors.success} />
              <Text style={styles.trendText}>Live</Text>
            </View>
          </View>
          
          <View style={styles.heroDivider} />
          
          <View style={styles.heroBottom}>
            <View style={styles.heroStatItem}>
              <ShoppingBag size={12} color={Colors.white} style={{ opacity: 0.7 }} />
              <Text style={styles.heroStatLabel}>Today's Orders</Text>
              <Text style={styles.heroStatText}>{isLoading ? '...' : displayTodayOrders}</Text>
            </View>
            
            {RBAC.hasPermission(user?.role, RBAC.Permissions.VIEW_BILLS_TAB) ? (
              <>
                <View style={styles.heroStatItem}>
                  <Wallet size={12} color={Colors.white} style={{ opacity: 0.7 }} />
                  <Text style={styles.heroStatLabel}>Revenue</Text>
                  <Text style={styles.heroStatText}>₹{isLoading ? '...' : Number(stats?.todayRevenue || 0).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.heroStatItem}>
                  <Clock size={12} color={Colors.white} style={{ opacity: 0.7 }} />
                  <Text style={styles.heroStatLabel}>Pending</Text>
                  <Text style={styles.heroStatText}>₹{isLoading ? '...' : Number(stats?.todayPendingAmount || 0).toLocaleString('en-IN')}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.heroStatItem}>
                  <Truck size={12} color={Colors.white} style={{ opacity: 0.7 }} />
                  <Text style={styles.heroStatLabel}>On Duty</Text>
                  <Text style={styles.heroStatText}>{isLoading ? '...' : stats?.activeOrders || 0}</Text>
                </View>
                <View style={styles.heroStatItem}>
                  <Users size={12} color={Colors.white} style={{ opacity: 0.7 }} />
                  <Text style={styles.heroStatLabel}>Workforce</Text>
                  <Text style={styles.heroStatText}>{isLoading ? '...' : stats?.customers || 0}</Text>
                </View>
              </>
            )}
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Dashboard Overview</Text>
        <View style={styles.statsGrid}>
          {RBAC.hasPermission(user?.role, RBAC.Permissions.MANAGE_CUSTOMERS) && (
            <StatCard
              title="Total Customers"
              value={stats?.customers?.toString() || '0'}
              icon={Users}
              color={Colors.info}
              isLoading={isLoading}
            />
          )}
          
          <StatCard
            title={RBAC.hasPermission(user?.role, RBAC.Permissions.MANAGE_MENU_STOCK) ? "Menu Items" : "Delivery Personnel"}
            value={(stats?.menuItems || stats?.stock || 0).toString()}
            icon={ShoppingBag}
            color={Colors.success}
            isLoading={isLoading}
          />

          {RBAC.hasPermission(user?.role, RBAC.Permissions.VIEW_BILLS_TAB) && (
            <StatCard
              title="Outstanding Bills"
              value={`₹${((stats?.outstanding || 0) / 1000).toFixed(1)}k`}
              icon={Wallet}
              color={Colors.error}
              subValue="Pending payments"
              isLoading={isLoading}
            />
          )}

          <StatCard
            title="Active Operations"
            value={stats?.activeOrders?.toString() || '0'}
            icon={Activity}
            color={Colors.warning}
            subValue="Orders in progress"
            isLoading={isLoading}
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

        {/* Upcoming Orders Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders List - Displayed for everyone to ensure visibility */}
        {(recentOrders && recentOrders.length > 0) ? (
          recentOrders.map((order: any) => {
            const statusColors: any = {
              'COMPLETED': Colors.success,
              'DELIVERED': Colors.success,
              'PENDING': Colors.warning,
              'QUOTATION': Colors.info,
              'IN PROGRESS': Colors.primary,
              'IN_PROGRESS': Colors.primary,
              'CANCELLED': Colors.error,
            };
            const s = order.status?.toUpperCase() || 'PENDING';
            const statusColor = statusColors[s] || Colors.textSecondary;

            return (
              <TouchableOpacity
                key={order.id || order._id || Math.random().toString()}
                style={[styles.orderItem, Shadows.small]}
                onPress={() => navigation.navigate('Orders', { screen: 'OrderDetail', params: { order } })}
              >
                <View style={styles.orderInfo}>
                  <Text style={styles.customerName}>{order.customer?.name || 'Standard Order'}</Text>
                  <Text style={styles.orderMeta}>
                    {order.items?.length || 0} Items · {order.address || 'Delivery'}
                  </Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount}>₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{order.status || 'Pending'}</Text>
                  </View>
                </View>
                <ChevronRight size={18} color={Colors.textTertiary} style={styles.chevron} />
              </TouchableOpacity>
            );
          })
        ) : !isLoading ? (
          <View style={styles.emptyContainer}>
            <ShoppingBag size={40} color={Colors.textTertiary} opacity={0.5} />
            <Text style={styles.emptyText}>No recent orders yet</Text>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingTop: 75,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  subGreeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  logoButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
    padding: 6,
  },
  headerLogo: {
    width: '100%',
    height: '100%',
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  heroValue: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
    marginLeft: 4,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 20,
  },
  heroBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  heroStatItem: {
    flex: 1,
    gap: 4,
  },
  heroStatLabel: {
    fontSize: 10,
    color: Colors.white,
    opacity: 0.8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  heroStatText: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  viewAll: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statInfo: {},
  statTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  statSubValue: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  quickAction: {
    width: (width - 80) / 4,
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
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
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  orderMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  orderRight: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  orderAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 'auto',
  },
  emptyContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    borderStyle: 'dashed',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.textTertiary,
    fontWeight: '600',
  }
});

export default HomeScreen;
