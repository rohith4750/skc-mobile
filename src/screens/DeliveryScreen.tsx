import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  FlatList,
  Alert,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
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
import { Colors, Shadows, Radii } from '../theme/colors';
import { useGetOrdersQuery } from '../services/orderApi';
import { useGetWorkforceQuery } from '../services/adminApi';
import { trackingService } from '../services/trackingService';
import { useAuth } from '../services/AuthContext';
import { Order } from '../types';

const DeliveryItem = ({ order }: { order: Order }) => {
  const status = order.status;
  const isOut = status === 'OUT_FOR_DELIVERY';

  return (
    <TouchableOpacity style={[styles.deliveryCard, Shadows.small]} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: isOut ? Colors.successLight : Colors.warningLight }]}>
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
            <Truck size={18} color={Colors.primary} />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.customerName}>{order.customer?.name || 'Customer'}</Text>
            <Text style={styles.orderLabel}>Order #{order.id.slice(-6).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <MapPin size={14} color={Colors.textTertiary} />
          <Text style={styles.locationText} numberOfLines={1}>{order.address || 'No address provided'}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
          <Phone size={15} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Call</Text>
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
          <Navigation size={15} color={Colors.primary} />
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
  const { data: workforce = [] } = useGetWorkforceQuery();

  const [isTracking, setIsTracking] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setCurrentLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  const handleOpenNavigation = (order: any) => {
    if (!order.address) {
      Alert.alert('No Address', 'This order does not have a delivery address.');
      return;
    }
    const encoded = encodeURIComponent(order.address);
    const url = `https://maps.google.com/?q=${encoded}`;
    Linking.openURL(url);
  };

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
        Alert.alert('Access Denied', 'Only main administrators can stop a live trip tracking session.');
        return;
      }
      await trackingService.stopTracking();
      setIsTracking(false);
    } else {
      try {
        trackingService.setToken(selectedDriver.trackingToken);
        await trackingService.startTracking();
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
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Delivery & Logistics</Text>
            <Text style={styles.subtitle}>{deliveryOrders.length} active delivery tasks</Text>
          </View>
        </View>
      </View>

      {/* Driver Cockpit */}
      <View style={[styles.cockpitContainer, Shadows.small]}>
        <View style={styles.cockpitHeader}>
          <Text style={styles.cockpitTitle}>Driver Profile</Text>
          <TouchableOpacity onPress={() => setShowDriverModal(true)} style={styles.driverSelectBtn} activeOpacity={0.7}>
            <User size={14} color={Colors.primaryDark} />
            <Text style={styles.driverSelectText}>
              {selectedDriver ? selectedDriver.name : 'Select Profile'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.trackingBox}>
          <View style={styles.trackingStatus}>
            <View style={[styles.pulseDot, isTracking ? styles.pulseDotActive : {}]} />
            <Text style={styles.trackingStatusText}>
              {isTracking ? 'GPS Tracking Live' : 'Tracking Offline'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.trackToggleBtn, isTracking ? styles.trackToggleBtnStop : {}]}
            onPress={handleToggleTracking}
            activeOpacity={0.8}
          >
            <Navigation size={16} color={isTracking ? Colors.error : Colors.white} />
            <Text style={[styles.trackToggleText, isTracking && { color: Colors.error }]}>
              {isTracking ? 'Stop' : 'Start'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Card */}
      {isTracking && currentLocation && (
        <View style={[styles.mapCard, Shadows.small]}>
          <View style={styles.mapCardHeader}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>GPS SESSION ACTIVE</Text>
            </View>
            <Text style={styles.coordText}>
              {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
            </Text>
          </View>
          {deliveryOrders.slice(0, 3).map(order => (
            <TouchableOpacity
              key={order.id}
              style={styles.navItem}
              onPress={() => handleOpenNavigation(order)}
              activeOpacity={0.7}
            >
              <View style={styles.navIconBox}>
                <Navigation size={14} color={Colors.primary} />
              </View>
              <View style={styles.navInfo}>
                <Text style={styles.navCustomer}>{order.customer?.name}</Text>
                <Text style={styles.navAddress} numberOfLines={1}>{order.address || 'No address'}</Text>
              </View>
              <Text style={styles.navOpenText}>Navigate ›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!isTracking && (
        <View style={styles.mapOfflineCard}>
          <Navigation size={24} color={Colors.textTertiary} />
          <Text style={styles.mapOfflineText}>Start tracking session to see live navigation routes</Text>
        </View>
      )}

      {/* Driver Modal */}
      <Modal visible={showDriverModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Driver</Text>
              <TouchableOpacity onPress={() => setShowDriverModal(false)}>
                <X size={20} color={Colors.textSecondary} />
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
                      trackingService.stopTracking();
                      setIsTracking(false);
                    }
                    setShowDriverModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <User size={18} color={selectedDriver?.id === item.id ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.driverName, selectedDriver?.id === item.id && { color: Colors.primaryDark, fontWeight: '700' }]}>{item.name}</Text>
                  {selectedDriver?.id === item.id && <CheckCircle2 size={18} color={Colors.primary} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No driver profiles available</Text>}
            />
          </View>
        </View>
      </Modal>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Active Queue</Text>
        <TouchableOpacity onPress={refetchOrders} activeOpacity={0.7}>
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
          <View style={styles.emptyBox}>
            <Package size={40} color={Colors.border} />
            <Text style={styles.emptyText}>No deliveries in queue</Text>
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
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  viewAll: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 18,
  },
  deliveryCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoText: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  orderLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  actionDivider: {
    width: 1,
    height: 18,
    backgroundColor: Colors.borderLight,
  },
  cockpitContainer: {
    margin: 18,
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cockpitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cockpitTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  driverSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    gap: 4,
  },
  driverSelectText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  trackingBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  trackingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textTertiary,
  },
  pulseDotActive: {
    backgroundColor: Colors.success,
  },
  trackingStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  trackToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.md,
    gap: 4,
  },
  trackToggleBtnStop: {
    backgroundColor: Colors.errorLight,
  },
  trackToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 20,
    maxHeight: '65%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  driverItemActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  driverName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textTertiary,
    marginTop: 16,
    fontSize: 13,
  },
  mapCard: {
    marginHorizontal: 18,
    marginBottom: 14,
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mapCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.success,
    letterSpacing: 0.5,
  },
  coordText: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  navIconBox: {
    width: 28,
    height: 28,
    borderRadius: Radii.sm,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navInfo: {
    flex: 1,
  },
  navCustomer: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  navAddress: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  navOpenText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  mapOfflineCard: {
    marginHorizontal: 18,
    marginBottom: 14,
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  mapOfflineText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
});

export default DeliveryScreen;
