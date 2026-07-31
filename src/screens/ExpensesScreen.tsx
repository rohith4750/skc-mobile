import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  Modal,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  X,
  Calendar as CalendarIcon,
  Tag,
  User,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Clock,
  Layers,
  ChevronDown,
  Users,
  Utensils,
  Truck,
  Flame,
  Store,
  Package,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Shadows, Radii } from '../theme/colors';
import { useToast } from '../components/Toast';
import { 
  useGetExpensesQuery, 
  useCreateExpenseMutation, 
  useUpdateExpenseMutation, 
  useDeleteExpenseMutation 
} from '../services/adminApi';
import { useGetOrdersQuery } from '../services/orderApi';

const EXPENSE_CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'supervisor', label: '👥 Supervisor' },
  { id: 'chef', label: '🍳 Chef' },
  { id: 'labours', label: '👷 Labours' },
  { id: 'boys', label: '👦 Boys' },
  { id: 'transport', label: '🚚 Transport' },
  { id: 'gas', label: '🔥 Gas & Fuel' },
  { id: 'pan', label: '🍃 Pan' },
  { id: 'store', label: '🏪 Store' },
  { id: 'other', label: '📦 Other' },
];

const getCategoryIcon = (category: string) => {
  const cat = String(category || '').toLowerCase();
  if (cat.includes('supervisor')) return <Users size={12} color={Colors.primaryDark} />;
  if (cat.includes('chef')) return <Utensils size={12} color={Colors.primaryDark} />;
  if (cat.includes('transport')) return <Truck size={12} color={Colors.primaryDark} />;
  if (cat.includes('gas')) return <Flame size={12} color={Colors.primaryDark} />;
  if (cat.includes('store')) return <Store size={12} color={Colors.primaryDark} />;
  return <Package size={12} color={Colors.primaryDark} />;
};

const ExpensesScreen = ({ route, navigation }: any) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('all');
  const [showOrderFilterModal, setShowOrderFilterModal] = useState(false);

  // Queries & Mutations
  const { 
    data: expenses = [], 
    isLoading: loadingExpenses, 
    isFetching, 
    refetch 
  } = useGetExpensesQuery(undefined, { refetchOnMountOrArgChange: true });

  const { data: orders = [] } = useGetOrdersQuery();

  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation();
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();

  // Modal Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [formOrderId, setFormOrderId] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('supervisor');
  const [formRecipient, setFormRecipient] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formPaidAmount, setFormPaidAmount] = useState<string>('');
  const [formPaymentStatus, setFormPaymentStatus] = useState<'paid' | 'pending' | 'partial'>('paid');
  const [formPaymentDate, setFormPaymentDate] = useState<Date>(new Date());
  const [formDescription, setFormDescription] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Handle route params on mount / navigation (e.g. from OrderDetailScreen)
  useEffect(() => {
    if (route.params?.initialOrderId) {
      setSelectedOrderId(route.params.initialOrderId);
    }
    if (route.params?.openAddModal) {
      openAddModal(route.params.initialOrderId || '');
    }
  }, [route.params]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const openAddModal = (orderId: string = '') => {
    setEditingExpenseId(null);
    setFormOrderId(orderId);
    setFormCategory('supervisor');
    setFormRecipient('');
    setFormAmount('');
    setFormPaidAmount('');
    setFormPaymentStatus('paid');
    setFormPaymentDate(new Date());
    setFormDescription('');
    setModalVisible(true);
  };

  const openEditModal = (expense: any) => {
    setEditingExpenseId(expense.id || expense._id);
    setFormOrderId(expense.orderId || expense.order?.id || '');
    setFormCategory(expense.category || 'other');
    setFormRecipient(expense.recipient || '');
    setFormAmount(expense.amount ? String(expense.amount) : '');
    setFormPaidAmount(expense.paidAmount !== undefined ? String(expense.paidAmount) : String(expense.amount || ''));
    setFormPaymentStatus(expense.paymentStatus || 'paid');
    setFormPaymentDate(expense.paymentDate ? new Date(expense.paymentDate) : new Date());
    setFormDescription(expense.description || expense.notes || '');
    setModalVisible(true);
  };

  const handleSaveExpense = async () => {
    if (!formAmount.trim() || isNaN(Number(formAmount)) || Number(formAmount) <= 0) {
      Alert.alert('Required', 'Please enter a valid expense amount');
      return;
    }

    try {
      const payload: any = {
        category: formCategory,
        recipient: formRecipient.trim() || undefined,
        amount: parseFloat(formAmount),
        paidAmount: formPaidAmount.trim() ? parseFloat(formPaidAmount) : parseFloat(formAmount),
        paymentStatus: formPaymentStatus,
        paymentDate: formPaymentDate.toISOString(),
        description: formDescription.trim() || undefined,
      };

      if (formOrderId) {
        payload.orderId = formOrderId;
      }

      if (editingExpenseId) {
        await updateExpense({ id: editingExpenseId, ...payload }).unwrap();
        showToast('Expense updated successfully!', 'success');
      } else {
        await createExpense(payload).unwrap();
        showToast('Expense recorded successfully!', 'success');
      }

      setModalVisible(false);
      refetch();
    } catch (err: any) {
      console.error('Failed to save expense:', err);
      Alert.alert('Error', err?.data?.error || err?.data?.message || 'Failed to save expense record');
    }
  };

  const handleDeleteExpense = (id: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(id).unwrap();
              showToast('Expense deleted successfully', 'success');
              refetch();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  // Filtered Expenses Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Category Filter
      if (selectedCategory !== 'all' && expense.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Order/Event Filter
      if (selectedOrderId !== 'all') {
        const expOrderId = expense.orderId || expense.order?.id || expense.order;
        if (expOrderId !== selectedOrderId) return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const desc = (expense.description || '').toLowerCase();
        const recip = (expense.recipient || '').toLowerCase();
        const cat = (expense.category || '').toLowerCase();
        const orderEvName = (expense.order?.eventName || '').toLowerCase();
        const orderCliName = (expense.order?.customer?.name || '').toLowerCase();
        return desc.includes(q) || recip.includes(q) || cat.includes(q) || orderEvName.includes(q) || orderCliName.includes(q);
      }
      return true;
    });
  }, [expenses, selectedCategory, selectedOrderId, searchQuery]);

  // Overall Metrics Calculation
  const stats = useMemo(() => {
    let totalSpent = 0;
    let totalPaid = 0;
    let totalPending = 0;

    filteredExpenses.forEach(exp => {
      const amt = Number(exp.amount) || 0;
      const pd = exp.paidAmount !== undefined ? Number(exp.paidAmount) : (exp.paymentStatus === 'paid' ? amt : 0);
      totalSpent += amt;
      totalPaid += pd;
      totalPending += Math.max(0, amt - pd);
    });

    return { totalSpent, totalPaid, totalPending, count: filteredExpenses.length };
  }, [filteredExpenses]);

  const selectedOrderObj = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId);
  }, [orders, selectedOrderId]);

  const renderExpenseItem = ({ item }: { item: any }) => {
    const expenseId = item.id || item._id;
    const amount = Number(item.amount) || 0;
    const paid = item.paidAmount !== undefined ? Number(item.paidAmount) : (item.paymentStatus === 'paid' ? amount : 0);
    const balance = Math.max(0, amount - paid);

    const linkedOrder = orders.find(o => o.id === (item.orderId || item.order?.id));
    const eventTitle = linkedOrder ? (linkedOrder.eventName || linkedOrder.customer?.name || `Order #${linkedOrder.id.slice(-4)}`) : (item.order?.eventName || null);

    return (
      <View style={[styles.expenseCard, Shadows.small]}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            {getCategoryIcon(item.category)}
            <Text style={styles.categoryText}>{String(item.category || 'OTHER').toUpperCase()}</Text>
          </View>

          <View style={styles.cardHeaderRight}>
            <Text style={styles.expenseDate}>
              {item.paymentDate ? new Date(item.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No date'}
            </Text>

            <TouchableOpacity 
              onPress={() => openEditModal(item)}
              style={styles.actionIconBtn}
              activeOpacity={0.7}
            >
              <Edit3 size={14} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleDeleteExpense(expenseId)}
              style={styles.actionIconBtn}
              activeOpacity={0.7}
            >
              <Trash2 size={14} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {eventTitle && (
          <View style={styles.eventBadgeRow}>
            <Layers size={11} color={Colors.primaryDark} />
            <Text style={styles.eventBadgeText} numberOfLines={1}>Event: {eventTitle}</Text>
          </View>
        )}

        <View style={styles.mainInfo}>
          <View style={styles.recipientRow}>
            <User size={13} color={Colors.textTertiary} />
            <Text style={styles.recipientName}>{item.recipient || 'Vendor / Staff'}</Text>
          </View>
          {item.description ? (
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>AMOUNT</Text>
            <Text style={styles.amountValue}>₹{amount.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.cardFooterRight}>
            {balance > 0 ? (
              <Text style={styles.dueText}>Due: ₹{balance.toLocaleString('en-IN')}</Text>
            ) : null}
            <View style={[
              styles.statusBadge, 
              { backgroundColor: item.paymentStatus === 'paid' ? Colors.successLight : item.paymentStatus === 'partial' ? Colors.warningLight : Colors.errorLight }
            ]}>
              <Text style={[
                styles.statusText, 
                { color: item.paymentStatus === 'paid' ? Colors.success : item.paymentStatus === 'partial' ? Colors.warning : Colors.error }
              ]}>
                {item.paymentStatus?.toUpperCase() || 'PAID'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity 
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Event Expenses</Text>
            <Text style={styles.subtitle}>{stats.count} expense records</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => openAddModal()}
            activeOpacity={0.8}
          >
            <Plus size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL SPENT</Text>
            <Text style={styles.statVal}>₹{stats.totalSpent.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>PAID</Text>
            <Text style={[styles.statVal, { color: Colors.success }]}>₹{stats.totalPaid.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>PENDING</Text>
            <Text style={[styles.statVal, { color: stats.totalPending > 0 ? Colors.error : Colors.textSecondary }]}>
              ₹{stats.totalPending.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Search & Event Filter Selector */}
        <View style={styles.filterBarRow}>
          <View style={styles.searchContainer}>
            <Search size={16} color={Colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search category, recipient..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textTertiary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <X size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.eventFilterBtn, selectedOrderId !== 'all' && styles.eventFilterBtnActive]}
            onPress={() => setShowOrderFilterModal(true)}
            activeOpacity={0.7}
          >
            <Layers size={14} color={selectedOrderId !== 'all' ? Colors.white : Colors.primaryDark} />
            <Text style={[styles.eventFilterBtnText, selectedOrderId !== 'all' && styles.eventFilterBtnTextActive]} numberOfLines={1}>
              {selectedOrderId === 'all' ? 'All Events' : (selectedOrderObj?.eventName || 'Selected Event')}
            </Text>
            <ChevronDown size={14} color={selectedOrderId !== 'all' ? Colors.white : Colors.primaryDark} />
          </TouchableOpacity>
        </View>

        {/* Category Scroll Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryScroll}
        >
          {EXPENSE_CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Expenses List */}
      {loadingExpenses ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 10, color: Colors.textSecondary, fontSize: 13 }}>Loading expense records...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredExpenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id || item._id || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isFetching} 
              onRefresh={onRefresh} 
              tintColor={Colors.primary} 
            />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <TrendingDown size={48} color={Colors.border} />
              <Text style={styles.emptyText}>No expense records found</Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => openAddModal()}
                activeOpacity={0.8}
              >
                <Plus size={16} color={Colors.white} style={{ marginRight: 6 }} />
                <Text style={styles.emptyAddBtnText}>Record First Expense</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* CREATE / EDIT EXPENSE MODAL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentContainer, Shadows.large]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {editingExpenseId ? 'Edit Expense Record' : 'Record New Expense'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              {/* Event / Order Attachment */}
              <Text style={styles.formInputLabel}>Attach to Event (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => setFormOrderId('')}
                  style={[styles.orderChip, !formOrderId && styles.orderChipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.orderChipText, !formOrderId && styles.orderChipTextActive]}>General (No Event)</Text>
                </TouchableOpacity>
                {orders.map(ord => {
                  const isSel = formOrderId === ord.id;
                  const label = ord.eventName || ord.customer?.name || `Order #${ord.id.slice(-4)}`;
                  return (
                    <TouchableOpacity
                      key={ord.id}
                      onPress={() => setFormOrderId(ord.id)}
                      style={[styles.orderChip, isSel && styles.orderChipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.orderChipText, isSel && styles.orderChipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Category Picker */}
              <Text style={styles.formInputLabel}>Expense Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
                {EXPENSE_CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                  const isSel = formCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setFormCategory(cat.id)}
                      style={[styles.categoryChip, isSel && styles.categoryChipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.categoryChipText, isSel && styles.categoryChipTextActive]}>{cat.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Recipient / Vendor Name */}
              <Text style={styles.formInputLabel}>Recipient / Vendor Name</Text>
              <TextInput
                style={styles.formInput}
                value={formRecipient}
                onChangeText={setFormRecipient}
                placeholder="e.g. Ramesh Supervisor / City Gas Depot"
                placeholderTextColor={Colors.textTertiary}
              />

              {/* Amount & Paid Amount */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formInputLabel}>Total Amount (₹) *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formAmount}
                    keyboardType="numeric"
                    onChangeText={(t) => {
                      setFormAmount(t);
                      if (!formPaidAmount || formPaidAmount === formAmount) {
                        setFormPaidAmount(t);
                      }
                    }}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formInputLabel}>Paid Amount (₹)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formPaidAmount}
                    keyboardType="numeric"
                    onChangeText={setFormPaidAmount}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
              </View>

              {/* Payment Status Buttons */}
              <Text style={styles.formInputLabel}>Payment Status</Text>
              <View style={styles.statusToggleRow}>
                <TouchableOpacity
                  style={[styles.statusToggleBtn, formPaymentStatus === 'paid' && styles.statusToggleBtnPaid]}
                  onPress={() => setFormPaymentStatus('paid')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.statusToggleText, formPaymentStatus === 'paid' && styles.statusToggleTextActive]}>Paid</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusToggleBtn, formPaymentStatus === 'partial' && styles.statusToggleBtnPartial]}
                  onPress={() => setFormPaymentStatus('partial')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.statusToggleText, formPaymentStatus === 'partial' && styles.statusToggleTextActive]}>Partial</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusToggleBtn, formPaymentStatus === 'pending' && styles.statusToggleBtnPending]}
                  onPress={() => setFormPaymentStatus('pending')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.statusToggleText, formPaymentStatus === 'pending' && styles.statusToggleTextActive]}>Pending</Text>
                </TouchableOpacity>
              </View>

              {/* Payment Date */}
              <Text style={styles.formInputLabel}>Expense Date</Text>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <CalendarIcon size={16} color={Colors.primary} />
                <Text style={styles.datePickerText}>{formPaymentDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formPaymentDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) setFormPaymentDate(date);
                  }}
                />
              )}

              {/* Description / Notes */}
              <Text style={styles.formInputLabel}>Description / Notes</Text>
              <TextInput
                style={[styles.formInput, { height: 70, textAlignVertical: 'top' }]}
                value={formDescription}
                multiline={true}
                onChangeText={setFormDescription}
                placeholder="Additional notes about this payment..."
                placeholderTextColor={Colors.textTertiary}
              />
            </ScrollView>

            <TouchableOpacity 
              style={[styles.formSubmitBtn, (isCreating || isUpdating) && { opacity: 0.6 }]}
              onPress={handleSaveExpense}
              disabled={isCreating || isUpdating}
              activeOpacity={0.8}
            >
              {isCreating || isUpdating ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.formSubmitText}>
                  {editingExpenseId ? 'Update Expense Record' : 'Save Expense Record'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EVENT FILTER SELECTION MODAL */}
      <Modal
        visible={showOrderFilterModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowOrderFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentContainer, Shadows.large]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Filter Expenses by Event</Text>
              <TouchableOpacity onPress={() => setShowOrderFilterModal(false)} activeOpacity={0.7}>
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }}>
              <TouchableOpacity
                style={[styles.orderFilterRow, selectedOrderId === 'all' && styles.orderFilterRowSelected]}
                onPress={() => {
                  setSelectedOrderId('all');
                  setShowOrderFilterModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.orderFilterText, selectedOrderId === 'all' && styles.orderFilterTextSelected]}>
                  🌐 All Expenses (Global View)
                </Text>
                {selectedOrderId === 'all' && <CheckCircle2 size={16} color={Colors.primary} />}
              </TouchableOpacity>

              {orders.map(ord => {
                const isSel = selectedOrderId === ord.id;
                return (
                  <TouchableOpacity
                    key={ord.id}
                    style={[styles.orderFilterRow, isSel && styles.orderFilterRowSelected]}
                    onPress={() => {
                      setSelectedOrderId(ord.id);
                      setShowOrderFilterModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.orderFilterText, isSel && styles.orderFilterTextSelected]}>
                        {ord.eventName || ord.customer?.name || 'Event'}
                      </Text>
                      <Text style={styles.orderFilterSubtext}>
                        Client: {ord.customer?.name || 'N/A'} • {ord.eventDate ? new Date(ord.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'No date'}
                      </Text>
                    </View>
                    {isSel && <CheckCircle2 size={16} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  header: {
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'ios' ? 48 : 42,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 12,
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
  addButton: {
    backgroundColor: Colors.primary,
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    marginHorizontal: 18,
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  filterBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    gap: 8,
    marginBottom: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    borderRadius: Radii.md,
    height: 38,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    marginLeft: 6,
  },
  eventFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    height: 38,
    borderRadius: Radii.md,
    maxWidth: 130,
  },
  eventFilterBtnActive: {
    backgroundColor: Colors.primary,
  },
  eventFilterBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  eventFilterBtnTextActive: {
    color: Colors.white,
  },
  categoryScroll: {
    paddingHorizontal: 18,
    gap: 6,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  listContent: {
    padding: 18,
    paddingBottom: 40,
  },
  expenseCard: {
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
    marginBottom: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expenseDate: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  actionIconBtn: {
    padding: 4,
  },
  eventBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  eventBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  mainInfo: {
    marginBottom: 8,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 8,
  },
  amountBox: {},
  amountLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 1,
  },
  cardFooterRight: {
    alignItems: 'flex-end',
  },
  dueText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 3,
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
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textTertiary,
    marginTop: 10,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.md,
    marginTop: 16,
    ...Shadows.small,
  },
  emptyAddBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalContentContainer: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 18,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  formInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: Colors.text,
    marginBottom: 10,
  },
  orderChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  orderChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  orderChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  statusToggleBtn: {
    flex: 1,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusToggleBtnPaid: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  statusToggleBtnPartial: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
  },
  statusToggleBtnPending: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  statusToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  statusToggleTextActive: {
    color: Colors.white,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    marginBottom: 10,
  },
  datePickerText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  formSubmitBtn: {
    backgroundColor: Colors.primary,
    height: 46,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    ...Shadows.small,
  },
  formSubmitText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  orderFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  orderFilterRowSelected: {
    backgroundColor: Colors.primaryLight + '40',
    paddingHorizontal: 8,
    borderRadius: Radii.md,
  },
  orderFilterText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  orderFilterTextSelected: {
    color: Colors.primaryDark,
  },
  orderFilterSubtext: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});

export default ExpensesScreen;
