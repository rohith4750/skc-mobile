import React, { useState, useCallback, useMemo } from 'react';
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
import { Colors, Shadows, Radii } from '../theme/colors';
import { useGetCustomersQuery, Customer } from '../services/customerApi';

const CustomersScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');

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
    return (
      <View style={[styles.customerCard, Shadows.small]}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase() || 'C'}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.customerName}>{item.name}</Text>
            <View style={styles.phoneTag}>
               <Lucide.Phone size={10} color={Colors.textTertiary} />
               <Text style={styles.customerPhone}>{item.phone || 'No Mobile'}</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.circleBtn}
              onPress={() => handleEdit(item)}
              activeOpacity={0.7}
            >
              <Lucide.Edit2 size={14} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.circleBtn}
              onPress={() => Alert.alert('Delete', 'Delete feature migration in progress...')}
              activeOpacity={0.7}
            >
              <Lucide.Trash2 size={14} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardContent}>
           <View style={styles.infoBox}>
              <Lucide.MapPin size={12} color={Colors.textTertiary} />
              <Text style={styles.addressText} numberOfLines={1}>{item.address || 'No address provided'}</Text>
           </View>
        </View>

        <View style={styles.cardFooter}>
           <TouchableOpacity 
             style={styles.secondaryBtn}
             onPress={() => item.phone && handleCall(item.phone)}
             activeOpacity={0.8}
           >
              <Lucide.Phone size={14} color={Colors.white} />
              <Text style={styles.btnTextWhite}>Call</Text>
           </TouchableOpacity>
           
           <TouchableOpacity 
             style={styles.primaryBtn}
             onPress={() => handleViewOrders(item.id)}
             activeOpacity={0.7}
           >
              <Lucide.History size={14} color={Colors.primaryDark} />
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
            activeOpacity={0.7}
          >
            <Lucide.ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenTitle}>Clients</Text>
            <Text style={styles.screenSub}>{customers.length} contacts saved</Text>
          </View>
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={handleAdd}
            activeOpacity={0.8}
          >
            <Lucide.Plus size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Lucide.Search size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name or phone..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={Colors.textTertiary}
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
              <Lucide.User size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No Contacts Found</Text>
              <Text style={styles.emptyBody}>Try a different search query or add a new client.</Text>
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
    backgroundColor: Colors.background,
  },
  topSection: {
    backgroundColor: Colors.white,
    paddingTop: 52,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 16,
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
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  screenSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    marginHorizontal: 18,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    height: 44,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  listArea: {
    padding: 18,
    paddingBottom: 40,
  },
  customerCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  phoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  customerPhone: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  circleBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardContent: {
    marginBottom: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: Radii.md,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  addressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    height: 38,
    borderRadius: Radii.md,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    height: 38,
    borderRadius: Radii.md,
    ...Shadows.small,
  },
  btnTextWhite: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  btnTextPrimary: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
  },
  emptyBody: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 30,
  },
});

export default CustomersScreen;
