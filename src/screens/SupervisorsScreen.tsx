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
} from 'react-native';
import { UserCheck, Plus, Search, Phone, Mail, Building2, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { Colors, Shadows, Radii } from '../theme/colors';
import { useGetSupervisorsQuery } from '../services/adminApi';

const SupervisorsScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { 
    data: supervisors = [], 
    isLoading, 
    isFetching, 
    refetch 
  } = useGetSupervisorsQuery(undefined, {
    refetchOnMountOrArgChange: true
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const filteredSupervisors = useMemo(() => {
    return supervisors.filter(sv => {
      const query = searchQuery.toLowerCase();
      return (
        sv.name?.toLowerCase().includes(query) ||
        sv.phone?.toLowerCase().includes(query) ||
        sv.cateringServiceName?.toLowerCase().includes(query)
      );
    });
  }, [supervisors, searchQuery]);

  const renderSupervisorItem = ({ item }: { item: any }) => (
    <View style={[styles.svCard, Shadows.small]}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase() || 'S'}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.svName}>{item.name}</Text>
          <View style={styles.serviceRow}>
            <Building2 size={12} color={Colors.primary} />
            <Text style={styles.serviceText}>{item.cateringServiceName || 'SKC Catering'}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.isActive ? Colors.successLight : Colors.errorLight }]}>
          <Text style={[styles.statusText, { color: item.isActive ? Colors.success : Colors.error }]}>
            {item.isActive ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>
      </View>

      <View style={styles.contactSection}>
        <View style={styles.contactRow}>
          <Phone size={13} color={Colors.textTertiary} />
          <Text style={styles.contactText}>{item.phone || 'No phone'}</Text>
        </View>
        <View style={styles.contactRow}>
          <Mail size={13} color={Colors.textTertiary} />
          <Text style={styles.contactText}>{item.email || 'No email'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.viewOrdersBtn} activeOpacity={0.7}>
        <Text style={styles.viewOrdersText}>Assigned Orders</Text>
        <ChevronRight size={14} color={Colors.primaryDark} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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
            <Text style={styles.title}>Supervisors</Text>
            <Text style={styles.subtitle}>{supervisors.length} active supervisors</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => Alert.alert('Add Supervisor', 'This feature is currently read-only on mobile.')}
            activeOpacity={0.8}
          >
            <Plus size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or contact..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredSupervisors}
          renderItem={renderSupervisorItem}
          keyExtractor={(item) => item.id}
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
              <UserCheck size={48} color={Colors.border} />
              <Text style={styles.emptyText}>No supervisors found</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  header: {
    backgroundColor: Colors.white,
    paddingTop: 52,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 16,
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
  listContent: {
    padding: 18,
    paddingBottom: 40,
  },
  svCard: {
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
    width: 38,
    height: 38,
    borderRadius: 19,
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
  svName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  serviceText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  contactSection: {
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    padding: 10,
    gap: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  viewOrdersBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  viewOrdersText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
});

export default SupervisorsScreen;
