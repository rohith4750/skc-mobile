import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Alert,
  Linking,
} from 'react-native';
import * as Lucide from 'lucide-react-native';
import { Colors, Shadows } from '../theme/colors';
import { useGetCustomersQuery } from '../services/customerApi';
import { Customer } from '../services/customerApi';

const CustomersScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Performance Data Fetching
  const { 
    data: customers = [], 
    isLoading, 
    isFetching, 
    refetch 
  } = useGetCustomersQuery(undefined, {
    refetchOnMountOrArgChange: true
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const query = searchQuery.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query)
      );
    });
  }, [customers, searchQuery]);

  const handleEdit = useCallback((customer: Customer) => {
    navigation.navigate('CustomerForm', { customer });
  }, [navigation]);

  const handleAdd = useCallback(() => {
    navigation.navigate('CustomerForm');
  }, [navigation]);

  const handleCall = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone}`);
  }, []);

  const handleViewOrders = useCallback((id: string) => {
    navigation.navigate('Orders', { customerId: id });
  }, [navigation]);

  const renderCustomerItem = ({ item }: { item: Customer }) => {
    const avatarColor = [Colors.primary, '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B'][Math.floor(Math.random() * 5)];
    
    return (
      <View style={styles.customerCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: avatarColor + '15' }]}>
            <Text style={[styles.avatarText, { color: avatarColor }]}>{item.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.customerName}>{item.name}</Text>
            <View style={styles.phoneTag}>
               <Lucide.Phone size={10} color={Colors.textSecondary} />
               <Text style={styles.customerPhone}>{item.phone || 'No Mobile'}</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.circleBtn}
              onPress={() => handleEdit(item)}
            >
              <Lucide.Edit2 size={16} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.circleBtn}
              onPress={() => {
                 // Delete handled through API mutations (to be implemented)
                 Alert.alert('Delete', 'Delete feature migration in progress...');
              }}
            >
              <Lucide.Trash2 size={16} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardContent}>
           <View style={styles.infoBox}>
              <Lucide.MapPin size={14} color={Colors.textSecondary} />
              <Text style={styles.addressText} numberOfLines={1}>{item.address || 'No Address Provided'}</Text>
           </View>
        </View>

        <View style={styles.cardFooter}>
           <TouchableOpacity 
             style={styles.secondaryBtn}
             onPress={() => item.phone && handleCall(item.phone)}
           >
              <Lucide.Phone size={16} color={Colors.white} />
              <Text style={styles.btnTextWhite}>Call Now</Text>
           </TouchableOpacity>
           
           <TouchableOpacity 
             style={styles.primaryBtn}
             onPress={() => handleViewOrders(item.id)}
           >
              <Lucide.History size={16} color={Colors.primary} />
              <Text style={styles.btnTextPrimary}>Orders</Text>
           </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity 
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
            style={styles.backBtn}
          >
            <Lucide.ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenTitle}>Clients</Text>
            <Text style={styles.screenSub}>{customers.length} Contacts Saved</Text>
          </View>
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={handleAdd}
          >
            <Lucide.Plus size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Lucide.Search size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Find by name or number..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listArea}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Lucide.User size={60} color="#E2E8F0" />
              <Text style={styles.emptyTitle}>No Contacts Found</Text>
              <Text style={styles.emptyBody}>Try a different search or add a new client.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  topSection: {
    backgroundColor: Colors.white,
    paddingTop: 75,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Shadows.medium,
    zIndex: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  backBtn: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginRight: 15,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  screenSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    height: 52,
    marginBottom: 24,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  listArea: {
    padding: 20,
    paddingBottom: 110,
  },
  customerCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    ...Shadows.small,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  phoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  customerPhone: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    gap: 8,
  },
  addressText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary + '10',
    height: 44,
    borderRadius: 12,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: 12,
    ...Shadows.small,
  },
  btnTextWhite: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  btnTextPrimary: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 16,
  },
  emptyBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});

export default CustomersScreen;
