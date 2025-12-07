import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useUser } from '@clerk/clerk-expo';
import { api, PGListing } from '../../utils/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

// Booking info interface
interface BookingInfo {
  hasPG: boolean;
  pg?: PGListing;
  customer?: {
    id: number;
    name: string;
    email: string;
    room_no: string;
    floor: string;
    room_type: string;
    move_in_date: string;
    status: string;
    amount: number;
    booking_id: string;
  };
}

// Calculate days until rent is due (1st of each month)
const getDaysUntilRentDue = (): number => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  if (today.getDate() === 1) {
    return 0;
  } else {
    const nextDueDate = new Date(currentYear, currentMonth + 1, 1);
    const diffTime = nextDueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
};

// Format date nicely
const formatDate = (dateString: string): string => {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function MyPGPage() {
  const router = useRouter();
  const { user } = useUser();
  
  const [loading, setLoading] = useState(true);
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null);
  const [daysUntilDue, setDaysUntilDue] = useState(0);
  const [visitRequests, setVisitRequests] = useState<any[]>([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [editingCheckIn, setEditingCheckIn] = useState(false);
  
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    loadBookingInfo();
    setDaysUntilDue(getDaysUntilRentDue());
  }, [userEmail]);

  const loadBookingInfo = async () => {
    if (!userEmail) {
      setLoading(false);
      setBookingInfo({ hasPG: false });
      return;
    }

    try {
      setLoading(true);
      const response = await api.getMyPG(userEmail);
      setBookingInfo(response);
      
      // Load visit requests
      try {
        const visits = await api.getVisitRequests(userEmail);
        setVisitRequests(visits);
      } catch (e) {
        console.log('No visit requests');
      }
    } catch (error) {
      console.error('Failed to load My PG:', error);
      setBookingInfo({ hasPG: false });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Render booking content
  const renderBookingContent = () => {
    if (!bookingInfo?.hasPG || !bookingInfo.pg || !bookingInfo.customer) {
      return null;
    }

    const { pg, customer } = bookingInfo;

    return (
      <>
        {/* Combined PG Card with White Booking Details */}
        <View style={styles.combinedCard}>
          {/* PG Image */}
          <Link href={`/(home)/pg-details?id=${pg.id}`} asChild>
            <TouchableOpacity activeOpacity={0.9}>
              <ImageBackground
                source={{ uri: pg.image_url || pg.images?.[0] || 'https://via.placeholder.com/400x200' }}
                style={styles.pgCardImage}
                imageStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.pgCardGradient}
                >
                  <Text style={styles.pgCardTitle}>{pg.title}</Text>
                  <View style={styles.pgCardLocationRow}>
                    <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.pgCardLocation}>
                      {pg.location}, {pg.city}
                    </Text>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          </Link>

          {/* White Booking Details Section */}
          <View style={styles.bookingDetailsSection}>
            <Text style={styles.bookingDetailsTitle}>Booking Details</Text>
            
            <View style={styles.detailRow}>
              <View style={styles.detailRowLeft}>
                <Ionicons name="bed-outline" size={20} color="#0F2925" />
                <Text style={styles.detailRowLabel}>Room Number</Text>
              </View>
              <Text style={styles.detailRowValue}>
                {customer.room_no || 'To be assigned'}
              </Text>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailRowLeft}>
                <Ionicons name="layers-outline" size={20} color="#0F2925" />
                <Text style={styles.detailRowLabel}>Floor</Text>
              </View>
              <Text style={styles.detailRowValue}>
                {customer.floor || 'To be assigned'}
              </Text>
            </View>

            <View style={styles.detailDivider} />

            <TouchableOpacity 
              style={styles.detailRow}
              onPress={() => setShowCheckInPicker(!showCheckInPicker)}
            >
              <View style={styles.detailRowLeft}>
                <Ionicons name="calendar-outline" size={20} color="#0F2925" />
                <Text style={styles.detailRowLabel}>Check-in Date</Text>
              </View>
              <View style={styles.checkInEdit}>
                <Text style={styles.detailRowValue}>
                  {formatDate(customer.move_in_date)}
                </Text>
                <Ionicons name={showCheckInPicker ? "chevron-down" : "chevron-forward"} size={16} color="#0F2925" />
              </View>
            </TouchableOpacity>
            
            {showCheckInPicker && (
              <View>
                <DateTimePicker
                  value={customer.move_in_date ? new Date(customer.move_in_date) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={async (event, date) => {
                    if (Platform.OS !== 'ios') {
                      setShowCheckInPicker(false);
                    }
                    if (event.type === 'set' && date && customer.id) {
                      setEditingCheckIn(true);
                      try {
                        await api.updateCheckInDate(customer.id, date.toISOString().split('T')[0]);
                        loadBookingInfo();
                        Alert.alert('Success', 'Check-in date updated!');
                      } catch (error) {
                        Alert.alert('Error', 'Failed to update check-in date');
                      } finally {
                        setEditingCheckIn(false);
                      }
                    }
                  }}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity 
                    style={styles.datePickerDoneButton}
                    onPress={() => setShowCheckInPicker(false)}
                  >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailRowLeft}>
                <Ionicons name="people-outline" size={20} color="#0F2925" />
                <Text style={styles.detailRowLabel}>Room Type</Text>
              </View>
              <Text style={styles.detailRowValue}>
                {customer.room_type || 'N/A'}
              </Text>
            </View>

            {/* Cancel Booking Button */}
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                Alert.alert(
                  'Cancel Booking',
                  'Are you sure you want to cancel your PG booking? This action cannot be undone.',
                  [
                    { text: 'No, Keep Booking', style: 'cancel' },
                    { 
                      text: 'Yes, Cancel', 
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await api.cancelBooking(customer.id);
                          Alert.alert('Booking Cancelled', 'Your booking has been cancelled successfully.');
                          loadBookingInfo(); // Refresh the page
                        } catch (error) {
                          Alert.alert('Error', 'Failed to cancel booking. Please try again.');
                        }
                      }
                    },
                  ]
                );
              }}
            >
              <Ionicons name="close-circle-outline" size={20} color="#f44336" />
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rent Due Card - Glassmorphic */}
        <View style={styles.rentCardWrapper}>
          <BlurView intensity={60} tint="dark" style={styles.rentCard}>
            <View style={styles.rentCardInner}>
              <View style={styles.rentCardLeft}>
                <Text style={styles.rentDueLabel}>Days until rent is due</Text>
                <Text style={styles.rentDueDate}>1st of next month</Text>
              </View>
              <View style={styles.rentDaysContainer}>
                <Text style={styles.rentDaysNumber}>{daysUntilDue}</Text>
                <Text style={styles.rentDaysText}>days</Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Scheduled Visits Section - Now on top */}
        {visitRequests.length > 0 && (
          <View style={styles.announcementsSection}>
            <Text style={styles.sectionTitle}>Scheduled Visits</Text>
            {visitRequests.map((visit, index) => (
              <TouchableOpacity
                key={visit.id || index}
                style={styles.visitCard}
                disabled={visit.status !== 'rejected'}
                onPress={() => {
                  if (visit.status === 'rejected') {
                    router.push(`/(home)/pg-details?id=${visit.pg_id}`);
                  }
                }}
              >
                <View style={styles.visitCardContent}>
                  <Text style={styles.visitPgTitle}>{visit.pg_title}</Text>
                  <Text style={styles.visitDateTime}>
                    {new Date(visit.visit_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at {visit.visit_time}
                  </Text>
                </View>
                <View style={styles.visitStatusBadge}>
                  {visit.status === 'pending' && (
                    <>
                      <Ionicons name="time-outline" size={18} color="#888" />
                      <Text style={styles.visitStatusPending}>Waiting</Text>
                    </>
                  )}
                  {visit.status === 'approved' && (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#4ADE80" />
                      <Text style={styles.visitStatusApproved}>Approved</Text>
                    </>
                  )}
                  {visit.status === 'rejected' && (
                    <>
                      <Ionicons name="close-circle" size={18} color="#f44336" />
                      <Text style={styles.visitStatusRejected}>Not approved</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Announcements Section */}
        <View style={styles.announcementsSection}>
          <Text style={styles.sectionTitle}>Announcements</Text>
          <View style={styles.announcementPlaceholder}>
            <Ionicons name="megaphone-outline" size={40} color="rgba(255,255,255,0.3)" />
            <Text style={styles.announcementPlaceholderText}>
              No announcements yet
            </Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0F2925', '#1A3C34', '#0F2925']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My PG</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4ADE80" />
              <Text style={styles.loadingText}>Loading your booking...</Text>
            </View>
          ) : bookingInfo?.hasPG ? (
            renderBookingContent()
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="home-outline" size={60} color="rgba(255,255,255,0.3)" />
              </View>
              <Text style={styles.emptyTitle}>No PG Booked Yet</Text>
              <Text style={styles.emptySubtitle}>
                Once you book a PG, your room details and announcements will appear here.
              </Text>
              <Link href="/(home)/home-feed" asChild>
                <TouchableOpacity style={styles.exploreButton}>
                  <Text style={styles.exploreButtonText}>Explore PGs</Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F2925',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 16,
    fontSize: 16,
  },
  // Combined card styles
  combinedCard: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  pgCardImage: {
    width: '100%',
    height: 180,
  },
  pgCardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  pgCardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  pgCardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  pgCardLocation: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  // White booking section
  bookingDetailsSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  bookingDetailsTitle: {
    color: '#0F2925',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailRowLabel: {
    color: '#333',
    fontSize: 15,
  },
  detailRowValue: {
    color: '#0F2925',
    fontSize: 15,
    fontWeight: '600',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#eee',
  },
  // Rent card - glassmorphic
  rentCardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  rentCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  rentCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  rentCardLeft: {
    gap: 4,
  },
  rentDueLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rentDueDate: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  rentDaysContainer: {
    alignItems: 'center',
  },
  rentDaysNumber: {
    color: '#4ADE80',
    fontSize: 36,
    fontWeight: 'bold',
  },
  rentDaysText: {
    color: '#4ADE80',
    fontSize: 14,
  },
  // Announcements
  announcementsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  announcementPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  announcementPlaceholderText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  exploreButton: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  exploreButtonText: {
    color: '#0F2925',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Visit card styles
  visitCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  visitCardContent: {
    flex: 1,
  },
  visitPgTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  visitDateTime: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  visitStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  visitStatusPending: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  visitStatusApproved: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '600',
  },
  visitStatusRejected: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '600',
  },
  checkInEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f44336',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  cancelButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerDoneButton: {
    alignSelf: 'center',
    paddingHorizontal: 30,
    paddingVertical: 10,
    backgroundColor: '#0F2925',
    borderRadius: 20,
    marginTop: 10,
  },
  datePickerDoneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
