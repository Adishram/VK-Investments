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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOwner } from '../../context/OwnerContext';
import api from '../../utils/api';

interface Visit {
  id: number;
  user_name: string;
  user_email: string;
  pg_id: number;
  pg_title: string;
  pg_location: string;
  visit_date: string;
  visit_time: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function VisitsScreen() {
  const router = useRouter();
  const { owner } = useOwner();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (owner?.id) {
      loadVisits();
    }
  }, [owner?.id]);

  const loadVisits = async () => {
    if (!owner?.id) return;
    try {
      setLoading(true);
      const data = await api.getOwnerVisits(owner.id);
      setVisits(data);
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVisits();
    setRefreshing(false);
  }, [owner?.id]);

  const handleApprove = async (visitId: number) => {
    try {
      await api.approveVisit(visitId);
      Alert.alert('Success', 'Visit approved!');
      loadVisits();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve visit');
    }
  };

  const handleReject = async (visitId: number) => {
    Alert.alert(
      'Reject Visit',
      'Are you sure you want to reject this visit request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.rejectVisit(visitId);
              Alert.alert('Rejected', 'Visit request has been rejected');
              loadVisits();
            } catch (error) {
              Alert.alert('Error', 'Failed to reject visit');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const filteredVisits = visits.filter(v => {
    if (filter === 'all') return true;
    return v.status === filter;
  });

  const pendingCount = visits.filter(v => v.status === 'pending').length;
  const approvedCount = visits.filter(v => v.status === 'approved').length;
  const rejectedCount = visits.filter(v => v.status === 'rejected').length;

  const renderVisitCard = (visit: Visit) => (
    <View key={visit.id} style={styles.visitCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={20} color="#8B5CF6" />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.visitorName}>{visit.user_name || 'User'}</Text>
          <Text style={styles.visitorEmail}>{visit.user_email}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          visit.status === 'pending' ? styles.statusPending :
          visit.status === 'approved' ? styles.statusApproved : styles.statusRejected
        ]}>
          <Text style={[
            styles.statusText,
            visit.status === 'pending' ? styles.statusTextPending :
            visit.status === 'approved' ? styles.statusTextApproved : styles.statusTextRejected
          ]}>
            {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.visitDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="business-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{visit.pg_title}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{formatDate(visit.visit_date)} at {visit.visit_time}</Text>
        </View>
      </View>

      {visit.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.rejectBtn}
            onPress={() => handleReject(visit.id)}
          >
            <Ionicons name="close" size={18} color="#EF4444" />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.approveBtn}
            onPress={() => handleApprove(visit.id)}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.approveBtnText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scheduled Visits</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All ({visits.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
              New ({pendingCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'approved' && styles.filterTabActive]}
            onPress={() => setFilter('approved')}
          >
            <Text style={[styles.filterText, filter === 'approved' && styles.filterTextActive]}>
              Approved ({approvedCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'rejected' && styles.filterTabActive]}
            onPress={() => setFilter('rejected')}
          >
            <Text style={[styles.filterText, filter === 'rejected' && styles.filterTextActive]}>
              Rejected ({rejectedCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Visit List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading visits...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
          }
        >
          {filteredVisits.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No Visit Requests</Text>
              <Text style={styles.emptySubtext}>
                {filter === 'all' 
                  ? "You'll see visit requests here when customers schedule them"
                  : `No ${filter} visits`}
              </Text>
            </View>
          ) : (
            filteredVisits.map(renderVisitCard)
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
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#8B5CF6',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
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
  visitCard: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF620',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  visitorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  visitorEmail: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusApproved: {
    backgroundColor: '#ECFDF5',
  },
  statusRejected: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextPending: {
    color: '#D97706',
  },
  statusTextApproved: {
    color: '#059669',
  },
  statusTextRejected: {
    color: '#DC2626',
  },
  visitDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  rejectBtnText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#10B981',
  },
  approveBtnText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});
