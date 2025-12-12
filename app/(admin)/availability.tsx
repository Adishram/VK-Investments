import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

interface PGAvailability {
  id: number;
  title: string;
  price: number;
  city: string;
  locality: string;
  gender: string;
  food_included: boolean;
  owner_name: string;
  owner_email: string;
  owner_mobile: string;
  owner_contact: string;
  customerCount: number;
  roomBreakdown: {
    single: number;
    double: number;
    triple: number;
    total: number;
  };
}

export default function AvailabilityScreen() {
  const router = useRouter();
  const [pgs, setPGs] = useState<PGAvailability[]>([]);
  const [filteredPGs, setFilteredPGs] = useState<PGAvailability[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPGs();
  }, [searchQuery, pgs]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getAvailability();
      setPGs(data);
    } catch (error) {
      console.error('Error loading availability:', error);
      setPGs([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const filterPGs = () => {
    if (!searchQuery.trim()) {
      setFilteredPGs(pgs);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = pgs.filter(pg =>
      pg.title?.toLowerCase().includes(query) ||
      pg.city?.toLowerCase().includes(query) ||
      pg.owner_name?.toLowerCase().includes(query) ||
      pg.locality?.toLowerCase().includes(query)
    );
    setFilteredPGs(filtered);
  };

  const renderPGCard = (pg: PGAvailability) => (
    <View key={pg.id} style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.pgName}>{pg.title}</Text>
          <Text style={styles.pgLocation}>{pg.locality}, {pg.city}</Text>
        </View>
        <View style={[styles.genderBadge, { backgroundColor: pg.gender === 'women' ? '#EC4899' : pg.gender === 'men' ? '#3B82F6' : '#8B5CF6' }]}>
          <Text style={styles.genderText}>{pg.gender || 'Unisex'}</Text>
        </View>
      </View>

      {/* Room Details */}
      <View style={styles.roomsContainer}>
        <Text style={styles.sectionLabel}>Room Availability</Text>
        <View style={styles.roomsGrid}>
          <View style={styles.roomType}>
            <Text style={styles.roomCount}>{pg.roomBreakdown?.single || 0}</Text>
            <Text style={styles.roomLabel}>Single</Text>
          </View>
          <View style={styles.roomType}>
            <Text style={styles.roomCount}>{pg.roomBreakdown?.double || 0}</Text>
            <Text style={styles.roomLabel}>Double</Text>
          </View>
          <View style={styles.roomType}>
            <Text style={styles.roomCount}>{pg.roomBreakdown?.triple || 0}</Text>
            <Text style={styles.roomLabel}>Triple</Text>
          </View>
          <View style={[styles.roomType, styles.totalRooms]}>
            <Text style={[styles.roomCount, styles.totalCount]}>{pg.roomBreakdown?.total || 0}</Text>
            <Text style={styles.roomLabel}>Total</Text>
          </View>
        </View>
      </View>

      {/* Owner Info */}
      <View style={styles.ownerContainer}>
        <Text style={styles.sectionLabel}>Owner Details</Text>
        <View style={styles.ownerInfo}>
          <View style={styles.ownerRow}>
            <Ionicons name="person-outline" size={16} color="#6B7280" />
            <Text style={styles.ownerText}>{pg.owner_name}</Text>
          </View>
          <View style={styles.ownerRow}>
            <Ionicons name="call-outline" size={16} color="#6B7280" />
            <Text style={styles.ownerText}>{pg.owner_mobile || pg.owner_contact || 'N/A'}</Text>
          </View>
          <View style={styles.ownerRow}>
            <Ionicons name="mail-outline" size={16} color="#6B7280" />
            <Text style={styles.ownerText}>{pg.owner_email || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Footer Stats */}
      <View style={styles.cardFooter}>
        <View style={styles.footerStat}>
          <Ionicons name="people" size={18} color="#10B981" />
          <Text style={styles.footerStatText}>{pg.customerCount} Customers</Text>
        </View>
        <View style={styles.footerStat}>
          <Ionicons name="cash-outline" size={18} color="#3B82F6" />
          <Text style={styles.footerStatText}>₹{String(pg.price).replace(/\/mo/gi, '').replace(/\/month/gi, '')}</Text>
        </View>
        <View style={styles.footerStat}>
          <Ionicons name={pg.food_included ? 'restaurant' : 'restaurant-outline'} size={18} color={pg.food_included ? '#F59E0B' : '#9CA3AF'} />
          <Text style={styles.footerStatText}>{pg.food_included ? 'Food' : 'No Food'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4B5563" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PG Availability</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by PG name, city, owner..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          Showing {filteredPGs.length} of {pgs.length} PGs
        </Text>
      </View>

      {/* PG List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading PGs...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
          }
        >
          {filteredPGs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No PGs found</Text>
              <Text style={styles.emptySubtext}>Pull down to refresh</Text>
            </View>
          ) : (
            filteredPGs.map(renderPGCard)
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
  placeholder: {
    width: 40,
  },
  searchContainer: {
    backgroundColor: '#4B5563',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#111827',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitleContainer: {
    flex: 1,
  },
  pgName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  pgLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  genderBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  genderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  roomsContainer: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roomsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roomType: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  totalRooms: {
    backgroundColor: '#10B98115',
  },
  roomCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalCount: {
    color: '#10B981',
  },
  roomLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  ownerContainer: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  ownerInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ownerText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerStatText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 6,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 40,
  },
});
