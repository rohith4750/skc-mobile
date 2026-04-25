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
import * as Lucide from 'lucide-react-native';
import { Colors, Shadows } from '../theme/colors';
import api from '../services/api';

import { useGetExpensesQuery } from '../services/adminApi';

const ExpensesScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Performance Data Fetching
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
    <View style={styles.expenseCard}>
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Lucide.Tag size={12} color={Colors.primary} />
          <Text style={styles.categoryText}>{item.category?.toUpperCase()}</Text>
        </View>
        <Text style={styles.expenseDate}>{new Date(item.paymentDate).toLocaleDateString()}</Text>
      </View>

      <View style={styles.mainInfo}>
        <View style={styles.recipientRow}>
          <Lucide.User size={16} color={Colors.textSecondary} />
          <Text style={styles.recipientName}>{item.recipient || 'Anonymous'}</Text>
        </View>
        <Text style={styles.description}>{item.description || 'No description'}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>PAID AMOUNT</Text>
          <Text style={styles.amountValue}>₹{item.amount?.toLocaleString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.paymentStatus === 'paid' ? '#E8F5E9' : '#FFF3E0' }]}>
          <Text style={[styles.statusText, { color: item.paymentStatus === 'paid' ? '#2E7D32' : '#EF6C00' }]}>
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
          >
            <Lucide.ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Expenses</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => Alert.alert('Coming Soon', 'Expense creation is coming in the next update.')}
          >
            <Lucide.Plus size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Lucide.Search size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search category, recipient..."
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
          data={filteredExpenses}
          renderItem={renderExpenseItem}
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
              <Lucide.IndianRupee size={48} color={Colors.border} />
              <Text style={styles.emptyText}>No expenses recorded</Text>
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
  expenseCard: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  expenseDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  mainInfo: {
    marginBottom: 16,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    paddingTop: 12,
  },
  amountBox: {
  },
  amountLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default ExpensesScreen;
