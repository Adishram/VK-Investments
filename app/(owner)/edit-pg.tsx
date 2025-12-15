import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api, { PGListing } from '../../utils/api';

// Conditional imports to avoid crashes if packages are missing
let BlurView: any = View; // Fallback to View
try {
  const ExpoBlur = require('expo-blur');
  BlurView = ExpoBlur.BlurView;
} catch (e) {
  console.log('expo-blur not available');
}

let MapView: any = null;
let Marker: any = null;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
} catch (e) {
  console.log('react-native-maps not available');
}

const { width } = Dimensions.get('window');

export default function EditPGScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  
  const [formData, setFormData] = useState<Partial<PGListing>>({});
  
  // Room State
  const [newRoom, setNewRoom] = useState({ type: '', count: '', price: '', deposit: '' });

  useEffect(() => {
    if (id) {
      loadPG();
    }
  }, [id]);

  const loadPG = async () => {
    try {
      setLoading(true);
      const pg = await api.getPGById(Number(id));
      // Parse rooms if string
      if (typeof pg.rooms === 'string') {
        try {
          pg.rooms = JSON.parse(pg.rooms);
        } catch (e) {
          pg.rooms = [];
        }
      }
      if (!pg.rooms) pg.rooms = [];
      setFormData(pg);
    } catch (error) {
      Alert.alert('Error', 'Failed to load PG details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      await api.updatePG(Number(id), formData);
      Alert.alert('Success', 'PG details updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update PG');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete PG',
      'Are you sure you want to delete this PG? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await api.deletePG(Number(id));
              Alert.alert('Success', 'PG deleted successfully', [
                { text: 'OK', onPress: () => router.replace('/(owner)/my-listings') }
              ]);
            } catch (error) {
              setDeleting(false);
              Alert.alert('Error', 'Failed to delete PG');
            }
          },
        },
      ]
    );
  };

  const handleAddRoom = () => {
    if (!newRoom.type || !newRoom.count || !newRoom.price) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    const room = {
      type: newRoom.type,
      count: parseInt(newRoom.count) || 0,
      price: parseInt(newRoom.price) || 0,
      deposit: parseInt(newRoom.deposit) || 0,
    };
    const updatedRooms = [...(formData.rooms || []), room];
    setFormData({ ...formData, rooms: updatedRooms });
    setNewRoom({ type: '', count: '', price: '', deposit: '' });
    setShowAddRoom(false);
  };

  const removeRoom = (index: number) => {
    Alert.alert('Remove Room', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
          const updatedRooms = [...(formData.rooms || [])];
          updatedRooms.splice(index, 1);
          setFormData({ ...formData, rooms: updatedRooms });
      }}
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit PG</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Basic Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PG Title</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="e.g. VK Luxury Stays"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe your property..."
              multiline
              numberOfLines={4}
            />
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Starting Price</Text>
              <TextInput
                style={styles.input}
                value={formData.price?.toString()}
                onChangeText={(text) => setFormData({ ...formData, price: Number(text) })}
                keyboardType="numeric"
                placeholder="₹"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Deposit</Text>
              <TextInput
                style={styles.input}
                value={formData.safety_deposit?.toString()}
                onChangeText={(text) => setFormData({ ...formData, safety_deposit: text })}
                keyboardType="numeric"
                placeholder="₹"
              />
            </View>
          </View>
        </View>

        {/* Room Configuration */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Room Configuration</Text>
            <TouchableOpacity onPress={() => setShowAddRoom(true)} style={styles.addRoomBtn}>
              <Ionicons name="add" size={20} color="#10B981" />
              <Text style={styles.addRoomText}>Add Room</Text>
            </TouchableOpacity>
          </View>

          {formData.rooms && formData.rooms.length > 0 ? (
            formData.rooms.map((room: any, index: number) => (
              <View key={index} style={styles.roomItem}>
                <View style={styles.roomInfo}>
                  <Text style={styles.roomType}>{room.type}</Text>
                  <Text style={styles.roomDetails}>
                    {room.count} Rooms • ₹{room.price}/mo
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeRoom(index)} style={styles.deleteRoomBtn}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No rooms configured</Text>
          )}
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Location</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
            />
          </View>

           <View style={styles.inputGroup}>
            <Text style={styles.label}>Street / Address</Text>
            <TextInput
              style={styles.input}
              value={formData.street}
              onChangeText={(text) => setFormData({ ...formData, street: text })}
            />
          </View>

          {/* Map Preview */}
          {MapView && formData.latitude && formData.longitude && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: formData.latitude,
                  longitude: formData.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                  }}
                />
              </MapView>
            </View>
          )}
        </View>
        
        {/* Additional Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Amenities & Rules</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amenities (comma separated)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { height: 80 }]}
              value={Array.isArray(formData.amenities) ? formData.amenities.join(', ') : formData.amenities}
              onChangeText={(text) => setFormData({ ...formData, amenities: text.split(',').map(s => s.trim()) })}
              placeholder="Wi-Fi, AC, TV, etc."
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>House Rules (comma separated)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { height: 80 }]}
              value={Array.isArray(formData.rules) ? formData.rules.join(', ') : formData.rules}
              onChangeText={(text) => setFormData({ ...formData, rules: text.split(',').map(s => s.trim()) })}
              placeholder="No Smoking, No Pets, etc."
              multiline
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={[styles.card, styles.dangerCard]}>
          <Text style={[styles.cardTitle, { color: '#EF4444' }]}>Danger Zone</Text>
          <Text style={styles.dangerText}>
             Deleting this PG will permanently remove all associated data including bookings and revenue history.
          </Text>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.deleteButtonText}>Delete Property permanently</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Save Button */}
      {BlurView !== View ? (
        <BlurView intensity={80} tint="light" style={styles.footer}>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleUpdate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </BlurView>
      ) : (
        <View style={[styles.footer, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
           <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleUpdate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Add Room Modal */}
      <Modal
        visible={showAddRoom}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddRoom(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Room Type</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Room Type (e.g. Single Room AC)"
              placeholderTextColor="#9CA3AF"
              value={newRoom.type}
              onChangeText={(text) => setNewRoom({ ...newRoom, type: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Number of Rooms"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={newRoom.count}
              onChangeText={(text) => setNewRoom({ ...newRoom, count: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Rent Price (₹)"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={newRoom.price}
              onChangeText={(text) => setNewRoom({ ...newRoom, price: text })}
            />
             <TextInput
              style={styles.modalInput}
              placeholder="Deposit (₹)"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={newRoom.deposit}
              onChangeText={(text) => setNewRoom({ ...newRoom, deposit: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setShowAddRoom(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.addBtn]} 
                onPress={handleAddRoom}
              >
                <Text style={styles.addBtnText}>Add</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight! + 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  addRoomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
  },
  addRoomText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  mapContainer: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  map: {
    flex: 1,
  },
  roomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roomInfo: {
    flex: 1,
  },
  roomType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  roomDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  deleteRoomBtn: {
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
  },
  dangerCard: {
    borderColor: '#FECACA',
    borderWidth: 1,
    backgroundColor: '#FEF2F2',
  },
  dangerText: {
    fontSize: 14,
    color: '#7F1D1D',
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.5)',
  },
  saveButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#111827',
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    color: '#111827',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
  },
  addBtn: {
    backgroundColor: '#10B981',
  },
  cancelBtnText: {
    color: '#374151',
    fontWeight: '600',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
