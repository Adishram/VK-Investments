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
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOwner } from '../../context/OwnerContext';
import api from '../../utils/api';

interface Customer {
  id: number;
  name: string;
  email: string;
  mobile: string;
  pg_id: number;
  pg_title: string;
  room_no: string;
  floor: string;
  room_type: string;
  move_in_date: string;
  status: string;
  amount: number;
}

export default function CustomersScreen() {
  const router = useRouter();
  const { owner } = useOwner();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [roomNo, setRoomNo] = useState('');
  const [floor, setFloor] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (owner?.id) {
      loadCustomers();
    }
  }, [owner?.id]);

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, customers]);

  const loadCustomers = async () => {
    if (!owner?.id) return;
    try {
      setLoading(true);
      const data = await api.getOwnerGuests(owner.id);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  }, [owner?.id]);

  const filterCustomers = () => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(c =>
      c.name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.mobile?.includes(query) ||
      c.room_no?.includes(query) ||
      c.pg_title?.toLowerCase().includes(query)
    );
    setFilteredCustomers(filtered);
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setRoomNo(customer.room_no || '');
    setFloor(customer.floor || '');
    setModalVisible(true);
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;
    
    try {
      setUpdating(true);
      await api.updateGuestRoom(selectedCustomer.id, roomNo, floor);
      Alert.alert('Success', 'Customer details updated');
      setModalVisible(false);
      loadCustomers();
    } catch (error) {
      Alert.alert('Error', 'Failed to update customer');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderCustomerCard = (customer: Customer) => (
    <TouchableOpacity
      key={customer.id}
      style={styles.customerCard}
      onPress={() => openEditModal(customer)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{customer.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerPG}>{customer.pg_title}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: customer.status === 'Paid' ? '#ECFDF5' : '#FEF2F2' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: customer.status === 'Paid' ? '#059669' : '#DC2626' }
          ]}>{customer.status || 'Pending'}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="call-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{customer.mobile || 'N/A'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="mail-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText} numberOfLines={1}>{customer.email}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Room</Text>
          <Text style={styles.footerValue}>{customer.room_no || 'Not assigned'}</Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Floor</Text>
          <Text style={styles.footerValue}>{customer.floor || 'Not assigned'}</Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Type</Text>
          <Text style={styles.footerValue}>{customer.room_type || 'N/A'}</Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Move-in</Text>
          <Text style={styles.footerValue}>{formatDate(customer.move_in_date)}</Text>
        </View>
      </View>

      <View style={styles.editHint}>
        <Ionicons name="create-outline" size={16} color="#10B981" />
        <Text style={styles.editHintText}>Tap to assign room</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Customers</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, room..."
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
          {filteredCustomers.length} customers
        </Text>
      </View>

      {/* Customer List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
          }
        >
          {filteredCustomers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No Customers Yet</Text>
              <Text style={styles.emptySubtext}>
                Customers who book your PGs will appear here
              </Text>
            </View>
          ) : (
            filteredCustomers.map(renderCustomerCard)
          )}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}

      {/* Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Room</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {selectedCustomer && (
              <View style={styles.modalBody}>
                <Text style={styles.modalCustomerName}>{selectedCustomer.name}</Text>
                <Text style={styles.modalCustomerPG}>{selectedCustomer.pg_title}</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Room Number</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g., 101, A-12"
                    placeholderTextColor="#9CA3AF"
                    value={roomNo}
                    onChangeText={setRoomNo}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Floor</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g., Ground, 1st, 2nd"
                    placeholderTextColor="#9CA3AF"
                    value={floor}
                    onChangeText={setFloor}
                  />
                </View>
              </View>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, updating && styles.saveBtnDisabled]}
                onPress={handleUpdateCustomer}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#3B82F6',
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
  searchContainer: {
    backgroundColor: '#3B82F6',
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
  },
  customerCard: {
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F620',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  cardHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  customerPG: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
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
  cardDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    maxWidth: 120,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerItem: {
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  editHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  editHintText: {
    fontSize: 13,
    color: '#10B981',
  },
  bottomSpacing: {
    height: 40,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  modalCustomerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalCustomerPG: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelBtnText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  saveBtnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
