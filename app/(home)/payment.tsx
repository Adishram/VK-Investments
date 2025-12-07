import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import QRCode from 'react-native-qrcode-svg';
import { useUser } from '@clerk/clerk-expo';
import { api } from '../../utils/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const UPI_ID = 'bookmypg@upi';
const WEBSITE_URL = 'https://bookmypg.co.in';

// Format date nicely
const formatDate = (dateString: string): string => {
  if (!dateString) return 'Select Date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function PaymentPage() {
  const router = useRouter();
  const { user } = useUser();
  const params = useLocalSearchParams();
  
  const pgId = Number(params.pgId);
  const pgTitle = params.pgTitle as string || '';
  const roomType = params.roomType as string || '';
  const totalAmount = Number(params.totalAmount) || 0;
  const initialCheckInDate = params.checkInDate as string || '';
  const ownerEmail = params.ownerEmail as string || '';
  
  const [confirming, setConfirming] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialCheckInDate);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handlePaymentDone = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login to complete booking');
      return;
    }

    setConfirming(true);
    try {
      await api.confirmBooking({
        name: user.fullName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        mobile: '',
        pgId,
        roomType,
        amount: totalAmount,
        moveInDate: selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : null,
      });

      Alert.alert(
        '🎉 Booking Confirmed!',
        'Your PG room has been booked successfully. You can view your booking details in My PG.',
        [
          {
            text: 'View My PG',
            onPress: () => router.replace('/(home)/my-pg'),
          },
        ]
      );
    } catch (error) {
      console.error('Payment confirmation error:', error);
      Alert.alert('Error', 'Failed to confirm booking. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient
        colors={['#0F2925', '#1A3C34', '#0F2925']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10 }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Amount Card */}
          <BlurView intensity={40} tint="dark" style={styles.amountCard}>
            <View style={styles.amountCardInner}>
              <Text style={styles.amountLabel}>Amount to Pay</Text>
              <Text style={styles.amountValue}>₹{totalAmount.toLocaleString()}</Text>
              <Text style={styles.bookingFor}>for {roomType} at {pgTitle}</Text>
            </View>
          </BlurView>

          {/* Check-in Date Section */}
          <BlurView intensity={40} tint="dark" style={styles.dateSection}>
            <View style={styles.dateSectionInner}>
              <Text style={styles.dateTitle}>Check-in Date</Text>
              <TouchableOpacity 
                style={styles.dateSelector}
                onPress={() => setShowDatePicker(!showDatePicker)}
              >
                <Ionicons name="calendar" size={20} color="#4ADE80" />
                <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                <Ionicons name={showDatePicker ? "chevron-down" : "chevron-forward"} size={20} color="#fff" />
              </TouchableOpacity>
              
              {showDatePicker && (
                <View>
                  <DateTimePicker
                    value={selectedDate ? new Date(selectedDate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={new Date()}
                    textColor="#fff"
                    onChange={(event, date) => {
                      if (Platform.OS !== 'ios') {
                        setShowDatePicker(false);
                      }
                      if (event.type === 'set' && date) {
                        setSelectedDate(date.toISOString());
                      }
                    }}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity 
                      style={styles.datePickerDoneButton}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.datePickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              <Text style={styles.dateHint}>You can update this date later from My PG page</Text>
            </View>
          </BlurView>

          {/* QR Code Section */}
          <BlurView intensity={40} tint="dark" style={styles.qrSection}>
            <View style={styles.qrSectionInner}>
              <Text style={styles.qrTitle}>Scan to Pay</Text>
              <Text style={styles.qrSubtitle}>UPI Payment</Text>
              
              <View style={styles.qrContainer}>
                <View style={styles.qrBackground}>
                  <QRCode
                    value={WEBSITE_URL}
                    size={150}
                    backgroundColor="#fff"
                    color="#000"
                    logo={require('../../assets/icon.png')}
                    logoSize={35}
                    logoBackgroundColor="#fff"
                    logoMargin={4}
                    logoBorderRadius={8}
                  />
                </View>
              </View>

              <Text style={styles.upiId}>{UPI_ID}</Text>
              
              <View style={styles.orDivider}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.orLine} />
              </View>
              
              <Text style={styles.manualText}>
                Pay manually to UPI ID above and click "Payment Done"
              </Text>
            </View>
          </BlurView>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Fixed Payment Done Button */}
        <View style={styles.fixedButtonContainer}>
          <TouchableOpacity 
            style={[styles.doneButton, confirming && { opacity: 0.6 }]}
            onPress={handlePaymentDone}
            disabled={confirming}
          >
            {confirming ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#000" />
                <Text style={styles.doneButtonText}>Payment Done</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.secureText}>
            <Ionicons name="shield-checkmark" size={14} color="#4ADE80" /> Secure Payment
          </Text>
        </View>
      </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  amountCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  amountCardInner: {
    padding: 24,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    alignItems: 'center',
  },
  amountLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginBottom: 4,
  },
  amountValue: {
    color: '#4ADE80',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookingFor: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  qrSection: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  qrSectionInner: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    alignItems: 'center',
  },
  qrTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  qrSubtitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
  },
  qrContainer: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  qrBackground: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  upiId: {
    color: '#4ADE80',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  orText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginHorizontal: 16,
  },
  manualText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ADE80',
    paddingVertical: 18,
    borderRadius: 30,
    gap: 10,
  },
  doneButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secureText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  dateSection: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  dateSectionInner: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dateTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  dateHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  datePickerDoneButton: {
    alignSelf: 'center',
    paddingHorizontal: 30,
    paddingVertical: 10,
    backgroundColor: '#4ADE80',
    borderRadius: 20,
    marginTop: 10,
  },
  datePickerDoneText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F2925',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
});
