import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Image,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const LOGO = require('../assets/icon.png');
import { Receipt, CreditCard, Clock, AlertTriangle, Search, ArrowLeft, Filter, Download, FileText, ChevronDown, ChevronUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows } from '../theme/colors';
import { useToast } from '../components/Toast';
import { useGetBillsQuery } from '../services/adminApi';
import { exportBillToPDF } from '../utils/pdfGenerator';
import { Bill } from '../types';

const BillsScreen = ({ navigation }: any) => {
  const { showToast } = useToast();
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  // New High-Performance Data Fetching
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
      // Status Filter
      const status = bill.status?.toUpperCase();
      let matchesStatus = true;
      if (filter === 'PAID') matchesStatus = status === 'PAID';
      else if (filter === 'UNPAID') matchesStatus = status === 'UNPAID' || status === 'PARTIAL';

      // Date Filter (matches Web version logic)
      const billDate = new Date(bill.order?.eventDate || bill.createdAt);
      const matchesMonth = selectedMonth === 0 || (billDate.getMonth() + 1) === selectedMonth;
      const matchesYear = selectedYear === 0 || billDate.getFullYear() === selectedYear;

      // Search Filter
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
    // Calculate due as total - paid for perfect summary consistency
    const due = Math.max(0, total - paid);
    return { total, paid, due };
  }, [filteredBills]);

  const getStatusConfig = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return { color: '#2E7D32', bg: '#E8F5E9' };
      case 'PARTIAL': return { color: '#1565C0', bg: '#E3F2FD' };
      case 'UNPAID': return { color: Colors.error, bg: Colors.error + '10' };
      default: return { color: Colors.textSecondary, bg: '#F1F3F5' };
    }
  };

  const renderBillItem = ({ item }: { item: Bill }) => {
    const status = getStatusConfig(item.status);
    return (
      <TouchableOpacity style={styles.billCard} activeOpacity={0.8}>
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
               <Text style={[styles.finValue, { color: '#2E7D32' }]}>₹{Number(item.paidAmount || 0).toLocaleString('en-IN')}</Text>
           </View>
           <View style={styles.finItem}>
              <Text style={styles.finLabel}>Due</Text>
               <Text style={[styles.finValue, { color: Colors.error }]}>₹{Number(item.remainingAmount || item.dueAmount || 0).toLocaleString('en-IN')}</Text>
           </View>
        </View>

        <View style={styles.cardFooter}>
           <View style={styles.footerInfo}>
              <Clock size={12} color={Colors.textSecondary} />
              <Text style={styles.footerText}>
                 {item.paymentHistory.length > 0 
                   ? `Updated ${new Date(item.paymentHistory[item.paymentHistory.length-1].date).toLocaleDateString()}`
                   : 'Waiting for payment'}
              </Text>
           </View>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={async () => {
                const success = await exportBillToPDF(item);
                if (!success) showToast('Could not generate PDF', 'error');
              }}
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
            >
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Image source={LOGO} style={styles.headerLogo} resizeMode="contain" />
            </View>
            <Text style={styles.title}>Financials</Text>
            <TouchableOpacity 
              style={[styles.filterToggle, isFiltersVisible && styles.filterToggleActive]} 
              onPress={() => setIsFiltersVisible(!isFiltersVisible)}
            >
              <Filter size={20} color={isFiltersVisible ? Colors.white : Colors.textSecondary} />
            </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer or phone..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.premiumStatsCard}>
           <LinearGradient
             colors={[Colors.primary, Colors.primaryDark]}
             start={{ x: 0, y: 0 }}
             end={{ x: 1, y: 1 }}
             style={styles.mainStatCard}
           >
             <View style={styles.mainStatInfo}>
               <Text style={styles.mainStatLabel}>Total Bill Amount</Text>
               <Text style={styles.mainStatValue}>₹{financialStats.total.toLocaleString('en-IN')}</Text>
             </View>
             <CreditCard size={32} color={Colors.white} style={{ opacity: 0.3 }} />
           </LinearGradient>

           <View style={styles.secondaryStatsRow}>
             <View style={[styles.subStatCard, { borderLeftColor: '#2E7D32' }]}>
               <Text style={styles.subStatLabel}>Collected</Text>
               <Text style={[styles.subStatValue, { color: '#2E7D32' }]}>₹{financialStats.paid.toLocaleString('en-IN')}</Text>
             </View>
             <View style={[styles.subStatCard, { borderLeftColor: Colors.error }]}>
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
            >
              <FileText size={18} color={Colors.white} />
              <Text style={styles.monthlyDownloadText}>Download {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth-1]} Report</Text>
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
              <Receipt size={60} color="#EEE" />
              <Text style={styles.emptyMsg}>No financial records yet</Text>
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
    paddingBottom: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 25,
  },
  backBtn: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginRight: 15,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    marginLeft: 10,
  },
  filterToggle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterToggleActive: {
    backgroundColor: Colors.primary,
  },
  collapsibleFilters: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingVertical: 15,
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthlyDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
    paddingVertical: 12,
    borderRadius: 15,
    gap: 10,
    ...Shadows.small,
  },
  monthlyDownloadText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
    padding: 4,
  },
  headerLogo: {
    width: '100%',
    height: '100%',
  },
  premiumStatsCard: {
    marginHorizontal: 25,
    marginBottom: 25,
    gap: 12,
  },
  mainStatCard: {
    padding: 24,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.medium,
  },
  mainStatInfo: {
    flex: 1,
  },
  mainStatLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mainStatValue: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.white,
    marginTop: 4,
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  subStatCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 20,
    borderLeftWidth: 4,
    ...Shadows.small,
  },
  subStatLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  subStatValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 25,
    paddingHorizontal: 15,
    borderRadius: 15,
    height: 46,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  filterRow: {
    paddingVertical: 5,
    backgroundColor: Colors.white,
  },
  secondaryFilterRow: {
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  filterScrollContent: {
    paddingHorizontal: 25,
    alignItems: 'center',
    gap: 8,
  },
  monthTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  activeMonthTab: {
    backgroundColor: Colors.primary,
  },
  monthTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeMonthTabText: {
    color: Colors.white,
  },
  yearPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginRight: 4,
  },
  miniTab: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  activeMiniTab: {
    backgroundColor: Colors.primary + '20',
  },
  miniTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeMiniTabText: {
    color: Colors.primary,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  activeFilterTab: {
    backgroundColor: Colors.primary + '15',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  activeFilterText: {
    color: Colors.primary,
  },
  vertDivider: {
    width: 1,
    height: 15,
    backgroundColor: '#EEE',
    marginHorizontal: 5,
  },
  statBox: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#EEE',
    marginHorizontal: 20,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2E7D32',
  },
  scrollArea: {
    padding: 20,
    paddingBottom: 100,
  },
  billCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    ...Shadows.small,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  idBox: {
  },
  idLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  idValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  financialRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  finItem: {
    flex: 1,
    alignItems: 'center',
  },
  finLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  finValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  actionBtn: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
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
    color: '#DDD',
    fontWeight: '700',
  },
});

export default BillsScreen;
