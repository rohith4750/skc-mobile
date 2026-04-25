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
  Switch,
  TextInput,
  ScrollView,
} from 'react-native';
import * as Lucide from 'lucide-react-native';
import { Colors, Shadows } from '../theme/colors';
import { useGetStockQuery, useUpdateStockItemMutation } from '../services/stockApi';
import { StockItem } from '../services/stockApi';

const CATEGORIES = ['ALL', 'LUNCH', 'SNACKS', 'BREAKFAST', 'RETAIL'];

const StockScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  // New High-Performance Data Handling
  const { 
    data: stock = [], 
    isLoading, 
    isFetching, 
    refetch 
  } = useGetStockQuery(undefined, {
    refetchOnMountOrArgChange: true
  });

  const [updateStockItem] = useUpdateStockItemMutation();

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  const handleToggleStatus = useCallback(async (id: string, currentStatus: boolean) => {
    try {
      await updateStockItem({ id, isAvailable: !currentStatus }).unwrap();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  }, [updateStockItem]);

  const filteredMenu = useMemo(() => {
    return stock.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const itemType = item.category || 'General';
      const matchesCategory = activeCategory === 'ALL' || 
        itemType.toUpperCase() === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [stock, searchQuery, activeCategory]);

  const handleEdit = useCallback((item: StockItem) => {
    navigation.navigate('MenuItemForm', { item });
  }, [navigation]);

  const handleAdd = useCallback(() => {
    navigation.navigate('MenuItemForm');
  }, [navigation]);

  const renderMenuItem = ({ item }: { item: StockItem }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => handleEdit(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemIconContainer}>
        <Lucide.Layers size={20} color={item.isAvailable ? Colors.primary : Colors.textSecondary} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemType}>{item.category || 'General'}</Text>
        <Text style={styles.itemPrice}>₹{item.price?.toLocaleString() || '0'}</Text>
      </View>
      
      <View style={styles.actionContainer}>
        <Switch
          value={item.isAvailable}
          onValueChange={() => handleToggleStatus(item.id, item.isAvailable)}
          trackColor={{ false: '#DEE2E6', true: Colors.primary + '40' }}
          thumbColor={item.isAvailable ? Colors.primary : '#ADB5BD'}
        />
        <Text style={[styles.statusLabel, { color: item.isAvailable ? Colors.success : Colors.textSecondary }]}>
          {item.isAvailable ? 'LIVE' : 'OFF'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <TouchableOpacity 
              onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
              style={styles.backBtn}
            >
              <Lucide.ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Menu & Stock</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAdd}
            >
              <Lucide.Plus size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchBox}>
           <Lucide.Search size={18} color="#999" />
           <TextInput
              style={styles.searchInput}
              placeholder="Search dishes..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#999"
           />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat}
              style={[styles.catPill, activeCategory === cat && styles.activeCatPill]}
              onPress={() => handleCategoryChange(cat)}
            >
              <Text style={[styles.catText, activeCategory === cat && styles.activeCatText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredMenu}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isFetching} 
              onRefresh={onRefresh} 
              tintColor={Colors.primary} 
            />
          }
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Lucide.ShoppingBag size={50} color="#DDD" />
              <Text style={styles.emptyMsg}>No items found</Text>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...Shadows.medium,
    zIndex: 5,
  },
  header: {
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  backBtn: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginRight: 15,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 25,
    paddingHorizontal: 15,
    borderRadius: 15,
    height: 50,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  catScroll: {
    marginBottom: 20,
  },
  catContent: {
    paddingHorizontal: 25,
    gap: 10,
  },
  catPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  activeCatPill: {
    backgroundColor: Colors.primary,
  },
  catText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeCatText: {
    color: Colors.white,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    ...Shadows.small,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
  },
  itemType: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  actionContainer: {
    alignItems: 'center',
    marginLeft: 10,
    gap: 4,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '900',
  },
  centerBox: {
    flex: 1,
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMsg: {
    marginTop: 15,
    fontSize: 16,
    color: '#CCC',
    fontWeight: '700',
  },
});

export default StockScreen;
