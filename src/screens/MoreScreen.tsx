import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
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
  ArrowLeft
} from 'lucide-react-native';
import { Colors, Shadows } from '../theme/colors';
import Constants from 'expo-constants';
import { useAuth } from '../services/AuthContext';

const MenuSection = ({ title, items }: any) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.card}>
      {items.map((item: any, index: number) => (
        <React.Fragment key={item.id}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.6}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
              <item.icon size={20} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <ChevronRight size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
          {index < items.length - 1 && <View style={styles.divider} />}
        </React.Fragment>
      ))}
    </View>
  </View>
);

const MoreScreen = ({ navigation }: any) => {
  const { signOut, user } = useAuth();
  const isAdmin = ['admin', 'superadmin'].includes(user?.role?.toLowerCase() || '');

  const businessModules = [
    { id: 'Customers', label: 'Customers', icon: Users, color: Colors.info, onPress: () => navigation.navigate('MoreStack', { screen: 'Customers' }), adminOnly: true },
    { id: 'Stock', label: 'Menu & Stock', icon: ShoppingBag, color: Colors.success, onPress: () => navigation.navigate('MoreStack', { screen: 'Stock' }), adminOnly: true },
    { id: 'Materials', label: 'Inventory', icon: Package, color: Colors.warning, onPress: () => navigation.navigate('MoreStack', { screen: 'Materials' }), adminOnly: true },
    { id: 'Expenses', label: 'Expenses', icon: CreditCard, color: Colors.error, onPress: () => navigation.navigate('MoreStack', { screen: 'Expenses' }), adminOnly: true },
    { id: 'Supervisors', label: 'Workforce', icon: UserCheck, color: Colors.secondary, onPress: () => navigation.navigate('MoreStack', { screen: 'Supervisors' }), adminOnly: true },
  ].filter(module => !module.adminOnly || isAdmin);

  const appSettings = [
    { id: 'Delivery', label: 'Delivery Settings', icon: Truck, color: Colors.primary, onPress: () => {} },
    { id: 'Notifications', label: 'Notifications', icon: Bell, color: '#FFAC33', onPress: () => {} },
    { id: 'Security', label: 'Security', icon: ShieldCheck, color: '#34A853', onPress: () => {} },
    { id: 'Help', label: 'Help & Support', icon: HelpCircle, color: '#4285F4', onPress: () => {} },
    { id: 'Settings', label: 'App Settings', icon: Settings, color: Colors.textSecondary, onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
            style={styles.backBtn}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>More</Text>
        </View>

        {/* User Profile Summary */}
        <View style={[styles.profileCard, Shadows.small]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase() || 'S'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.username || 'SKC User'}</Text>
            <Text style={styles.userRole}>{user?.role?.toUpperCase() || 'ADMIN'}</Text>
          </View>
        </View>

        {businessModules.length > 0 && (
          <MenuSection title="Business Modules" items={businessModules} />
        )}
        <MenuSection title="System & App" items={appSettings} />

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={signOut}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0 (Build 47)</Text>
        <View style={{ height: 40 }} />
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 75,
  },
  backBtn: {
    padding: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginRight: 15,
    ...Shadows.small,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '800',
  },
  profileInfo: {
    marginLeft: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  userRole: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 15,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 70,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '10',
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
    marginBottom: 20,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.error,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textTertiary,
  }
});

export default MoreScreen;
