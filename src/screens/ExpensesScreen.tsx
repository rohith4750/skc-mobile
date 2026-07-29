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
import * as Lucide from 'lucide-react-native';
import { Colors, Shadows, Radii } from '../theme/colors';
import { useGetExpensesQuery } from '../services/adminApi';

const ExpensesScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { 
    data: expenses = [], 
    isLoading, 
    isFetching, 
    refetch 
  } = useGetExpensesQuery(undefined, {
    refetchOnMountOrArgChange: true
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const query = searchQuery.toLowerCase();
      return (
        expense.description?.toLowerCase().includes(query) ||
        expense.recipient?.toLowerCase().includes(query) ||
        expense.category?.toLowerCase().includes(query)
      );
    });
  }, [expenses, searchQuery]);

  const renderExpenseItem = ({ item }: { item: any }) => (
    <View style={[styles.expenseCard, Shadows.small]}>
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Lucide.Tag size={10} color={Colors.primaryDark} />
          <Text style={styles.categoryText}>{item.category?.toUpperCase()}</Text>
        </View>
        <Text style={styles.expenseDate}>{new Date(item.paymentDate).toLocaleDateString()}</Text>
      </View>

      <View style={styles.mainInfo}>
        <View style={styles.recipientRow}>
          <Lucide.User size={14} color={Colors.textTertiary} />
          <Text style={styles.recipientName}>{item.recipient || 'Standard Recipient'}</Text>
        </View>
        <Text style={styles.description}>{item.description || 'No description provided'}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>AMOUNT PAID</Text>
          <Text style={styles.amountValue}>₹{item.amount?.toLocaleString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.paymentStatus === 'paid' ? Colors.successLight : Colors.warningLight }]}>
          <Text style={[styles.statusText, { color: item.paymentStatus === 'paid' ? Colors.success : Colors.warning }]}>
            {item.paymentStatus?.toUpperCase() || 'PAID'}
          </Text>
        </View>
      </View>
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
            <Lucide.ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Expenses</Text>
            <Text style={styles.subtitle}>{expenses.length} records logged</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => Alert.alert('Coming Soon', 'Expense creation is coming in the next update.')}
            activeOpacity={0.8}
          >
            <Lucide.Plus size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Lucide.Search size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search category, recipient..."
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
          data={filteredExpenses}
          renderItem={renderExpenseItem}
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
              <Lucide.IndianRupee size={48} color={Colors.border} />
              <Text style={styles.emptyText}>No expense records found</Text>
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
  expenseCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  expenseDate: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  mainInfo: {
    marginBottom: 12,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 10,
  },
  amountBox: {},
  amountLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
});

export default ExpensesScreen;
