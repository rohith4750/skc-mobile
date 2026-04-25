import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { 
  MapPin, 
  Truck, 
  ChevronRight,
  Phone,
  Navigation,
  Clock,
  Package,
  ArrowLeft
} from 'lucide-react-native';
import { Colors, Shadows } from '../theme/colors';
import Constants from 'expo-constants';
import { useGetOrdersQuery } from '../services/orderApi';
import { Order } from '../types';

const DeliveryItem = ({ order }: { order: Order }) => {
  const status = order.status;
  const isOut = status === 'OUT_FOR_DELIVERY';
  
  return (
    <TouchableOpacity style={[styles.deliveryCard, Shadows.small]}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: isOut ? Colors.success + '15' : Colors.warning + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: isOut ? Colors.success : Colors.warning }]} />
          <Text style={[styles.statusText, { color: isOut ? Colors.success : Colors.warning }]}>
            {status === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : status}
          </Text>
        </View>
        <Text style={styles.timeText}>{order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <View style={styles.iconBox}>
            <Truck size={20} color={Colors.primary} />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.customerName}>{order.customer?.name || 'Customer'}</Text>
            <Text style={styles.orderLabel}>Order #{order.id.slice(-6).toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.locationRow}>
          <MapPin size={16} color={Colors.textTertiary} />
          <Text style={styles.locationText} numberOfLines={1}>{order.address || 'No address provided'}</Text>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Phone size={16} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Call</Text>
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        <TouchableOpacity style={styles.actionButton}>
          <Navigation size={16} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Route</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const DeliveryScreen = ({ navigation }: any) => {
  const { data: orders = [], isLoading, refetch } = useGetOrdersQuery();

  const deliveryOrders = React.useMemo(() => {
    return orders.filter(o => 
      o.status === 'OUT_FOR_DELIVERY' || 
      o.status === 'PREPARING' || 
      o.status === 'CONFIRMED'
    ).sort((a, b) => {
      // Prioritize Out for Delivery
      if (a.status === 'OUT_FOR_DELIVERY' && b.status !== 'OUT_FOR_DELIVERY') return -1;
      if (a.status !== 'OUT_FOR_DELIVERY' && b.status === 'OUT_FOR_DELIVERY') return 1;
      return 0;
    });
  }, [orders]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity 
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
            style={styles.backBtn}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Logistics</Text>
            <Text style={styles.subtitle}>{deliveryOrders.length} active operations</Text>
          </View>
        </View>
      </View>

      <View style={styles.mapPlaceholder}>
         {/* In a real app, this would be a MapView */}
         <View style={styles.mapInner}>
            <Navigation size={48} color={Colors.primary + '40'} />
            <Text style={styles.mapText}>Live Map Visualization</Text>
            <TouchableOpacity style={[styles.mapButton, Shadows.small]}>
                <Text style={styles.mapButtonText}>Enlarge Map</Text>
            </TouchableOpacity>
         </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Active Queue</Text>
        <TouchableOpacity onPress={refetch}>
            <Text style={styles.viewAll}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />
        }
      >
        {deliveryOrders.length > 0 ? (
          deliveryOrders.map(order => (
            <DeliveryItem key={order.id} order={order} />
          ))
        ) : (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Package size={48} color={Colors.textTertiary} opacity={0.5} />
            <Text style={{ marginTop: 10, color: Colors.textSecondary }}>No deliveries in progress</Text>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 75,
    backgroundColor: Colors.white,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  mapPlaceholder: {
    height: 200,
    margin: 20,
    borderRadius: 24,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.small,
  },
  mapInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary + '05',
  },
  mapText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  mapButton: {
    marginTop: 15,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mapButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  viewAll: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  deliveryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  cardBody: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {},
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  orderLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 12,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  actionDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  }
});

export default DeliveryScreen;
