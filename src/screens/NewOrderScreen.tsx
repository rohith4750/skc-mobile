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
  Modal,
  FlatList,
  StatusBar,
  Switch
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
  DollarSign
} from 'lucide-react-native';
import { Colors, Shadows, Radii } from '../theme/colors';
import { useToast } from '../components/Toast';
import { useGetCustomersQuery, useCreateCustomerMutation } from '../services/customerApi';
import { useGetMenuQuery, useCreateMenuItemMutation } from '../services/menuApi';
import { useCreateOrderMutation, useUpdateOrderMutation } from '../services/orderApi';
import DateTimePicker from '@react-native-community/datetimepicker';


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

const FOOD_CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'breakfast', label: '🥞 Breakfast' },
  { id: 'sweets', label: '🍬 Sweets' },
  { id: 'rice', label: '🍚 Rice & Biryani' },
  { id: 'curry', label: '🍛 Curries' },
  { id: 'dal', label: '🍲 Dal & Liquids' },
  { id: 'roti', label: '🫓 Rotis & Breads' },
  { id: 'starter', label: '🧆 Starters' },
  { id: 'chutney', label: '🥒 Pickles' },
  { id: 'drinks', label: '🍹 Drinks' },
  { id: 'common', label: '🍽️ Extras' },
];

const getItemSubCategory = (item: any): string => {
  const types = Array.isArray(item?.type) ? item.type.map((t: any) => String(t || '').toLowerCase()) : [String(item?.type || '').toLowerCase()];
  const category = String(item?.category || '').toLowerCase();
  const desc = String(item?.description || '').toLowerCase();
  const name = String(item?.name || '').toLowerCase();

  if (
    types.includes('sweets') || types.includes('saree') || types.includes('saare') ||
    category.includes('sweet') || category.includes('saare') || desc.includes('sweet') ||
    name.includes('laddu') || name.includes('jamoon') || name.includes('jamun') || name.includes('payasam') ||
    name.includes('halwa') || name.includes('kheer') || name.includes('burfi') || name.includes('peda') ||
    name.includes('mysorepak') || name.includes('jilebi') || name.includes('badusha') || name.includes('pongali')
  ) {
    return 'sweets';
  }

  if (
    types.includes('rice') || category.includes('rice') || desc.includes('rice') ||
    name.includes('rice') || name.includes('biryani') || name.includes('pulihora') || name.includes('pulao') ||
    name.includes('bath') || name.includes('baath') || name.includes('fried rice')
  ) {
    return 'rice';
  }

  if (
    types.includes('dal') || types.includes('liquid') || category.includes('dal') || category.includes('liquid') ||
    name.includes('pappu') || name.includes('dal') || name.includes('sambar') || name.includes('rasam') ||
    name.includes('pulusu') || name.includes('chaaru')
  ) {
    return 'dal';
  }

  if (
    types.includes('roti') || category.includes('roti') || desc.includes('roti') ||
    name.includes('roti') || name.includes('naan') || name.includes('pulka') || name.includes('paratha')
  ) {
    return 'roti';
  }

  if (
    types.includes('pickle') || types.includes('chutney') || category.includes('pickle') || category.includes('chutney') ||
    name.includes('pickle') || name.includes('chutney') || name.includes('pachadi') || name.includes('podi')
  ) {
    return 'chutney';
  }

  if (
    types.includes('starter') || types.includes('fry') || category.includes('starter') || category.includes('fry') ||
    name.includes('fry') || name.includes('pakoda') || name.includes('bajji') || name.includes('65') || name.includes('manchuria')
  ) {
    return 'starter';
  }

  if (
    types.includes('welcome_drink') || types.includes('soup') || category.includes('drink') || category.includes('water') ||
    name.includes('juice') || name.includes('soup') || name.includes('water') || name.includes('coffee') || name.includes('tea')
  ) {
    return 'drinks';
  }

  if (
    types.includes('north_indian') || types.includes('south_indian_curry') || category.includes('curry') ||
    name.includes('curry') || name.includes('masala') || name.includes('kurma') || name.includes('paneer') || name.includes('aalu')
  ) {
    return 'curry';
  }

  if (
    types.includes('breakfast') || types.includes('tiffins') || category.includes('breakfast') || desc.includes('breakfast') ||
    name.includes('idli') || name.includes('dosa') || name.includes('upma') || name.includes('pesarattu') ||
    name.includes('uthappa') || name.includes('pongal') || name.includes('poori') || name.includes('wada') || name.includes('vada')
  ) {
    return 'breakfast';
  }

  return 'common';
};

const NewOrderScreen = ({ route, navigation }: any) => {
  const orderToEdit = route.params?.orderToEdit;
  const isEditing = !!orderToEdit;
  const { showToast } = useToast();
  
  // Queries & Mutations
  const { data: customers = [], isLoading: loadingCustomers } = useGetCustomersQuery();
  const { data: menuItems = [], isLoading: loadingMenu } = useGetMenuQuery();
  const [createCustomer, { isLoading: isSavingCustomer }] = useCreateCustomerMutation();
  const [createMenuItem, { isLoading: isCreatingMenuItem }] = useCreateMenuItemMutation();
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
  const [updateOrder, { isLoading: isUpdatingOrder }] = useUpdateOrderMutation();

  // Quick Add Dish Form State
  const [quickAddDishModalVisible, setQuickAddDishModalVisible] = useState(false);
  const [quickAddDishForm, setQuickAddDishForm] = useState({ name: '', nameTelugu: '', category: 'breakfast' });
  const [quickAddTargetMealId, setQuickAddTargetMealId] = useState<string | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [eventName, setEventName] = useState('');
  const [orderType, setOrderType] = useState<'EVENT' | 'LUNCH_PACK'>('EVENT');
  const [mealTypes, setMealTypes] = useState<FormMealType[]>([]);
  const [stalls, setStalls] = useState<FormStall[]>([]);
  const [showStalls, setShowStalls] = useState(false);
  const [discount, setDiscount] = useState('');
  const [transportCost, setTransportCost] = useState('');
  const [serviceCost, setServiceCost] = useState('');
  const [waterBottlesCost, setWaterBottlesCost] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [isFullyPaid, setIsFullyPaid] = useState(false);
  const [previousPartialAdvance, setPreviousPartialAdvance] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer' | 'other'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Accordion section state
  const [expandedSection, setExpandedSection] = useState<'customer' | 'meals' | 'stalls' | 'financials' | null>('customer');
  const [expandedMealCards, setExpandedMealCards] = useState<Record<string, boolean>>({});
  const [expandedStallCards, setExpandedStallCards] = useState<Record<string, boolean>>({});

  // Date & Time Picker State
  const [activeDatePickerMealId, setActiveDatePickerMealId] = useState<string | null>(null);
  const [activeTimePickerMealId, setActiveTimePickerMealId] = useState<string | null>(null);

  const getDateObj = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const formatDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTimeObj = (timeStr: string) => {
    const d = new Date();
    if (!timeStr) return d;
    try {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const ampm = match[3];
        if (ampm) {
          if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
          if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
        }
        d.setHours(hours, minutes, 0, 0);
        return d;
      }
    } catch (e) {}
    return d;
  };

  const formatTimeStr = (d: Date) => {
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${minStr} ${ampm}`;
  };

  
  // Modals & Search State
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCustomerModalVisible, setNewCustomerModalVisible] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', address: '' });

  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeMealIdForItemSelection, setActiveMealIdForItemSelection] = useState<string | null>(null);
  const [activeStallIdForItemSelection, setActiveStallIdForItemSelection] = useState<string | null>(null);

  const resetForm = () => {
    setCustomerId('');
    setEventName('');
    setOrderType('EVENT');
    setMealTypes([]);
    setStalls([]);
    setShowStalls(false);
    setDiscount('');
    setTransportCost('');
    setServiceCost('');
    setWaterBottlesCost('');
    setAdvancePaid('');
    setIsFullyPaid(false);
    setPreviousPartialAdvance('');
    setPaymentMethod('cash');
    setPaymentNotes('');
    setExpandedSection('customer');
    setExpandedMealCards({});
    setExpandedStallCards({});
  };

  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Initialize or prefill when editing
  useEffect(() => {
    if (isEditing && orderToEdit) {
      setCustomerId(orderToEdit.customerId || orderToEdit.customer?.id || '');
      setEventName(orderToEdit.eventName || '');
      setOrderType(orderToEdit.orderType || 'EVENT');
      setDiscount(orderToEdit.discount ? String(orderToEdit.discount) : '');
      setTransportCost(orderToEdit.transportCost ? String(orderToEdit.transportCost) : '');
      setServiceCost(orderToEdit.serviceCost ? String(orderToEdit.serviceCost) : '');
      setWaterBottlesCost(orderToEdit.waterBottlesCost ? String(orderToEdit.waterBottlesCost) : '');
      const advStr = orderToEdit.advancePaid ? String(orderToEdit.advancePaid) : '';
      setAdvancePaid(advStr);
      const isFull = Number(orderToEdit.remainingAmount) === 0 || (Number(orderToEdit.advancePaid) > 0 && Number(orderToEdit.advancePaid) >= Number(orderToEdit.totalAmount));
      setIsFullyPaid(isFull);
      setPreviousPartialAdvance(isFull ? '' : advStr);
      setPaymentMethod(orderToEdit.paymentMethod || 'cash');
      setPaymentNotes(orderToEdit.internalNote || '');

      const allItems = Array.isArray(orderToEdit.items) ? orderToEdit.items : [];

      if (orderToEdit.mealTypeAmounts && typeof orderToEdit.mealTypeAmounts === 'object' && Object.keys(orderToEdit.mealTypeAmounts).length > 0) {
        const assignedItemIds = new Set<string>();

        const loadedMeals: FormMealType[] = Object.entries(orderToEdit.mealTypeAmounts).map(([id, data]: [string, any]) => {
          const sessionType = (data.menuType || '').toLowerCase();
          
          const sessionItems = allItems.filter((i: any) => {
            const itemMealType = String(i.mealType || '').toLowerCase();
            return i.mealType === id || (sessionType && itemMealType === sessionType);
          });

          const selectedItems: string[] = [];
          const itemQuantities: Record<string, string> = {};
          const itemCustomizations: Record<string, string> = {};
          const itemPrices: Record<string, string> = {};

          sessionItems.forEach((i: any) => {
            const itemId = i.menuItemId || i.menuItem?.id || i.id;
            if (itemId) {
              if (!selectedItems.includes(itemId)) {
                selectedItems.push(itemId);
              }
              assignedItemIds.add(itemId);
              itemQuantities[itemId] = String(i.quantity ?? 1);
              if (i.customization) itemCustomizations[itemId] = String(i.customization);
              if (i.price) itemPrices[itemId] = String(i.price);
            }
          });

          return {
            id,
            eventName: data.eventName || orderToEdit.eventName || '',
            venue: data.venue || '',
            menuType: data.menuType || '',
            selectedMenuItems: selectedItems,
            pricingMethod: data.pricingMethod || 'manual',
            numberOfPlates: data.numberOfPlates ? String(data.numberOfPlates) : '',
            platePrice: data.platePrice ? String(data.platePrice) : '',
            manualAmount: data.manualAmount ? String(data.manualAmount) : (data.amount ? String(data.amount) : ''),
            date: data.date || orderToEdit.eventDate || '',
            time: data.time || '',
            services: data.services || [],
            numberOfMembers: data.numberOfMembers ? String(data.numberOfMembers) : '',
            itemCustomizations,
            itemQuantities,
            itemPrices,
            description: data.description || '',
          };
        });

        // Collect any unassigned items and put into the first session
        const unassigned = allItems.filter((i: any) => {
          const itemId = i.menuItemId || i.menuItem?.id || i.id;
          return itemId && !assignedItemIds.has(itemId);
        });

        if (unassigned.length > 0 && loadedMeals.length > 0) {
          unassigned.forEach((i: any) => {
            const itemId = i.menuItemId || i.menuItem?.id || i.id;
            if (itemId && !loadedMeals[0].selectedMenuItems.includes(itemId)) {
              loadedMeals[0].selectedMenuItems.push(itemId);
              loadedMeals[0].itemQuantities[itemId] = String(i.quantity ?? 1);
              if (i.customization) loadedMeals[0].itemCustomizations[itemId] = String(i.customization);
              if (i.price) loadedMeals[0].itemPrices[itemId] = String(i.price);
            }
          });
        }

        setMealTypes(loadedMeals);
        const initialExpanded: Record<string, boolean> = {};
        loadedMeals.forEach(m => initialExpanded[m.id] = true);
        setExpandedMealCards(initialExpanded);
      } else {
        // Fallback: group all items into a single session
        const defaultId = generateId();
        const selectedItems: string[] = [];
        const itemQuantities: Record<string, string> = {};
        const itemCustomizations: Record<string, string> = {};
        const itemPrices: Record<string, string> = {};

        allItems.forEach((i: any) => {
          const itemId = i.menuItemId || i.menuItem?.id || i.id;
          if (itemId) {
            if (!selectedItems.includes(itemId)) {
              selectedItems.push(itemId);
            }
            itemQuantities[itemId] = String(i.quantity ?? 1);
            if (i.customization) itemCustomizations[itemId] = String(i.customization);
            if (i.price) itemPrices[itemId] = String(i.price);
          }
        });

        const defaultMeal: FormMealType = {
          id: defaultId,
          eventName: orderToEdit.eventName || '',
          venue: '',
          menuType: 'session',
          selectedMenuItems: selectedItems,
          pricingMethod: 'manual',
          numberOfPlates: '',
          platePrice: '',
          manualAmount: String(orderToEdit.totalAmount || 0),
          date: orderToEdit.eventDate || new Date().toISOString().split('T')[0],
          time: '',
          services: [],
          numberOfMembers: '',
          itemCustomizations,
          itemQuantities,
          itemPrices,
          description: '',
        };

        setMealTypes([defaultMeal]);
        setExpandedMealCards({ [defaultId]: true });
      }

      // Parse stalls if available
      if (Array.isArray(orderToEdit.stalls) && orderToEdit.stalls.length > 0) {
        setShowStalls(true);
        const loadedStalls: FormStall[] = orderToEdit.stalls.map((s: any) => ({
          id: s.id || generateId(),
          category: s.category || '',
          description: s.description || '',
          selectedMenuItems: s.selectedMenuItems || [],
          itemCustomizations: s.itemCustomizations || {},
          itemQuantities: s.itemQuantities || {},
          pricingMethod: s.pricingMethod || 'manual',
          numberOfPlates: s.numberOfPlates ? String(s.numberOfPlates) : '',
          platePrice: s.platePrice ? String(s.platePrice) : '',
          manualAmount: s.manualAmount ? String(s.manualAmount) : '',
          cost: s.cost ? String(s.cost) : '',
          numberOfMembers: s.numberOfMembers ? String(s.numberOfMembers) : '',
          eventName: s.eventName || '',
          venue: s.venue || '',
          date: s.date || '',
          time: s.time || '',
          services: s.services || [],
        }));
        setStalls(loadedStalls);
      }
    } else {
      if (mealTypes.length === 0) {
        handleAddMealType();
      }
    }
  }, [isEditing, orderToEdit]);

  // Focus listener to ensure fresh form when creating a new order
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const currentOrderToEdit = route.params?.orderToEdit;
      if (!currentOrderToEdit) {
        resetForm();
        const freshMealId = Math.random().toString(36).substring(2, 9);
        const freshMeal: FormMealType = {
          id: freshMealId,
          eventName: '',
          venue: '',
          menuType: '',
          selectedMenuItems: [],
          pricingMethod: 'manual',
          numberOfPlates: '',
          platePrice: '',
          manualAmount: '',
          date: new Date().toISOString().split('T')[0],
          time: '',
          services: [],
          numberOfMembers: '',
          itemCustomizations: {},
          itemQuantities: {},
          itemPrices: {},
          description: ''
        };
        setMealTypes([freshMeal]);
        setExpandedMealCards({ [freshMealId]: true });
      }
    });
    return unsubscribe;
  }, [navigation, route.params]);


  const filteredCustomersList = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const query = customerSearch.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(query) || c.phone.includes(query)
    );
  }, [customers, customerSearch]);

  const filteredMenuItemsList = useMemo(() => {
    let activeMenu = menuItems.filter(item => item.isActive);

    if (selectedCategory !== 'all') {
      activeMenu = activeMenu.filter(item => getItemSubCategory(item) === selectedCategory);
    }

    if (!itemSearch.trim()) return activeMenu;
    const query = itemSearch.toLowerCase();
    return activeMenu.filter(item => 
      item.name.toLowerCase().includes(query) || 
      (item.nameTelugu && item.nameTelugu.includes(query))
    );
  }, [menuItems, selectedCategory, itemSearch]);

  const selectedCustomerObj = useMemo(() => {
    return customers.find(c => c.id === customerId);
  }, [customers, customerId]);

  // Total pricing calculations
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
    const service = parseFloat(serviceCost) || 0;
    const discountVal = parseFloat(discount) || 0;
    const waterBottles = waterTotal > 0 ? waterTotal : (parseFloat(waterBottlesCost) || 0);

    const total = Math.max(0, mealTypesTotal + transport + service + waterBottles + stallsTotal - discountVal);
    const advance = parseFloat(advancePaid) || 0;
    const balance = Math.max(0, total - advance);

    return { total, balance, waterTotal, stallsTotal, mealTypesTotal };
  }, [mealTypes, stalls, showStalls, transportCost, serviceCost, discount, waterBottlesCost, advancePaid, menuItems]);

  // Keep advancePaid updated if full paid toggle is active
  useEffect(() => {
    if (isFullyPaid) {
      setAdvancePaid(String(totals.total));
    }
  }, [totals.total, isFullyPaid]);


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
      showToast('No common items found', 'error');
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
    showToast('Common items added', 'success');
  };

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

  const openItemSelector = (mealId: string | null, stallId: string | null) => {
    setActiveMealIdForItemSelection(mealId);
    setActiveStallIdForItemSelection(stallId);
    setItemSearch('');

    if (mealId) {
      const meal = mealTypes.find(mt => mt.id === mealId);
      const sName = (meal?.menuType || meal?.eventName || '').toLowerCase();
      if (sName.includes('breakfast') || sName.includes('tiffin') || sName.includes('morning')) {
        setSelectedCategory('breakfast');
      } else if (sName.includes('sweet') || sName.includes('saree')) {
        setSelectedCategory('sweets');
      } else {
        setSelectedCategory('all');
      }
    } else {
      setSelectedCategory('all');
    }

    setItemModalVisible(true);
  };

  const handleQuickAddDish = async () => {
    if (!quickAddDishForm.name.trim()) {
      Alert.alert('Required', 'Dish name is required');
      return;
    }

    try {
      const newDishPayload = {
        name: quickAddDishForm.name.trim(),
        nameTelugu: quickAddDishForm.nameTelugu.trim() || undefined,
        type: [quickAddDishForm.category],
        isCommon: false,
        isActive: true,
      };

      const createdDish = await createMenuItem(newDishPayload).unwrap();
      const dishId = createdDish.id || (createdDish as any)._id;

      showToast(`Added "${createdDish.name}" to menu & session!`, 'success');

      // Add newly created dish to target meal session
      const targetId = quickAddTargetMealId || activeMealIdForItemSelection;
      if (targetId) {
        setMealTypes(prev => prev.map(mt => {
          if (mt.id === targetId) {
            const isSelected = mt.selectedMenuItems.includes(dishId);
            if (!isSelected) {
              return {
                ...mt,
                selectedMenuItems: [...mt.selectedMenuItems, dishId],
                itemQuantities: { ...mt.itemQuantities, [dishId]: '1' },
                itemCustomizations: { ...mt.itemCustomizations }
              };
            }
          }
          return mt;
        }));
      }

      setQuickAddDishForm({ name: '', nameTelugu: '', category: 'breakfast' });
      setQuickAddDishModalVisible(false);
    } catch (err: any) {
      console.error('Failed to create quick menu item:', err);
      Alert.alert('Error', 'Failed to save new dish to menu');
    }
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

  const handleSubmit = async () => {
    if (!customerId) {
      Alert.alert('Validation Error', 'Please select a customer.');
      return;
    }
    if (!eventName.trim()) {
      Alert.alert('Validation Error', 'Please enter an event name.');
      return;
    }
    if (mealTypes.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one meal session.');
      return;
    }

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
        mealTypeAmounts: mealTypeAmountsPayload,
        stalls: stallsPayload,
        transportCost: parseFloat(transportCost) || 0,
        serviceCost: parseFloat(serviceCost) || 0,
        waterBottlesCost: parseFloat(waterBottlesCost) || 0,
        discount: parseFloat(discount) || 0,
        paymentMethod,
        additionalPayment: parseFloat(advancePaid) || 0,
        internalNote: paymentNotes,
        eventDate: primaryDate
      };

      if (isEditing && orderToEdit?.id) {
        await updateOrder({ id: orderToEdit.id, ...payload }).unwrap();
        showToast('Order updated successfully!', 'success');
      } else {
        await createOrder({ ...payload, status: 'pending' }).unwrap();
        showToast('Order created successfully!', 'success');
      }

      resetForm();
      navigation.setParams({ orderToEdit: undefined });
      navigation.goBack();
    } catch (err: any) {
      console.error('Error submitting order:', err);
      const errMsg = err?.data?.error || 'Failed to submit order.';
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
            {isCompleted ? <CheckCircle2 size={12} color={Colors.white} /> : <Text style={styles.indicatorNumber}>{sectionKey === 'customer' ? '1' : sectionKey === 'meals' ? '2' : sectionKey === 'stalls' ? '3' : '4'}</Text>}
          </View>
          <Text style={styles.sectionTitleText}>{title}</Text>
        </View>
        {isExpanded ? <ChevronUp size={18} color={Colors.textSecondary} /> : <ChevronDown size={18} color={Colors.textSecondary} />}
      </TouchableOpacity>
    );
  };

  const isSubmitting = isCreatingOrder || isUpdatingOrder;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity 
            onPress={() => {
              resetForm();
              navigation.setParams({ orderToEdit: undefined });
              navigation.goBack();
            }} 
            style={styles.backBtn} 
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.screenTitle}>{isEditing ? `Edit Order #${orderToEdit.id?.slice(-6)?.toUpperCase()}` : 'Create Order'}</Text>
            <Text style={styles.screenSubtitle}>{isEditing ? 'Modify order details, sessions & pricing' : 'Add a new booking or quotation'}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Section 1: Customer Details */}
          <View style={[styles.accordionContainer, Shadows.small]}>
            {renderSectionHeader('1. Client & Event Details', 'customer', !!customerId && !!eventName.trim())}
            {expandedSection === 'customer' && (
              <View style={styles.accordionBody}>
                <Text style={styles.inputLabel}>Select Client *</Text>
                <View style={styles.customerSelectorRow}>
                  <TouchableOpacity 
                    style={styles.customerSelectorBtn}
                    onPress={() => setCustomerModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <User size={16} color={Colors.textTertiary} style={{ marginRight: 8 }} />
                    <Text style={[styles.customerSelectorText, !selectedCustomerObj && { color: Colors.textTertiary }]} numberOfLines={1}>
                      {selectedCustomerObj ? `${selectedCustomerObj.name} (${selectedCustomerObj.phone})` : 'Search & Select Customer...'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickAddBtn}
                    onPress={() => setNewCustomerModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Plus size={18} color={Colors.white} />
                  </TouchableOpacity>
                </View>

                {selectedCustomerObj && (
                  <View style={styles.customerInfoCard}>
                    <MapPin size={14} color={Colors.primaryDark} style={{ marginTop: 2, marginRight: 6 }} />
                    <Text style={styles.customerAddressText}>{selectedCustomerObj.address || 'No address provided'}</Text>
                  </View>
                )}

                <Text style={styles.inputLabel}>Event / Order Name *</Text>
                <View style={styles.textInputContainer}>
                  <Utensils size={16} color={Colors.textTertiary} style={{ marginRight: 8 }} />
                  <TextInput 
                    style={styles.textInput}
                    value={eventName}
                    onChangeText={setEventName}
                    placeholder="e.g. Wedding Reception"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>

                <View style={styles.typeToggleRow}>
                  <Text style={styles.typeToggleLabel}>Catering Type</Text>
                  <View style={styles.typeSelector}>
                    <TouchableOpacity 
                      style={[styles.typeBtn, orderType === 'EVENT' && styles.typeBtnActive]}
                      onPress={() => setOrderType('EVENT')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.typeBtnText, orderType === 'EVENT' && styles.typeBtnTextActive]}>Event Catering</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Section 2: Meal Sessions */}
          <View style={[styles.accordionContainer, Shadows.small]}>
            {renderSectionHeader('2. Meal Sessions & Menu Builder', 'meals', mealTypes.length > 0 && mealTypes.every(mt => !!mt.menuType && mt.selectedMenuItems.length > 0))}
            {expandedSection === 'meals' && (
              <View style={styles.accordionBody}>
                {mealTypes.map((mt, index) => {
                  const isCardExpanded = expandedMealCards[mt.id];
                  return (
                    <View key={mt.id} style={styles.card}>
                      <TouchableOpacity 
                        style={styles.cardHeader}
                        onPress={() => setExpandedMealCards(prev => ({ ...prev, [mt.id]: !isCardExpanded }))}
                        activeOpacity={0.8}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardIndexText}>SESSION #{index + 1}</Text>
                          <Text style={styles.cardTitleText}>
                            {mt.menuType ? mt.menuType.toUpperCase() : 'Select Session Type...'}
                          </Text>
                        </View>
                        <View style={styles.cardHeaderActions}>
                          <TouchableOpacity onPress={() => handleRemoveMealType(mt.id)} style={styles.trashBtn} activeOpacity={0.7}>
                            <Trash2 size={16} color={Colors.error} />
                          </TouchableOpacity>
                          {isCardExpanded ? <ChevronUp size={16} color={Colors.textSecondary} /> : <ChevronDown size={16} color={Colors.textSecondary} />}
                        </View>
                      </TouchableOpacity>

                      {isCardExpanded && (
                        <View style={styles.cardBody}>
                          <Text style={styles.cardInputLabel}>Session Type *</Text>
                          <View style={styles.typeGrid}>
                            {MENU_TYPES.map(type => (
                              <TouchableOpacity
                                key={type.value}
                                onPress={() => handleUpdateMealField(mt.id, 'menuType', type.value)}
                                style={[styles.typeGridBtn, mt.menuType === type.value && styles.typeGridBtnActive]}
                                activeOpacity={0.7}
                              >
                                <Text style={[styles.typeGridBtnText, mt.menuType === type.value && styles.typeGridBtnTextActive]}>
                                  {type.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>

                          <View style={styles.formRow}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                              <Text style={styles.cardInputLabel}>Event Date *</Text>
                              <TouchableOpacity 
                                style={styles.smallInputContainer}
                                onPress={() => setActiveDatePickerMealId(mt.id)}
                                activeOpacity={0.7}
                              >
                                <Calendar size={14} color={Colors.primary} style={{ marginRight: 6 }} />
                                <Text style={[styles.smallInputText, !mt.date && { color: Colors.textTertiary }]}>
                                  {mt.date || 'Select Date'}
                                </Text>
                              </TouchableOpacity>
                              {activeDatePickerMealId === mt.id && (
                                <DateTimePicker
                                  value={getDateObj(mt.date)}
                                  mode="date"
                                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                  onChange={(event: any, selectedDate?: Date) => {
                                    if (Platform.OS === 'android') {
                                      setActiveDatePickerMealId(null);
                                    }
                                    if (selectedDate && event.type !== 'dismissed') {
                                      handleUpdateMealField(mt.id, 'date', formatDateStr(selectedDate));
                                      if (Platform.OS === 'ios') setActiveDatePickerMealId(null);
                                    }
                                  }}
                                />
                              )}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.cardInputLabel}>Time</Text>
                              <TouchableOpacity 
                                style={styles.smallInputContainer}
                                onPress={() => setActiveTimePickerMealId(mt.id)}
                                activeOpacity={0.7}
                              >
                                <Clock size={14} color={Colors.primary} style={{ marginRight: 6 }} />
                                <Text style={[styles.smallInputText, !mt.time && { color: Colors.textTertiary }]}>
                                  {mt.time || 'Select Time'}
                                </Text>
                              </TouchableOpacity>
                              {activeTimePickerMealId === mt.id && (
                                <DateTimePicker
                                  value={getTimeObj(mt.time)}
                                  mode="time"
                                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                  onChange={(event: any, selectedDate?: Date) => {
                                    if (Platform.OS === 'android') {
                                      setActiveTimePickerMealId(null);
                                    }
                                    if (selectedDate && event.type !== 'dismissed') {
                                      handleUpdateMealField(mt.id, 'time', formatTimeStr(selectedDate));
                                      if (Platform.OS === 'ios') setActiveTimePickerMealId(null);
                                    }
                                  }}
                                />
                              )}
                            </View>
                          </View>


                          <Text style={styles.cardInputLabel}>Venue Address</Text>
                          <View style={styles.smallInputContainer}>
                            <MapPin size={14} color={Colors.textTertiary} style={{ marginRight: 6 }} />
                            <TextInput 
                              style={styles.smallInput}
                              value={mt.venue}
                              onChangeText={(t) => handleUpdateMealField(mt.id, 'venue', t)}
                              placeholder="Hall name / Location"
                              placeholderTextColor={Colors.textTertiary}
                            />
                          </View>

                          <Text style={styles.cardInputLabel}>Pricing Method</Text>
                          <View style={styles.pricingToggleRow}>
                            <TouchableOpacity 
                              style={[styles.pricingMethodBtn, mt.pricingMethod === 'manual' && styles.pricingMethodBtnActive]}
                              onPress={() => handleUpdateMealField(mt.id, 'pricingMethod', 'manual')}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.pricingMethodBtnText, mt.pricingMethod === 'manual' && styles.pricingMethodBtnTextActive]}>Manual Amount</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.pricingMethodBtn, mt.pricingMethod === 'plate-based' && styles.pricingMethodBtnActive]}
                              onPress={() => handleUpdateMealField(mt.id, 'pricingMethod', 'plate-based')}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.pricingMethodBtnText, mt.pricingMethod === 'plate-based' && styles.pricingMethodBtnTextActive]}>Plate-Based</Text>
                            </TouchableOpacity>
                          </View>

                          {mt.pricingMethod === 'plate-based' ? (
                            <View style={styles.formRow}>
                              <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.cardInputLabel}>Plates Count *</Text>
                                <TextInput 
                                  style={styles.borderedInput}
                                  value={mt.numberOfPlates}
                                  keyboardType="numeric"
                                  onChangeText={(t) => handleUpdateMealField(mt.id, 'numberOfPlates', t)}
                                  placeholder="0"
                                  placeholderTextColor={Colors.textTertiary}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.cardInputLabel}>Plate Price (₹) *</Text>
                                <TextInput 
                                  style={styles.borderedInput}
                                  value={mt.platePrice}
                                  keyboardType="numeric"
                                  onChangeText={(t) => handleUpdateMealField(mt.id, 'platePrice', t)}
                                  placeholder="0.00"
                                  placeholderTextColor={Colors.textTertiary}
                                />
                              </View>
                            </View>
                          ) : mt.menuType !== 'saree' ? (
                            <View>
                              <Text style={styles.cardInputLabel}>Manual Amount (₹) *</Text>
                              <TextInput 
                                style={styles.borderedInput}
                                value={mt.manualAmount}
                                keyboardType="numeric"
                                onChangeText={(t) => handleUpdateMealField(mt.id, 'manualAmount', t)}
                                placeholder="0.00"
                                placeholderTextColor={Colors.textTertiary}
                              />
                            </View>
                          ) : null}

                          <Text style={styles.cardInputLabel}>Expected Guest Count</Text>
                          <TextInput 
                            style={styles.borderedInput}
                            value={mt.numberOfMembers}
                            keyboardType="numeric"
                            onChangeText={(t) => handleUpdateMealField(mt.id, 'numberOfMembers', t)}
                            placeholder="Guest count"
                            placeholderTextColor={Colors.textTertiary}
                          />

                          <View style={styles.menuSelectionHeader}>
                            <Text style={styles.cardInputLabel}>Selected Items ({mt.selectedMenuItems.length})</Text>
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                              <TouchableOpacity 
                                style={styles.quickCreateDishHeaderBtn}
                                onPress={() => {
                                  setQuickAddTargetMealId(mt.id);
                                  const sName = (mt.menuType || mt.eventName || '').toLowerCase();
                                  const defaultCat = sName.includes('breakfast') || sName.includes('tiffin') ? 'breakfast' : 'breakfast';
                                  setQuickAddDishForm({ name: '', nameTelugu: '', category: defaultCat });
                                  setQuickAddDishModalVisible(true);
                                }}
                                activeOpacity={0.7}
                              >
                                <Plus size={11} color={Colors.primaryDark} />
                                <Text style={styles.quickCreateDishHeaderBtnText}>+ New Dish</Text>
                              </TouchableOpacity>

                              <TouchableOpacity 
                                style={styles.commonItemsBtn}
                                onPress={() => handleSelectCommonItems(mt.id)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.commonItemsBtnText}>+ Common</Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Quick Add Menu Section */}
                          <View style={styles.quickAddSection}>
                            <Text style={styles.quickAddTitle}>⚡ Quick Add Dishes:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickAddScroll}>
                              {menuItems.filter(item => {
                                if (!item.isActive) return false;
                                const sessionName = (mt.menuType || mt.eventName || '').toLowerCase();
                                const cat = getItemSubCategory(item);
                                if (sessionName.includes('breakfast') || sessionName.includes('tiffin')) {
                                  return cat === 'breakfast' || cat === 'drinks' || cat === 'common';
                                }
                                return true;
                              }).slice(0, 15).map(item => {
                                const isSel = mt.selectedMenuItems.includes(item.id);
                                return (
                                  <TouchableOpacity
                                    key={item.id}
                                    onPress={() => {
                                      const newIds = isSel 
                                        ? mt.selectedMenuItems.filter(id => id !== item.id)
                                        : [...mt.selectedMenuItems, item.id];
                                      
                                      const newQuantities = { ...mt.itemQuantities };
                                      const newCustomizations = { ...mt.itemCustomizations };
                                      if (!isSel) {
                                        newQuantities[item.id] = '1';
                                        if (item.description) newCustomizations[item.id] = item.description;
                                      } else {
                                        delete newQuantities[item.id];
                                        delete newCustomizations[item.id];
                                      }

                                      handleUpdateMealField(mt.id, 'selectedMenuItems', newIds);
                                      handleUpdateMealField(mt.id, 'itemQuantities', newQuantities);
                                      handleUpdateMealField(mt.id, 'itemCustomizations', newCustomizations);
                                    }}
                                    style={[styles.quickItemChip, isSel && styles.quickItemChipActive]}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={[styles.quickItemChipText, isSel && styles.quickItemChipTextActive]}>
                                      {isSel ? '✓ ' : '+ '}{item.name}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          </View>

                          <TouchableOpacity 
                            style={styles.selectItemsBtn}
                            onPress={() => openItemSelector(mt.id, null)}
                            activeOpacity={0.8}
                          >
                            <Plus size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                            <Text style={styles.selectItemsBtnText}>Add / Search Dishes...</Text>
                          </TouchableOpacity>

                          {mt.selectedMenuItems.map(itemId => {
                            const dish = menuItems.find(i => i.id === itemId);
                            if (!dish) return null;
                            return (
                              <View key={itemId} style={styles.selectedItemRow}>
                                <View style={styles.selectedItemDetails}>
                                  <Text style={styles.selectedItemName}>{dish.name}</Text>
                                  {dish.nameTelugu && <Text style={styles.selectedItemTelugu}>({dish.nameTelugu})</Text>}
                                  
                                  <TextInput 
                                    style={styles.customizationInput}
                                    value={mt.itemCustomizations[itemId] || ''}
                                    onChangeText={(t) => {
                                      const updatedCustom = { ...mt.itemCustomizations, [itemId]: t };
                                      handleUpdateMealField(mt.id, 'itemCustomizations', updatedCustom);
                                    }}
                                    placeholder="Add custom notes (spice/sweet level)"
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

                                  <TouchableOpacity 
                                    onPress={() => {
                                      const newIds = mt.selectedMenuItems.filter(id => id !== itemId);
                                      handleUpdateMealField(mt.id, 'selectedMenuItems', newIds);
                                    }}
                                    style={styles.removeItemBtn}
                                    activeOpacity={0.7}
                                  >
                                    <X size={14} color={Colors.error} />
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
                  activeOpacity={0.8}
                >
                  <Plus size={16} color={Colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.addSessionBtnText}>Add Another Meal Session</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Section 3: Food Stalls */}
          <View style={[styles.accordionContainer, Shadows.small]}>
            {renderSectionHeader('3. Special Stalls & Counters', 'stalls', !showStalls || (stalls.length > 0 && stalls.every(s => !!s.category.trim())))}
            {expandedSection === 'stalls' && (
              <View style={styles.accordionBody}>
                {showStalls && stalls.map((stall, index) => {
                  const isStallExpanded = expandedStallCards[stall.id];
                  return (
                    <View key={stall.id} style={styles.card}>
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
                          <TouchableOpacity onPress={() => handleRemoveStall(stall.id)} style={styles.trashBtn} activeOpacity={0.7}>
                            <Trash2 size={16} color={Colors.error} />
                          </TouchableOpacity>
                          {isStallExpanded ? <ChevronUp size={16} color={Colors.textSecondary} /> : <ChevronDown size={16} color={Colors.textSecondary} />}
                        </View>
                      </TouchableOpacity>

                      {isStallExpanded && (
                        <View style={styles.cardBody}>
                          <Text style={styles.cardInputLabel}>Stall Category Name *</Text>
                          <TextInput 
                            style={styles.borderedInput}
                            value={stall.category}
                            onChangeText={(t) => handleUpdateStallField(stall.id, 'category', t)}
                            placeholder="e.g. Chaat Stall, Welcome Drinks"
                            placeholderTextColor={Colors.textTertiary}
                          />

                          <View style={styles.formRow}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                              <Text style={styles.cardInputLabel}>Plates Count</Text>
                              <TextInput 
                                style={styles.borderedInput}
                                value={stall.numberOfPlates}
                                keyboardType="numeric"
                                onChangeText={(t) => handleUpdateStallField(stall.id, 'numberOfPlates', t)}
                                placeholder="0"
                                placeholderTextColor={Colors.textTertiary}
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
                                placeholderTextColor={Colors.textTertiary}
                              />
                            </View>
                          </View>

                          <Text style={styles.cardInputLabel}>Manual Stall Amount (₹)</Text>
                          <TextInput 
                            style={styles.borderedInput}
                            value={stall.manualAmount}
                            keyboardType="numeric"
                            onChangeText={(t) => handleUpdateStallField(stall.id, 'manualAmount', t)}
                            placeholder="0.00"
                            placeholderTextColor={Colors.textTertiary}
                          />

                          <Text style={styles.cardInputLabel}>Stall Items ({stall.selectedMenuItems.length})</Text>
                          <TouchableOpacity 
                            style={styles.selectItemsBtn}
                            onPress={() => openItemSelector(null, stall.id)}
                            activeOpacity={0.8}
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
                                </View>
                                <TouchableOpacity 
                                  onPress={() => {
                                    const newIds = stall.selectedMenuItems.filter(id => id !== itemId);
                                    handleUpdateStallField(stall.id, 'selectedMenuItems', newIds);
                                  }}
                                  style={styles.removeItemBtn}
                                  activeOpacity={0.7}
                                >
                                  <X size={14} color={Colors.error} />
                                </TouchableOpacity>
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
                  activeOpacity={0.8}
                >
                  <Plus size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.addStallBtnText}>Add Food Stall / Counter</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Section 4: Financials & Payment */}
          <View style={[styles.accordionContainer, Shadows.small]}>
            {renderSectionHeader('4. Financials & Payment', 'financials', true)}
            {expandedSection === 'financials' && (
              <View style={styles.accordionBody}>
                <View style={styles.formRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>Transport (₹)</Text>
                    <View style={styles.textInputContainer}>
                      <Truck size={14} color={Colors.textTertiary} style={{ marginRight: 6 }} />
                      <TextInput 
                        style={styles.textInput}
                        value={transportCost}
                        keyboardType="numeric"
                        onChangeText={setTransportCost}
                        placeholder="0.00"
                        placeholderTextColor={Colors.textTertiary}
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Water Bottles (₹)</Text>
                    <View style={styles.textInputContainer}>
                      <DollarSign size={14} color={Colors.textTertiary} style={{ marginRight: 6 }} />
                      <TextInput 
                        style={styles.textInput}
                        value={waterBottlesCost}
                        keyboardType="numeric"
                        onChangeText={setWaterBottlesCost}
                        placeholder="0.00"
                        placeholderTextColor={Colors.textTertiary}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>Other Charges (₹)</Text>
                    <View style={styles.textInputContainer}>
                      <DollarSign size={14} color={Colors.textTertiary} style={{ marginRight: 6 }} />
                      <TextInput 
                        style={styles.textInput}
                        value={serviceCost}
                        keyboardType="numeric"
                        onChangeText={setServiceCost}
                        placeholder="0.00"
                        placeholderTextColor={Colors.textTertiary}
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Discount (₹)</Text>
                    <View style={styles.textInputContainer}>
                      <Percent size={14} color={Colors.textTertiary} style={{ marginRight: 6 }} />
                      <TextInput 
                        style={styles.textInput}
                        value={discount}
                        keyboardType="numeric"
                        onChangeText={setDiscount}
                        placeholder="0.00"
                        placeholderTextColor={Colors.textTertiary}
                      />
                    </View>
                  </View>
                </View>

                {/* Full Paid Toggle Box */}
                <View style={styles.fullPaidContainer}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fullPaidTitle}>Mark as Fully Paid</Text>
                    <Text style={styles.fullPaidSubtitle}>Auto-set advance equal to total (₹{totals.total.toLocaleString('en-IN')})</Text>
                  </View>
                  <Switch 
                    value={isFullyPaid}
                    onValueChange={(val) => {
                      setIsFullyPaid(val);
                      if (val) {
                        if (advancePaid !== String(totals.total)) {
                          setPreviousPartialAdvance(advancePaid);
                        }
                        setAdvancePaid(String(totals.total));
                      } else {
                        setAdvancePaid(previousPartialAdvance || '0');
                      }
                    }}
                    trackColor={{ false: Colors.border, true: Colors.success + '60' }}
                    thumbColor={isFullyPaid ? Colors.success : Colors.textTertiary}
                  />
                </View>

                <Text style={styles.inputLabel}>Advance / Amount Paid (₹)</Text>
                <View style={styles.textInputContainer}>
                  <DollarSign size={14} color={Colors.textTertiary} style={{ marginRight: 6 }} />
                  <TextInput 
                    style={styles.textInput}
                    value={advancePaid}
                    keyboardType="numeric"
                    onChangeText={(val) => {
                      setAdvancePaid(val);
                      const numVal = parseFloat(val) || 0;
                      if (numVal !== totals.total) {
                        setIsFullyPaid(false);
                        setPreviousPartialAdvance(val);
                      } else if (numVal === totals.total && totals.total > 0) {
                        setIsFullyPaid(true);
                      }
                    }}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>



                <Text style={styles.inputLabel}>Payment Method</Text>
                <View style={styles.paymentMethodRow}>
                  {PAYMENT_METHODS.map(method => (
                    <TouchableOpacity
                      key={method.value}
                      onPress={() => setPaymentMethod(method.value as any)}
                      style={[styles.paymentMethodTab, paymentMethod === method.value && styles.paymentMethodTabActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.paymentMethodText, paymentMethod === method.value && styles.paymentMethodTextActive]}>
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Internal Order Note</Text>
                <TextInput 
                  style={styles.textArea}
                  value={paymentNotes}
                  multiline={true}
                  numberOfLines={3}
                  onChangeText={setPaymentNotes}
                  placeholder="Notes about setup, specific preferences..."
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            )}
          </View>

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Floating Checkout Bar */}
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
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Check size={18} color={Colors.white} />
                <Text style={styles.submitBtnText}>{isEditing ? 'Save Changes' : 'Submit Order'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* CUSTOMER SELECTOR MODAL */}
        <Modal
          visible={customerModalVisible}
          animationType="slide"
          onRequestClose={() => setCustomerModalVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)} style={styles.modalCloseBtn} activeOpacity={0.7}>
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Client</Text>
              <TouchableOpacity 
                style={styles.modalCreateBtn} 
                onPress={() => {
                  setCustomerModalVisible(false);
                  setNewCustomerModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Plus size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBox}>
              <Search size={16} color={Colors.textTertiary} />
              <TextInput 
                style={styles.modalSearchInput}
                value={customerSearch}
                onChangeText={setCustomerSearch}
                placeholder="Search name or phone..."
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            {loadingCustomers ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={filteredCustomersList}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 18 }}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.customerListRow}
                    onPress={() => {
                      setCustomerId(item.id);
                      setCustomerModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.customerRowInfo}>
                      <Text style={styles.customerRowName}>{item.name}</Text>
                      <Text style={styles.customerRowPhone}>{item.phone}</Text>
                    </View>
                    {customerId === item.id && <Check size={16} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.centerBox}>
                    <Text style={styles.emptyMsg}>No clients found</Text>
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
                <Text style={styles.dialogTitle}>Quick Add Client</Text>
                <TouchableOpacity onPress={() => setNewCustomerModalVisible(false)} activeOpacity={0.7}>
                  <X size={18} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 280 }}>
                <Text style={styles.dialogInputLabel}>Full Name *</Text>
                <TextInput 
                  style={styles.dialogTextInput}
                  value={newCustomerForm.name}
                  onChangeText={(t) => setNewCustomerForm({ ...newCustomerForm, name: t })}
                  placeholder="Client name"
                  placeholderTextColor={Colors.textTertiary}
                />

                <Text style={styles.dialogInputLabel}>Phone Number *</Text>
                <TextInput 
                  style={styles.dialogTextInput}
                  value={newCustomerForm.phone}
                  keyboardType="phone-pad"
                  onChangeText={(t) => setNewCustomerForm({ ...newCustomerForm, phone: t })}
                  placeholder="10-digit phone"
                  placeholderTextColor={Colors.textTertiary}
                />

                <Text style={styles.dialogInputLabel}>Address *</Text>
                <TextInput 
                  style={[styles.dialogTextInput, { height: 50, textAlignVertical: 'top' }]}
                  value={newCustomerForm.address}
                  multiline={true}
                  onChangeText={(t) => setNewCustomerForm({ ...newCustomerForm, address: t })}
                  placeholder="Full delivery address"
                  placeholderTextColor={Colors.textTertiary}
                />
              </ScrollView>

              <TouchableOpacity 
                style={[styles.dialogSubmitBtn, isSavingCustomer && { opacity: 0.6 }]}
                onPress={handleSaveCustomer}
                disabled={isSavingCustomer}
                activeOpacity={0.8}
              >
                {isSavingCustomer ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.dialogSubmitText}>Save & Select</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ITEMS SELECTOR MODAL */}
        <Modal
          visible={itemModalVisible}
          animationType="slide"
          onRequestClose={() => setItemModalVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setItemModalVisible(false)} style={styles.modalCloseBtn} activeOpacity={0.7}>
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Menu Items</Text>
              <View style={{ width: 36 }} />
            </View>

            <View style={styles.modalSearchBox}>
              <Search size={16} color={Colors.textTertiary} />
              <TextInput 
                style={styles.modalSearchInput}
                value={itemSearch}
                onChangeText={setItemSearch}
                placeholder="Search dishes (English / Telugu)..."
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            {/* Food Category Filters */}
            <View style={{ marginBottom: 6 }}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.categoryScroll}
              >
                {FOOD_CATEGORIES.map(cat => {
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

            {loadingMenu ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={filteredMenuItemsList}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 18 }}
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
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemNameText, isSelected && { color: Colors.primaryDark }]}>{item.name}</Text>
                        {item.nameTelugu && <Text style={styles.itemTeluguText}>{item.nameTelugu}</Text>}
                        {item.price ? <Text style={styles.itemPriceText}>Base Price: ₹{item.price}</Text> : null}
                      </View>
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Check size={12} color={Colors.white} />}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={[styles.centerBox, { paddingVertical: 30 }]}>
                    <Text style={styles.emptyMsg}>
                      {itemSearch.trim() ? `No dish found for "${itemSearch}"` : 'No dishes in this category'}
                    </Text>
                    {itemSearch.trim().length > 0 && (
                      <TouchableOpacity
                        style={styles.dynamicCreateBtn}
                        onPress={() => {
                          setQuickAddTargetMealId(activeMealIdForItemSelection);
                          setQuickAddDishForm({ 
                            name: itemSearch.trim(), 
                            nameTelugu: '', 
                            category: selectedCategory !== 'all' ? selectedCategory : 'breakfast' 
                          });
                          setQuickAddDishModalVisible(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <Plus size={14} color={Colors.white} style={{ marginRight: 6 }} />
                        <Text style={styles.dynamicCreateBtnText}>Create "{itemSearch.trim()}" as New Dish</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                }
              />
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalFooterDoneBtn}
                onPress={() => setItemModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalFooterDoneText}>Done Selecting</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* QUICK CREATE NEW DISH MODAL */}
        <Modal
          visible={quickAddDishModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setQuickAddDishModalVisible(false)}
        >
          <View style={styles.dialogOverlay}>
            <View style={[styles.dialogContainer, Shadows.large]}>
              <View style={styles.dialogHeader}>
                <Text style={styles.dialogTitle}>Quick Create New Dish</Text>
                <TouchableOpacity onPress={() => setQuickAddDishModalVisible(false)} activeOpacity={0.7}>
                  <X size={18} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 320 }}>
                <Text style={styles.dialogInputLabel}>Dish Name (English) *</Text>
                <TextInput 
                  style={styles.dialogTextInput}
                  value={quickAddDishForm.name}
                  onChangeText={(t) => setQuickAddDishForm({ ...quickAddDishForm, name: t })}
                  placeholder="e.g. Ghee Karam Dosa"
                  placeholderTextColor={Colors.textTertiary}
                />

                <Text style={styles.dialogInputLabel}>Telugu Name (Optional)</Text>
                <TextInput 
                  style={styles.dialogTextInput}
                  value={quickAddDishForm.nameTelugu}
                  onChangeText={(t) => setQuickAddDishForm({ ...quickAddDishForm, nameTelugu: t })}
                  placeholder="e.g. నేతి కారం దోశ"
                  placeholderTextColor={Colors.textTertiary}
                />

                <Text style={styles.dialogInputLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 4 }}>
                  {FOOD_CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                    const isSel = quickAddDishForm.category === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setQuickAddDishForm({ ...quickAddDishForm, category: cat.id })}
                        style={[styles.categoryChip, isSel && styles.categoryChipActive]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.categoryChipText, isSel && styles.categoryChipTextActive]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </ScrollView>

              <TouchableOpacity 
                style={[styles.dialogSubmitBtn, isCreatingMenuItem && { opacity: 0.6 }]}
                onPress={handleQuickAddDish}
                disabled={isCreatingMenuItem}
                activeOpacity={0.8}
              >
                {isCreatingMenuItem ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.dialogSubmitText}>Save & Add to Session</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    padding: 18,
  },
  accordionContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.white,
  },
  sectionHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  indicatorNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  sectionTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  accordionBody: {
    padding: 14,
    backgroundColor: Colors.white,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  customerSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerSelectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 44,
    paddingHorizontal: 12,
  },
  customerSelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  quickAddBtn: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  customerInfoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: 10,
    marginBottom: 12,
  },
  customerAddressText: {
    flex: 1,
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: '600',
    lineHeight: 16,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 44,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  typeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  typeToggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Radii.sm,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.sm,
  },
  typeBtnActive: {
    backgroundColor: Colors.white,
    ...Shadows.small,
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeBtnTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.background,
  },
  cardIndexText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  cardTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 1,
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trashBtn: {
    padding: 4,
  },
  cardBody: {
    padding: 12,
  },
  cardInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  typeGridBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeGridBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeGridBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeGridBtnTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  smallInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 40,
    paddingHorizontal: 10,
  },
  smallInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
  },
  smallInputText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  borderedInput: {
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 13,
    color: Colors.text,
    marginBottom: 10,
  },
  pricingToggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Radii.sm,
    padding: 2,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pricingMethodBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: Radii.sm,
  },
  pricingMethodBtnActive: {
    backgroundColor: Colors.white,
    ...Shadows.small,
  },
  pricingMethodBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pricingMethodBtnTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  menuSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  commonItemsBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  commonItemsBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  quickCreateDishHeaderBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  quickCreateDishHeaderBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  dynamicCreateBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.md,
    marginTop: 12,
    ...Shadows.small,
  },
  dynamicCreateBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  selectItemsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
    height: 38,
    borderRadius: Radii.md,
    marginBottom: 10,
  },
  selectItemsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  selectedItemRow: {
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 10,
    marginBottom: 6,
  },
  selectedItemDetails: {
    flex: 1,
  },
  selectedItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  selectedItemTelugu: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  customizationInput: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    height: 28,
    fontSize: 11,
    color: Colors.primaryDark,
    marginTop: 2,
    padding: 0,
  },
  selectedItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
    gap: 10,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
    marginRight: 4,
  },
  qtyInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.sm,
    width: 44,
    height: 26,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    padding: 0,
    color: Colors.text,
  },
  removeItemBtn: {
    padding: 4,
  },
  addSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    height: 44,
    borderRadius: Radii.md,
    ...Shadows.small,
    marginTop: 6,
  },
  addSessionBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  addStallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
    borderWidth: 1,
    height: 44,
    borderRadius: Radii.md,
    marginTop: 6,
  },
  addStallBtnText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  fullPaidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary + '30',
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 12,
  },
  fullPaidTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  fullPaidSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  paymentMethodTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paymentMethodTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  paymentMethodTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  textArea: {
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    fontSize: 13,
    color: Colors.text,
    height: 70,
    textAlignVertical: 'top',
  },
  totalsBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vertDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  totalVal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  balanceVal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    height: 44,
    paddingHorizontal: 18,
    borderRadius: Radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Shadows.small,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  modalCreateBtn: {
    padding: 4,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    marginHorizontal: 18,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: Colors.text,
  },
  categoryScroll: {
    paddingHorizontal: 18,
    gap: 6,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  quickAddSection: {
    marginVertical: 8,
  },
  quickAddTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  quickAddScroll: {
    gap: 6,
  },
  quickItemChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickItemChipActive: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  quickItemChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  quickItemChipTextActive: {
    color: Colors.success,
    fontWeight: '700',
  },
  customerListRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  customerRowInfo: {},
  customerRowName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  customerRowPhone: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  itemRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  itemNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  itemTeluguText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  itemPriceText: {
    fontSize: 10,
    color: Colors.primaryDark,
    fontWeight: '600',
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  modalFooterDoneBtn: {
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  modalFooterDoneText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  dialogInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dialogTextInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 13,
    color: Colors.text,
    marginBottom: 10,
  },
  dialogSubmitBtn: {
    backgroundColor: Colors.primary,
    height: 42,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    ...Shadows.small,
  },
  dialogSubmitText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMsg: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
});

export default NewOrderScreen;
