import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Lucide from 'lucide-react-native';
import { Colors, Shadows, Radii } from '../theme/colors';
import { useToast } from '../components/Toast';
import { useGetMenuQuery, useUpdateMenuItemMutation, MenuItem as StockItem } from '../services/menuApi';
import { exportMenuToPDF } from '../utils/pdfGenerator';

const CATEGORIES = ['ALL', 'LUNCH', 'SNACKS', 'BREAKFAST', 'RETAIL'];

const StockScreen = ({ navigation }: any) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  const { 
    data: stock = [], 
    isLoading, 
    isFetching, 
    refetch 
  } = useGetMenuQuery(undefined, {
    refetchOnMountOrArgChange: true
  });

  const [updateStockItem] = useUpdateMenuItemMutation();

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
      await updateStockItem({ id, isActive: !currentStatus }).unwrap();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  }, [updateStockItem]);

  const filteredMenu = useMemo(() => {
    return stock.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.nameTelugu?.includes(searchQuery);
      
      const itemTypes = item.type || [];
      const matchesCategory = activeCategory === 'ALL' || 
        itemTypes.some(t => t.toUpperCase() === activeCategory);
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
      style={[styles.itemCard, Shadows.small]}
      onPress={() => handleEdit(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemIconContainer}>
        <Lucide.Layers size={18} color={item.isActive ? Colors.primaryDark : Colors.textTertiary} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemType}>{(item.type || []).join(', ') || 'General'}</Text>
        <Text style={styles.itemPrice}>₹{item.price?.toLocaleString() || '0'}</Text>
      </View>
      
      <View style={styles.actionContainer}>
        <Switch
          value={item.isActive}
          onValueChange={() => handleToggleStatus(item.id, item.isActive)}
          trackColor={{ false: Colors.border, true: Colors.primaryLight }}
          thumbColor={item.isActive ? Colors.primary : Colors.textTertiary}
        />
        <Text style={[styles.statusLabel, { color: item.isActive ? Colors.success : Colors.textTertiary }]}>
          {item.isActive ? 'LIVE' : 'OFF'}
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
              activeOpacity={0.7}
            >
              <Lucide.ArrowLeft size={20} color={Colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Menu & Stock</Text>
              <Text style={styles.subtitle}>{stock.length} total items listed</Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAdd}
              activeOpacity={0.8}
            >
              <Lucide.Plus size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchBox}>
           <Lucide.Search size={18} color={Colors.textTertiary} />
           <TextInput
              style={styles.searchInput}
              placeholder="Search dishes or items..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor={Colors.textTertiary}
           />
           <TouchableOpacity 
             onPress={async () => {
               const success = await exportMenuToPDF(stock);
               if (!success) showToast('Failed to export menu', 'error');
             }}
             style={{ padding: 4 }}
             activeOpacity={0.7}
           >
             <Lucide.FileDown size={18} color={Colors.primary} />
           </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat}
              style={[styles.catPill, activeCategory === cat && styles.activeCatPill]}
              onPress={() => handleCategoryChange(cat)}
              activeOpacity={0.7}
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
              <Lucide.ShoppingBag size={48} color={Colors.border} />
              <Text style={styles.emptyMsg}>No menu items found</Text>
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
  header: {
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  addButton: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    marginHorizontal: 18,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    height: 44,
    gap: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  catScroll: {
    marginBottom: 14,
  },
  catContent: {
    paddingHorizontal: 18,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeCatPill: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeCatText: {
    color: Colors.white,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  itemType: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  actionContainer: {
    alignItems: 'center',
    marginLeft: 8,
    gap: 2,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  centerBox: {
    flex: 1,
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMsg: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
});

export default StockScreen;
