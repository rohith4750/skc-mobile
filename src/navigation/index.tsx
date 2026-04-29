import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import { 
  Home as HomeIcon, 
  ShoppingBag, 
  Receipt, 
  Truck, 
  MoreHorizontal
} from 'lucide-react-native';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import BillsScreen from '../screens/BillsScreen';
import DeliveryScreen from '../screens/DeliveryScreen';
import MoreScreen from '../screens/MoreScreen';

// Secondary Modules (for More stack)
import CustomersScreen from '../screens/CustomersScreen';
import CustomerFormScreen from '../screens/CustomerFormScreen';
import StockScreen from '../screens/StockScreen';
import MenuItemFormScreen from '../screens/MenuItemFormScreen';
import MaterialsScreen from '../screens/MaterialsScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import SupervisorsScreen from '../screens/SupervisorsScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

import { useAuth } from '../services/AuthContext';
import { Colors } from '../theme/colors';
import { hasPermission, Permissions } from '../utils/rbac';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- Nested Stacks ---

const OrdersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="OrdersHome" component={OrdersScreen} />
    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
  </Stack.Navigator>
);

const MoreStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="MoreGrid" component={MoreScreen} />
    <Stack.Screen name="Customers" component={CustomersScreen} />
    <Stack.Screen name="CustomerForm" component={CustomerFormScreen} />
    <Stack.Screen name="Stock" component={StockScreen} />
    <Stack.Screen name="MenuItemForm" component={MenuItemFormScreen} />
    <Stack.Screen name="Materials" component={MaterialsScreen} />
    <Stack.Screen name="Expenses" component={ExpensesScreen} />
    <Stack.Screen name="Supervisors" component={SupervisorsScreen} />
  </Stack.Navigator>
);

// --- Main Navigation ---

const MainTabs = () => {
  const { user } = useAuth();
  
  const canViewBills = hasPermission(user?.role, Permissions.VIEW_BILLS_TAB);
  const canViewOrders = hasPermission(user?.role, Permissions.VIEW_ORDERS_TAB);
  const canViewDelivery = hasPermission(user?.role, Permissions.VIEW_DELIVERY_TAB);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Home') return <HomeIcon size={24} color={color} strokeWidth={focused ? 2.5 : 2} />;
          if (route.name === 'Orders') return <ShoppingBag size={24} color={color} strokeWidth={focused ? 2.5 : 2} />;
          if (route.name === 'Bills') return <Receipt size={24} color={color} strokeWidth={focused ? 2.5 : 2} />;
          if (route.name === 'Delivery') return <Truck size={24} color={color} strokeWidth={focused ? 2.5 : 2} />;
          if (route.name === 'MoreStack') return <MoreHorizontal size={24} color={color} strokeWidth={focused ? 2.5 : 2} />;
          return null;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: -4,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      {canViewOrders && (
        <Tab.Screen name="Orders" component={OrdersStack} />
      )}
      {canViewBills && (
        <Tab.Screen name="Bills" component={BillsScreen} />
      )}
      {canViewDelivery && (
        <Tab.Screen name="Delivery" component={DeliveryScreen} />
      )}
      <Tab.Screen 
        name="MoreStack" 
        component={MoreStack} 
        options={{ tabBarLabel: 'More' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
      {token === null ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
