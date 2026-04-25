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
} from 'react-native';
import { UserCheck, Plus, Search, Phone, Mail, Building2, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { Colors, Shadows } from '../theme/colors';
import api from '../services/api';

import { useGetSupervisorsQuery } from '../services/adminApi';

const SupervisorsScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Performance Data Fetching
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
    <View style={styles.svCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.svName}>{item.name}</Text>
          <View style={styles.serviceRow}>
            <Building2 size={12} color={Colors.primary} />
            <Text style={styles.serviceText}>{item.cateringServiceName || 'SKC Catering'}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#E8F5E9' : '#FFEBEE' }]}>
          <Text style={[styles.statusText, { color: item.isActive ? '#2E7D32' : '#C62828' }]}>
            {item.isActive ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>
      </View>

      <View style={styles.contactSection}>
        <View style={styles.contactRow}>
          <Phone size={14} color={Colors.textSecondary} />
          <Text style={styles.contactText}>{item.phone || 'No phone'}</Text>
        </View>
        <View style={styles.contactRow}>
          <Mail size={14} color={Colors.textSecondary} />
          <Text style={styles.contactText}>{item.email || 'No email'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.viewOrdersBtn}>
        <Text style={styles.viewOrdersText}>Assigned Orders</Text>
        <ChevronRight size={16} color={Colors.primary} />
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
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Supervisors</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => Alert.alert('Add Supervisor', 'This feature is currently read-only on mobile.')}
          >
            <Plus size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or contact..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={Colors.textSecondary}
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
          refreshControl={
            <RefreshControl 
              refreshing={isFetching} 
              onRefresh={onRefresh} 
              colors={[Colors.primary]} 
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
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  header: {
    backgroundColor: Colors.white,
    paddingTop: 75,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  backBtn: {
    padding: 8,
    backgroundColor: '#F1F3F5',
    borderRadius: 12,
    marginRight: 15,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F5',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 44,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  svCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...Shadows.small,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  svName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  serviceText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  contactSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  viewOrdersBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  viewOrdersText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default SupervisorsScreen;
