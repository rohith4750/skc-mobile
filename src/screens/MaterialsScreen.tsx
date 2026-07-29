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
import { Package, Plus, Search, AlertTriangle, ArrowLeft } from 'lucide-react-native';
import { Colors, Shadows, Radii } from '../theme/colors';
import { useGetMaterialsQuery } from '../services/adminApi';

const MaterialsScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');

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
      <View style={[styles.stockCard, Shadows.small]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: isLow ? Colors.errorLight : Colors.primaryLight }]}>
             <Package size={18} color={isLow ? Colors.error : Colors.primaryDark} />
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
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Inventory</Text>
            <Text style={styles.subtitle}>{stock.length} materials tracked</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => Alert.alert('Add Material', 'Manage materials on the web dashboard.')}
            activeOpacity={0.8}
          >
            <Plus size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search materials..."
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
          data={filteredStock}
          renderItem={renderStockItem}
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
  stockCard: {
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
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  categoryText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  lowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.errorLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  lowText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.error,
  },
  stockDetails: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderLight,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
});

export default MaterialsScreen;
