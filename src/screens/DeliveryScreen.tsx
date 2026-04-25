import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  FlatList,
  Alert,
  Linking,
} from 'react-native';
import {
  MapPin,
  Truck,
  Phone,
  Navigation,
  Package,
  ArrowLeft,
  User,
  CheckCircle2,
  X
} from 'lucide-react-native';
import { Colors, Shadows } from '../theme/colors';
import { useGetOrdersQuery } from '../services/orderApi';
import { useGetWorkforceQuery } from '../services/adminApi';
import { trackingService } from '../services/trackingService';
import { useAuth } from '../services/AuthContext';
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
  const { user } = useAuth();
  const isAdmin = user?.role === 'superadmin';

  const { data: orders = [], isLoading: isLoadingOrders, refetch: refetchOrders } = useGetOrdersQuery();
  const { data: workforce = [], isLoading: isLoadingWorkforce } = useGetWorkforceQuery();

  const [isTracking, setIsTracking] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);

  // Filter for transport workforce
  const transportDrivers = React.useMemo(() => {
    if (!Array.isArray(workforce)) return [];
    return workforce.filter((w: any) => w.role === 'transport' && w.isActive);
  }, [workforce]);

  const deliveryOrders = React.useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return orders.filter((o: any) =>
      o.status === 'OUT_FOR_DELIVERY' ||
      o.status === 'PREPARING' ||
      o.status === 'CONFIRMED'
    ).sort((a: any, b: any) => {
      if (a.status === 'OUT_FOR_DELIVERY' && b.status !== 'OUT_FOR_DELIVERY') return -1;
      if (a.status !== 'OUT_FOR_DELIVERY' && b.status === 'OUT_FOR_DELIVERY') return 1;
      return 0;
    });
  }, [orders]);

  const handleToggleTracking = async () => {
    if (!selectedDriver) {
      Alert.alert('Select Identity', 'Please select your driver profile to start tracking.');
      setShowDriverModal(true);
      return;
    }

    if (isTracking) {
      if (!isAdmin) {
        Alert.alert('Access Denied', 'Only main administrators can stop a live trip tracking session once it is initiated.');
        return;
      }
      // Stop Tracking
      await trackingService.stopTracking();
      setIsTracking(false);
    } else {
      // Start Tracking
      try {
        trackingService.setToken(selectedDriver.trackingToken);
        const res = await trackingService.startTracking();
        setIsTracking(true);
      } catch (err: any) {
        Alert.alert('Tracking Error', err.message || 'Failed to start GPS tracking.');
      }
    }
  };

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

      {/* Driver Cockpit */}
      <View style={styles.cockpitContainer}>
        <View style={styles.cockpitHeader}>
          <Text style={styles.cockpitTitle}>Driver Identity</Text>
          <TouchableOpacity onPress={() => setShowDriverModal(true)} style={styles.driverSelectBtn}>
            <User size={14} color={Colors.primary} />
            <Text style={styles.driverSelectText}>
              {selectedDriver ? selectedDriver.name : 'Select Driver'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.trackingBox}>
          <View style={styles.trackingStatus}>
            <View style={[styles.pulseDot, isTracking ? styles.pulseDotActive : {}]} />
            <Text style={styles.trackingStatusText}>
              {isTracking ? 'GPS Tracking Active' : 'Tracking Offline'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.trackToggleBtn, isTracking ? styles.trackToggleBtnStop : {}]}
            onPress={handleToggleTracking}
          >
            <Navigation size={18} color={isTracking ? Colors.error : Colors.white} />
            <Text style={[styles.trackToggleText, isTracking && { color: Colors.error }]}>
              {isTracking ? 'Stop' : 'Start'} Tracking
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Select Driver Modal */}
      <Modal visible={showDriverModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Profile</Text>
              <TouchableOpacity onPress={() => setShowDriverModal(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={transportDrivers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.driverItem, selectedDriver?.id === item.id && styles.driverItemActive]}
                  onPress={() => {
                    setSelectedDriver(item);
                    if (isTracking && selectedDriver?.id !== item.id) {
                      // Stop tracking if they switch profiles
                      trackingService.stopTracking();
                      setIsTracking(false);
                    }
                    setShowDriverModal(false);
                  }}
                >
                  <User size={20} color={selectedDriver?.id === item.id ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.driverName, selectedDriver?.id === item.id && { color: Colors.primary, fontWeight: '700' }]}>{item.name}</Text>
                  {selectedDriver?.id === item.id && <CheckCircle2 size={20} color={Colors.primary} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No transport profiles found.</Text>}
            />
          </View>
        </View>
      </Modal>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Active Queue</Text>
        <TouchableOpacity onPress={refetchOrders}>
          <Text style={styles.viewAll}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoadingOrders} onRefresh={refetchOrders} tintColor={Colors.primary} />
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
  },
  cockpitContainer: {
    margin: 20,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    ...Shadows.small,
  },
  cockpitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cockpitTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  driverSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  driverSelectText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  trackingBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 16,
  },
  trackingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.textTertiary,
  },
  pulseDotActive: {
    backgroundColor: Colors.success,
  },
  trackingStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  trackToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  trackToggleBtnStop: {
    backgroundColor: Colors.error + '15',
  },
  trackToggleText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    marginBottom: 10,
    gap: 12,
  },
  driverItemActive: {
    backgroundColor: Colors.primary + '15',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  driverName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 20,
  },
  mapCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 16,
    ...Shadows.medium,
  },
  mapCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.success,
    letterSpacing: 0.5,
  },
  coordText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: 'monospace',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navInfo: {
    flex: 1,
  },
  navCustomer: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  navAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  navOpenText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  mapOfflineCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  mapOfflineText: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
});


export default DeliveryScreen;
