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
import { Menu, LogOut, LayoutDashboard, PlusCircle, User, ShoppingBag, Receipt, Package, CreditCard, UserCheck, X } from 'lucide-react-native';
import { Colors, Shadows, Radii } from '../theme/colors';
import { useAuth } from '../services/AuthContext';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.78, 320);

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
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: open ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const menuItems = [
    { id: 'Orders', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'NewOrder', icon: PlusCircle, label: 'Create Order' },
    { id: 'Customers', icon: User, label: 'Customers' },
    { id: 'Stock', icon: ShoppingBag, label: 'Menu Items' },
    { id: 'Materials', icon: Package, label: 'Materials' },
    { id: 'Bills', icon: Receipt, label: 'Financials' },
    { id: 'Expenses', icon: CreditCard, label: 'Expenses' },
    { id: 'Supervisors', icon: UserCheck, label: 'Supervisors' },
  ];

  React.useEffect(() => {
    toggleDrawer(false);
  }, [activeTab]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Content */}
      <View style={{ flex: 1 }}>{children}</View>

      {/* Global Overlay */}
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
            <TouchableOpacity 
              style={styles.closeBtn}
              onPress={() => toggleDrawer(false)}
            >
              <X size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.avatarContainer}>
               <Image source={require('../assets/icon.png')} style={styles.avatar} />
            </View>
            <Text style={styles.userName}>{user?.username || 'SKC Admin'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.userRole}>{user?.role?.toUpperCase() || 'MANAGER'}</Text>
            </View>
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
                  activeOpacity={0.7}
                >
                  <Icon size={20} color={isActive ? Colors.primary : Colors.textSecondary} strokeWidth={isActive ? 2.2 : 1.8} />
                  <Text style={[styles.menuText, isActive && styles.activeMenuText]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.drawerFooter}>
            <TouchableOpacity style={styles.logoutButton} onPress={() => { toggleDrawer(false); signOut(); }}>
              <LogOut size={18} color={Colors.error} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Floating Menu Trigger */}
      {!isOpen && (
        <View style={styles.headerAccess}>
           <TouchableOpacity onPress={() => toggleDrawer(true)} style={styles.menuTrigger} activeOpacity={0.8}>
              <Menu size={22} color={Colors.text} strokeWidth={2} />
           </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerAccess: {
    position: 'absolute',
    top: 50,
    left: 18,
    zIndex: 10,
  },
  menuTrigger: {
    width: 42,
    height: 42,
    borderRadius: Radii.md,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  overlayArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.white,
    zIndex: 101,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    ...Shadows.medium,
  },
  drawerHeader: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  roleBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    marginTop: 6,
  },
  userRole: {
    fontSize: 10,
    color: Colors.primaryDark,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    marginBottom: 4,
  },
  activeMenuItem: {
    backgroundColor: Colors.primaryLight,
  },
  menuText: {
    fontSize: 14,
    marginLeft: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeMenuText: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    backgroundColor: Colors.errorLight,
  },
  logoutText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600',
  },
});

export default LayoutShell;
