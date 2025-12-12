import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOwner } from '../../context/OwnerContext';
import api from '../../utils/api';

const { width } = Dimensions.get('window');

interface PaymentData {
  customers: any[];
  totalEarnings: number;
  paidCount: number;
  dueCount: number;
}

export default function PaymentsScreen() {
  const router = useRouter();
  const { owner } = useOwner();
  const [data, setData] = useState<PaymentData>({
    customers: [],
    totalEarnings: 0,
    paidCount: 0,
    dueCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (owner?.id) {
      loadPayments();
    }
  }, [owner?.id]);

  const loadPayments = async () => {
    if (!owner?.id) return;
    try {
      setLoading(true);
      const result = await api.getOwnerPayments(owner.id);
      setData(result);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  }, [owner?.id]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calculate pie chart percentages
  const total = data.paidCount + data.dueCount;
  const paidPercent = total > 0 ? (data.paidCount / total) * 100 : 0;
  const duePercent = total > 0 ? (data.dueCount / total) * 100 : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4B5563" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments & Earnings</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />
          }
        >
          {/* Total Earnings Card */}
          <View style={styles.earningsCard}>
            <View style={styles.earningsIconContainer}>
              <Ionicons name="wallet" size={32} color="#F59E0B" />
            </View>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
            <Text style={styles.earningsAmount}>₹{data.totalEarnings.toLocaleString()}</Text>
            <Text style={styles.earningsSubtext}>From {data.paidCount} paid customers</Text>
          </View>

          {/* Payment Status Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Payment Status</Text>
            
            {/* Simple Bar Chart */}
            <View style={styles.barChartContainer}>
              <View style={styles.barRow}>
                <Text style={styles.barLabel}>Paid</Text>
                <View style={styles.barBackground}>
                  <View style={[styles.barFill, styles.barPaid, { width: `${paidPercent}%` }]} />
                </View>
                <Text style={styles.barValue}>{data.paidCount}</Text>
              </View>
              <View style={styles.barRow}>
                <Text style={styles.barLabel}>Due</Text>
                <View style={styles.barBackground}>
                  <View style={[styles.barFill, styles.barDue, { width: `${duePercent}%` }]} />
                </View>
                <Text style={styles.barValue}>{data.dueCount}</Text>
              </View>
            </View>

            {/* Pie representation */}
            <View style={styles.pieContainer}>
              <View style={styles.pieChart}>
                <View style={[styles.pieSlice, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.pieText}>{Math.round(paidPercent)}%</Text>
                </View>
              </View>
              <View style={styles.pieLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>Paid ({data.paidCount})</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>Due ({data.dueCount})</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Customer Payments List */}
          <Text style={styles.sectionTitle}>Customer Payments</Text>
          
          {data.customers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No payment records</Text>
            </View>
          ) : (
            data.customers.map((customer) => (
              <View key={customer.id} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{customer.name?.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.customerName}>{customer.name}</Text>
                    <Text style={styles.pgTitle}>{customer.pg_title}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: customer.status === 'Paid' ? '#ECFDF5' : '#FEF2F2' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: customer.status === 'Paid' ? '#059669' : '#DC2626' }
                    ]}>
                      {customer.status || 'Pending'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.paymentDetails}>
                  <View style={styles.paymentDetailItem}>
                    <Text style={styles.detailLabel}>Amount</Text>
                    <Text style={styles.detailValue}>₹{(customer.amount || 0).toLocaleString()}</Text>
                  </View>
                  <View style={styles.paymentDetailItem}>
                    <Text style={styles.detailLabel}>Room Type</Text>
                    <Text style={styles.detailValue}>{customer.room_type || 'N/A'}</Text>
                  </View>
                  <View style={styles.paymentDetailItem}>
                    <Text style={styles.detailLabel}>Paid Date</Text>
                    <Text style={styles.detailValue}>{formatDate(customer.paid_date)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4B5563',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  earningsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  earningsIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  earningsSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  barChartContainer: {
    gap: 12,
    marginBottom: 20,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barLabel: {
    width: 40,
    fontSize: 13,
    color: '#6B7280',
  },
  barBackground: {
    flex: 1,
    height: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 12,
  },
  barPaid: {
    backgroundColor: '#10B981',
  },
  barDue: {
    backgroundColor: '#EF4444',
  },
  barValue: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  pieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  pieChart: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pieSlice: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  pieLegend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 12,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F59E0B20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  pgTitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paymentDetailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 40,
  },
});
