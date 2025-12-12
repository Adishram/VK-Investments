import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PGFormProvider, usePGForm } from '../../../context/PGFormContext';

const AMENITIES_LIST = [
  { id: 'housekeeping', label: 'House Keeping', icon: 'home-outline' },
  { id: 'gym', label: 'Gym', icon: 'barbell-outline' },
  { id: 'sofa', label: 'Sofa', icon: 'bed-outline' },
  { id: 'dining_table', label: 'Dining Table', icon: 'restaurant-outline' },
  { id: 'bed_cot_pillow', label: 'BED COT PILLOW', icon: 'bed-outline' },
  { id: 'hot_water', label: 'Hot Water', icon: 'water-outline' },
  { id: 'reading_room', label: 'Reading Room', icon: 'book-outline' },
  { id: 'wardrobes', label: 'Wardrobes', icon: 'file-tray-full-outline' },
  { id: 'newspaper', label: 'News Paper', icon: 'newspaper-outline' },
  { id: 'toilets_attached', label: 'Toilets Attached', icon: 'water-outline' },
  { id: 'safety_lockers', label: 'Safety Lockers', icon: 'lock-closed-outline' },
  { id: 'cctv', label: 'CCTV', icon: 'videocam-outline' },
  { id: 'lift', label: 'Lift', icon: 'swap-vertical-outline' },
  { id: 'kitchen', label: 'Kitchen', icon: 'restaurant-outline' },
  { id: 'separate_eb', label: 'Separate EB Meter', icon: 'flash-outline' },
  { id: 'mineral_water', label: 'Mineral / RO Water', icon: 'water-outline' },
  { id: 'microwave', label: 'Microwave Oven', icon: 'cube-outline' },
  { id: 'geyser', label: 'Geyser', icon: 'flame-outline' },
  { id: 'refrigerator', label: 'Refrigerator', icon: 'snow-outline' },
  { id: 'wifi', label: 'Wi-Fi', icon: 'wifi-outline' },
  { id: 'television', label: 'Television', icon: 'tv-outline' },
  { id: 'security', label: 'Security', icon: 'shield-checkmark-outline' },
  { id: 'laundry', label: 'Laundry', icon: 'shirt-outline' },
  { id: 'washing_machine', label: 'Washing Machine', icon: 'water-outline' },
  { id: 'ac', label: 'AC', icon: 'snow-outline' },
  { id: 'parking', label: 'Parking', icon: 'car-outline' },
  { id: 'power_backup', label: 'Power Backup', icon: 'battery-charging-outline' },
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

function Step2Content() {
  const router = useRouter();
  const { formData, updateFormData, setCurrentStep } = usePGForm();

  useEffect(() => {
    setCurrentStep(2);
  }, []);

  const toggleAmenity = (amenityId: string) => {
    const current = formData.amenities || [];
    const updated = current.includes(amenityId)
      ? current.filter(a => a !== amenityId)
      : [...current, amenityId];
    updateFormData({ amenities: updated });
  };

  const isSelected = (amenityId: string) => {
    return (formData.amenities || []).includes(amenityId);
  };

  const validateAndContinue = () => {
    if ((formData.amenities || []).length === 0) {
      Alert.alert('Select Amenities', 'Please select at least one amenity for your PG');
      return;
    }
    router.push('/(owner)/add-pg/step3-rules' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Property - Step 2 of 5</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepperWrapper}>
        <StepIndicator currentStep={2} />
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '40%' }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Select Amenities *</Text>
        <Text style={styles.sectionHint}>
          Choose the amenities available at your PG
        </Text>

        {/* Amenities Grid */}
        <View style={styles.amenitiesGrid}>
          {AMENITIES_LIST.map((amenity) => (
            <TouchableOpacity
              key={amenity.id}
              style={[
                styles.amenityCard,
                isSelected(amenity.id) && styles.amenityCardSelected,
              ]}
              onPress={() => toggleAmenity(amenity.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                isSelected(amenity.id) && styles.checkboxSelected,
              ]}>
                {isSelected(amenity.id) && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
              <Ionicons 
                name={amenity.icon as any} 
                size={24} 
                color={isSelected(amenity.id) ? '#10B981' : '#6B7280'} 
              />
              <Text style={[
                styles.amenityLabel,
                isSelected(amenity.id) && styles.amenityLabelSelected,
              ]}>{amenity.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.selectedCount}>
          {(formData.amenities || []).length} amenities selected
        </Text>

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

export default function Step2Amenities() {
  return (
    <PGFormProvider>
      <Step2Content />
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
    backgroundColor: '#10B981',
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
    backgroundColor: '#10B981',
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
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
    backgroundColor: '#10B981',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
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
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityCard: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minHeight: 100,
    justifyContent: 'center',
  },
  amenityCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  checkbox: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  amenityLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  amenityLabelSelected: {
    color: '#059669',
    fontWeight: '600',
  },
  selectedCount: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
    backgroundColor: '#10B981',
    borderRadius: 14,
  },
  continueBtnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
