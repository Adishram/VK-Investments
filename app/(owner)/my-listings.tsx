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
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOwner } from '../../context/OwnerContext';
import api from '../../utils/api';

const { width } = Dimensions.get('window');

interface PGListing {
  id: number;
  title: string;
  city: string;
  street: string;
  price: number;
  image_url?: string;
  images?: string[];
  gender?: string;
  rooms?: any[];
  customerCount?: number;
}

export default function MyListingsScreen() {
  const router = useRouter();
  const { owner } = useOwner();
  const [pgs, setPGs] = useState<PGListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (owner?.id) {
      loadPGs();
    }
  }, [owner?.id]);

  const loadPGs = async () => {
    if (!owner?.id) return;
    try {
      setLoading(true);
      const data = await api.getOwnerPGs(owner.id);
      
      // Get customer counts for each PG
      const pgsWithCounts = await Promise.all(data.map(async (pg: any) => {
        try {
          const guests = await api.getOwnerGuests(owner.id);
          const count = guests.filter((g: any) => g.pg_id === pg.id).length;
          return { ...pg, customerCount: count };
        } catch {
          return { ...pg, customerCount: 0 };
        }
      }));
      
      setPGs(pgsWithCounts);
    } catch (error) {
      console.error('Error loading PGs:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPGs();
    setRefreshing(false);
  }, [owner?.id]);

  const getImageUrl = (pg: PGListing) => {
    if (pg.images && pg.images.length > 0) {
      const img = pg.images[0];
      if (typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:'))) {
        return img;
      }
    }
    if (pg.image_url && (pg.image_url.startsWith('http') || pg.image_url.startsWith('data:'))) {
      return pg.image_url;
    }
    return 'https://via.placeholder.com/300x200?text=No+Image';
  };

  const getRoomCount = (pg: PGListing) => {
    if (!pg.rooms || !Array.isArray(pg.rooms)) return 0;
    try {
      const rooms = typeof pg.rooms === 'string' ? JSON.parse(pg.rooms) : pg.rooms;
      return rooms.reduce((sum: number, room: any) => sum + (room.count || room.available || 0), 0);
    } catch {
      return 0;
    }
  };

  const renderPGCard = (pg: PGListing) => (
    <TouchableOpacity
      key={pg.id}
      style={styles.pgCard}
      onPress={() => router.push({ pathname: '/(owner)/edit-pg', params: { id: pg.id.toString() } } as any)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: getImageUrl(pg) }} 
        style={styles.pgImage}
        resizeMode="cover"
      />
      <View style={styles.pgContent}>
        <Text style={styles.pgTitle} numberOfLines={1}>{pg.title}</Text>
        <View style={styles.pgLocationRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.pgLocation} numberOfLines={1}>
            {pg.street ? `${pg.street}, ` : ''}{pg.city}
          </Text>
        </View>
        
        <View style={styles.pgStats}>
          <View style={styles.pgStatItem}>
            <Ionicons name="bed-outline" size={16} color="#10B981" />
            <Text style={styles.pgStatText}>{getRoomCount(pg)} Rooms</Text>
          </View>
          <View style={styles.pgStatItem}>
            <Ionicons name="people-outline" size={16} color="#3B82F6" />
            <Text style={styles.pgStatText}>{pg.customerCount || 0} Guests</Text>
          </View>
          <View style={styles.pgStatItem}>
            <Text style={styles.pgPrice}>₹{pg.price}/mo</Text>
          </View>
        </View>
        
        {pg.gender && (
          <View style={[styles.genderBadge, { 
            backgroundColor: pg.gender === 'men' ? '#DBEAFE' : 
                           pg.gender === 'women' ? '#FCE7F3' : '#E0E7FF' 
          }]}>
            <Text style={[styles.genderText, { 
              color: pg.gender === 'men' ? '#1D4ED8' : 
                    pg.gender === 'women' ? '#BE185D' : '#4338CA' 
            }]}>
              {pg.gender === 'men' ? 'Men' : pg.gender === 'women' ? 'Women' : 'Unisex'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.editIcon}>
        <Ionicons name="create-outline" size={20} color="#6B7280" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4B5563" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My PG Listings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Add New PG Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push('/(owner)/add-pg' as any)}
      >
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add New PG</Text>
      </TouchableOpacity>

      {/* PG List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading your PGs...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
          }
        >
          {pgs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No PGs Listed Yet</Text>
              <Text style={styles.emptySubtext}>
                Add your first PG to start managing your properties
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultsText}>
                {pgs.length} {pgs.length === 1 ? 'Property' : 'Properties'} Listed
              </Text>
              {pgs.map(renderPGCard)}
            </>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  pgCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  pgImage: {
    width: '100%',
    height: 160,
  },
  pgContent: {
    padding: 16,
  },
  pgTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  pgLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  pgLocation: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  pgStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  pgStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pgStatText: {
    fontSize: 13,
    color: '#6B7280',
  },
  pgPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  genderBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});
