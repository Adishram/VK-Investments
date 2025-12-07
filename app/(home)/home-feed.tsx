import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  Dimensions,
  ImageBackground,
  Platform,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Link, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import { api, PGListing } from '../../utils/api';
import { useUser } from '@clerk/clerk-expo';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = width - 40; // Square cards

// Filter options
const SORT_OPTIONS = ['Low to High', 'High to Low'];
const OCCUPANCY_OPTIONS = ['Single Room', 'Double Sharing', 'Triple Sharing', '6 Sharing'];
const FOOD_OPTIONS = ['All', 'Yes', 'No'];
const GENDER_OPTIONS = ['All', 'Men', 'Women', 'Unisex'];

// --- Helper Functions ---
const formatPrice = (price: string | number) => {
  if (!price) return '₹0/mo';
  let pString = price.toString();
  pString = pString.replace(/[₹,]/g, '').replace(/\/mo/g, '').trim();
  return `₹${pString}/mo`;
};

// --- Skeleton Loading Component ---
const SkeletonCard = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.skeletonCard}>
      <Animated.View style={[styles.skeletonImage, { opacity }]} />
      <View style={styles.skeletonContent}>
        <Animated.View style={[styles.skeletonTitle, { opacity }]} />
        <Animated.View style={[styles.skeletonLocation, { opacity }]} />
        <View style={styles.skeletonFooter}>
          <Animated.View style={[styles.skeletonRating, { opacity }]} />
          <Animated.View style={[styles.skeletonPrice, { opacity }]} />
        </View>
      </View>
    </View>
  );
};

const SkeletonList = () => (
  <View style={styles.skeletonContainer}>
    <SkeletonCard />
    <SkeletonCard />
  </View>
);

// --- Card Components (No PG/Heart badges) ---

const RecommendedCard = ({ pg }: { pg: PGListing }) => (
  <Link href={`/(home)/pg-details?id=${pg.id}`} asChild>
    <TouchableOpacity activeOpacity={0.9} style={styles.cardContainer}>
      <ImageBackground
        source={{ uri: pg.image_url || pg.images?.[0] || 'https://via.placeholder.com/400x500' }}
        style={styles.cardImage}
        imageStyle={{ borderRadius: 24 }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.cardGradient}
          start={{ x: 0.5, y: 0.4 }}
          end={{ x: 0.5, y: 1 }}
        >
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>{pg.title}</Text>
            <View style={styles.cardLocationRow}>
              <Ionicons name="location" size={16} color="rgba(255,255,255,0.5)" />
              <Text style={styles.cardLocation} numberOfLines={1}>{pg.location}, {pg.city}</Text>
            </View>
            <View style={styles.cardFooterRow}>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Ionicons key={star} name="star" size={18} color="#FFD700" />
                ))}
              </View>
              <Text style={styles.priceText}>{formatPrice(pg.price)}</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  </Link>
);

const CityListCard = ({ pg }: { pg: PGListing }) => (
  <Link href={`/(home)/pg-details?id=${pg.id}`} asChild>
    <TouchableOpacity activeOpacity={0.9} style={styles.cityListCard}>
      <ImageBackground
        source={{ uri: pg.image_url || pg.images?.[0] || 'https://via.placeholder.com/400x500' }}
        style={styles.cityListImage}
        imageStyle={{ borderRadius: 24 }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.cityListGradient}
          start={{ x: 0.5, y: 0.4 }}
          end={{ x: 0.5, y: 1 }}
        >
          <View style={styles.cityListTextContainer}>
            <Text style={styles.cityListTitle} numberOfLines={1}>{pg.title}</Text>
            <View style={styles.cardLocationRow}>
              <Ionicons name="location" size={16} color="rgba(255,255,255,0.5)" />
              <Text style={styles.cityListLocation} numberOfLines={1}>{pg.location}, {pg.city}</Text>
            </View>
            <View style={styles.cityListFooter}>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Ionicons key={star} name="star" size={18} color="#FFD700" />
                ))}
              </View>
              <Text style={styles.cityListPrice}>{formatPrice(pg.price)}</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  </Link>
);

// Bottom Navigation
const BottomNavBar = ({ onNavigate }: { onNavigate?: (route: string) => void }) => (
  <View style={styles.bottomNavWrapper}>
    <BlurView intensity={80} tint="dark" style={styles.bottomNavPill}>
      <TouchableOpacity style={styles.navItem}>
        <Ionicons name="home" size={24} color="#4ADE80" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => onNavigate?.('/(home)/my-pg')}
      >
        <Ionicons name="bed-outline" size={24} color="#888" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => onNavigate?.('/(home)/explore-maps')}
      >
        <Ionicons name="compass-outline" size={24} color="#888" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => onNavigate?.('/(home)/chatbot')}
      >
        <Ionicons name="chatbubble-outline" size={24} color="#888" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => onNavigate?.('/(home)/profile')}
      >
        <Ionicons name="person-outline" size={24} color="#888" />
      </TouchableOpacity>
    </BlurView>
  </View>
);

// --- Main Component ---

export default function HomeFeed() {
  console.log('✅ HomeFeed Rendered');

  const router = useRouter();
  const { user } = useUser();
  
  // Location/City State
  const [city, setCity] = useState('Chennai');
  const [locationInput, setLocationInput] = useState('');
  
  // Data State
  const [allPGs, setAllPGs] = useState<PGListing[]>([]);
  const [recommendedPGs, setRecommendedPGs] = useState<PGListing[]>([]);
  const [cityPGs, setCityPGs] = useState<PGListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search State
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PGListing[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Filter State
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [selectedOccupancy, setSelectedOccupancy] = useState<string[]>([]);
  const [foodFilter, setFoodFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');

  // City Selector State
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Load saved location on mount
  useEffect(() => {
    loadSavedLocation();
    loadPGData();
    loadSearchHistory();
  }, []);

  useEffect(() => {
    console.log('🔄 Filtering PGs with:', { city, sortBy, priceRange, foodFilter, genderFilter });
    
    let filtered = allPGs.filter((pg: PGListing) => {
      // City filter
      if (city && pg.city.toLowerCase() !== city.toLowerCase()) return false;
      
      // Price filter
      if (pg.price < priceRange[0] || pg.price > priceRange[1]) return false;
      
      // Food filter
      if (foodFilter === 'Yes' && !pg.food_included) return false;
      if (foodFilter === 'No' && pg.food_included) return false;
      
      // Gender filter - skip if PG doesn't have gender set
      if (genderFilter !== 'All' && pg.gender) {
        const pgGender = pg.gender.toLowerCase();
        const filterGender = genderFilter.toLowerCase();
        if (pgGender !== filterGender) return false;
      }
      
      return true;
    });

    // Sort
    if (sortBy === 'Low to High') {
      filtered.sort((a: PGListing, b: PGListing) => a.price - b.price);
    } else if (sortBy === 'High to Low') {
      filtered.sort((a: PGListing, b: PGListing) => b.price - a.price);
    }

    console.log('✅ Filtered PGs count:', filtered.length);
    setRecommendedPGs(filtered.slice(0, 5));
    setCityPGs(filtered);
  }, [allPGs, city, sortBy, priceRange, selectedOccupancy, foodFilter, genderFilter]);

  const loadSavedLocation = async () => {
    try {
      const savedCity = await AsyncStorage.getItem('userCity');
      if (savedCity) {
        setCity(savedCity);
        setLocationInput(savedCity);
      }
    } catch (error) {
      console.error('Failed to load saved location:', error);
    }
  };

  const saveLocation = async (newCity: string) => {
    try {
      await AsyncStorage.setItem('userCity', newCity);
      setCity(newCity);
      setLocationInput(newCity);
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  };

  const useCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (address?.city) {
        saveLocation(address.city);
        setIsCityModalVisible(false);
      }
    } catch (error) {
      console.error('Failed to get current location:', error);
      alert('Could not get current location');
    }
  };

  const loadPGData = async () => {
    try {
      setLoading(true);
      const data = await api.getPGs();
      setAllPGs(data);
      
      const cities = [...new Set(data.map((pg: PGListing) => pg.city))];
      setAvailableCities(cities);
    } catch (error) {
      console.error('Failed to load PG data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndDisplayPGs = () => {
    let filtered = allPGs.filter((pg: PGListing) => {
      // City filter
      if (city && pg.city.toLowerCase() !== city.toLowerCase()) return false;
      
      // Price filter
      if (pg.price < priceRange[0] || pg.price > priceRange[1]) return false;
      
      // Food filter
      if (foodFilter === 'Yes' && !pg.food_included) return false;
      if (foodFilter === 'No' && pg.food_included) return false;
      
      // Gender filter
      if (genderFilter !== 'All') {
        const pgGender = pg.gender?.toLowerCase() || '';
        const filterGender = genderFilter.toLowerCase();
        if (pgGender !== filterGender) return false;
      }
      
      return true;
    });

    // Sort
    if (sortBy === 'Low to High') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'High to Low') {
      filtered.sort((a, b) => b.price - a.price);
    }

    setRecommendedPGs(filtered.slice(0, 5));
    setCityPGs(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = allPGs.filter((pg: PGListing) =>
      pg.title.toLowerCase().includes(query.toLowerCase()) ||
      pg.location.toLowerCase().includes(query.toLowerCase()) ||
      pg.city.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  };

  const saveSearchHistory = async (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
    setSearchHistory(updated);
    await AsyncStorage.setItem('searchHistory', JSON.stringify(updated));
  };

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('searchHistory');
      if (history) setSearchHistory(JSON.parse(history));
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPGData();
    setRefreshing(false);
  }, []);

  const resetFilters = () => {
    setSortBy('');
    setPriceRange([0, 50000]);
    setSelectedOccupancy([]);
    setFoodFilter('All');
    setGenderFilter('All');
  };

  const toggleOccupancy = (option: string) => {
    if (selectedOccupancy.includes(option)) {
      setSelectedOccupancy(selectedOccupancy.filter(o => o !== option));
    } else {
      setSelectedOccupancy([...selectedOccupancy, option]);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#0F2925', '#1A3C34', '#0F2925']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Main Content */}
      <View style={[styles.scrollContent, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 50 }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ADE80" />
          }
        >
          {/* Header Pill - Glassmorphic */}
          <View style={styles.headerPillWrapper}>
            <BlurView intensity={80} tint="dark" style={styles.headerPill}>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => setIsCityModalVisible(true)}
              >
                <Image
                  source={{ uri: user?.imageUrl || require('../../assets/icon.png') }}
                  style={styles.logoIcon}
                />
                <View style={styles.locationTextContainer}>
                  <Text style={styles.findText}>Find your perfect PG</Text>
                  <View style={styles.cityRow}>
                    <Text style={styles.cityText}>{city}</Text>
                    <Ionicons name="chevron-down" size={14} color="#4ADE80" />
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setIsFilterModalVisible(true)}
                >
                  <Ionicons name="options-outline" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setIsSearchVisible(true)}
                >
                  <Ionicons name="search-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>

          {/* Gender Quick Filter Pills */}
          <View style={styles.genderFilterRow}>
            {['All', 'Men', 'Women', 'Unisex'].map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.genderPill,
                  genderFilter === gender && styles.genderPillActive
                ]}
                onPress={() => setGenderFilter(gender)}
              >
                <Text style={[
                  styles.genderPillText,
                  genderFilter === gender && styles.genderPillTextActive
                ]}>{gender}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recommended Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended for you</Text>
            {loading ? (
              <SkeletonList />
            ) : (
              <FlatList
                horizontal
                data={recommendedPGs}
                renderItem={({ item }) => <RecommendedCard pg={item} />}
                keyExtractor={item => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            )}
          </View>

          {/* All PGs Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All PGs in {city}</Text>
            {loading ? (
              <SkeletonList />
            ) : (
              cityPGs.map(pg => (
                <CityListCard key={pg.id} pg={pg} />
              ))
            )}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </View>

      {/* Search Modal */}
      <Modal visible={isSearchVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.searchModal}>
            <View style={styles.searchHeader}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search PGs, locations..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />
              <TouchableOpacity onPress={() => {
                setIsSearchVisible(false);
                setSearchQuery('');
                setSearchResults([]);
              }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.searchResults}>
              {searchResults.length > 0 ? (
                searchResults.map(pg => (
                  <TouchableOpacity
                    key={pg.id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      saveSearchHistory(searchQuery);
                      setIsSearchVisible(false);
                      router.push(`/(home)/pg-details?id=${pg.id}`);
                    }}
                  >
                    <Image source={{ uri: pg.image_url }} style={styles.searchResultImage} />
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultTitle}>{pg.title}</Text>
                      <Text style={styles.searchResultLocation}>{pg.location}, {pg.city}</Text>
                      <Text style={styles.searchResultPrice}>{formatPrice(pg.price)}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : searchQuery ? (
                <Text style={styles.noResults}>No results found</Text>
              ) : (
                <View>
                  <Text style={styles.historyTitle}>Recent Searches</Text>
                  {searchHistory.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.historyItem}
                      onPress={() => handleSearch(item)}
                    >
                      <Ionicons name="time-outline" size={20} color="#888" />
                      <Text style={styles.historyText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Filter & Sort Modal - Light Theme */}
      <Modal visible={isFilterModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.filterModalLight}>
            <View style={styles.filterHeaderLight}>
              <Text style={styles.filterTitleLight}>Filter & Sort</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContentLight}>
              {/* Sort by Price */}
              <View style={styles.filterSectionLight}>
                <Text style={styles.filterLabelLight}>Sort by Price</Text>
                <View style={styles.pillsRowLight}>
                  {SORT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.filterPillLight, sortBy === option && styles.filterPillActiveLight]}
                      onPress={() => setSortBy(sortBy === option ? '' : option)}
                    >
                      <Text style={[styles.filterPillTextLight, sortBy === option && styles.filterPillTextActiveLight]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Range */}
              <View style={styles.filterSectionLight}>
                <Text style={styles.filterLabelLight}>Price Range</Text>
                <Text style={styles.priceRangeText}>₹{priceRange[0]} - ₹{priceRange[1]}</Text>
                <Slider
                  style={styles.sliderLight}
                  minimumValue={0}
                  maximumValue={50000}
                  step={1000}
                  value={priceRange[1]}
                  onValueChange={(value) => setPriceRange([0, value])}
                  minimumTrackTintColor="#2196F3"
                  maximumTrackTintColor="#ddd"
                  thumbTintColor="#2196F3"
                />
              </View>

              {/* Occupancy Type */}
              <View style={styles.filterSectionLight}>
                <Text style={styles.filterLabelLight}>Occupancy Type</Text>
                <View style={styles.pillsRowLight}>
                  {OCCUPANCY_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.filterPillLight, selectedOccupancy.includes(option) && styles.filterPillActiveLight]}
                      onPress={() => toggleOccupancy(option)}
                    >
                      <Text style={[styles.filterPillTextLight, selectedOccupancy.includes(option) && styles.filterPillTextActiveLight]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Food Included */}
              <View style={styles.filterSectionLight}>
                <Text style={styles.filterLabelLight}>Food Included</Text>
                <View style={styles.pillsRowLight}>
                  {FOOD_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.filterPillLight, foodFilter === option && styles.filterPillActiveLight]}
                      onPress={() => setFoodFilter(option)}
                    >
                      <Text style={[styles.filterPillTextLight, foodFilter === option && styles.filterPillTextActiveLight]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Gender */}
              <View style={styles.filterSectionLight}>
                <Text style={styles.filterLabelLight}>Gender</Text>
                <View style={styles.pillsRowLight}>
                  {GENDER_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.filterPillLight, genderFilter === option && styles.filterPillActiveLight]}
                      onPress={() => setGenderFilter(option)}
                    >
                      <Text style={[styles.filterPillTextLight, genderFilter === option && styles.filterPillTextActiveLight]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.filterActionsLight}>
              <TouchableOpacity style={styles.resetButtonLight} onPress={resetFilters}>
                <Text style={styles.resetButtonTextLight}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButtonLight} onPress={() => setIsFilterModalVisible(false)}>
                <Text style={styles.applyButtonTextLight}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* City Selector Modal with Input */}
      <Modal visible={isCityModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.cityModal}>
            <View style={styles.cityModalHeader}>
              <Text style={styles.cityModalTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setIsCityModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Location Input */}
            <View style={styles.locationInputContainer}>
              <View style={styles.searchInputWrapper}>
                <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.locationTextInput}
                  placeholder="Search location..."
                  placeholderTextColor="#888"
                  value={locationInput}
                  onChangeText={setLocationInput}
                  onSubmitEditing={() => {
                    if (locationInput.trim()) {
                      saveLocation(locationInput.trim());
                      setIsCityModalVisible(false);
                    }
                  }}
                />
              </View>
              <TouchableOpacity
                style={styles.useLocationButton}
                onPress={useCurrentLocation}
              >
                <Ionicons name="locate" size={20} color="#4ADE80" />
                <Text style={styles.useLocationText}>Use Current Location</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.orText}>Or select from available cities</Text>

            <ScrollView style={styles.cityList}>
              {availableCities.map((cityName) => (
                <TouchableOpacity
                  key={cityName}
                  style={[styles.cityListItem, city === cityName && styles.cityListItemActive]}
                  onPress={() => {
                    saveLocation(cityName);
                    setIsCityModalVisible(false);
                  }}
                >
                  <Text style={[styles.cityListItemText, city === cityName && styles.cityListItemTextActive]}>
                    {cityName}
                  </Text>
                  {city === cityName && <Ionicons name="checkmark-circle" size={24} color="#4ADE80" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <BottomNavBar onNavigate={(route) => router.push(route as any)} />
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F2925',
  },
  backgroundGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flex: 1,
  },
  
  // Header Pill Styles
  headerPillWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#4ADE80',
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  findText: {
    color: '#aaa',
    fontSize: 12,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cityText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  
  // Gender Quick Filter
  genderFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  genderPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  genderPillActive: {
    backgroundColor: '#1A3C34',
    borderColor: '#4ADE80',
  },
  genderPillText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  genderPillTextActive: {
    color: '#fff',
  },
  
  // Section
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  horizontalList: {
    paddingHorizontal: 20,
  },
  
  // Skeleton Loading
  skeletonContainer: {
    paddingHorizontal: 20,
  },
  skeletonCard: {
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  skeletonImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT * 0.7,
    backgroundColor: '#2a3b3c',
    borderRadius: 24,
  },
  skeletonContent: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginTop: -80,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  skeletonTitle: {
    width: '60%',
    height: 24,
    backgroundColor: '#2a3b3c',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonLocation: {
    width: '80%',
    height: 16,
    backgroundColor: '#2a3b3c',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonRating: {
    width: 100,
    height: 18,
    backgroundColor: '#2a3b3c',
    borderRadius: 4,
  },
  skeletonPrice: {
    width: 80,
    height: 22,
    backgroundColor: '#2a3b3c',
    borderRadius: 4,
  },
  
  // Card Styles - Taller
  cardContainer: {
    width: CARD_WIDTH * 0.85,
    marginRight: 16,
  },
  cardImage: {
    width: '100%',
    height: CARD_HEIGHT, // Taller cards
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    borderRadius: 24,
  },
  cardContent: {
    gap: 8,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardLocation: {
    color: '#ddd',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 3,
  },
  priceText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  
  // City List Cards - Square
  cityListCard: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  cityListImage: {
    width: '100%',
    height: CARD_HEIGHT, // Taller cards
    borderRadius: 24,
    overflow: 'hidden',
  },
  cityListGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  cityListTextContainer: {
    gap: 8,
  },
  cityListTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cityListLocation: {
    color: '#ddd',
    fontSize: 16,
    fontWeight: '500',
  },
  cityListFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cityListPrice: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  searchModal: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
  },
  cancelText: {
    color: '#4ADE80',
    fontSize: 16,
    fontWeight: '600',
  },
  searchResults: {
    flex: 1,
    padding: 20,
  },
  searchResultItem: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  searchResultImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  searchResultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  searchResultTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  searchResultLocation: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  searchResultPrice: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noResults: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  historyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  historyText: {
    color: '#fff',
    fontSize: 16,
  },
  
  // Filter Modal - Light Theme (matching reference)
  filterModalLight: {
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
  },
  filterHeaderLight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  filterTitleLight: {
    color: '#333',
    fontSize: 22,
    fontWeight: 'bold',
  },
  filterContentLight: {
    flex: 1,
    padding: 20,
  },
  filterSectionLight: {
    marginBottom: 28,
  },
  filterLabelLight: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  priceRangeText: {
    color: '#555',
    fontSize: 16,
    marginBottom: 8,
  },
  sliderLight: {
    width: '100%',
    height: 40,
  },
  pillsRowLight: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterPillLight: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#e8e8e8',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterPillActiveLight: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterPillTextLight: {
    color: '#555',
    fontSize: 14,
  },
  filterPillTextActiveLight: {
    color: '#fff',
    fontWeight: 'bold',
  },
  filterActionsLight: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  resetButtonLight: {
    flex: 1,
    padding: 16,
    borderRadius: 25,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
  },
  resetButtonTextLight: {
    color: '#555',
    fontSize: 16,
    fontWeight: 'bold',
  },
  applyButtonLight: {
    flex: 2,
    padding: 16,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  applyButtonTextLight: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // City Modal
  cityModal: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
  },
  cityModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  cityModalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  locationInputContainer: {
    padding: 20,
    gap: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  locationTextInput: {
    flex: 1,
    padding: 14,
    color: '#fff',
    fontSize: 16,
  },
  useLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  useLocationText: {
    color: '#4ADE80',
    fontSize: 16,
    fontWeight: '600',
  },
  orText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  cityList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cityListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: '#2a2a2a',
  },
  cityListItemActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  cityListItemText: {
    color: '#fff',
    fontSize: 16,
  },
  cityListItemTextActive: {
    color: '#4ADE80',
    fontWeight: 'bold',
  },
  bottomNavWrapper: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: width * 0.7,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  bottomNavPill: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  navItem: {
    padding: 8,
  },
});
