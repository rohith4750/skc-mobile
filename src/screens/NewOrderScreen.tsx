import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
  FlatList,
  StatusBar
} from 'react-native';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Plus, 
  X, 
  Calendar, 
  Clock, 
  Trash2, 
  Search, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Utensils, 
  Truck, 
  Percent, 
  CheckCircle2,
  DollarSign,
  Info
} from 'lucide-react-native';
import { Colors, Shadows } from '../theme/colors';
import { useToast } from '../components/Toast';
import { useGetCustomersQuery, useCreateCustomerMutation } from '../services/customerApi';
import { useGetMenuQuery } from '../services/menuApi';
import { useCreateOrderMutation } from '../services/orderApi';

const PAYMENT_METHODS = [
  { label: 'Cash', value: 'cash' },
  { label: 'UPI', value: 'upi' },
  { label: 'Card', value: 'card' },
  { label: 'Net Banking', value: 'bank_transfer' },
  { label: 'Other', value: 'other' }
];

const MENU_TYPES = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Hi-Tea', value: 'hi-tea' },
  { label: 'Snacks', value: 'snacks' },
  { label: 'Tiffin', value: 'tiffin' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Saree / Extra', value: 'saree' },
  { label: 'Session / Other', value: 'session' }
];

interface FormMealType {
  id: string;
  eventName: string;
  venue: string;
  menuType: string;
  selectedMenuItems: string[];
  pricingMethod: 'manual' | 'plate-based';
  numberOfPlates: string;
  platePrice: string;
  manualAmount: string;
  date: string;
  time: string;
  services: string[];
  numberOfMembers: string;
  itemCustomizations: Record<string, string>;
  itemQuantities: Record<string, string>;
  itemPrices: Record<string, string>;
  description: string;
}

interface FormStall {
  id: string;
  category: string;
  description: string;
  selectedMenuItems: string[];
  itemCustomizations: Record<string, string>;
  itemQuantities: Record<string, string>;
  pricingMethod: 'manual' | 'plate-based';
  numberOfPlates: string;
  platePrice: string;
  manualAmount: string;
  cost: string;
  numberOfMembers: string;
  eventName: string;
  venue: string;
  date: string;
  time: string;
  services: string[];
}

const NewOrderScreen = ({ navigation }: any) => {
  const { showToast } = useToast();
  
  // Queries & Mutations
  const { data: customers = [], isLoading: loadingCustomers } = useGetCustomersQuery();
  const { data: menuItems = [], isLoading: loadingMenu } = useGetMenuQuery();
  const [createCustomer, { isLoading: isSavingCustomer }] = useCreateCustomerMutation();
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [eventName, setEventName] = useState('');
  const [orderType, setOrderType] = useState<'EVENT' | 'LUNCH_PACK'>('EVENT');
  const [mealTypes, setMealTypes] = useState<FormMealType[]>([]);
  const [stalls, setStalls] = useState<FormStall[]>([]);
  const [showStalls, setShowStalls] = useState(false);
  const [discount, setDiscount] = useState('');
  const [transportCost, setTransportCost] = useState('');
  const [waterBottlesCost, setWaterBottlesCost] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer' | 'other'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // UI state
  const [expandedSection, setExpandedSection] = useState<'customer' | 'meals' | 'stalls' | 'financials' | null>('customer');
  const [expandedMealCards, setExpandedMealCards] = useState<Record<string, boolean>>({});
  const [expandedStallCards, setExpandedStallCards] = useState<Record<string, boolean>>({});
  
  // Search & Selector Modals
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCustomerModalVisible, setNewCustomerModalVisible] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', address: '' });

  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [activeMealIdForItemSelection, setActiveMealIdForItemSelection] = useState<string | null>(null);
  const [activeStallIdForItemSelection, setActiveStallIdForItemSelection] = useState<string | null>(null);

  // Auto-generate unique local IDs
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Initialize with one default meal session
  useEffect(() => {
    if (mealTypes.length === 0) {
      handleAddMealType();
    }
  }, []);

  // Filtered lists
  const filteredCustomersList = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const query = customerSearch.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(query) || c.phone.includes(query)
    );
  }, [customers, customerSearch]);

  const filteredMenuItemsList = useMemo(() => {
    const activeMenu = menuItems.filter(item => item.isActive);
    if (!itemSearch.trim()) return activeMenu;
    const query = itemSearch.toLowerCase();
    return activeMenu.filter(item => 
      item.name.toLowerCase().includes(query) || 
      (item.nameTelugu && item.nameTelugu.includes(query))
    );
  }, [menuItems, itemSearch]);

  const selectedCustomerObj = useMemo(() => {
    return customers.find(c => c.id === customerId);
  }, [customers, customerId]);

  // Pricing calculations
  const totals = useMemo(() => {
    let mealTypesTotal = 0;
    let waterTotal = 0;

    mealTypes.forEach(mt => {
      let mtTotal = 0;
      mt.selectedMenuItems.forEach(itemId => {
        const item = menuItems.find(m => m.id === itemId);
        if (item && item.price) {
          const qty = parseFloat(mt.itemQuantities[itemId] || '1');
          if (item.name.toLowerCase().includes('water') && item.name.toLowerCase().includes('bottle')) {
            waterTotal += item.price * qty;
          } else {
            mtTotal += item.price * qty;
          }
        }
      });

      if (mt.pricingMethod === 'plate-based') {
        const plates = parseFloat(mt.numberOfPlates) || parseFloat(mt.numberOfMembers) || 0;
        mtTotal += plates * (parseFloat(mt.platePrice) || 0);
      } else if (mt.menuType === 'saree') {
        const sareeTotal = mt.selectedMenuItems.reduce((sum, itemId) => {
          const price = parseFloat(mt.itemPrices[itemId] || '0') || 0;
          const qty = parseFloat(mt.itemQuantities[itemId] || '1') || 0;
          return sum + (price * qty);
        }, 0);
        mtTotal += sareeTotal;
      } else {
        mtTotal += parseFloat(mt.manualAmount) || 0;
      }
      mealTypesTotal += mtTotal;
    });

    const stallsTotal = showStalls ? stalls.reduce((sum, s) => {
      let sTotal = 0;
      if (s.pricingMethod === 'plate-based') {
        const plates = parseFloat(s.numberOfPlates) || parseFloat(s.numberOfMembers) || 0;
        sTotal = plates * (parseFloat(s.platePrice) || 0);
      } else {
        sTotal = parseFloat(s.manualAmount) || parseFloat(s.cost) || 0;
      }
      return sum + sTotal;
    }, 0) : 0;

    const transport = parseFloat(transportCost) || 0;
    const discountVal = parseFloat(discount) || 0;
    const waterBottles = waterTotal > 0 ? waterTotal : (parseFloat(waterBottlesCost) || 0);

    const total = Math.max(0, mealTypesTotal + transport + waterBottles + stallsTotal - discountVal);
    const advance = parseFloat(advancePaid) || 0;
    const balance = Math.max(0, total - advance);

    return { total, balance, waterTotal, stallsTotal, mealTypesTotal };
  }, [mealTypes, stalls, showStalls, transportCost, discount, waterBottlesCost, advancePaid, menuItems]);

  // Handlers for Meal Types
  const handleAddMealType = () => {
    const id = generateId();
    const newMeal: FormMealType = {
      id,
      eventName: '',
      venue: '',
      menuType: '',
      selectedMenuItems: [],
      pricingMethod: 'manual',
      numberOfPlates: '',
      platePrice: '',
      manualAmount: '',
      date: '',
      time: '',
      services: [],
      numberOfMembers: '',
      itemCustomizations: {},
      itemQuantities: {},
      itemPrices: {},
      description: ''
    };
    setMealTypes(prev => [...prev, newMeal]);
    setExpandedMealCards(prev => ({ ...prev, [id]: true }));
  };

  const handleRemoveMealType = (id: string) => {
    if (mealTypes.length === 1) {
      showToast('You must have at least one meal session', 'error');
      return;
    }
    Alert.alert('Remove Session', 'Are you sure you want to delete this session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
          setMealTypes(prev => prev.filter(mt => mt.id !== id));
      }}
    ]);
  };

  const handleUpdateMealField = (id: string, field: keyof FormMealType, value: any) => {
    setMealTypes(prev => prev.map(mt => {
      if (mt.id === id) {
        const updated = { ...mt, [field]: value } as FormMealType;
        if (field === 'numberOfMembers' && mt.pricingMethod === 'plate-based') {
          updated.numberOfPlates = value;
        }
        if (field === 'pricingMethod' && value === 'plate-based') {
          updated.numberOfPlates = mt.numberOfMembers;
        }
        return updated;
      }
      return mt;
    }));
  };

  const handleSelectCommonItems = (mealId: string) => {
    const commonItems = menuItems.filter(item => {
      const isCommonFlag = item.isCommon === true;
      const nameMatch = item.name.toLowerCase().includes('common');
      return isCommonFlag || nameMatch;
    });

    if (commonItems.length === 0) {
      showToast('No common items found in database', 'error');
      return;
    }

    setMealTypes(prev => prev.map(mt => {
      if (mt.id === mealId) {
        const newIds = Array.from(new Set([...mt.selectedMenuItems, ...commonItems.map(i => i.id)]));
        const newQuantities = { ...mt.itemQuantities };
        const newCustomizations = { ...mt.itemCustomizations };

        commonItems.forEach(item => {
          if (!newQuantities[item.id]) newQuantities[item.id] = '1';
          if (!newCustomizations[item.id] && item.description) {
            newCustomizations[item.id] = item.description;
          }
        });

        return {
          ...mt,
          selectedMenuItems: newIds,
          itemQuantities: newQuantities,
          itemCustomizations: newCustomizations
        };
      }
      return mt;
    }));
    showToast('Common items added to session', 'success');
  };

  // Handlers for Stalls
  const handleAddStall = () => {
    const id = generateId();
    const newStall: FormStall = {
      id,
      category: '',
      description: '',
      selectedMenuItems: [],
      itemCustomizations: {},
      itemQuantities: {},
      pricingMethod: 'manual',
      numberOfPlates: '',
      platePrice: '',
      manualAmount: '',
      cost: '',
      numberOfMembers: '',
      eventName: '',
      venue: '',
      date: '',
      time: '',
      services: []
    };
    setStalls(prev => [...prev, newStall]);
    setExpandedStallCards(prev => ({ ...prev, [id]: true }));
    setShowStalls(true);
  };

  const handleRemoveStall = (id: string) => {
    setStalls(prev => prev.filter(s => s.id !== id));
    if (stalls.length <= 1) setShowStalls(false);
  };

  const handleUpdateStallField = (id: string, field: keyof FormStall, value: any) => {
    setStalls(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, [field]: value } as FormStall;
        if (field === 'numberOfMembers' && s.pricingMethod === 'plate-based') {
          updated.numberOfPlates = value;
        }
        if (field === 'pricingMethod' && value === 'plate-based') {
          updated.numberOfPlates = s.numberOfMembers;
        }
        return updated;
      }
      return s;
    }));
  };

  // Item Modal Handlers
  const openItemSelector = (mealId: string | null, stallId: string | null) => {
    setActiveMealIdForItemSelection(mealId);
    setActiveStallIdForItemSelection(stallId);
    setItemSearch('');
    setItemModalVisible(true);
  };

  const handleToggleItem = (itemId: string) => {
    if (activeMealIdForItemSelection) {
      setMealTypes(prev => prev.map(mt => {
        if (mt.id === activeMealIdForItemSelection) {
          const isSelected = mt.selectedMenuItems.includes(itemId);
          const newIds = isSelected 
            ? mt.selectedMenuItems.filter(id => id !== itemId)
            : [...mt.selectedMenuItems, itemId];
          
          const newQuantities = { ...mt.itemQuantities };
          const newCustomizations = { ...mt.itemCustomizations };
          const newPrices = { ...mt.itemPrices };

          if (!isSelected) {
            newQuantities[itemId] = '1';
            newPrices[itemId] = '';
            const item = menuItems.find(i => i.id === itemId);
            if (item?.description) {
              newCustomizations[itemId] = item.description;
            }
          } else {
            delete newQuantities[itemId];
            delete newCustomizations[itemId];
            delete newPrices[itemId];
          }

          return {
            ...mt,
            selectedMenuItems: newIds,
            itemQuantities: newQuantities,
            itemCustomizations: newCustomizations,
            itemPrices: newPrices
          };
        }
        return mt;
      }));
    } else if (activeStallIdForItemSelection) {
      setStalls(prev => prev.map(st => {
        if (st.id === activeStallIdForItemSelection) {
          const isSelected = st.selectedMenuItems.includes(itemId);
          const newIds = isSelected 
            ? st.selectedMenuItems.filter(id => id !== itemId)
            : [...st.selectedMenuItems, itemId];
          
          const newQuantities = { ...st.itemQuantities };
          const newCustomizations = { ...st.itemCustomizations };

          if (!isSelected) {
            newQuantities[itemId] = '1';
            const item = menuItems.find(i => i.id === itemId);
            if (item?.description) {
              newCustomizations[itemId] = item.description;
            }
          } else {
            delete newQuantities[itemId];
            delete newCustomizations[itemId];
          }

          return {
            ...st,
            selectedMenuItems: newIds,
            itemQuantities: newQuantities,
            itemCustomizations: newCustomizations
          };
        }
        return st;
      }));
    }
  };

  // Quick Customer Creation
  const handleSaveCustomer = async () => {
    if (!newCustomerForm.name.trim() || !newCustomerForm.phone.trim() || !newCustomerForm.address.trim()) {
      Alert.alert('Validation Error', 'Name, Phone and Address are required.');
      return;
    }
    try {
      const result = await createCustomer(newCustomerForm).unwrap();
      setCustomerId(result.id);
      setNewCustomerModalVisible(false);
      setNewCustomerForm({ name: '', phone: '', address: '' });
      showToast('Customer created and selected!', 'success');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create customer');
    }
  };

  // Submit Order Creation
  const handleSubmit = async () => {
    if (!customerId) {
      Alert.alert('Validation Error', 'Please select a customer.');
      return;
    }
    if (!eventName.trim()) {
      Alert.alert('Validation Error', 'Please enter an event/order name.');
      return;
    }
    if (mealTypes.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one meal session.');
      return;
    }

    // Sessions Validation
    for (let i = 0; i < mealTypes.length; i++) {
      const mt = mealTypes[i];
      if (!mt.menuType) {
        Alert.alert('Validation Error', `Please select a session type for Session #${i + 1}`);
        return;
      }
      if (mt.selectedMenuItems.length === 0) {
        Alert.alert('Validation Error', `Please select at least one item for session: ${mt.menuType}`);
        return;
      }
      if (!mt.date) {
        Alert.alert('Validation Error', `Please provide a date (YYYY-MM-DD) for session: ${mt.menuType}`);
        return;
      }
    }

    try {
      // Build API Payload
      const mealTypeAmountsPayload: Record<string, any> = {};
      mealTypes.forEach(mt => {
        mealTypeAmountsPayload[mt.id] = {
          menuType: mt.menuType,
          amount: mt.pricingMethod === 'plate-based'
            ? (parseFloat(mt.numberOfPlates) || parseFloat(mt.numberOfMembers) || 0) * (parseFloat(mt.platePrice) || 0)
            : parseFloat(mt.manualAmount) || 0,
          date: mt.date,
          time: mt.time,
          venue: mt.venue,
          services: mt.services,
          numberOfMembers: parseInt(mt.numberOfMembers) || 0,
          pricingMethod: mt.pricingMethod,
          numberOfPlates: parseFloat(mt.numberOfPlates) || 0,
          platePrice: parseFloat(mt.platePrice) || 0,
          manualAmount: parseFloat(mt.manualAmount) || 0,
          eventName: mt.eventName || eventName,
          description: mt.description,
          itemPrices: mt.menuType === 'saree' ? Object.fromEntries(
            Object.entries(mt.itemPrices).map(([k, v]) => [k, parseFloat(v) || 0])
          ) : undefined
        };
      });

      const orderItems = mealTypes.flatMap(mt =>
        mt.selectedMenuItems.map(menuItemId => ({
          menuItemId,
          quantity: parseFloat(mt.itemQuantities[menuItemId] || '1'),
          mealType: mt.id,
          customization: mt.itemCustomizations[menuItemId] || null,
          price: mt.menuType === 'saree' ? parseFloat(mt.itemPrices[menuItemId]) || 0 : undefined
        }))
      );

      const stallItems = stalls.flatMap(s =>
        s.selectedMenuItems.map(menuItemId => ({
          menuItemId,
          quantity: parseFloat(s.itemQuantities[menuItemId] || '1'),
          mealType: s.id,
          customization: s.itemCustomizations[menuItemId] || null
        }))
      );

      const stallsPayload = stalls.map(s => ({
        id: s.id,
        category: s.category,
        description: s.description,
        selectedMenuItems: s.selectedMenuItems,
        itemCustomizations: s.itemCustomizations,
        itemQuantities: s.itemQuantities,
        pricingMethod: s.pricingMethod,
        numberOfPlates: parseFloat(s.numberOfPlates) || 0,
        platePrice: parseFloat(s.platePrice) || 0,
        manualAmount: parseFloat(s.manualAmount) || 0,
        cost: s.pricingMethod === 'plate-based'
          ? (parseFloat(s.numberOfPlates) || 0) * (parseFloat(s.platePrice) || 0)
          : parseFloat(s.manualAmount) || 0,
        numberOfMembers: parseInt(s.numberOfMembers) || 0,
        eventName: s.eventName || eventName,
        venue: s.venue,
        date: s.date,
        time: s.time,
        services: s.services
      }));

      // Find the earliest date to set as order date
      const sortedDates = mealTypes
        .map(mt => mt.date)
        .filter(Boolean)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      
      const primaryDate = sortedDates[0] || new Date().toISOString().split('T')[0];

      const payload = {
        customerId,
        eventName,
        orderType,
        items: [...orderItems, ...stallItems],
        totalAmount: totals.total,
        advancePaid: parseFloat(advancePaid) || 0,
        remainingAmount: totals.balance,
        status: 'pending', // Starts as pending quotation
        mealTypeAmounts: mealTypeAmountsPayload,
        stalls: stallsPayload,
        transportCost: parseFloat(transportCost) || 0,
        waterBottlesCost: parseFloat(waterBottlesCost) || 0,
        discount: parseFloat(discount) || 0,
        paymentMethod,
        additionalPayment: parseFloat(advancePaid) || 0,
        internalNote: paymentNotes,
        eventDate: primaryDate
      };

      await createOrder(payload).unwrap();
      showToast('Order created successfully!', 'success');
      navigation.goBack();
    } catch (err: any) {
      console.error('Error creating order:', err);
      const errMsg = err?.data?.error || 'Failed to submit order. Check details.';
      Alert.alert('Submission Error', errMsg);
    }
  };

  const renderSectionHeader = (title: string, sectionKey: 'customer' | 'meals' | 'stalls' | 'financials', isCompleted: boolean) => {
    const isExpanded = expandedSection === sectionKey;
    return (
      <TouchableOpacity 
        style={[styles.sectionHeader, isExpanded && styles.sectionHeaderExpanded]} 
        onPress={() => setExpandedSection(isExpanded ? null : sectionKey)}
        activeOpacity={0.8}
      >
        <View style={styles.headerTitleRow}>
          <View style={[styles.statusIndicator, { backgroundColor: isCompleted ? Colors.success : Colors.border }]}>
            {isCompleted ? <CheckCircle2 size={14} color={Colors.white} /> : <Text style={styles.indicatorNumber}>{sectionKey === 'customer' ? '1' : sectionKey === 'meals' ? '2' : sectionKey === 'stalls' ? '3' : '4'}</Text>}
          </View>
          <Text style={styles.sectionTitleText}>{title}</Text>
        </View>
        {isExpanded ? <ChevronUp size={20} color={Colors.textSecondary} /> : <ChevronDown size={20} color={Colors.textSecondary} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Screen Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.screenTitle}>Create Order</Text>
            <Text style={styles.screenSubtitle}>Add a new booking or quotation</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Section 1: Customer Details */}
          <View style={styles.accordionContainer}>
            {renderSectionHeader('Customer & Event Details', 'customer', !!customerId && !!eventName.trim())}
            {expandedSection === 'customer' && (
              <View style={styles.accordionBody}>
                {/* Customer Picker */}
                <Text style={styles.inputLabel}>Select Customer *</Text>
                <View style={styles.customerSelectorRow}>
                  <TouchableOpacity 
                    style={styles.customerSelectorBtn}
                    onPress={() => setCustomerModalVisible(true)}
                  >
                    <User size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                    <Text style={[styles.customerSelectorText, !selectedCustomerObj && { color: Colors.textTertiary }]}>
                      {selectedCustomerObj ? `${selectedCustomerObj.name} (${selectedCustomerObj.phone})` : 'Search & Select Customer...'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickAddBtn}
                    onPress={() => setNewCustomerModalVisible(true)}
                  >
                    <Plus size={20} color={Colors.white} />
                  </TouchableOpacity>
                </View>

                {selectedCustomerObj && (
                  <View style={styles.customerInfoCard}>
                    <MapPin size={14} color={Colors.textSecondary} style={{ marginTop: 2, marginRight: 6 }} />
                    <Text style={styles.customerAddressText}>{selectedCustomerObj.address || 'No address provided'}</Text>
                  </View>
                )}

                {/* Event Name */}
                <Text style={styles.inputLabel}>Event / Order Name *</Text>
                <View style={styles.textInputContainer}>
                  <Utensils size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                  <TextInput 
                    style={styles.textInput}
                    value={eventName}
                    onChangeText={setEventName}
                    placeholder="e.g. Rohith Marriage Ceremony"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>

                {/* Order Type Toggle */}
                <View style={styles.typeToggleRow}>
                  <Text style={styles.typeToggleLabel}>Order Type</Text>
                  <View style={styles.typeSelector}>
                    <TouchableOpacity 
                      style={[styles.typeBtn, orderType === 'EVENT' && styles.typeBtnActive]}
                      onPress={() => setEventName(eventName)}
                    >
                      <Text style={[styles.typeBtnText, orderType === 'EVENT' && styles.typeBtnTextActive]}>Event Catering</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Section 2: Meal Sessions */}
          <View style={styles.accordionContainer}>
            {renderSectionHeader('Meal Sessions', 'meals', mealTypes.length > 0 && mealTypes.every(mt => !!mt.menuType && mt.selectedMenuItems.length > 0))}
            {expandedSection === 'meals' && (
              <View style={styles.accordionBody}>
                {mealTypes.map((mt, index) => {
                  const isCardExpanded = expandedMealCards[mt.id];
                  return (
                    <View key={mt.id} style={[styles.card, Shadows.small]}>
                      {/* Card Header Toggle */}
                      <TouchableOpacity 
                        style={styles.cardHeader}
                        onPress={() => setExpandedMealCards(prev => ({ ...prev, [mt.id]: !isCardExpanded }))}
                        activeOpacity={0.8}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardIndexText}>SESSION #{index + 1}</Text>
                          <Text style={styles.cardTitleText}>
                            {mt.menuType ? mt.menuType.toUpperCase() : 'Select Menu Type...'}
                          </Text>
                        </View>
                        <View style={styles.cardHeaderActions}>
                          <TouchableOpacity onPress={() => handleRemoveMealType(mt.id)} style={styles.trashBtn}>
                            <Trash2 size={18} color={Colors.error} />
                          </TouchableOpacity>
                          {isCardExpanded ? <ChevronUp size={18} color={Colors.textSecondary} /> : <ChevronDown size={18} color={Colors.textSecondary} />}
                        </View>
                      </TouchableOpacity>

                      {isCardExpanded && (
                        <View style={styles.cardBody}>
                          {/* Menu Type Picker */}
                          <Text style={styles.cardInputLabel}>Session Type *</Text>
                          <View style={styles.typeGrid}>
                            {MENU_TYPES.map(type => (
                              <TouchableOpacity
                                key={type.value}
                                onPress={() => handleUpdateMealField(mt.id, 'menuType', type.value)}
                                style={[styles.typeGridBtn, mt.menuType === type.value && styles.typeGridBtnActive]}
                              >
                                <Text style={[styles.typeGridBtnText, mt.menuType === type.value && styles.typeGridBtnTextActive]}>
                                  {type.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>

                          {/* Date, Time, Venue */}
                          <View style={styles.formRow}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                              <Text style={styles.cardInputLabel}>Event Date *</Text>
                              <View style={styles.smallInputContainer}>
                                <Calendar size={14} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                                <TextInput 
                                  style={styles.smallInput}
                                  value={mt.date}
                                  onChangeText={(t) => handleUpdateMealField(mt.id, 'date', t)}
                                  placeholder="YYYY-MM-DD"
                                  placeholderTextColor={Colors.textTertiary}
                                />
                              </View>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.cardInputLabel}>Session Time</Text>
                              <View style={styles.smallInputContainer}>
                                <Clock size={14} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                                <TextInput 
                                  style={styles.smallInput}
                                  value={mt.time}
                                  onChangeText={(t) => handleUpdateMealField(mt.id, 'time', t)}
                                  placeholder="e.g. 12:30 PM"
                                  placeholderTextColor={Colors.textTertiary}
                                />
                              </View>
                            </View>
                          </View>

                          <Text style={styles.cardInputLabel}>Venue Address</Text>
                          <View style={styles.smallInputContainer}>
                            <MapPin size={14} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                            <TextInput 
                              style={styles.smallInput}
                              value={mt.venue}
                              onChangeText={(t) => handleUpdateMealField(mt.id, 'venue', t)}
                              placeholder="Session location / hall"
                              placeholderTextColor={Colors.textTertiary}
                            />
                          </View>

                          {/* Pricing Method Toggle */}
                          <Text style={styles.cardInputLabel}>Pricing Method</Text>
                          <View style={styles.pricingToggleRow}>
                            <TouchableOpacity 
                              style={[styles.pricingMethodBtn, mt.pricingMethod === 'manual' && styles.pricingMethodBtnActive]}
                              onPress={() => handleUpdateMealField(mt.id, 'pricingMethod', 'manual')}
                            >
                              <Text style={[styles.pricingMethodBtnText, mt.pricingMethod === 'manual' && styles.pricingMethodBtnTextActive]}>Manual Amount</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.pricingMethodBtn, mt.pricingMethod === 'plate-based' && styles.pricingMethodBtnActive]}
                              onPress={() => handleUpdateMealField(mt.id, 'pricingMethod', 'plate-based')}
                            >
                              <Text style={[styles.pricingMethodBtnText, mt.pricingMethod === 'plate-based' && styles.pricingMethodBtnTextActive]}>Plate-Based</Text>
                            </TouchableOpacity>
                          </View>

                          {mt.pricingMethod === 'plate-based' ? (
                            <View style={styles.formRow}>
                              <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={styles.cardInputLabel}>No. of Plates *</Text>
                                <TextInput 
                                  style={styles.borderedInput}
                                  value={mt.numberOfPlates}
                                  keyboardType="numeric"
                                  onChangeText={(t) => handleUpdateMealField(mt.id, 'numberOfPlates', t)}
                                  placeholder="0"
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.cardInputLabel}>Plate Price * (₹)</Text>
                                <TextInput 
                                  style={styles.borderedInput}
                                  value={mt.platePrice}
                                  keyboardType="numeric"
                                  onChangeText={(t) => handleUpdateMealField(mt.id, 'platePrice', t)}
                                  placeholder="0.00"
                                />
                              </View>
                            </View>
                          ) : mt.menuType !== 'saree' ? (
                            <View>
                              <Text style={styles.cardInputLabel}>Manual Amount * (₹)</Text>
                              <TextInput 
                                style={styles.borderedInput}
                                value={mt.manualAmount}
                                keyboardType="numeric"
                                onChangeText={(t) => handleUpdateMealField(mt.id, 'manualAmount', t)}
                                placeholder="0.00"
                              />
                            </View>
                          ) : null}

                          <Text style={styles.cardInputLabel}>Plates / Head Count Label</Text>
                          <TextInput 
                            style={styles.borderedInput}
                            value={mt.numberOfMembers}
                            keyboardType="numeric"
                            onChangeText={(t) => handleUpdateMealField(mt.id, 'numberOfMembers', t)}
                            placeholder="Expected guests count"
                          />

                          {/* Menu Items Selector */}
                          <View style={styles.menuSelectionHeader}>
                            <Text style={styles.cardInputLabel}>Session Items * ({mt.selectedMenuItems.length})</Text>
                            <TouchableOpacity 
                              style={styles.commonItemsBtn}
                              onPress={() => handleSelectCommonItems(mt.id)}
                            >
                              <Text style={styles.commonItemsBtnText}>+ Add Common</Text>
                            </TouchableOpacity>
                          </View>

                          <TouchableOpacity 
                            style={styles.selectItemsBtn}
                            onPress={() => openItemSelector(mt.id, null)}
                          >
                            <Plus size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                            <Text style={styles.selectItemsBtnText}>Add / Search Dishes...</Text>
                          </TouchableOpacity>

                          {/* Selected Items List */}
                          {mt.selectedMenuItems.map(itemId => {
                            const dish = menuItems.find(i => i.id === itemId);
                            if (!dish) return null;
                            return (
                              <View key={itemId} style={styles.selectedItemRow}>
                                <View style={styles.selectedItemDetails}>
                                  <Text style={styles.selectedItemName}>{dish.name}</Text>
                                  {dish.nameTelugu && <Text style={styles.selectedItemTelugu}>({dish.nameTelugu})</Text>}
                                  
                                  {/* Customization input */}
                                  <TextInput 
                                    style={styles.customizationInput}
                                    value={mt.itemCustomizations[itemId] || ''}
                                    onChangeText={(t) => {
                                      const updatedCustom = { ...mt.itemCustomizations, [itemId]: t };
                                      handleUpdateMealField(mt.id, 'itemCustomizations', updatedCustom);
                                    }}
                                    placeholder="Add customization (sweet/spice note)"
                                    placeholderTextColor={Colors.textTertiary}
                                  />
                                </View>

                                <View style={styles.selectedItemActions}>
                                  <View style={styles.qtyContainer}>
                                    <Text style={styles.qtyLabel}>Qty:</Text>
                                    <TextInput 
                                      style={styles.qtyInput}
                                      value={mt.itemQuantities[itemId] || '1'}
                                      keyboardType="numeric"
                                      onChangeText={(t) => {
                                        const updatedQty = { ...mt.itemQuantities, [itemId]: t };
                                        handleUpdateMealField(mt.id, 'itemQuantities', updatedQty);
                                      }}
                                    />
                                  </View>

                                  {mt.menuType === 'saree' && (
                                    <View style={styles.priceContainer}>
                                      <Text style={styles.qtyLabel}>Price:</Text>
                                      <TextInput 
                                        style={styles.qtyInput}
                                        value={mt.itemPrices[itemId] || ''}
                                        keyboardType="numeric"
                                        placeholder="₹0"
                                        onChangeText={(t) => {
                                          const updatedPrice = { ...mt.itemPrices, [itemId]: t };
                                          handleUpdateMealField(mt.id, 'itemPrices', updatedPrice);
                                        }}
                                      />
                                    </View>
                                  )}

                                  <TouchableOpacity 
                                    onPress={() => {
                                      const newIds = mt.selectedMenuItems.filter(id => id !== itemId);
                                      handleUpdateMealField(mt.id, 'selectedMenuItems', newIds);
                                    }}
                                    style={styles.removeItemBtn}
                                  >
                                    <X size={16} color={Colors.error} />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}

                <TouchableOpacity 
                  style={styles.addSessionBtn}
                  onPress={handleAddMealType}
                >
                  <Plus size={18} color={Colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.addSessionBtnText}>Add Another Meal Session</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Section 3: Stalls */}
          <View style={styles.accordionContainer}>
            {renderSectionHeader('Event Food Stalls', 'stalls', !showStalls || (stalls.length > 0 && stalls.every(s => !!s.category.trim())))}
            {expandedSection === 'stalls' && (
              <View style={styles.accordionBody}>
                {showStalls && stalls.map((stall, index) => {
                  const isStallExpanded = expandedStallCards[stall.id];
                  return (
                    <View key={stall.id} style={[styles.card, Shadows.small]}>
                      <TouchableOpacity 
                        style={styles.cardHeader}
                        onPress={() => setExpandedStallCards(prev => ({ ...prev, [stall.id]: !isStallExpanded }))}
                        activeOpacity={0.8}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardIndexText}>STALL #{index + 1}</Text>
                          <Text style={styles.cardTitleText}>
                            {stall.category ? stall.category.toUpperCase() : 'Enter Stall Category...'}
                          </Text>
                        </View>
                        <View style={styles.cardHeaderActions}>
                          <TouchableOpacity onPress={() => handleRemoveStall(stall.id)} style={styles.trashBtn}>
                            <Trash2 size={18} color={Colors.error} />
                          </TouchableOpacity>
                          {isStallExpanded ? <ChevronUp size={18} color={Colors.textSecondary} /> : <ChevronDown size={18} color={Colors.textSecondary} />}
                        </View>
                      </TouchableOpacity>

                      {isStallExpanded && (
                        <View style={styles.cardBody}>
                          <Text style={styles.cardInputLabel}>Stall Category Name *</Text>
                          <TextInput 
                            style={styles.borderedInput}
                            value={stall.category}
                            onChangeText={(t) => handleUpdateStallField(stall.id, 'category', t)}
                            placeholder="e.g. Chat Counter, Ice Cream"
                          />

                          <Text style={styles.cardInputLabel}>Stall Description</Text>
                          <TextInput 
                            style={styles.borderedInput}
                            value={stall.description}
                            onChangeText={(t) => handleUpdateStallField(stall.id, 'description', t)}
                            placeholder="Details about items or setups"
                          />

                          <View style={styles.formRow}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                              <Text style={styles.cardInputLabel}>Plates Count</Text>
                              <TextInput 
                                style={styles.borderedInput}
                                value={stall.numberOfPlates}
                                keyboardType="numeric"
                                onChangeText={(t) => handleUpdateStallField(stall.id, 'numberOfPlates', t)}
                                placeholder="0"
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.cardInputLabel}>Plate Price (₹)</Text>
                              <TextInput 
                                style={styles.borderedInput}
                                value={stall.platePrice}
                                keyboardType="numeric"
                                onChangeText={(t) => handleUpdateStallField(stall.id, 'platePrice', t)}
                                placeholder="0.00"
                              />
                            </View>
                          </View>

                          <Text style={styles.cardInputLabel}>Manual Stall Cost (₹)</Text>
                          <TextInput 
                            style={styles.borderedInput}
                            value={stall.manualAmount}
                            keyboardType="numeric"
                            onChangeText={(t) => handleUpdateStallField(stall.id, 'manualAmount', t)}
                            placeholder="0.00"
                          />

                          {/* Stall Items Selection */}
                          <Text style={styles.cardInputLabel}>Stall Items ({stall.selectedMenuItems.length})</Text>
                          <TouchableOpacity 
                            style={styles.selectItemsBtn}
                            onPress={() => openItemSelector(null, stall.id)}
                          >
                            <Plus size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                            <Text style={styles.selectItemsBtnText}>Add / Search Dishes...</Text>
                          </TouchableOpacity>

                          {stall.selectedMenuItems.map(itemId => {
                            const dish = menuItems.find(i => i.id === itemId);
                            if (!dish) return null;
                            return (
                              <View key={itemId} style={styles.selectedItemRow}>
                                <View style={styles.selectedItemDetails}>
                                  <Text style={styles.selectedItemName}>{dish.name}</Text>
                                  <TextInput 
                                    style={styles.customizationInput}
                                    value={stall.itemCustomizations[itemId] || ''}
                                    onChangeText={(t) => {
                                      const updatedCustom = { ...stall.itemCustomizations, [itemId]: t };
                                      handleUpdateStallField(stall.id, 'itemCustomizations', updatedCustom);
                                    }}
                                    placeholder="Customization note"
                                    placeholderTextColor={Colors.textTertiary}
                                  />
                                </View>
                                <View style={styles.selectedItemActions}>
                                  <TouchableOpacity 
                                    onPress={() => {
                                      const newIds = stall.selectedMenuItems.filter(id => id !== itemId);
                                      handleUpdateStallField(stall.id, 'selectedMenuItems', newIds);
                                    }}
                                    style={styles.removeItemBtn}
                                  >
                                    <X size={16} color={Colors.error} />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}

                <TouchableOpacity 
                  style={styles.addStallBtn}
                  onPress={handleAddStall}
                >
                  <Plus size={18} color={Colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.addStallBtnText}>Add Stall Counter</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Section 4: Global Financials */}
          <View style={styles.accordionContainer}>
            {renderSectionHeader('Financial Details & Payment', 'financials', true)}
            {expandedSection === 'financials' && (
              <View style={styles.accordionBody}>
                {/* Side Costs */}
                <View style={styles.formRow}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.inputLabel}>Transport Cost (₹)</Text>
                    <View style={styles.textInputContainer}>
                      <Truck size={16} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                      <TextInput 
                        style={styles.textInput}
                        value={transportCost}
                        keyboardType="numeric"
                        onChangeText={setTransportCost}
                        placeholder="0.00"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Water Bottles Cost (₹)</Text>
                    <View style={styles.textInputContainer}>
                      <DollarSign size={16} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                      <TextInput 
                        style={styles.textInput}
                        value={waterBottlesCost}
                        keyboardType="numeric"
                        onChangeText={setWaterBottlesCost}
                        placeholder="0.00"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.inputLabel}>Discount (₹)</Text>
                    <View style={styles.textInputContainer}>
                      <Percent size={16} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                      <TextInput 
                        style={styles.textInput}
                        value={discount}
                        keyboardType="numeric"
                        onChangeText={setDiscount}
                        placeholder="0.00"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Advance Paid (₹)</Text>
                    <View style={styles.textInputContainer}>
                      <DollarSign size={16} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                      <TextInput 
                        style={styles.textInput}
                        value={advancePaid}
                        keyboardType="numeric"
                        onChangeText={setAdvancePaid}
                        placeholder="0.00"
                      />
                    </View>
                  </View>
                </View>

                {/* Payment Method */}
                <Text style={styles.inputLabel}>Payment Method</Text>
                <View style={styles.paymentMethodRow}>
                  {PAYMENT_METHODS.map(method => (
                    <TouchableOpacity
                      key={method.value}
                      onPress={() => setPaymentMethod(method.value as any)}
                      style={[styles.paymentMethodTab, paymentMethod === method.value && styles.paymentMethodTabActive]}
                    >
                      <Text style={[styles.paymentMethodText, paymentMethod === method.value && styles.paymentMethodTextActive]}>
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Internal Notes */}
                <Text style={styles.inputLabel}>Internal Order Note</Text>
                <TextInput 
                  style={styles.textArea}
                  value={paymentNotes}
                  multiline={true}
                  numberOfLines={3}
                  onChangeText={setPaymentNotes}
                  placeholder="Notes about menu configurations, chef lists, etc."
                />
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Floating Totals Bar */}
        <View style={[styles.totalsBar, Shadows.large]}>
          <View style={styles.totalsInfo}>
            <View>
              <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.totalVal}>₹{totals.total.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.vertDivider} />
            <View>
              <Text style={styles.totalLabel}>BALANCE DUE</Text>
              <Text style={styles.balanceVal}>₹{totals.balance.toLocaleString('en-IN')}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.submitBtn, isCreatingOrder && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isCreatingOrder}
          >
            {isCreatingOrder ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Check size={20} color={Colors.white} />
                <Text style={styles.submitBtnText}>Create Order</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* CUSTOMER SEARCH MODAL */}
        <Modal
          visible={customerModalVisible}
          animationType="slide"
          onRequestClose={() => setCustomerModalVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Customer</Text>
              <TouchableOpacity 
                style={styles.modalCreateBtn} 
                onPress={() => {
                  setCustomerModalVisible(false);
                  setNewCustomerModalVisible(true);
                }}
              >
                <Plus size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBox}>
              <Search size={18} color={Colors.textSecondary} />
              <TextInput 
                style={styles.modalSearchInput}
                value={customerSearch}
                onChangeText={setCustomerSearch}
                placeholder="Search by customer name or phone..."
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            {loadingCustomers ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
            ) : (
              <FlatList
                data={filteredCustomersList}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 20 }}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.customerListRow}
                    onPress={() => {
                      setCustomerId(item.id);
                      setCustomerModalVisible(false);
                    }}
                  >
                    <View style={styles.customerRowInfo}>
                      <Text style={styles.customerRowName}>{item.name}</Text>
                      <Text style={styles.customerRowPhone}>{item.phone}</Text>
                    </View>
                    {customerId === item.id && <Check size={18} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.centerBox}>
                    <Text style={styles.emptyMsg}>No customers found</Text>
                  </View>
                }
              />
            )}
          </SafeAreaView>
        </Modal>

        {/* QUICK ADD CUSTOMER MODAL */}
        <Modal
          visible={newCustomerModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setNewCustomerModalVisible(false)}
        >
          <View style={styles.dialogOverlay}>
            <View style={[styles.dialogContainer, Shadows.large]}>
              <View style={styles.dialogHeader}>
                <Text style={styles.dialogTitle}>Quick Add Customer</Text>
                <TouchableOpacity onPress={() => setNewCustomerModalVisible(false)}>
                  <X size={20} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 300 }}>
                <Text style={styles.dialogInputLabel}>Full Name *</Text>
                <TextInput 
                  style={styles.dialogTextInput}
                  value={newCustomerForm.name}
                  onChangeText={(t) => setNewCustomerForm({ ...newCustomerForm, name: t })}
                  placeholder="Customer name"
                />

                <Text style={styles.dialogInputLabel}>Phone Number *</Text>
                <TextInput 
                  style={styles.dialogTextInput}
                  value={newCustomerForm.phone}
                  keyboardType="phone-pad"
                  onChangeText={(t) => setNewCustomerForm({ ...newCustomerForm, phone: t })}
                  placeholder="10-digit number"
                />

                <Text style={styles.dialogInputLabel}>Delivery Address *</Text>
                <TextInput 
                  style={[styles.dialogTextInput, { height: 60, textAlignVertical: 'top' }]}
                  value={newCustomerForm.address}
                  multiline={true}
                  onChangeText={(t) => setNewCustomerForm({ ...newCustomerForm, address: t })}
                  placeholder="Full address"
                />
              </ScrollView>

              <TouchableOpacity 
                style={[styles.dialogSubmitBtn, isSavingCustomer && { opacity: 0.7 }]}
                onPress={handleSaveCustomer}
                disabled={isSavingCustomer}
              >
                {isSavingCustomer ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.dialogSubmitText}>Save Customer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ITEMS MULTI-SELECT MODAL */}
        <Modal
          visible={itemModalVisible}
          animationType="slide"
          onRequestClose={() => setItemModalVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setItemModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Dishes</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.modalSearchBox}>
              <Search size={18} color={Colors.textSecondary} />
              <TextInput 
                style={styles.modalSearchInput}
                value={itemSearch}
                onChangeText={setItemSearch}
                placeholder="Search dishes (Telugu/English)..."
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            {loadingMenu ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
            ) : (
              <FlatList
                data={filteredMenuItemsList}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 15 }}
                renderItem={({ item }) => {
                  let isSelected = false;
                  if (activeMealIdForItemSelection) {
                    isSelected = mealTypes.find(mt => mt.id === activeMealIdForItemSelection)?.selectedMenuItems.includes(item.id) || false;
                  } else if (activeStallIdForItemSelection) {
                    isSelected = stalls.find(st => st.id === activeStallIdForItemSelection)?.selectedMenuItems.includes(item.id) || false;
                  }

                  return (
                    <TouchableOpacity 
                      style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                      onPress={() => handleToggleItem(item.id)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemNameText, isSelected && { color: Colors.primary }]}>{item.name}</Text>
                        {item.nameTelugu && <Text style={styles.itemTeluguText}>{item.nameTelugu}</Text>}
                        {item.price ? <Text style={styles.itemPriceText}>Base: ₹{item.price}</Text> : null}
                      </View>
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Check size={12} color={Colors.white} />}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.centerBox}>
                    <Text style={styles.emptyMsg}>No dishes found</Text>
                  </View>
                }
              />
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalFooterDoneBtn}
                onPress={() => setItemModalVisible(false)}
              >
                <Text style={styles.modalFooterDoneText}>Done Selecting</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 75,
    paddingBottom: 15,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  backBtn: {
    padding: 8,
    marginRight: 10,
    backgroundColor: '#F1F3F5',
    borderRadius: 10
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text
  },
  screenSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600'
  },
  scrollContent: {
    padding: 20
  },
  accordionContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    ...Shadows.small
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white
  },
  sectionHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  indicatorNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text
  },
  accordionBody: {
    padding: 16,
    backgroundColor: '#FCFDFE'
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    marginLeft: 2
  },
  customerSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  customerSelectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    height: 48,
    paddingHorizontal: 12
  },
  customerSelectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text
  },
  quickAddBtn: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: 12,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small
  },
  customerInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8F2',
    borderColor: '#FFEFE0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  customerAddressText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '600',
    lineHeight: 16
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    height: 48,
    paddingHorizontal: 12,
    marginBottom: 16
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500'
  },
  typeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10
  },
  typeToggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F3F5',
    borderRadius: 10,
    padding: 3
  },
  typeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8
  },
  typeBtnActive: {
    backgroundColor: Colors.white,
    ...Shadows.small
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary
  },
  typeBtnTextActive: {
    color: Colors.primary
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 16,
    overflow: 'hidden'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA'
  },
  cardIndexText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1
  },
  cardTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  trashBtn: {
    padding: 4
  },
  cardBody: {
    padding: 16
  },
  cardInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginLeft: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16
  },
  typeGridBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F3F5',
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  typeGridBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },
  typeGridBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary
  },
  typeGridBtnTextActive: {
    color: Colors.white
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  smallInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 40,
    paddingHorizontal: 8
  },
  smallInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600'
  },
  borderedInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 40,
    paddingHorizontal: 10,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 12
  },
  pricingToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F3F5',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12
  },
  pricingMethodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8
  },
  pricingMethodBtnActive: {
    backgroundColor: Colors.white,
    ...Shadows.small
  },
  pricingMethodBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary
  },
  pricingMethodBtnTextActive: {
    color: Colors.primary
  },
  menuSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6
  },
  commonItemsBtn: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  commonItemsBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary
  },
  selectItemsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8F2',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderStyle: 'dashed',
    height: 40,
    borderRadius: 10,
    marginBottom: 12
  },
  selectItemsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary
  },
  selectedItemRow: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    padding: 10,
    marginBottom: 8
  },
  selectedItemDetails: {
    flex: 1
  },
  selectedItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text
  },
  selectedItemTelugu: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2
  },
  customizationInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    height: 32,
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
    padding: 0
  },
  selectedItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 12
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  qtyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginRight: 4
  },
  qtyInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    width: 50,
    height: 28,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    padding: 0
  },
  removeItemBtn: {
    padding: 4
  },
  addSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    height: 48,
    borderRadius: 12,
    ...Shadows.small,
    marginTop: 10
  },
  addSessionBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700'
  },
  addStallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
    borderWidth: 1,
    height: 48,
    borderRadius: 12,
    marginTop: 10
  },
  addStallBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700'
  },
  paymentMethodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  paymentMethodTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F3F5',
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  paymentMethodTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary
  },
  paymentMethodTextActive: {
    color: Colors.white
  },
  textArea: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    padding: 10,
    fontSize: 13,
    color: Colors.text,
    height: 80,
    textAlignVertical: 'top'
  },
  totalsBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  totalsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  vertDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0'
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text
  },
  balanceVal: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Shadows.medium
  },
  submitBtnDisabled: {
    opacity: 0.7
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '900'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  modalCloseBtn: {
    padding: 4
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text
  },
  modalCreateBtn: {
    padding: 4
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F5',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 44
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500'
  },
  customerListRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5'
  },
  customerRowInfo: {},
  customerRowName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text
  },
  customerRowPhone: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8
  },
  itemRowSelected: {
    borderColor: Colors.primary + '60',
    backgroundColor: Colors.primary + '05'
  },
  itemNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text
  },
  itemTeluguText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2
  },
  itemPriceText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white
  },
  modalFooterDoneBtn: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium
  },
  modalFooterDoneText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800'
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  dialogContainer: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text
  },
  dialogInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6
  },
  dialogTextInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 13,
    color: Colors.text,
    marginBottom: 12
  },
  dialogSubmitBtn: {
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    ...Shadows.small
  },
  dialogSubmitText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800'
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyMsg: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500'
  }
});

export default NewOrderScreen;
