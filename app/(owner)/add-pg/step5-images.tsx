import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { PGFormProvider, usePGForm } from '../../../context/PGFormContext';
import { useOwner } from '../../../context/OwnerContext';
import api from '../../../utils/api';

const ROOM_TYPE_LABELS: { [key: string]: string } = {
  single: 'Single Room',
  double: 'Double Sharing',
  triple: 'Triple Sharing',
  four: 'Four Sharing',
  six: 'Six Sharing',
};

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

function Step5Content() {
  const router = useRouter();
  const { formData, updateFormData, setCurrentStep, resetFormData } = usePGForm();
  const { owner } = useOwner();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCurrentStep(5);
  }, []);

  const pickImages = async (type: 'building' | 'amenity' | string, maxCount: number) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        base64: true,
        selectionLimit: maxCount,
      });

      if (!result.canceled && result.assets) {
        const images = result.assets.map(asset => {
          if (asset.base64) {
            return `data:image/jpeg;base64,${asset.base64}`;
          }
          return asset.uri;
        });

        if (type === 'building') {
          updateFormData({ buildingImages: [...formData.buildingImages, ...images].slice(0, 10) });
        } else if (type === 'amenity') {
          updateFormData({ amenityImages: [...formData.amenityImages, ...images].slice(0, 5) });
        } else {
          // Room type image
          updateFormData({ 
            roomImages: { 
              ...formData.roomImages, 
              [type]: images[0] 
            } 
          });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removeImage = (type: 'building' | 'amenity', index: number) => {
    if (type === 'building') {
      const updated = [...formData.buildingImages];
      updated.splice(index, 1);
      updateFormData({ buildingImages: updated });
    } else {
      const updated = [...formData.amenityImages];
      updated.splice(index, 1);
      updateFormData({ amenityImages: updated });
    }
  };

  const removeRoomImage = (roomType: string) => {
    const updated = { ...formData.roomImages };
    delete updated[roomType];
    updateFormData({ roomImages: updated });
  };

  const validateAndSubmit = async () => {
    // Validate building images (min 3)
    if (formData.buildingImages.length < 3) {
      Alert.alert('Building Images Required', 'Please add at least 3 building/exterior images');
      return;
    }

    // Validate amenity images (min 2)
    if (formData.amenityImages.length < 2) {
      Alert.alert('Amenity Images Required', 'Please add at least 2 amenity images');
      return;
    }

    // Validate room images (1 per room type)
    const roomTypes = formData.rooms.map(r => r.type);
    const missingRoomImages = roomTypes.filter(type => !formData.roomImages[type]);
    if (missingRoomImages.length > 0) {
      const labels = missingRoomImages.map(t => ROOM_TYPE_LABELS[t] || t).join(', ');
      Alert.alert('Room Images Required', `Please add images for: ${labels}`);
      return;
    }

    // Submit
    try {
      setSubmitting(true);

      // Combine all images
      const allImages = [
        ...formData.buildingImages,
        ...formData.amenityImages,
        ...Object.values(formData.roomImages),
      ];

      // Generate occupancy_types and occupancy_prices from rooms (for pg-details compatibility)
      const occupancyTypes = formData.rooms.map(r => ROOM_TYPE_LABELS[r.type] || r.type);
      const occupancyPrices: { [key: string]: number } = {};
      formData.rooms.forEach(r => {
        const label = ROOM_TYPE_LABELS[r.type] || r.type;
        occupancyPrices[label] = r.price;
      });

      // Find the minimum price for the main price field
      const minPrice = formData.rooms.length > 0 
        ? Math.min(...formData.rooms.map(r => r.price))
        : 0;

      // Find the first deposit for safety_deposit
      const firstDeposit = formData.rooms[0]?.deposit || 0;

      // Prepare PG data - matching database schema and pg-details expectations
      const pgData = {
        title: formData.pgName,
        description: formData.description,
        price: minPrice,
        location: formData.locality || formData.city,
        house_no: '',
        street: formData.address,
        city: formData.city,
        pincode: '',
        latitude: formData.latitude,
        longitude: formData.longitude,
        image_url: allImages[0] || '',  // First image as primary
        owner_contact: formData.mobile,
        gender: formData.gender,
        food_included: formData.foodAvailable,
        notice_period: formData.noticePeriod + ' days',
        gate_close_time: formData.gateCloseTime,
        safety_deposit: firstDeposit.toString(),
        // For pg-details.tsx room section
        occupancy_types: occupancyTypes,
        occupancy_prices: occupancyPrices,
        // Detailed rooms array for new format
        rooms: formData.rooms.map(r => ({
          type: ROOM_TYPE_LABELS[r.type] || r.type,
          count: r.count,
          available: r.count,
          isAC: r.isAC,
          price: r.price,
          deposit: r.deposit,
        })),
        // Amenities array with proper labels
        amenities: formData.amenities.map(a => {
          // Convert amenity IDs to display labels
          const amenityLabels: { [key: string]: string } = {
            housekeeping: 'House Keeping',
            gym: 'Gym',
            sofa: 'Sofa',
            dining_table: 'Dining Table',
            bed_cot_pillow: 'Bed, Cot & Pillow',
            hot_water: 'Hot Water',
            reading_room: 'Reading Room',
            wardrobes: 'Wardrobes',
            newspaper: 'News Paper',
            toilets_attached: 'Attached Toilets',
            safety_lockers: 'Safety Lockers',
            cctv: 'CCTV',
            lift: 'Lift',
            kitchen: 'Kitchen',
            separate_eb: 'Separate EB Meter',
            mineral_water: 'RO Water',
            microwave: 'Microwave',
            geyser: 'Geyser',
            refrigerator: 'Refrigerator',
            wifi: 'Wi-Fi',
            television: 'Television',
            security: 'Security',
            laundry: 'Laundry',
            washing_machine: 'Washing Machine',
            ac: 'AC',
            parking: 'Parking',
            power_backup: 'Power Backup',
          };
          return amenityLabels[a] || a;
        }),
        rules: formData.rules,
        images: allImages,
        owner_id: owner?.id?.toString() || '',
        owner_email: owner?.email || formData.email,
      };

      await api.addPG(pgData);
      
      Alert.alert(
        'Success! 🎉',
        'Your PG has been listed successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              resetFormData();
              router.replace('/(owner)/my-listings' as any);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add PG. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRoomTypes = formData.rooms.map(r => r.type);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Property - Step 5 of 5</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepperWrapper}>
        <StepIndicator currentStep={5} />
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Building Images */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Building / Exterior Images *</Text>
          <Text style={styles.sectionHint}>Minimum 3, Maximum 10 images</Text>
          
          <View style={styles.imagesGrid}>
            {formData.buildingImages.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeBtn}
                  onPress={() => removeImage('building', index)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            {formData.buildingImages.length < 10 && (
              <TouchableOpacity 
                style={styles.addImageBtn}
                onPress={() => pickImages('building', 10 - formData.buildingImages.length)}
              >
                <Ionicons name="add" size={32} color="#10B981" />
                <Text style={styles.addImageText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.countText}>{formData.buildingImages.length}/10 images</Text>
        </View>

        {/* Amenity Images */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Amenity Images *</Text>
          <Text style={styles.sectionHint}>Minimum 2 images (common areas, facilities)</Text>
          
          <View style={styles.imagesGrid}>
            {formData.amenityImages.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeBtn}
                  onPress={() => removeImage('amenity', index)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            {formData.amenityImages.length < 5 && (
              <TouchableOpacity 
                style={styles.addImageBtn}
                onPress={() => pickImages('amenity', 5 - formData.amenityImages.length)}
              >
                <Ionicons name="add" size={32} color="#10B981" />
                <Text style={styles.addImageText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.countText}>{formData.amenityImages.length}/5 images</Text>
        </View>

        {/* Room Type Images */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Room Type Images *</Text>
          <Text style={styles.sectionHint}>1 image per room type you selected</Text>
          
          {selectedRoomTypes.length === 0 ? (
            <View style={styles.noRoomsWarning}>
              <Ionicons name="warning-outline" size={24} color="#F59E0B" />
              <Text style={styles.warningText}>No room types selected. Go back to Step 4.</Text>
            </View>
          ) : (
            <View style={styles.roomImagesSection}>
              {selectedRoomTypes.map((type) => (
                <View key={type} style={styles.roomImageRow}>
                  <Text style={styles.roomTypeLabel}>{ROOM_TYPE_LABELS[type] || type}</Text>
                  
                  {formData.roomImages[type] ? (
                    <View style={styles.roomImageContainer}>
                      <Image source={{ uri: formData.roomImages[type] }} style={styles.roomImagePreview} />
                      <TouchableOpacity 
                        style={styles.removeRoomImgBtn}
                        onPress={() => removeRoomImage(type)}
                      >
                        <Ionicons name="close-circle" size={22} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.addRoomImageBtn}
                      onPress={() => pickImages(type, 1)}
                    >
                      <Ionicons name="camera-outline" size={24} color="#10B981" />
                      <Text style={styles.addRoomImageText}>Add Image</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => router.back()}
            disabled={submitting}
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={validateAndSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.submitBtnText}>Submit PG</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

export default function Step5Images() {
  return (
    <PGFormProvider>
      <Step5Content />
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
  imageSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10B981',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
  },
  countText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'right',
  },
  noRoomsWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#B45309',
  },
  roomImagesSection: {
    gap: 12,
  },
  roomImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
  },
  roomTypeLabel: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  roomImageContainer: {
    position: 'relative',
  },
  roomImagePreview: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  removeRoomImgBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 11,
  },
  addRoomImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
  },
  addRoomImageText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
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
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    backgroundColor: '#10B981',
    borderRadius: 14,
  },
  submitBtnDisabled: {
    backgroundColor: '#A7F3D0',
  },
  submitBtnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
