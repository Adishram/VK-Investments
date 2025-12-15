import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOwner } from '../../context/OwnerContext';
import api from '../../utils/api';

const { width } = Dimensions.get('window');

interface Stats {
  totalPGs: number;
  totalCustomers: number;
  totalEarnings: number;
  paidPayments: number;
  pendingPayments: number;
}

export default function OwnerDashboard() {
  const router = useRouter();
  const { owner, logout } = useOwner();
  const [stats, setStats] = useState<Stats>({
    totalPGs: 0,
    totalCustomers: 0,
    totalEarnings: 0,
    paidPayments: 0,
    pendingPayments: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (owner?.id) {
      loadStats();
    }
  }, [owner?.id]);

  const loadStats = async () => {
    if (!owner?.id) return;
    try {
      const data = await api.getOwnerStats(owner.id);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [owner?.id]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/sign-in');
  };

  const dashboardItems = [
    {
      id: 'my-listings',
      title: 'My PG Listings',
      subtitle: `${stats.totalPGs} Properties`,
      icon: 'business-outline',
      color: '#10B981',
      large: true,
    },
    {
      id: 'customers',
      title: 'Manage Customers',
      subtitle: `${stats.totalCustomers} Guests`,
      icon: 'people-outline',
      color: '#3B82F6',
    },
    {
      id: 'visits',
      title: 'Scheduled Visits',
      subtitle: 'View Requests',
      icon: 'calendar-outline',
      color: '#8B5CF6',
    },
    {
      id: 'payments',
      title: 'Payments',
      subtitle: `₹${stats.totalEarnings.toLocaleString()}`,
      icon: 'wallet-outline',
      color: '#F59E0B',
    },
    {
      id: 'announcements',
      title: 'Announcements',
      subtitle: 'Send Updates',
      icon: 'megaphone-outline',
      color: '#EF4444',
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Account',
      icon: 'settings-outline',
      color: '#6B7280',
    },
  ];

  const handleCardPress = (id: string) => {
    router.push(`/(owner)/${id}` as any);
  };

  // Simple bar chart for paid vs due
  const totalPayments = stats.paidPayments + stats.pendingPayments;
  const paidPercent = totalPayments > 0 ? (stats.paidPayments / totalPayments) * 100 : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome, {owner?.name?.split(' ')[0] || 'Owner'}</Text>
          <Text style={styles.subtitle}>PG Owner Dashboard</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
      >
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalPGs}</Text>
            <Text style={styles.statLabel}>PGs Listed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalCustomers}</Text>
            <Text style={styles.statLabel}>Total Guests</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>₹{(stats.totalEarnings / 1000).toFixed(0)}K</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        {/* Payment Status Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Payment Status</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chartBar}>
              <View style={[styles.chartFill, { width: `${paidPercent}%`, backgroundColor: '#10B981' }]} />
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Paid ({stats.paidPayments})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#E5E7EB' }]} />
                <Text style={styles.legendText}>Due ({stats.pendingPayments})</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions - Bento Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.bentoGrid}>
          {dashboardItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.bentoCard,
                item.large && styles.bentoCardLarge,
              ]}
              onPress={() => handleCardPress(item.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              <View style={[styles.cardAccent, { backgroundColor: item.color }]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#6B7280" />
          <Text style={styles.infoText}>
            Manage your PG properties, customers, and payments from this dashboard. 
            Pull down to refresh stats.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  chartContainer: {
    gap: 12,
  },
  chartBar: {
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  chartFill: {
    height: '100%',
    borderRadius: 12,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  bentoCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: '1%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  bentoCardLarge: {
    width: '98%',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 12,
    lineHeight: 20,
  },
});
