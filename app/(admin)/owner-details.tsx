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
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

interface OwnerDetail {
  id: number;
  name: string;
  email: string;
  mobile: string;
  city: string;
  state: string;
  address: string;
  created_at: string;
}

interface PGListing {
  id: number;
  title: string;
  city: string;
  price: number;
  rooms: any;
}

interface OwnerData {
  owner: OwnerDetail;
  pgs: PGListing[];
  stats: {
    totalPGs: number;
    totalCustomers: number;
  };
}

export default function OwnerDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<OwnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await api.getOwnerDetails(parseInt(id!));
      setData(result);
    } catch (error) {
      console.error('Error loading owner details:', error);
      Alert.alert('Error', 'Failed to load owner details');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [id]);

  const handleDeleteOwner = () => {
    if (!data) return;
    
    Alert.alert(
      'Delete Owner',
      `Are you sure you want to delete "${data.owner.name}"? This will remove their login access permanently.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteOwner(data.owner.id);
              Alert.alert('Success', 'Owner deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete owner');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getRoomCount = (rooms: any) => {
    if (!rooms) return 0;
    try {
      const parsed = typeof rooms === 'string' ? JSON.parse(rooms) : rooms;
      if (Array.isArray(parsed)) {
        return parsed.reduce((sum, room) => sum + (room.count || room.available || 0), 0);
      }
      return 0;
    } catch {
      return 0;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading owner details...</Text>
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Owner not found</Text>
          <TouchableOpacity style={styles.backButtonAlt} onPress={() => router.back()}>
            <Text style={styles.backButtonAltText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Owner Details</Text>
        <TouchableOpacity onPress={handleDeleteOwner} style={styles.deleteHeaderBtn}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
      >
        {/* Owner Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarTextLarge}>{data.owner.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.ownerName}>{data.owner.name}</Text>
          <Text style={styles.ownerEmail}>{data.owner.email}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{data.stats.totalPGs}</Text>
              <Text style={styles.statLabel}>PGs Listed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{data.stats.totalCustomers}</Text>
              <Text style={styles.statLabel}>Customers</Text>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="call-outline" size={20} color="#8B5CF6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{data.owner.mobile || 'Not provided'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="location-outline" size={20} color="#8B5CF6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>
                  {data.owner.city}{data.owner.state ? `, ${data.owner.state}` : ''}
                </Text>
              </View>
            </View>
            {data.owner.address && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="home-outline" size={20} color="#8B5CF6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{data.owner.address}</Text>
                </View>
              </View>
            )}
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Joined</Text>
                <Text style={styles.infoValue}>{formatDate(data.owner.created_at)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* PG Listings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PG Listings ({data.pgs.length})</Text>
          {data.pgs.length === 0 ? (
            <View style={styles.emptyPGContainer}>
              <Ionicons name="business-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyPGText}>No PGs listed yet</Text>
            </View>
          ) : (
            data.pgs.map((pg) => (
              <View key={pg.id} style={styles.pgCard}>
                <View style={styles.pgHeader}>
                  <View style={styles.pgInfo}>
                    <Text style={styles.pgName}>{pg.title}</Text>
                    <Text style={styles.pgLocation}>{pg.city}</Text>
                  </View>
                  <View style={styles.pgPrice}>
                    <Text style={styles.priceText}>₹{pg.price}</Text>
                    <Text style={styles.priceLabel}>/month</Text>
                  </View>
                </View>
                <View style={styles.pgStats}>
                  <View style={styles.pgStatItem}>
                    <Ionicons name="bed-outline" size={16} color="#6B7280" />
                    <Text style={styles.pgStatText}>{getRoomCount(pg.rooms)} rooms</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteOwner}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.deleteButtonText}>Delete Owner</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    backgroundColor: '#8B5CF6',
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
  deleteHeaderBtn: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
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
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
  },
  backButtonAlt: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#8B5CF6',
    borderRadius: 25,
  },
  backButtonAltText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B5CF620',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarTextLarge: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  ownerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  ownerEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#8B5CF610',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginTop: 2,
  },
  emptyPGContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyPGText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  pgCard: {
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
  pgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pgInfo: {
    flex: 1,
  },
  pgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  pgLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  pgPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  pgStats: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  pgStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pgStatText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});
