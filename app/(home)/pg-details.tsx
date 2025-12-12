import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  Linking,
  StatusBar,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { api, PGListing, Review } from '../../utils/api';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useUser } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.55; // 55% of screen height for larger image

export default function PGDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const [pg, setPg] = useState<PGListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Schedule Visit State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [visitDate, setVisitDate] = useState(new Date());
  const [visitTime, setVisitTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [schedulingVisit, setSchedulingVisit] = useState(false);
  
  // Room Selection State
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);

  useEffect(() => {
    loadPGDetails();
  }, [id]);

  const loadPGDetails = async () => {
    try {
      if (!id) return;
      const data = await api.getPGById(Number(id));
      console.log('PG Data loaded:', JSON.stringify(data, null, 2));
      setPg(data);
      // Load reviews
      try {
        const reviewsData = await api.getReviews(Number(id));
        setReviews(reviewsData);
      } catch (e) {
        console.log('No reviews yet');
      }
    } catch (error) {
      console.error('Failed to load PG details:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => 
        `data:image/jpeg;base64,${asset.base64}`
      );
      setReviewImages([...reviewImages, ...newImages].slice(0, 3));
    }
  };

  const submitReview = async () => {
    if (!pg || !user) return;
    
    setSubmittingReview(true);
    try {
      await api.addReview(
        pg.id,
        user.fullName || user.primaryEmailAddress?.emailAddress || 'Anonymous',
        reviewRating,
        reviewText,
        reviewImages
      );
      
      // Reload reviews
      const reviewsData = await api.getReviews(pg.id);
      setReviews(reviewsData);
      
      // Reset form
      setShowReviewModal(false);
      setReviewRating(5);
      setReviewText('');
      setReviewImages([]);
      Alert.alert('Success', 'Your review has been submitted!');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        {/* Skeleton for Image */}
        <View style={[styles.skeletonImage, { width, height: IMAGE_HEIGHT }]} />
        
        {/* Skeleton for Content */}
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonTitleRow}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonBadge} />
          </View>
          <View style={styles.skeletonLocation} />
          <View style={styles.skeletonPrice} />
          
          {/* Skeleton for Action Buttons */}
          <View style={styles.skeletonActions}>
            <View style={styles.skeletonActionBtn} />
            <View style={styles.skeletonActionBtn} />
            <View style={styles.skeletonActionBtn} />
          </View>
          
          {/* Skeleton for Description */}
          <View style={styles.skeletonSection}>
            <View style={styles.skeletonSectionTitle} />
            <View style={styles.skeletonText} />
            <View style={[styles.skeletonText, { width: '80%' }]} />
            <View style={[styles.skeletonText, { width: '60%' }]} />
          </View>
          
          {/* Skeleton for Amenities */}
          <View style={styles.skeletonSection}>
            <View style={styles.skeletonSectionTitle} />
            <View style={styles.skeletonAmenities}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={styles.skeletonAmenityItem} />
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!pg) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>PG not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get valid images - check for actual image URLs or base64
  const isValidImage = (img: any): img is string => {
    if (!img || typeof img !== 'string') return false;
    // Check for HTTP URL, data URI, or raw base64
    return img.startsWith('http') || 
           img.startsWith('data:image') || 
           img.startsWith('/9j/') || // JPEG base64
           img.startsWith('iVBOR'); // PNG base64
  };

  const formatImage = (img: string): string => {
    // If it's already a proper URL or data URI, return as is
    if (img.startsWith('http') || img.startsWith('data:image')) {
      return img;
    }
    // If it's raw base64, add the data URI prefix
    if (img.startsWith('/9j/')) {
      return `data:image/jpeg;base64,${img}`;
    }
    if (img.startsWith('iVBOR')) {
      return `data:image/png;base64,${img}`;
    }
    return img;
  };

  const getValidImages = () => {
    if (pg.images && Array.isArray(pg.images) && pg.images.length > 0) {
      const validImages = pg.images.filter(isValidImage).map(formatImage);
      if (validImages.length > 0) return validImages;
    }
    if (isValidImage(pg.image_url)) {
      return [formatImage(pg.image_url)];
    }
    return [];
  };
  
  const images = getValidImages();
  const hasImages = images.length > 0;
  
  const handleCall = () => {
    if (pg.owner_contact) Linking.openURL(`tel:${pg.owner_contact}`);
  };

  // Validate schedule visit date/time
  const validateScheduleDateTime = (): { valid: boolean; message?: string } => {
    const now = new Date();
    const selectedDateTime = new Date(visitDate);
    selectedDateTime.setHours(visitTime.getHours(), visitTime.getMinutes());

    // Check if date is in the past
    if (visitDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      return { valid: false, message: 'Please select a future date.' };
    }

    // Check if time is within 6 hours (same day only)
    const isSameDay = visitDate.toDateString() === now.toDateString();
    if (isSameDay) {
      const hoursUntilVisit = (selectedDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilVisit < 6) {
        return { valid: false, message: 'Visits must be scheduled at least 6 hours in advance. Please select a time tomorrow or later.' };
      }
    }

    // Check time window (7am - 7pm)
    const hour = visitTime.getHours();
    if (hour < 7) {
      return { valid: false, message: 'Visits can only be scheduled between 7:00 AM and 7:00 PM. Please select a later time.' };
    }
    if (hour >= 19) {
      return { valid: false, message: 'Visits can only be scheduled between 7:00 AM and 7:00 PM. Please select an earlier time.' };
    }

    return { valid: true };
  };

  const handleScheduleVisit = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please sign in to schedule a visit.');
      return;
    }

    // Validate date/time
    const validation = validateScheduleDateTime();
    if (!validation.valid) {
      Alert.alert('Invalid Time', validation.message);
      return;
    }

    setSchedulingVisit(true);
    try {
      const dateStr = visitDate.toISOString().split('T')[0];
      const timeStr = visitTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      await api.scheduleVisit(
        user.primaryEmailAddress?.emailAddress || '',
        user.fullName || '',
        pg.id,
        pg.owner_email || '',
        dateStr,
        timeStr
      );
      
      setShowScheduleModal(false);
      Alert.alert(
        'Visit Scheduled!',
        'Your visit request has been sent to the owner. You can check the status in My PG page.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule visit. Please try again.');
    } finally {
      setSchedulingVisit(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: pg.title,
        message: `Check out ${pg.title} in ${pg.city}!\n\nPrice: ₹${pg.price}/month\n${pg.description}\n\nContact: ${pg.owner_contact || 'N/A'}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const openInMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${pg.latitude},${pg.longitude}`,
      android: `geo:0,0?q=${pg.latitude},${pg.longitude}(${pg.title})`,
    });
    if (url) Linking.openURL(url);
  };

  const getAmenityIcon = (amenity: string): any => {
    const map: { [key: string]: string } = {
      'WiFi': 'wifi',
      'Wi-Fi': 'wifi',
      'AC': 'snowflake',
      'Hot water': 'water-boiler',
      'Food': 'food',
      'Laundry': 'washing-machine',
      'Parking': 'car',
      'Gym': 'dumbbell',
      'TV': 'television',
      'Power Backup': 'battery-charging',
      'Cleaning': 'broom',
      'CCTV': 'cctv',
    };
    return map[amenity] || 'check-circle';
  };

  const renderStars = (rating: number, onPress?: (star: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress && onPress(star)}
            disabled={!onPress}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={onPress ? 32 : 16}
              color="#FFD700"
              style={{ marginHorizontal: 2 }}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          {hasImages ? (
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(index);
              }}
              renderItem={({ item }) => (
                <Image 
                  source={{ uri: item }} 
                  style={styles.mainImage}
                  resizeMode="cover"
                />
              )}
              keyExtractor={(item, index) => index.toString()}
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="image-outline" size={80} color="#4ADE80" />
              <Text style={styles.noImageText}>No images available</Text>
            </View>
          )}
          
          {/* Header Icons */}
          <View style={styles.headerOverlay}>
            <TouchableOpacity style={styles.headerIcon} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Image Dots */}
          {hasImages && images.length > 1 && (
            <View style={styles.dotsContainer}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, currentImageIndex === index && styles.dotActive]}
                />
              ))}
            </View>
          )}

          {/* Title Card Overlay - Apple Liquid Glass */}
          <BlurView intensity={100} tint="light" style={styles.titleCard}>
            <View style={styles.titleCardInner}>
              <View style={styles.titleContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.pgTitle}>{pg.title}</Text>
                  {pg.gender && (
                    <View style={[
                      styles.genderBadge,
                      { backgroundColor: pg.gender === 'women' ? '#FDF2F8' : pg.gender === 'men' ? '#EFF6FF' : '#F0FDF4' }
                    ]}>
                      <Text style={[
                        styles.genderText,
                        { color: pg.gender === 'women' ? '#DB2777' : pg.gender === 'men' ? '#2563EB' : '#16A34A' }
                      ]}>
                        {pg.gender === 'women' ? 'Women' : pg.gender === 'men' ? 'Men' : 'Unisex'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color="#666" />
                  <Text style={styles.locationText}>{pg.city}</Text>
                </View>
              </View>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.ratingText}>{typeof pg.rating === 'number' ? pg.rating.toFixed(1) : '0.0'}</Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{pg.description}</Text>
          </View>

          {/* Facilities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Facilities</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.facilitiesRow}>
                {(pg.amenities || ['Wi-Fi', 'AC', 'Hot water']).map((amenity, index) => (
                  <View key={index} style={styles.facilityPill}>
                    <MaterialCommunityIcons name={getAmenityIcon(amenity)} size={18} color="#555" />
                    <Text style={styles.facilityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Available Rooms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Rooms</Text>
            <View style={styles.roomsGrid}>
              {/* Use rooms array if available (new format), otherwise fall back to occupancy_types */}
              {pg.rooms && Array.isArray(pg.rooms) && pg.rooms.length > 0 ? (
                pg.rooms.map((room: any, index: number) => (
                  <View key={index} style={styles.roomCard}>
                    <View style={styles.roomHeader}>
                      <Text style={styles.roomType}>{room.type}</Text>
                      <View style={styles.availableBadge}>
                        <Text style={styles.availableText}>{room.available || room.count} Left</Text>
                      </View>
                    </View>
                    <Text style={styles.roomDetails}>{room.isAC ? 'AC' : 'Non-AC'}</Text>
                    <View style={styles.roomPricing}>
                      <Text style={styles.roomPrice}>₹{room.price}/mo</Text>
                      <Text style={styles.depositText}>Dep: ₹{room.deposit || (room.price * 2)}</Text>
                    </View>
                  </View>
                ))
              ) : pg.occupancy_types && pg.occupancy_types.length > 0 ? (
                pg.occupancy_types.map((type, index) => (
                  <View key={index} style={styles.roomCard}>
                    <View style={styles.roomHeader}>
                      <Text style={styles.roomType}>{type}</Text>
                      <View style={styles.availableBadge}>
                        <Text style={styles.availableText}>Available</Text>
                      </View>
                    </View>
                    <Text style={styles.roomDetails}>Non-AC</Text>
                    <View style={styles.roomPricing}>
                      <Text style={styles.roomPrice}>₹{pg.occupancy_prices?.[type] || pg.price}/mo</Text>
                      <Text style={styles.depositText}>Dep: ₹{pg.safety_deposit || (pg.occupancy_prices?.[type] || pg.price) * 2}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.roomCard}>
                  <View style={styles.roomHeader}>
                    <Text style={styles.roomType}>Standard Room</Text>
                    <View style={styles.availableBadge}>
                      <Text style={styles.availableText}>Available</Text>
                    </View>
                  </View>
                  <Text style={styles.roomDetails}>Non-AC</Text>
                  <View style={styles.roomPricing}>
                    <Text style={styles.roomPrice}>₹{pg.price}/mo</Text>
                    <Text style={styles.depositText}>Dep: ₹{pg.safety_deposit || pg.price * 2}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Info Bar */}
          <View style={styles.infoBar}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Food</Text>
              <Text style={styles.infoValue}>{pg.food_included ? 'Included' : 'Not Included'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Notice</Text>
              <Text style={styles.infoValue}>{pg.notice_period || '30 Days'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Gate Close</Text>
              <Text style={styles.infoValue}>{pg.gate_close_time || '11:00 PM'}</Text>
            </View>
          </View>

          {/* House Rules */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>House Rules</Text>
            {(pg.rules || ['No Drinking', 'No overnight guests', 'Respect quiet hours']).map((rule, index) => (
              <View key={index} style={styles.ruleRow}>
                <View style={styles.ruleDot} />
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={{
                  latitude: pg.latitude || 12.9716,
                  longitude: pg.longitude || 77.5946,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: pg.latitude || 12.9716,
                    longitude: pg.longitude || 77.5946,
                  }}
                  title={pg.title}
                />
              </MapView>
              <TouchableOpacity style={styles.openMapsButton} onPress={openInMaps}>
                <Text style={styles.openMapsText}>Open in Maps</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.addressText}>{pg.location}, {pg.city}</Text>
          </View>

          {/* Contact Owner */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Owner</Text>
            <View style={styles.contactButtons}>
              <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chatButton} onPress={() => setShowScheduleModal(true)}>
                <Ionicons name="calendar-outline" size={20} color="#0F2925" />
                <Text style={styles.chatButtonText}>Schedule Visit</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(true)}>
                <Text style={styles.writeReviewText}>Write a Review</Text>
              </TouchableOpacity>
            </View>
            
            {reviews.length === 0 ? (
              <Text style={styles.noReviews}>No reviews yet. Be the first to review!</Text>
            ) : (
              reviews.map((review, index) => (
                <View key={index} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View>
                      <Text style={styles.reviewerName}>{review.user_name}</Text>
                      {renderStars(review.rating)}
                    </View>
                    {user?.fullName === review.user_name && (
                      <TouchableOpacity>
                        <Ionicons name="trash-outline" size={20} color="#ff4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.reviewTextContent}>{review.review_text}</Text>
                  {review.review_images && review.review_images.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewImagesScroll}>
                      {review.review_images.map((img, imgIndex) => (
                        <Image key={imgIndex} source={{ uri: img }} style={styles.reviewImage} />
                      ))}
                    </ScrollView>
                  )}
                </View>
              ))
            )}
          </View>

          <View style={{ height: 140 }} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar - Glassmorphic Pill */}
      <View style={styles.bottomBarWrapper}>
        <BlurView intensity={80} tint="dark" style={styles.bottomBarPill}>
          <View style={styles.priceSection}>
            <Text style={styles.startingFrom}>Starting from</Text>
            <Text style={styles.bottomPrice}>₹{pg.price}<Text style={styles.perPerson}>/mo</Text></Text>
          </View>
          <TouchableOpacity style={styles.bookButton} onPress={() => setShowRoomModal(true)}>
            <Text style={styles.bookButtonText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={18} color="#000" />
          </TouchableOpacity>
        </BlurView>
      </View>

      {/* Review Modal */}
      <Modal visible={showReviewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.reviewModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.ratingLabel}>Your Rating</Text>
            {renderStars(reviewRating, setReviewRating)}

            <Text style={styles.ratingLabel}>Your Review</Text>
            <TextInput
              style={styles.reviewInput}
              multiline
              numberOfLines={4}
              placeholder="Share your experience..."
              placeholderTextColor="#888"
              value={reviewText}
              onChangeText={setReviewText}
            />

            <Text style={styles.ratingLabel}>Add Photos (up to 3)</Text>
            <View style={styles.imagePickerRow}>
              {reviewImages.map((img, index) => (
                <View key={index} style={styles.reviewImagePreview}>
                  <Image source={{ uri: img }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={styles.removeImageBtn}
                    onPress={() => setReviewImages(reviewImages.filter((_, i) => i !== index))}
                  >
                    <Ionicons name="close-circle" size={24} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {reviewImages.length < 3 && (
                <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                  <Ionicons name="camera-outline" size={32} color="#4ADE80" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.submitReviewBtn, submittingReview && { opacity: 0.6 }]}
              onPress={submitReview}
              disabled={submittingReview}
            >
              {submittingReview ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitReviewText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Schedule Visit Modal - Full Screen White */}
      <Modal visible={showScheduleModal} animationType="slide">
        <View style={styles.scheduleModalContainer}>
          <View style={styles.scheduleModalHeader}>
            <Text style={styles.scheduleModalTitle}>Schedule Visit</Text>
            <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.scheduleModalContent}>
            <Text style={styles.scheduleLabel}>Select Date</Text>
            <TouchableOpacity 
              style={styles.scheduleDateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#4ADE80" />
              <Text style={styles.scheduleDateText}>
                {visitDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={visitDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) setVisitDate(date);
                }}
              />
            )}

            <Text style={styles.scheduleLabel}>Select Time</Text>
            <TouchableOpacity 
              style={styles.scheduleDateButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time" size={20} color="#4ADE80" />
              <Text style={styles.scheduleDateText}>
                {visitTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={visitTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, time) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (time) setVisitTime(time);
                }}
              />
            )}
          </View>

          <View style={styles.scheduleModalFooter}>
            <TouchableOpacity 
              style={[styles.scheduleSubmitBtn, schedulingVisit && { opacity: 0.6 }]}
              onPress={handleScheduleVisit}
              disabled={schedulingVisit}
            >
              {schedulingVisit ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.scheduleSubmitText}>Schedule Visit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Room Selection Modal */}
      <Modal visible={showRoomModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.reviewModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Room Type</Text>
              <TouchableOpacity onPress={() => setShowRoomModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.ratingLabel}>Available Rooms</Text>
            
            {(pg.occupancy_types || ['Single Sharing', 'Double Sharing', 'Triple Sharing']).map((type, index) => {
              const roomPrice = pg.occupancy_prices?.[type] || pg.price;
              return (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.roomOption,
                    selectedRoomType === type && styles.roomOptionSelected
                  ]}
                  onPress={() => setSelectedRoomType(type)}
                >
                  <View style={styles.roomOptionLeft}>
                    <Text style={styles.roomOptionType}>{type}</Text>
                    <Text style={styles.roomOptionPrice}>₹{roomPrice}/month</Text>
                  </View>
                  <View style={[
                    styles.roomRadio,
                    selectedRoomType === type && styles.roomRadioSelected
                  ]}>
                    {selectedRoomType === type && (
                      <View style={styles.roomRadioInner} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity 
              style={[styles.submitReviewBtn, !selectedRoomType && { opacity: 0.5 }]}
              disabled={!selectedRoomType}
              onPress={() => {
                setShowRoomModal(false);
                const roomPrice = pg.occupancy_prices?.[selectedRoomType || ''] || pg.price;
                router.push({
                  pathname: '/(home)/booking',
                  params: {
                    pgId: pg.id.toString(),
                    pgTitle: pg.title,
                    pgLocation: pg.location,
                    pgCity: pg.city,
                    pgImage: pg.image_url || pg.images?.[0] || '',
                    roomType: selectedRoomType || '',
                    price: roomPrice.toString(),
                    ownerEmail: pg.owner_email || '',
                  },
                });
              }}
            >
              <Text style={styles.submitReviewText}>Continue to Booking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F2925',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F2925',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F2925',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },

  // Image Section
  imageContainer: {
    height: IMAGE_HEIGHT,
    position: 'relative',
    backgroundColor: '#1A3C34',
  },
  mainImage: {
    width: width,
    height: IMAGE_HEIGHT,
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A3C34',
  },
  noImageText: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 12,
  },
  headerOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  titleCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  titleCardInner: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  titleContent: {
    flex: 1,
    paddingRight: 12,
  },
  pgTitle: {
    color: '#1a1a1a',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: '#444',
    fontSize: 15,
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ratingText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  genderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  genderText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingTop: 25,
    backgroundColor: '#0F2925',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  description: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 24,
  },

  // Facilities
  facilitiesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  facilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  facilityText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '500',
  },

  // Rooms
  roomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roomCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    width: (width - 52) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  roomType: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  availableBadge: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  availableText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  roomDetails: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 10,
  },
  roomPricing: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 10,
  },
  roomPrice: {
    color: '#4ADE80',
    fontSize: 16,
    fontWeight: 'bold',
  },
  depositText: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },

  // Info Bar
  infoBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // Rules
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  ruleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  ruleText: {
    color: '#ccc',
    fontSize: 15,
  },

  // Map
  mapContainer: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  map: {
    flex: 1,
  },
  openMapsButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  openMapsText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  addressText: {
    color: '#ccc',
    fontSize: 14,
  },

  // Contact
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ADE80',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  chatButtonText: {
    color: '#0F2925',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Reviews
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  writeReviewText: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '600',
  },
  noReviews: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
  starsContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reviewerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reviewTextContent: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  reviewImagesScroll: {
    marginTop: 12,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },

  // Bottom Bar - Glassmorphic Pill
  bottomBarWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 16,
    right: 16,
    borderRadius: 30,
    overflow: 'hidden',
  },
  bottomBarPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  priceSection: {},
  startingFrom: {
    color: '#aaa',
    fontSize: 12,
  },
  bottomPrice: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  perPerson: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#aaa',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ADE80',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 6,
  },
  bookButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // Review Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  reviewModalContent: {
    backgroundColor: '#1A3C34',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  ratingLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 16,
  },
  reviewInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    textAlignVertical: 'top',
    height: 120,
  },
  imagePickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  reviewImagePreview: {
    position: 'relative',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4ADE80',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitReviewBtn: {
    backgroundColor: '#4ADE80',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitReviewText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  datePickerText: {
    color: '#fff',
    fontSize: 16,
  },
  
  // Room Selection Modal Styles
  roomOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roomOptionSelected: {
    borderColor: '#4ADE80',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  roomOptionLeft: {
    gap: 4,
  },
  roomOptionType: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  roomOptionPrice: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  roomRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomRadioSelected: {
    borderColor: '#4ADE80',
  },
  roomRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ADE80',
  },
  
  // Schedule Visit Full Screen Modal Styles
  scheduleModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scheduleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scheduleModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  scheduleModalContent: {
    flex: 1,
    padding: 20,
  },
  scheduleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 20,
  },
  scheduleDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  scheduleDateText: {
    color: '#000',
    fontSize: 16,
    flex: 1,
  },
  scheduleModalFooter: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  scheduleSubmitBtn: {
    backgroundColor: '#4ADE80',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  scheduleSubmitText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Skeleton Loader Styles
  skeletonImage: {
    backgroundColor: '#2a3b3c',
  },
  skeletonContent: {
    padding: 20,
    marginTop: -30,
    backgroundColor: '#0F2925',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  skeletonTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonTitle: {
    width: '60%',
    height: 28,
    backgroundColor: '#2a3b3c',
    borderRadius: 8,
  },
  skeletonBadge: {
    width: 60,
    height: 28,
    backgroundColor: '#2a3b3c',
    borderRadius: 14,
  },
  skeletonLocation: {
    width: '80%',
    height: 16,
    backgroundColor: '#2a3b3c',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonPrice: {
    width: '40%',
    height: 24,
    backgroundColor: '#2a3b3c',
    borderRadius: 6,
    marginBottom: 20,
  },
  skeletonActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  skeletonActionBtn: {
    width: 60,
    height: 60,
    backgroundColor: '#2a3b3c',
    borderRadius: 30,
  },
  skeletonSection: {
    marginBottom: 24,
  },
  skeletonSectionTitle: {
    width: '40%',
    height: 20,
    backgroundColor: '#2a3b3c',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonText: {
    width: '100%',
    height: 14,
    backgroundColor: '#2a3b3c',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonAmenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skeletonAmenityItem: {
    width: 80,
    height: 36,
    backgroundColor: '#2a3b3c',
    borderRadius: 18,
  },
});
