import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');
const WEBSITE_URL = 'https://bookmypg.co.in';

export default function SharePage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out Book My PG - India's Largest PG Rental Network!\n\nFind the perfect PG accommodation near you.\n\n${WEBSITE_URL}`,
        url: WEBSITE_URL,
        title: 'Book My PG',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyLink = async () => {
    // Using share as a workaround since Clipboard requires additional setup
    try {
      await Share.share({
        message: WEBSITE_URL,
      });
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        {/* QR Code Section */}
        <BlurView intensity={40} tint="dark" style={styles.qrSection}>
          <View style={styles.qrSectionInner}>
            <Text style={styles.qrTitle}>Scan to Visit</Text>
            <Text style={styles.qrSubtitle}>Book My PG</Text>
            
            <View style={styles.qrContainer}>
              <View style={styles.qrBackground}>
                <QRCode
                  value={WEBSITE_URL}
                  size={width * 0.5}
                  backgroundColor="#fff"
                  color="#000"
                  logo={require('../../assets/icon.png')}
                  logoSize={50}
                  logoBackgroundColor="#fff"
                  logoMargin={5}
                  logoBorderRadius={10}
                />
              </View>
            </View>

            <Text style={styles.websiteUrl}>{WEBSITE_URL}</Text>
          </View>
        </BlurView>

        {/* Share Options */}
        <BlurView intensity={40} tint="dark" style={styles.shareSection}>
          <View style={styles.shareSectionInner}>
            <Text style={styles.shareTitle}>Share with Friends</Text>

            <TouchableOpacity style={styles.shareOption} onPress={handleShare}>
              <View style={[styles.shareIconContainer, { backgroundColor: 'rgba(0, 122, 255, 0.2)' }]}>
                <Ionicons name="share-outline" size={24} color="#007AFF" />
              </View>
              <View style={styles.shareTextContainer}>
                <Text style={styles.shareOptionTitle}>Share App</Text>
                <Text style={styles.shareOptionSubtitle}>Send via any app</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.shareOption} onPress={handleCopyLink}>
              <View style={[styles.shareIconContainer, { backgroundColor: 'rgba(52, 199, 89, 0.2)' }]}>
                <Ionicons name="link-outline" size={24} color="#34C759" />
              </View>
              <View style={styles.shareTextContainer}>
                <Text style={styles.shareOptionTitle}>Copy Link</Text>
                <Text style={styles.shareOptionSubtitle}>Copy website URL</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>
        </BlurView>

        {/* Invite Message */}
        <View style={styles.inviteSection}>
          <Ionicons name="heart" size={24} color="#FF6B6B" />
          <Text style={styles.inviteText}>
            Help others find their perfect PG by sharing Book My PG!
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
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
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  qrSection: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
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
    fontSize: 24,
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
  websiteUrl: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 20,
  },
  shareSection: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  shareSectionInner: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 20,
  },
  shareTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  shareIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  shareTextContainer: {
    flex: 1,
  },
  shareOptionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  shareOptionSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 4,
  },
  inviteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  inviteText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    flex: 1,
  },
});
