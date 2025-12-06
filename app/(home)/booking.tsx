import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function BookingPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get params from pg-details
  const pgId = Number(params.pgId);
  const pgTitle = params.pgTitle as string || 'PG Accommodation';
  const pgLocation = params.pgLocation as string || '';
  const pgCity = params.pgCity as string || '';
  const pgImage = params.pgImage as string || '';
  const roomType = params.roomType as string || 'Single';
  const price = Number(params.price) || 0;
  const ownerEmail = params.ownerEmail as string || '';
  
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Calculate amounts
  const depositAmount = price * 2;
  const totalAmount = price + depositAmount;

  const handleBack = () => {
    router.back();
  };

  const handlePayNow = () => {
    router.push({
      pathname: '/(home)/payment',
      params: {
        pgId: pgId.toString(),
        pgTitle,
        pgLocation,
        pgCity,
        pgImage,
        roomType,
        price: price.toString(),
        depositAmount: depositAmount.toString(),
        totalAmount: totalAmount.toString(),
        checkInDate: checkInDate.toISOString(),
        ownerEmail,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
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
          <Text style={styles.headerTitle}>Order Summary</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* PG Card */}
          <BlurView intensity={40} tint="dark" style={styles.pgCard}>
            <View style={styles.pgCardInner}>
              <Image 
                source={{ uri: pgImage || 'https://via.placeholder.com/100' }}
                style={styles.pgImage}
              />
              <View style={styles.pgInfo}>
                <Text style={styles.pgTitle}>{pgTitle}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.pgLocation}>{pgLocation}, {pgCity}</Text>
                </View>
              </View>
            </View>
          </BlurView>

          {/* Room Details */}
          <BlurView intensity={40} tint="dark" style={styles.sectionCard}>
            <View style={styles.sectionCardInner}>
              <Text style={styles.sectionTitle}>Room Details</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Room Type</Text>
                <Text style={styles.detailValue}>{roomType}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Monthly Rent</Text>
                <Text style={styles.detailValue}>₹{price.toLocaleString()}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Security Deposit</Text>
                <Text style={styles.detailValue}>₹{depositAmount.toLocaleString()}</Text>
              </View>
            </View>
          </BlurView>

          {/* Check-in Date */}
          <BlurView intensity={40} tint="dark" style={styles.sectionCard}>
            <View style={styles.sectionCardInner}>
              <Text style={styles.sectionTitle}>Check-in Date</Text>
              
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color="#4ADE80" />
                <Text style={styles.datePickerText}>
                  {checkInDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={checkInDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (date) setCheckInDate(date);
                  }}
                />
              )}
              
              <Text style={styles.dateNote}>
                You can update this date later from My PG page
              </Text>
            </View>
          </BlurView>

          {/* Payment Summary */}
          <BlurView intensity={40} tint="dark" style={styles.sectionCard}>
            <View style={styles.sectionCardInner}>
              <Text style={styles.sectionTitle}>Payment Summary</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>First Month Rent</Text>
                <Text style={styles.detailValue}>₹{price.toLocaleString()}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Security Deposit</Text>
                <Text style={styles.detailValue}>₹{depositAmount.toLocaleString()}</Text>
              </View>
              
              <View style={styles.totalDivider} />
              
              <View style={styles.detailRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{totalAmount.toLocaleString()}</Text>
              </View>
            </View>
          </BlurView>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Pay Button */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomLeft}>
            <Text style={styles.bottomTotalLabel}>Total</Text>
            <Text style={styles.bottomTotalValue}>₹{totalAmount.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={styles.payButton} onPress={handlePayNow}>
            <Text style={styles.payButtonText}>Pay Now</Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
          </TouchableOpacity>
        </View>
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
    padding: 16,
  },
  pgCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  pgCardInner: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pgImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  pgInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  pgTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pgLocation: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  sectionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  sectionCardInner: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  detailValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  totalDivider: {
    height: 2,
    backgroundColor: 'rgba(74, 222, 128, 0.3)',
    marginVertical: 12,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#4ADE80',
    fontSize: 20,
    fontWeight: 'bold',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  datePickerText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  dateNote: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  bottomLeft: {
    gap: 2,
  },
  bottomTotalLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  bottomTotalValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ADE80',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
  },
  payButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
