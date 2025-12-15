import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PGFormProvider, usePGForm } from '../../../context/PGFormContext';
import api from '../../../utils/api';

const { width } = Dimensions.get('window');

// Conditional MapView import
let MapView: any = null;
let Marker: any = null;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
} catch (e) {
  console.log('react-native-maps not available');
}

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

function Step1Content() {
  const router = useRouter();
  const { formData, updateFormData, setCurrentStep } = usePGForm();
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<Array<{name: string; lat: number; lon: number}>>([]);

  // Predefined Chennai locations for autocomplete
  const chennaiLocations = [
    { name: 'Anna Nagar, Chennai', lat: 13.0850, lon: 80.2101 },
    { name: 'T Nagar, Chennai', lat: 13.0418, lon: 80.2341 },
    { name: 'Adyar, Chennai', lat: 13.0067, lon: 80.2571 },
    { name: 'Velachery, Chennai', lat: 12.9750, lon: 80.2212 },
    { name: 'Guindy, Chennai', lat: 13.0067, lon: 80.2206 },
    { name: 'Mylapore, Chennai', lat: 13.0339, lon: 80.2619 },
    { name: 'Porur, Chennai', lat: 13.0358, lon: 80.1560 },
    { name: 'Tambaram, Chennai', lat: 12.9249, lon: 80.1000 },
    { name: 'OMR, Chennai', lat: 12.9010, lon: 80.2279 },
    { name: 'ECR, Chennai', lat: 12.8237, lon: 80.2457 },
  ];

  useEffect(() => {
    setCurrentStep(1);
  }, []);

  const genderOptions = [
    { value: 'men', label: 'Men' },
    { value: 'women', label: 'Women' },
    { value: 'unisex', label: 'Unisex' },
  ];

  const handleSearchAddress = (text: string) => {
    setSearchAddress(text);
    if (text.trim().length > 1) {
      const filtered = chennaiLocations.filter(loc =>
        loc.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredLocations(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setFilteredLocations([]);
    }
  };

  const selectLocation = (location: {name: string; lat: number; lon: number}) => {
    setSearchAddress(location.name);
    setShowSuggestions(false);
    updateFormData({
      latitude: location.lat,
      longitude: location.lon,
      locality: location.name,
    });
  };

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    updateFormData({ latitude, longitude });
  };

  const handleMarkerDrag = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    updateFormData({ latitude, longitude });
  };

  const validateAndContinue = () => {
    const required = ['pgName', 'gender', 'city', 'contactPerson', 'mobile', 'email'];
    const missing = required.filter(field => !formData[field as keyof typeof formData]);
    
    if (missing.length > 0) {
      Alert.alert('Required Fields', 'Please fill in all required fields marked with *');
      return;
    }
    
    if (!formData.latitude || !formData.longitude) {
      Alert.alert('Location Required', 'Please set the PG location on the map');
      return;
    }

    router.push('/(owner)/add-pg/step2-amenities' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4B5563" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Property - Step 1 of 5</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepperWrapper}>
        <StepIndicator currentStep={1} />
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '20%' }]} />
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Provide your basic details</Text>

          {/* Row 1 */}
          <View style={styles.row}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>PG Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="PG Name"
                placeholderTextColor="#9CA3AF"
                value={formData.pgName}
                onChangeText={(text) => updateFormData({ pgName: text })}
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>State *</Text>
              <TextInput
                style={styles.input}
                placeholder="Select State"
                placeholderTextColor="#9CA3AF"
                value={formData.state}
                onChangeText={(text) => updateFormData({ state: text })}
              />
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.row}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>PG Gender *</Text>
              <View style={styles.genderRow}>
                {genderOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.genderOption,
                      formData.gender === opt.value && styles.genderOptionActive,
                    ]}
                    onPress={() => updateFormData({ gender: opt.value as any })}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      formData.gender === opt.value && styles.genderOptionTextActive,
                    ]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="Select City"
                placeholderTextColor="#9CA3AF"
                value={formData.city}
                onChangeText={(text) => updateFormData({ city: text })}
              />
            </View>
          </View>

          {/* Row 3 */}
          <View style={styles.row}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>PG Reg No</Text>
              <TextInput
                style={styles.input}
                placeholder="PG Reg No"
                placeholderTextColor="#9CA3AF"
                value={formData.pgRegNo}
                onChangeText={(text) => updateFormData({ pgRegNo: text })}
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Locality *</Text>
              <TextInput
                style={styles.input}
                placeholder="Select Locality"
                placeholderTextColor="#9CA3AF"
                value={formData.locality}
                onChangeText={(text) => updateFormData({ locality: text })}
              />
            </View>
          </View>

          {/* Row 4 */}
          <View style={styles.row}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Contact Person Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Contact Person Name"
                placeholderTextColor="#9CA3AF"
                value={formData.contactPerson}
                onChangeText={(text) => updateFormData({ contactPerson: text })}
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Food Available *</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleOption, formData.foodAvailable && styles.toggleOptionActive]}
                  onPress={() => updateFormData({ foodAvailable: true })}
                >
                  <Text style={[styles.toggleText, formData.foodAvailable && styles.toggleTextActive]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleOption, !formData.foodAvailable && styles.toggleOptionActive]}
                  onPress={() => updateFormData({ foodAvailable: false })}
                >
                  <Text style={[styles.toggleText, !formData.foodAvailable && styles.toggleTextActive]}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Row 5 */}
          <View style={styles.row}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Mobile No *</Text>
              <TextInput
                style={styles.input}
                placeholder="Mobile No"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={formData.mobile}
                onChangeText={(text) => updateFormData({ mobile: text })}
              />
            </View>
            <View style={styles.inputHalf} />
          </View>

          {/* Row 6 */}
          <View style={styles.row}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => updateFormData({ email: text })}
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Gate Closing Time *</Text>
              <TextInput
                style={styles.input}
                placeholder="10:00 PM"
                placeholderTextColor="#9CA3AF"
                value={formData.gateCloseTime}
                onChangeText={(text) => updateFormData({ gateCloseTime: text })}
              />
            </View>
          </View>

          {/* Address */}
          <View style={styles.inputFull}>
            <Text style={styles.inputLabel}>Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter a location"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              value={formData.address}
              onChangeText={(text) => updateFormData({ address: text })}
            />
          </View>

          {/* Row 7 */}
          <View style={styles.row}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Landmark</Text>
              <TextInput
                style={styles.input}
                placeholder="Landmark"
                placeholderTextColor="#9CA3AF"
                value={formData.landmark}
                onChangeText={(text) => updateFormData({ landmark: text })}
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Notice Period (Days) *</Text>
              <TextInput
                style={styles.input}
                placeholder="30"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                value={formData.noticePeriod}
                onChangeText={(text) => updateFormData({ noticePeriod: text })}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputFull}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your PG..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={(text) => updateFormData({ description: text })}
            />
          </View>

          {/* Location Search with Autocomplete */}
          <View style={styles.inputFull}>
            <Text style={styles.inputLabel}>Search Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Type to search (e.g. Anna Nagar)..."
              placeholderTextColor="#9CA3AF"
              value={searchAddress}
              onChangeText={handleSearchAddress}
            />
            {showSuggestions && filteredLocations.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {filteredLocations.map((loc, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => selectLocation(loc)}
                  >
                    <Ionicons name="location-outline" size={16} color="#4ADE80" />
                    <Text style={styles.suggestionText}>{loc.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Map */}
          {MapView ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: formData.latitude || 13.0827,
                  longitude: formData.longitude || 80.2707,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                region={formData.latitude && formData.longitude ? {
                  latitude: formData.latitude,
                  longitude: formData.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                } : undefined}
                onPress={handleMapPress}
              >
                {!!formData.latitude && !!formData.longitude && (
                  <Marker
                    coordinate={{
                      latitude: formData.latitude,
                      longitude: formData.longitude,
                    }}
                    draggable
                    onDragEnd={handleMarkerDrag}
                  />
                )}
              </MapView>
              <Text style={styles.mapHint}>
                Tap on map or drag marker to set exact location
              </Text>
            </View>
          ) : (
            <View style={styles.noMapContainer}>
              <Ionicons name="map-outline" size={48} color="#9CA3AF" />
              <Text style={styles.noMapText}>Map not available</Text>
              <Text style={styles.noMapHint}>Enter coordinates manually:</Text>
              <View style={styles.row}>
                <View style={styles.inputHalf}>
                  <TextInput
                    style={styles.input}
                    placeholder="Latitude"
                    keyboardType="decimal-pad"
                    value={formData.latitude ? String(formData.latitude) : ''}
                    onChangeText={(text) => updateFormData({ latitude: parseFloat(text) || 0 })}
                  />
                </View>
                <View style={styles.inputHalf}>
                  <TextInput
                    style={styles.input}
                    placeholder="Longitude"
                    keyboardType="decimal-pad"
                    value={formData.longitude ? String(formData.longitude) : ''}
                    onChangeText={(text) => updateFormData({ longitude: parseFloat(text) || 0 })}
                  />
                </View>
              </View>
            </View>
          )}

          {formData.latitude && formData.longitude ? (
            <View style={styles.coordsDisplay}>
              <Ionicons name="location" size={16} color="#10B981" />
              <Text style={styles.coordsText}>
                {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </Text>
            </View>
          ) : null}

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
      </KeyboardAvoidingView>
    </View>
  );
}

export default function Step1Basic() {
  return (
    <PGFormProvider>
      <Step1Content />
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
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
  },
  inputFull: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  genderOptionActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  genderOptionText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  genderOptionTextActive: {
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  toggleOptionActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  toggleText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  map: {
    width: '100%',
    height: 250,
  },
  mapHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    padding: 8,
  },
  noMapContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  noMapText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  noMapHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 16,
  },
  coordsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  coordsText: {
    fontSize: 13,
    color: '#059669',
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
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
  },
});
