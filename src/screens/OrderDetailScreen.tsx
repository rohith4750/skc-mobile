import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ArrowLeft, User, Phone, Calendar, Clock, Package, Share2, CheckCircle, Edit3, Trash2 } from 'lucide-react-native';
import { Colors, Shadows, Radii } from '../theme/colors';

import { useGetOrderByIdQuery, useUpdateOrderStatusMutation, useDeleteOrderMutation } from '../services/orderApi';
import { useToast } from '../components/Toast';
import { shareOrderPdf } from '../utils/pdfSharing';

const OrderDetailScreen = ({ route, navigation }: any) => {
  const { showToast } = useToast();
  const { order: initialOrder } = route.params;

  const { 
    data: order = initialOrder, 
    isLoading 
  } = useGetOrderByIdQuery(initialOrder.id);

  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation();

  const handleSharePress = useCallback(() => {
    const isQuotation = order.status?.toLowerCase() === 'quotation';
    Alert.alert(
      'Export Document',
      'Choose which document you would like to generate and share:',
      [
        {
          text: isQuotation ? 'Share Quotation PDF' : 'Share Bill PDF',
          onPress: () => shareOrderPdf(order, 'bill', isQuotation),
        },
        {
          text: 'Share Menu Details PDF',
          onPress: () => shareOrderPdf(order, 'menu', isQuotation),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }, [order]);

  const handleDeletePress = useCallback(() => {
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
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete order');
            }
          }
        }
      ]
    );
  }, [order, deleteOrder, navigation, showToast]);

  const handleStatusChange = useCallback(async (newStatus: string) => {
    try {
      await updateStatus({ id: order.id, status: newStatus }).unwrap();
      showToast(`Order status updated to ${newStatus.replace('_', ' ').toUpperCase()}`, 'success');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error?.data?.error || error?.data?.details || 'Failed to update order status');
    }
  }, [order.id, updateStatus, showToast]);

  const handleProcess = useCallback(() => {
    Alert.alert(
      'Update Order Status',
      'Select a new status for this order:',
      [
        { text: 'Pending', onPress: () => handleStatusChange('pending') },
        { text: 'In Progress', onPress: () => handleStatusChange('in_progress') },
        { text: 'Completed', onPress: () => handleStatusChange('completed') },
        { text: 'Quotation', onPress: () => handleStatusChange('quotation') },
        { text: 'Cancel Order', style: 'destructive', onPress: () => handleStatusChange('cancelled') },
        { text: 'Close', style: 'cancel' },
      ]
    );
  }, [handleStatusChange]);

  const getStatusConfig = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'COMPLETED':
      case 'DELIVERED': return { color: Colors.success, bg: Colors.successLight, label: 'COMPLETED' };
      case 'PENDING': return { color: Colors.warning, bg: Colors.warningLight, label: 'PENDING' };
      case 'QUOTATION': return { color: Colors.info, bg: Colors.infoLight, label: 'QUOTATION' };
      case 'IN_PROGRESS':
      case 'IN PROGRESS':
      case 'PREPARING': return { color: Colors.primaryDark, bg: Colors.primaryLight, label: 'IN PROGRESS' };
      case 'CANCELLED': return { color: Colors.error, bg: Colors.errorLight, label: 'CANCELLED' };
      default: return { color: Colors.textSecondary, bg: Colors.surfaceSubtle, label: status };
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
      <StatusBar barStyle="dark-content" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <SafeAreaView style={styles.safeHeader}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')} 
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order #{order.id.slice(-6).toUpperCase()}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('NewOrder', { orderToEdit: order })} 
                style={styles.editBtn} 
                activeOpacity={0.7}
              >
                <Edit3 size={16} color={Colors.primaryDark} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeletePress} style={styles.deleteBtn} activeOpacity={0.7}>
                <Trash2 size={16} color={Colors.error} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSharePress} style={styles.shareBtn} activeOpacity={0.7}>
                <Share2 size={16} color={Colors.primaryDark} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={[styles.statusCard, Shadows.small]}>
           <View style={styles.statusRow}>
              <View>
                <Text style={styles.statusCardLabel}>STATUS</Text>
                <Text style={[styles.statusCardValue, { color: status.color }]}>{status.label}</Text>
              </View>
              <View style={[styles.badgePill, { backgroundColor: status.bg }]}>
                 <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
              </View>
           </View>
           <View style={styles.timingRow}>
              <View style={styles.timingItem}>
                 <Calendar size={14} color={Colors.textTertiary} />
                 <Text style={styles.timingText}>{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
              </View>
              <View style={styles.timingItem}>
                 <Clock size={14} color={Colors.textTertiary} />
                 <Text style={styles.timingText}>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
           </View>
        </View>

        {/* Customer Card */}
        <View style={[styles.card, Shadows.small]}>
           <View style={styles.cardHeader}>
              <User size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>Customer Information</Text>
           </View>
           <View style={styles.divider} />
           
           <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>NAME</Text>
              <Text style={styles.detailValue}>{order.customer?.name || 'Walk-in Customer'}</Text>
           </View>
           
           <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>PHONE</Text>
              <Text style={styles.detailValue}>{order.customer?.phone || 'Not Provided'}</Text>
           </View>
        </View>

        {/* Items Card */}
        <View style={[styles.card, Shadows.small]}>
           <View style={styles.cardHeader}>
              <Package size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>Order Items</Text>
           </View>
           <View style={styles.divider} />
           
           {order.items?.map((item: any, index: number) => (
              <View key={index} style={styles.orderItem}>
                 <View style={styles.itemMain}>
                    <Text style={styles.itemName}>{item.menuItem?.name || item.name}</Text>
                    <Text style={styles.itemMeta}>{item.quantity} × ₹{item.price}</Text>
                 </View>
                 <Text style={styles.itemPrice}>₹{Number(item.quantity * item.price || 0).toLocaleString('en-IN')}</Text>
              </View>
           ))}

           <View style={styles.billBox}>
              <View style={styles.totalRow}>
                 <Text style={styles.totalLabel}>Grand Total</Text>
                 <Text style={styles.totalAmount}>₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</Text>
              </View>
           </View>
        </View>
      </ScrollView>

      {/* Footer Action */}
      <SafeAreaView style={styles.footer}>
        <TouchableOpacity 
          style={styles.updateButton} 
          onPress={handleProcess}
          disabled={isUpdating}
          activeOpacity={0.8}
        >
          {isUpdating ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <CheckCircle size={18} color={Colors.white} />
              <Text style={styles.updateText}>Update Order Status</Text>
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
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  safeHeader: {
    paddingTop: 48,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: Colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 100,
  },
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  statusCardValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  timingRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  timingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: 12,
  },
  detailGroup: {
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemMain: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  itemMeta: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  billBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  footer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 16,
  },
  updateButton: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: Radii.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Shadows.small,
  },
  updateText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default OrderDetailScreen;
