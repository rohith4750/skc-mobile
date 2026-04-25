import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { Menu, X, LogOut, LayoutDashboard, User, Settings, ShoppingBag, Receipt, Package, CreditCard, UserCheck } from 'lucide-react-native';
import { Colors, Shadows } from '../theme/colors';
import { useAuth } from '../services/AuthContext';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

import { InteractionManager } from 'react-native';

const LayoutShell = React.memo(({ children, activeTab, onTabPress }: any) => {
  const { signOut, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const toggleDrawer = (open: boolean) => {
    setIsOpen(open);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: open ? 0 : -DRAWER_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: open ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const menuItems = [
    { id: 'Orders', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'Customers', icon: User, label: 'Customers' },
    { id: 'Stock', icon: ShoppingBag, label: 'Menu Items' },
    { id: 'Materials', icon: Package, label: 'Materials' },
    { id: 'Bills', icon: Receipt, label: 'Financials' },
    { id: 'Expenses', icon: CreditCard, label: 'Expenses' },
    { id: 'Supervisors', icon: UserCheck, label: 'Supervisors' },
  ];

  // Automatically close drawer when active tab changes
  React.useEffect(() => {
    toggleDrawer(false);
  }, [activeTab]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Content */}
      <View style={{ flex: 1 }}>{children}</View>

      {/* Global Overlay for closing */}
      {isOpen && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => toggleDrawer(false)}
          style={styles.overlayArea}
        >
          <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
        </TouchableOpacity>
      )}

      {/* Drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.drawerHeader}>
            <View style={styles.avatarContainer}>
               <Image source={require('../assets/icon.png')} style={styles.avatar} />
            </View>
            <Text style={styles.userName}>{user?.username || 'SKC Admin'}</Text>
            <Text style={styles.userRole}>{user?.role?.toUpperCase() || 'MANAGER'}</Text>
          </View>

          <View style={styles.drawerContent}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, isActive && styles.activeMenuItem]}
                  onPress={() => {
                    toggleDrawer(false);
                    onTabPress(item.id);
                  }}
                >
                  <Icon size={22} color={isActive ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.menuText, isActive && styles.activeMenuText]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.drawerFooter}>
            <TouchableOpacity style={styles.logoutButton} onPress={() => { toggleDrawer(false); signOut(); }}>
              <LogOut size={20} color={Colors.error} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Trigger (Floating or Header integrated) */}
      {!isOpen && (
        <View style={styles.headerAccess}>
           <TouchableOpacity onPress={() => toggleDrawer(true)} style={styles.menuTrigger}>
              <Menu size={24} color={Colors.text} />
           </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  headerAccess: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  menuTrigger: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  overlayArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.white,
    zIndex: 101,
    ...Shadows.medium,
  },
  drawerHeader: {
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  userRole: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 1,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 8,
  },
  activeMenuItem: {
    backgroundColor: Colors.primary + '15',
  },
  menuText: {
    fontSize: 15,
    marginLeft: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeMenuText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  drawerFooter: {
    padding: 30,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    color: Colors.error,
    fontWeight: '600',
  },
});

export default LayoutShell;
