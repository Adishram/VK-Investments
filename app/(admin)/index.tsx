import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPGs: 0,
    totalOwners: 0,
    totalBookings: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [pgs, owners, bookings] = await Promise.all([
        api.getAvailability(),
        api.getOwners(),
        api.getBookingReports(),
      ]);
      setStats({
        totalPGs: pgs.length,
        totalOwners: owners.length,
        totalBookings: bookings.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = () => {
    router.replace('/(auth)/sign-in');
  };

  const dashboardItems = [
    {
      id: 'availability',
      title: 'PG Availability',
      subtitle: `${stats.totalPGs} PGs Listed`,
      icon: 'business-outline',
      color: '#10B981',
      gradient: ['#10B981', '#059669'],
    },
    {
      id: 'booking-reports',
      title: 'Booking Reports',
      subtitle: `${stats.totalBookings} Bookings`,
      icon: 'document-text-outline',
      color: '#3B82F6',
      gradient: ['#3B82F6', '#2563EB'],
    },
    {
      id: 'owners',
      title: 'PG Owners',
      subtitle: `${stats.totalOwners} Owners`,
      icon: 'people-outline',
      color: '#8B5CF6',
      gradient: ['#8B5CF6', '#7C3AED'],
    },
    {
      id: 'notifications',
      title: 'Payment Alerts',
      subtitle: 'Send Reminders',
      icon: 'notifications-outline',
      color: '#F59E0B',
      gradient: ['#F59E0B', '#D97706'],
    },
  ];

  const handleCardPress = async (id: string) => {
    if (id === 'notifications') {
      try {
        const result = await api.notifyPayment();
        alert(result.message);
      } catch (error) {
        alert('Failed to send notifications');
      }
    } else {
      router.push(`/(admin)/${id}` as any);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome, Admin 👑</Text>
          <Text style={styles.subtitle}>Super Admin Dashboard</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalPGs}</Text>
            <Text style={styles.statLabel}>Total PGs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalOwners}</Text>
            <Text style={styles.statLabel}>Owners</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalBookings}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
        </View>

        {/* Bento Grid Dashboard */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.bentoGrid}>
          {dashboardItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.bentoCard,
                index === 0 && styles.bentoCardLarge,
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

        {/* Quick Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#6B7280" />
          <Text style={styles.infoText}>
            Manage all PG listings, owners, and bookings from this dashboard. 
            Use the cards above to navigate to different sections.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    marginBottom: 24,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
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
