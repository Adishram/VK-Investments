import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  Keyboard,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { api, PGListing } from '../../utils/api';

const { width, height } = Dimensions.get('window');

// Default location (Bangalore, India)
const DEFAULT_REGION: Region = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export default function ExploreMaps() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [pgs, setPgs] = useState<PGListing[]>([]);
  const [selectedPG, setSelectedPG] = useState<PGListing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  // Animate popup when selectedPG changes
  useEffect(() => {
    if (selectedPG) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedPG]);

  const loadData = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const userCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        const newRegion: Region = {
          ...userCoords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(newRegion);
      }

      const pgData = await api.getPGs();
      setPgs(pgData.filter(pg => pg.latitude && pg.longitude));
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleMapReady = () => {
    // Force map to re-render markers after it's fully loaded
    if (region.latitude !== DEFAULT_REGION.latitude) {
      setTimeout(() => {
        mapRef.current?.animateToRegion(region, 500);
      }, 100);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setPgs(await api.getPGs().then(data => data.filter(pg => pg.latitude && pg.longitude)));
      return;
    }
    
    Keyboard.dismiss();
    setSelectedPG(null);
    
    try {
      // Filter PGs by search query
      const allPgs = await api.getPGs();
      const filtered = allPgs.filter(pg => 
        pg.latitude && pg.longitude &&
        (pg.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         pg.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         pg.location?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      setPgs(filtered);
      
      // Zoom to first result if found
      if (filtered.length > 0 && filtered[0].latitude && filtered[0].longitude) {
        const newRegion: Region = {
          latitude: filtered[0].latitude,
          longitude: filtered[0].longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        mapRef.current?.animateToRegion(newRegion, 1000);
        setRegion(newRegion);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleMarkerPress = (pg: PGListing) => {
    setSelectedPG(pg);
    
    // Animate to marker
    if (pg.latitude && pg.longitude) {
      mapRef.current?.animateToRegion({
        latitude: pg.latitude - 0.005, // Offset to show popup above
        longitude: pg.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    }
  };

  const handleViewPG = () => {
    if (selectedPG) {
      router.push({
        pathname: '/(home)/pg-details',
        params: { id: selectedPG.id },
      });
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getImageUrl = (pg: PGListing): string => {
    // Use image_url first (may be base64), then images array, then placeholder
    return pg.image_url || (pg.images && pg.images[0]) || 'https://via.placeholder.com/400x300';
  };

  const closePopup = () => {
    setSelectedPG(null);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      
      {/* Full Screen Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onPress={closePopup}
        onMapReady={handleMapReady}
      >
        {/* Custom Marker Pins with TouchableOpacity for iOS */}
        {pgs.map((pg) => (
          <Marker
            key={pg.id}
            coordinate={{
              latitude: pg.latitude,
              longitude: pg.longitude,
            }}
            onPress={() => handleMarkerPress(pg)}
            onCalloutPress={() => handleMarkerPress(pg)}
            tracksViewChanges={false}
          >
            <TouchableOpacity
              onPress={() => handleMarkerPress(pg)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[
                styles.markerPin,
                selectedPG?.id === pg.id && styles.markerPinSelected
              ]}>
                <Ionicons name="home" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </Marker>
        ))}
      </MapView>

      {/* Glassmorphic Search Bar */}
      <View style={styles.searchContainer}>
        <BlurView intensity={100} tint="light" style={styles.searchBarBlur}>
          <View style={styles.searchBarInner}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color="#333" />
            </TouchableOpacity>
            
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={18} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search city or locality..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
            </View>
            
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <Ionicons name="navigate" size={20} color="#4ADE80" />
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>

      {/* Custom Popup Card - Positioned at bottom */}
      <Animated.View 
        style={[
          styles.popupContainer,
          { transform: [{ translateY: slideAnim }] }
        ]}
        pointerEvents={selectedPG ? 'auto' : 'none'}
      >
        {selectedPG && (
          <TouchableOpacity 
            style={styles.popup}
            activeOpacity={0.95}
            onPress={handleViewPG}
          >
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={closePopup}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
            
            {/* PG Image - Tap anywhere to go to details */}
            <Image
              source={{ uri: getImageUrl(selectedPG) }}
              style={styles.popupImage}
              resizeMode="cover"
            />
            <View style={styles.titleCardInner}>
                <View style={styles.titleContent}>
                  <Text style={styles.pgTitle}>{selectedPG.title}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.locationText}>{selectedPG.city}</Text>
                    {selectedPG.gender && (
                      <View style={[
                        styles.genderBadge,
                        { backgroundColor: selectedPG.gender === 'women' ? '#FDF2F8' : selectedPG.gender === 'men' ? '#EFF6FF' : '#F0FDF4', marginLeft: 8 }
                      ]}>
                        <Text style={[
                          styles.genderText,
                          { color: selectedPG.gender === 'women' ? '#DB2777' : selectedPG.gender === 'men' ? '#2563EB' : '#16A34A' }
                        ]}>
                          {selectedPG.gender === 'women' ? 'Women' : selectedPG.gender === 'men' ? 'Men' : 'Unisex'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
            </View>
            
            {/* PG Info */}
            <View style={styles.popupContent}>
              <View style={styles.popupFooter}>
                <Text style={styles.popupPrice}>
                  ₹{selectedPG.price?.toLocaleString('en-IN')}/month
                </Text>
                
                <View style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View PG</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  
  // Search Bar
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
  },
  searchBarBlur: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '400',
    paddingVertical: 8,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Custom Popup Card
  popupContainer: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
  },
  popup: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#e0e0e0',
  },
  popupContent: {
    padding: 16,
    gap: 8,
  },
  popupTitle: {
    color: '#1a1a1a',
    fontSize: 20,
    fontWeight: '700',
  },
  popupLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  popupLocation: {
    color: '#888',
    fontSize: 14,
  },
  popupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  popupPrice: {
    color: '#2E7D32',
    fontSize: 20,
    fontWeight: '700',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  titleCardInner: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  titleContent: {
    gap: 4,
  },
  pgTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  genderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  genderText: {
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Marker Pin Styles
  markerPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4ADE80',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerPinSelected: {
    backgroundColor: '#2196F3',
    transform: [{ scale: 1.2 }],
  },
});
