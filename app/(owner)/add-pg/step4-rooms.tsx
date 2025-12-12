import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  StatusBar,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PGFormProvider, usePGForm, RoomConfig } from '../../../context/PGFormContext';

const ROOM_TYPES = [
  { id: 'single', label: 'Single Room', icon: 'person-outline' },
  { id: 'double', label: 'Double Sharing', icon: 'people-outline' },
  { id: 'triple', label: 'Triple Sharing', icon: 'people-outline' },
  { id: 'four', label: 'Four Sharing', icon: 'people-outline' },
  { id: 'six', label: 'Six Sharing', icon: 'people-outline' },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: 'Basic Details' },
    { num: 2, label: 'Amenities' },
    { num: 3, label: 'Rules' },
    { num: 4, label: 'Rooms' },
    { num: 5, label: 'Images' },
  ];

  return (
    <View style={styles.stepperContainer}>
      {steps.map((step, index) => (
        <React.Fragment key={step.num}>
          <View style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              currentStep >= step.num && styles.stepCircleActive,
              currentStep > step.num && styles.stepCircleCompleted,
            ]}>
              {currentStep > step.num ? (
                <Ionicons name="checkmark" size={16} color="#fff" />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  currentStep >= step.num && styles.stepNumberActive,
                ]}>{step.num}</Text>
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              currentStep >= step.num && styles.stepLabelActive,
            ]}>{step.label}</Text>
          </View>
          {index < steps.length - 1 && (
            <View style={[
              styles.stepLine,
              currentStep > step.num && styles.stepLineActive,
            ]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

function Step4Content() {
  const router = useRouter();
  const { formData, updateFormData, setCurrentStep } = usePGForm();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  useEffect(() => {
    setCurrentStep(4);
    // Initialize selected types from existing rooms
    const existingTypes = formData.rooms.map(r => r.type);
    setSelectedTypes(existingTypes);
  }, []);

  const toggleRoomType = (typeId: string) => {
    if (selectedTypes.includes(typeId)) {
      // Remove type
      setSelectedTypes(prev => prev.filter(t => t !== typeId));
      updateFormData({ rooms: formData.rooms.filter(r => r.type !== typeId) });
    } else {
      // Add type with default values
      setSelectedTypes(prev => [...prev, typeId]);
      const newRoom: RoomConfig = {
        type: typeId,
        count: 1,
        isAC: false,
        price: 0,
        deposit: 0,
      };
      updateFormData({ rooms: [...formData.rooms, newRoom] });
    }
  };

  const updateRoomConfig = (typeId: string, field: keyof RoomConfig, value: any) => {
    const updatedRooms = formData.rooms.map(r => {
      if (r.type === typeId) {
        return { ...r, [field]: value };
      }
      return r;
    });
    updateFormData({ rooms: updatedRooms });
  };

  const getRoomConfig = (typeId: string): RoomConfig | undefined => {
    return formData.rooms.find(r => r.type === typeId);
  };

  const validateAndContinue = () => {
    if (formData.rooms.length === 0) {
      Alert.alert('Add Rooms', 'Please configure at least one room type');
      return;
    }

    const invalidRoom = formData.rooms.find(r => !r.price || r.price <= 0);
    if (invalidRoom) {
      const label = ROOM_TYPES.find(t => t.id === invalidRoom.type)?.label || invalidRoom.type;
      Alert.alert('Invalid Price', `Please set a valid price for ${label}`);
      return;
    }

    router.push('/(owner)/add-pg/step5-images' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4B5563" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Property - Step 4 of 5</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepperWrapper}>
        <StepIndicator currentStep={4} />
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '80%' }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Configure Rooms *</Text>
        <Text style={styles.sectionHint}>
          Select room types and set pricing for each
        </Text>

        {/* Room Type Selection */}
        <View style={styles.roomTypesGrid}>
          {ROOM_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.roomTypeCard,
                selectedTypes.includes(type.id) && styles.roomTypeCardSelected,
              ]}
              onPress={() => toggleRoomType(type.id)}
            >
              <View style={[
                styles.checkbox,
                selectedTypes.includes(type.id) && styles.checkboxSelected,
              ]}>
                {selectedTypes.includes(type.id) && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
              <Ionicons 
                name={type.icon as any} 
                size={24} 
                color={selectedTypes.includes(type.id) ? '#10B981' : '#6B7280'} 
              />
              <Text style={[
                styles.roomTypeLabel,
                selectedTypes.includes(type.id) && styles.roomTypeLabelSelected,
              ]}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Room Configurations */}
        {selectedTypes.length > 0 && (
          <View style={styles.configSection}>
            <Text style={styles.subsectionTitle}>Room Details</Text>
            
            {ROOM_TYPES.filter(t => selectedTypes.includes(t.id)).map((type) => {
              const config = getRoomConfig(type.id);
              if (!config) return null;

              return (
                <View key={type.id} style={styles.configCard}>
                  <View style={styles.configHeader}>
                    <Ionicons name={type.icon as any} size={20} color="#10B981" />
                    <Text style={styles.configTitle}>{type.label}</Text>
                  </View>

                  <View style={styles.configRow}>
                    <View style={styles.configField}>
                      <Text style={styles.configLabel}>Quantity</Text>
                      <View style={styles.counterRow}>
                        <TouchableOpacity
                          style={styles.counterBtn}
                          onPress={() => updateRoomConfig(type.id, 'count', Math.max(1, config.count - 1))}
                        >
                          <Ionicons name="remove" size={20} color="#6B7280" />
                        </TouchableOpacity>
                        <Text style={styles.counterValue}>{config.count}</Text>
                        <TouchableOpacity
                          style={styles.counterBtn}
                          onPress={() => updateRoomConfig(type.id, 'count', config.count + 1)}
                        >
                          <Ionicons name="add" size={20} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.configField}>
                      <Text style={styles.configLabel}>AC</Text>
                      <Switch
                        value={config.isAC}
                        onValueChange={(val) => updateRoomConfig(type.id, 'isAC', val)}
                        trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
                        thumbColor={config.isAC ? '#10B981' : '#9CA3AF'}
                      />
                    </View>
                  </View>

                  <View style={styles.configRow}>
                    <View style={styles.configFieldHalf}>
                      <Text style={styles.configLabel}>Price / Month (₹)</Text>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="0"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="number-pad"
                        value={config.price ? String(config.price) : ''}
                        onChangeText={(text) => updateRoomConfig(type.id, 'price', parseInt(text) || 0)}
                      />
                    </View>

                    <View style={styles.configFieldHalf}>
                      <Text style={styles.configLabel}>Safety Deposit (₹)</Text>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="0"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="number-pad"
                        value={config.deposit ? String(config.deposit) : ''}
                        onChangeText={(text) => updateRoomConfig(type.id, 'deposit', parseInt(text) || 0)}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {selectedTypes.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="bed-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Select room types above</Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.continueBtn}
            onPress={validateAndContinue}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

export default function Step4Rooms() {
  return (
    <PGFormProvider>
      <Step4Content />
    </PGFormProvider>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepperWrapper: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#4B5563',
  },
  stepCircleCompleted: {
    backgroundColor: '#4B5563',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  stepLine: {
    height: 2,
    flex: 0.5,
    backgroundColor: '#E5E7EB',
    marginBottom: 18,
  },
  stepLineActive: {
    backgroundColor: '#4B5563',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4B5563',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  roomTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  roomTypeCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  roomTypeCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  checkbox: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4B5563',
    borderColor: '#10B981',
  },
  roomTypeLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
  },
  roomTypeLabelSelected: {
    color: '#059669',
    fontWeight: '600',
  },
  configSection: {
    marginTop: 24,
  },
  configCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  configRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  configField: {
    alignItems: 'center',
  },
  configFieldHalf: {
    flex: 1,
  },
  configLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    minWidth: 30,
    textAlign: 'center',
  },
  priceInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backBtnText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  continueBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    backgroundColor: '#4B5563',
    borderRadius: 14,
  },
  continueBtnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
