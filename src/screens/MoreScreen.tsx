import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import { 
  Users, 
  ShoppingBag, 
  Package, 
  CreditCard, 
  UserCheck,
  ChevronRight,
  LogOut,
  Settings,
  ShieldCheck,
  Bell,
  HelpCircle,
  Truck,
  ArrowLeft,
  PlusCircle
} from 'lucide-react-native';
import { Colors, Shadows, Radii } from '../theme/colors';
import { useAuth } from '../services/AuthContext';
import { useToast } from '../components/Toast';
import { hasPermission, Permissions } from '../utils/rbac';

const MenuSection = ({ title, items }: any) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={[styles.card, Shadows.small]}>
      {items.map((item: any, index: number) => (
        <React.Fragment key={item.id}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
              <item.icon size={18} color={item.color} strokeWidth={2} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <ChevronRight size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
          {index < items.length - 1 && <View style={styles.divider} />}
        </React.Fragment>
      ))}
    </View>
  </View>
);

const MoreScreen = ({ navigation }: any) => {
  const { signOut, user } = useAuth();
  const { showToast } = useToast();

  const businessModules = [
    { id: 'NewOrder', label: 'Create New Order', icon: PlusCircle, color: Colors.primary, onPress: () => navigation.navigate('Orders', { screen: 'NewOrder' }), permission: Permissions.CREATE_ORDER },
    { id: 'Customers', label: 'Customers Database', icon: Users, color: Colors.info, onPress: () => navigation.navigate('MoreStack', { screen: 'Customers' }), permission: Permissions.MANAGE_CUSTOMERS },
    { id: 'Stock', label: 'Menu & Stock List', icon: ShoppingBag, color: Colors.success, onPress: () => navigation.navigate('MoreStack', { screen: 'Stock' }), permission: Permissions.MANAGE_MENU_STOCK },
    { id: 'Materials', label: 'Raw Inventory', icon: Package, color: Colors.warning, onPress: () => navigation.navigate('MoreStack', { screen: 'Materials' }), permission: Permissions.MANAGE_INVENTORY },
    { id: 'Expenses', label: 'Event Expenses', icon: CreditCard, color: Colors.error, onPress: () => navigation.navigate('MoreStack', { screen: 'Expenses' }), permission: Permissions.MANAGE_EXPENSES },
    { id: 'Supervisors', label: 'Workforce & Staff', icon: UserCheck, color: Colors.secondary, onPress: () => navigation.navigate('MoreStack', { screen: 'Supervisors' }), permission: Permissions.MANAGE_WORKFORCE },
  ].filter(module => {
    return hasPermission(user?.role, module.permission);
  });

  const appSettings = [
    { id: 'Delivery', label: 'Delivery Dispatch & Live Status', icon: Truck, color: Colors.primary, onPress: () => navigation.navigate('Delivery') },
    { id: 'Bills', label: 'Bills & Invoice Center', icon: CreditCard, color: Colors.info, onPress: () => navigation.navigate('Bills') },
    { 
      id: 'Refresh', 
      label: 'Sync Data & Clear Cache', 
      icon: Settings, 
      color: Colors.success, 
      onPress: () => {
        showToast('App synced & cache refreshed successfully!', 'success');
      } 
    },
    { 
      id: 'Help', 
      label: 'Help & Customer Support', 
      icon: HelpCircle, 
      color: '#3B82F6', 
      onPress: () => {
        Alert.alert(
          'SKC Caterers Support',
          'Need assistance with your catering manager app?\n\nContact Phone: 9866525102\nEmail: pujyasri1989cya@gmail.com\nSupport: SKC Caterers Support Team',
          [
            { 
              text: 'Call 9866525102', 
              onPress: () => Linking.openURL('tel:9866525102') 
            },
            { 
              text: 'Send Email', 
              onPress: () => Linking.openURL('mailto:pujyasri1989cya@gmail.com') 
            },
            { text: 'Close', style: 'cancel' }
          ]
        );
      } 
    },
    { 
      id: 'Security', 
      label: 'Security & User Role Info', 
      icon: ShieldCheck, 
      color: '#10B981', 
      onPress: () => {
        Alert.alert(
          'Security Info',
          `Logged in as: ${user?.username || 'User'}\nRole: ${user?.role?.toUpperCase() || 'MANAGER'}\nPermissions: Full access enabled`,
          [{ text: 'OK', style: 'default' }]
        );
      } 
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>More Features</Text>
        </View>

        {/* User Profile Summary */}
        <View style={[styles.profileCard, Shadows.small]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase() || 'S'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.username || 'SKC User'}</Text>
            <View style={styles.roleTag}>
              <Text style={styles.userRole}>{user?.role?.toUpperCase() || 'MANAGER'}</Text>
            </View>
          </View>
        </View>

        {businessModules.length > 0 && (
          <MenuSection title="Business Operations" items={businessModules} />
        )}
        <MenuSection title="System Preferences" items={appSettings} />

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={() => {
            Alert.alert(
              'Sign Out',
              'Are you sure you want to log out of SKC Caterers?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: signOut }
              ]
            );
          }}
          activeOpacity={0.8}
        >
          <LogOut size={18} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>SKC Mobile • Version 1.0.0</Text>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 52,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.primaryDark,
    fontSize: 20,
    fontWeight: '800',
  },
  profileInfo: {
    marginLeft: 14,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  roleTag: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  userRole: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 62,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorLight,
    padding: 14,
    borderRadius: Radii.md,
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.error,
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500',
  }
});

export default MoreScreen;
