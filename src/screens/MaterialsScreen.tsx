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
import { Package, Plus, Search, AlertTriangle, History, ArrowLeft } from 'lucide-react-native';
import { Colors, Shadows } from '../theme/colors';
import api from '../services/api';

import { useGetMaterialsQuery } from '../services/adminApi';

const MaterialsScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Performance Data Fetching
  const { 
    data: stock = [], 
    isLoading, 
    isFetching, 
    refetch 
  } = useGetMaterialsQuery(undefined, {
    refetchOnMountOrArgChange: true
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const filteredStock = useMemo(() => {
    return stock.filter(item => {
      const query = searchQuery.toLowerCase();
      return (
        item.name?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      );
    });
  }, [stock, searchQuery]);

  const renderStockItem = ({ item }: { item: any }) => {
    const isLow = item.minStock !== null && item.currentStock <= item.minStock;
    return (
      <View style={styles.stockCard}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
             <Package size={20} color={isLow ? Colors.error : Colors.primary} />
          </View>
          <View style={styles.headerInfo}>
             <Text style={styles.itemName}>{item.name}</Text>
             <Text style={styles.categoryText}>{item.category || 'General'}</Text>
          </View>
          {isLow && (
            <View style={styles.lowBadge}>
               <AlertTriangle size={10} color={Colors.error} />
               <Text style={styles.lowText}>LOW</Text>
            </View>
          )}
        </View>

        <View style={styles.stockDetails}>
           <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>CURRENT STOCK</Text>
              <Text style={[styles.detailValue, isLow && { color: Colors.error }]}>
                {item.currentStock} {item.unit || 'units'}
              </Text>
           </View>
           <View style={styles.detailDivider} />
           <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>MINIMUM REQUIRED</Text>
              <Text style={styles.detailValue}>{item.minStock || '-'}</Text>
           </View>
        </View>
      </View>
    );
  };

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
          <Text style={styles.title}>Materials</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => Alert.alert('Add Material', 'Manage materials on the web dashboard.')}
          >
            <Plus size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search materials..."
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
          data={filteredStock}
          renderItem={renderStockItem}
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
              <Package size={48} color={Colors.border} />
              <Text style={styles.emptyText}>No materials found</Text>
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
  stockCard: {
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
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  lowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lowText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.error,
  },
  stockDetails: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#DEE2E6',
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default MaterialsScreen;
