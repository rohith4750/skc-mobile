import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Receipt, CreditCard, Clock, Search, ArrowLeft, Filter, Download, FileText } from 'lucide-react-native';
import { Colors, Shadows, Radii } from '../theme/colors';
import { useToast } from '../components/Toast';
import { useGetBillsQuery } from '../services/adminApi';
import { shareOrderPdf } from '../utils/pdfSharing';
import { Bill } from '../types';

const BillsScreen = ({ navigation }: any) => {
  const { showToast } = useToast();
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const { 
    data: bills = [], 
    isLoading, 
    isFetching, 
    refetch 
  } = useGetBillsQuery(undefined, {
    refetchOnMountOrArgChange: true
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      const status = bill.status?.toUpperCase();
      let matchesStatus = true;
      if (filter === 'PAID') matchesStatus = status === 'PAID';
      else if (filter === 'UNPAID') matchesStatus = status === 'UNPAID' || status === 'PARTIAL';

      const billDate = new Date(bill.order?.eventDate || bill.createdAt);
      const matchesMonth = selectedMonth === 0 || (billDate.getMonth() + 1) === selectedMonth;
      const matchesYear = selectedYear === 0 || billDate.getFullYear() === selectedYear;

      const customerName = bill.order?.customer?.name?.toLowerCase() || '';
      const phone = bill.order?.customer?.phone || '';
      const query = searchQuery.toLowerCase();
      const matchesSearch = customerName.includes(query) || phone.includes(query);

      return matchesStatus && matchesMonth && matchesYear && matchesSearch;
    });
  }, [bills, filter, selectedMonth, selectedYear, searchQuery]);

  const financialStats = useMemo(() => {
    const total = filteredBills.reduce((acc, b) => acc + (Number(b.totalAmount || b.order?.totalAmount || 0)), 0);
    const paid = filteredBills.reduce((acc, b) => acc + (Number(b.paidAmount || 0)), 0);
    const due = Math.max(0, total - paid);
    return { total, paid, due };
  }, [filteredBills]);

  const getStatusConfig = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return { color: Colors.success, bg: Colors.successLight };
      case 'PARTIAL': return { color: Colors.info, bg: Colors.infoLight };
      case 'UNPAID': return { color: Colors.error, bg: Colors.errorLight };
      default: return { color: Colors.textSecondary, bg: Colors.surfaceSubtle };
    }
  };

  const renderBillItem = ({ item }: { item: Bill }) => {
    const status = getStatusConfig(item.status);
    return (
      <TouchableOpacity 
        style={[styles.billCard, Shadows.small]} 
        activeOpacity={0.8}
        onPress={() => {
          if (item.order) {
            navigation.navigate('Orders', {
              screen: 'OrderDetail',
              params: { order: item.order }
            });
          }
        }}
      >
        <View style={styles.billHeader}>
          <View style={styles.idBox}>
            <Text style={styles.idLabel}>BILL NO.</Text>
            <Text style={styles.idValue}>#{item.id.slice(-6).toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.financialRow}>
           <View style={styles.finItem}>
              <Text style={styles.finLabel}>Total Amount</Text>
               <Text style={styles.finValue}>₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}</Text>
           </View>
           <View style={styles.finItem}>
              <Text style={styles.finLabel}>Paid</Text>
               <Text style={[styles.finValue, { color: Colors.success }]}>₹{Number(item.paidAmount || 0).toLocaleString('en-IN')}</Text>
           </View>
           <View style={styles.finItem}>
              <Text style={styles.finLabel}>Due</Text>
               <Text style={[styles.finValue, { color: Colors.error }]}>₹{Number(item.remainingAmount || item.dueAmount || 0).toLocaleString('en-IN')}</Text>
           </View>
        </View>

        <View style={styles.cardFooter}>
           <View style={styles.footerInfo}>
              <Clock size={12} color={Colors.textTertiary} />
              <Text style={styles.footerText}>
                 {item.paymentHistory && item.paymentHistory.length > 0 
                   ? `Updated ${new Date(item.paymentHistory[item.paymentHistory.length-1].date).toLocaleDateString()}`
                   : 'Awaiting payment'}
              </Text>
           </View>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={async () => {
                if (item.order) {
                  await shareOrderPdf(item.order, 'bill', false, item);
                } else {
                  showToast('Order details not available', 'error');
                }
              }}
              activeOpacity={0.7}
            >
              <Download size={14} color={Colors.primary} />
              <Text style={styles.actionBtnText}>PDF</Text>
            </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Financials</Text>
            <TouchableOpacity 
              style={[styles.filterToggle, isFiltersVisible && styles.filterToggleActive]} 
              onPress={() => setIsFiltersVisible(!isFiltersVisible)}
              activeOpacity={0.7}
            >
              <Filter size={18} color={isFiltersVisible ? Colors.white : Colors.textSecondary} />
            </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customer or phone..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        <View style={styles.statsCardGrid}>
           <View style={[styles.mainStatCard, Shadows.small]}>
             <View style={styles.mainStatInfo}>
               <Text style={styles.mainStatLabel}>Total Invoiced</Text>
               <Text style={styles.mainStatValue}>₹{financialStats.total.toLocaleString('en-IN')}</Text>
             </View>
             <CreditCard size={28} color={Colors.primary} />
           </View>

           <View style={styles.secondaryStatsRow}>
             <View style={[styles.subStatCard, Shadows.small]}>
               <Text style={styles.subStatLabel}>Collected</Text>
               <Text style={[styles.subStatValue, { color: Colors.success }]}>₹{financialStats.paid.toLocaleString('en-IN')}</Text>
             </View>
             <View style={[styles.subStatCard, Shadows.small]}>
               <Text style={styles.subStatLabel}>Outstanding</Text>
               <Text style={[styles.subStatValue, { color: Colors.error }]}>₹{financialStats.due.toLocaleString('en-IN')}</Text>
             </View>
           </View>
        </View>

        {isFiltersVisible && (
          <View style={styles.collapsibleFilters}>
            <View style={styles.filterRow}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.filterScrollContent}
              >
                {['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setSelectedMonth(i)}
                    style={[styles.monthTab, selectedMonth === i && styles.activeMonthTab]}
                  >
                    <Text style={[styles.monthTabText, selectedMonth === i && styles.activeMonthTabText]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.secondaryFilterRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
                <View style={styles.yearPicker}>
                    <Text style={styles.pickerLabel}>Year:</Text>
                    {[2024, 2025, 2026].map(y => (
                      <TouchableOpacity 
                        key={y}
                        onPress={() => setSelectedYear(y)}
                        style={[styles.miniTab, selectedYear === y && styles.activeMiniTab]}
                      >
                        <Text style={[styles.miniTabText, selectedYear === y && styles.activeMiniTabText]}>{y}</Text>
                      </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.vertDivider} />

                {['ALL', 'PAID', 'UNPAID'].map((f) => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFilter(f as any)}
                    style={[styles.filterTab, filter === f && styles.activeFilterTab]}
                  >
                    <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity 
              style={styles.monthlyDownloadBtn}
              onPress={() => {
                const url = `https://www.skccaterers.in/api/bills/export?month=${selectedMonth}&year=${selectedYear}`;
                Linking.openURL(url).catch(() => showToast('Failed to export', 'error'));
              }}
              activeOpacity={0.8}
            >
              <FileText size={16} color={Colors.white} />
              <Text style={styles.monthlyDownloadText}>Export Monthly Report</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredBills}
          renderItem={renderBillItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollArea}
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
              <Receipt size={48} color={Colors.border} />
              <Text style={styles.emptyMsg}>No financial records found</Text>
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
    paddingBottom: 16,
  },
  header: {
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
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  filterToggle: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterToggleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  collapsibleFilters: {
    marginTop: 12,
    backgroundColor: Colors.background,
    borderRadius: Radii.lg,
    paddingVertical: 12,
    marginHorizontal: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  monthlyDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 14,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: Radii.md,
    gap: 8,
    ...Shadows.small,
  },
  monthlyDownloadText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  statsCardGrid: {
    marginHorizontal: 18,
    gap: 10,
  },
  mainStatCard: {
    backgroundColor: Colors.secondary,
    padding: 16,
    borderRadius: Radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainStatInfo: {
    flex: 1,
  },
  mainStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 2,
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  subStatCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  subStatValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    marginHorizontal: 18,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    height: 44,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  filterRow: {
    paddingVertical: 4,
  },
  secondaryFilterRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  filterScrollContent: {
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 6,
  },
  monthTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeMonthTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  monthTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeMonthTabText: {
    color: Colors.white,
    fontWeight: '700',
  },
  yearPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pickerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  miniTab: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeMiniTab: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  miniTabText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeMiniTabText: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  filterTab: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeFilterTab: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeFilterText: {
    color: Colors.primaryDark,
  },
  vertDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  scrollArea: {
    padding: 18,
    paddingBottom: 40,
  },
  billCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  idBox: {},
  idLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  idValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  financialRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  finItem: {
    flex: 1,
    alignItems: 'center',
  },
  finLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  finValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  actionBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
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

export default BillsScreen;
