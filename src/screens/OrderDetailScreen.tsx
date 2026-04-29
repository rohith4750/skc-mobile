import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { ArrowLeft, User, Phone, Calendar, Clock, MapPin, Receipt, CheckCircle, Package } from 'lucide-react-native';
import { Colors, Shadows } from '../theme/colors';

import { useGetOrderByIdQuery, useUpdateOrderStatusMutation } from '../services/orderApi';
import { ActivityIndicator, Alert } from 'react-native';

const OrderDetailScreen = ({ route, navigation }: any) => {
  const { order: initialOrder } = route.params;

  // Real-time fresh data
  const { 
    data: order = initialOrder, 
    isLoading 
  } = useGetOrderByIdQuery(initialOrder.id);

  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const handleProcess = useCallback(async () => {
    try {
      // Toggle logic or next-state logic
      const nextStatus = order.status === 'PENDING' ? 'CONFIRMED' : 
                        order.status === 'CONFIRMED' ? 'DELIVERED' : 'DELIVERED';
      
      await updateStatus({ id: order.id, status: nextStatus }).unwrap();
      Alert.alert('Success', `Order marked as ${nextStatus}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status');
    }
  }, [order, updateStatus]);

  const getStatusConfig = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'COMPLETED':
      case 'DELIVERED': return { color: '#2E7D32', bg: '#E8F5E9', label: 'COMPLETED' };
      case 'PENDING': return { color: '#E65100', bg: '#FFF3E0', label: 'PENDING' };
      case 'QUOTATION': return { color: '#1565C0', bg: '#E3F2FD', label: 'QUOTATION' };
      case 'IN_PROGRESS':
      case 'IN PROGRESS':
      case 'PREPARING': return { color: Colors.primary, bg: Colors.primary + '15', label: 'IN PROGRESS' };
      case 'CANCELLED': return { color: Colors.error, bg: Colors.error + '15', label: 'CANCELLED' };
      default: return { color: Colors.textSecondary, bg: '#F1F3F5', label: status };
    }
  };

  const status = getStatusConfig(order.status);

  if (isLoading && !order) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Hero Header */}
      <View style={styles.heroHeader}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')} 
              style={styles.iconButton}
            >
              <ArrowLeft size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.heroTitle}>ORDER DETAILS</Text>
            <TouchableOpacity style={styles.iconButton}>
              <Receipt size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.heroMain}>
             <Text style={styles.heroId}>#{order.id.slice(-8).toUpperCase()}</Text>
             <View style={[styles.heroBadge, { backgroundColor: status.bg }]}>
                <Text style={[styles.heroBadgeText, { color: status.color }]}>{status.label}</Text>
             </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Timing Section */}
        <View style={styles.timingRow}>
           <View style={styles.timingItem}>
              <Calendar size={18} color={Colors.primary} />
              <Text style={styles.timingText}>{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
           </View>
           <View style={styles.timingItem}>
              <Clock size={18} color={Colors.primary} />
              <Text style={styles.timingText}>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
           </View>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
           <View style={styles.cardHeader}>
              <User size={20} color={Colors.text} />
              <Text style={styles.cardTitle}>Customer Details</Text>
           </View>
           <View style={styles.divider} />
           
           <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>FULL NAME</Text>
              <Text style={styles.detailValue}>{order.customer?.name || 'Walk-in Customer'}</Text>
           </View>
           
           <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>MOBILE NUMBER</Text>
              <Text style={styles.detailValue}>{order.customer?.phone || 'Not Provided'}</Text>
           </View>
        </View>

        {/* Items Card */}
        <View style={styles.card}>
           <View style={styles.cardHeader}>
              <Package size={20} color={Colors.text} />
              <Text style={styles.cardTitle}>Order Summary</Text>
           </View>
           <View style={styles.divider} />
           
           {order.items?.map((item: any, index: number) => (
              <View key={index} style={styles.orderItem}>
                 <View style={styles.itemMain}>
                    <Text style={styles.itemName}>{item.menuItem?.name || item.name}</Text>
                    <Text style={styles.itemMeta}>{item.quantity} units @ ₹{item.price}</Text>
                 </View>
                 <Text style={styles.itemPrice}>₹{Number(item.quantity * item.price || 0).toLocaleString('en-IN')}</Text>
              </View>
           ))}

           <View style={styles.billBox}>
              <View style={styles.billRow}>
                 <Text style={styles.billLabel}>Order Subtotal</Text>
                 <Text style={styles.billAmount}>₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.totalRow}>
                 <Text style={styles.totalLabel}>TOTAL</Text>
                 <Text style={styles.totalAmount}>₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</Text>
              </View>
           </View>
        </View>
      </ScrollView>

      {/* Action Bar */}
      <SafeAreaView style={styles.footer}>
        <TouchableOpacity 
          style={[styles.updateButton, order.status === 'DELIVERED' && { backgroundColor: Colors.success }]} 
          onPress={handleProcess}
          disabled={isUpdating || order.status === 'DELIVERED'}
        >
          {isUpdating ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <CheckCircle size={22} color={Colors.white} />
              <Text style={styles.updateText}>
                {order.status === 'DELIVERED' ? 'COMPLETED' : 'Update Status'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  heroHeader: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingBottom: 30,
    ...Shadows.medium,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 75,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
  },
  heroMain: {
    alignItems: 'center',
    marginTop: 20,
  },
  heroId: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.white,
    marginBottom: 10,
  },
  heroBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 25,
    paddingBottom: 120,
  },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 20,
    marginBottom: 25,
    ...Shadows.small,
  },
  timingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timingText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 25,
    ...Shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 15,
  },
  itemMain: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  itemMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text,
  },
  billBox: {
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  billAmount: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#F3F4F6',
    borderStyle: 'dashed',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    ...Shadows.medium,
  },
  updateButton: {
    backgroundColor: Colors.primary,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  updateText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

export default OrderDetailScreen;
