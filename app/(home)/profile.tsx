import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  StatusBar,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useUser, useClerk } from '@clerk/clerk-expo';

const { width, height } = Dimensions.get('window');

interface MenuItem {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

export default function Profile() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleBack = () => {
    router.back();
  };

  const handleSettings = () => {
    router.push('/(home)/settings');
  };

  const handleShare = () => {
    router.push('/(home)/share');
  };

  const handleAboutUs = () => {
    router.push('/(home)/about');
  };

  const handleHelpCentre = () => {
    router.push('/(home)/help');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/sign-in');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ]
    );
  };

  const menuItems: MenuItem[] = [
    { icon: 'settings-outline', label: 'Settings', onPress: handleSettings },
    { icon: 'share-social-outline', label: 'Share', onPress: handleShare },
    { icon: 'information-circle-outline', label: 'About us', onPress: handleAboutUs },
    { icon: 'help-circle-outline', label: 'Help Centre', onPress: handleHelpCentre },
    { icon: 'log-out-outline', label: 'Logout', onPress: handleLogout, color: '#FF6B6B' },
  ];

  // Get user profile image or use a default
  const profileImage = user?.imageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800';
  const userName = user?.fullName || user?.firstName || 'User';
  const userEmail = user?.primaryEmailAddress?.emailAddress || 'user@email.com';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* Full Screen Background Image */}
      <ImageBackground
        source={{ uri: profileImage }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Gradient Overlay for readability */}
        <View style={styles.overlay} />

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        {/* User Info - Standalone above menu */}
        <View style={styles.userInfoContainer}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
        </View>

        {/* Glassmorphic Menu */}
        <BlurView intensity={40} tint="dark" style={styles.menuContainer}>
          <View style={styles.menuInner}>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={item.color || '#fff'}
                    />
                    <Text style={[styles.menuItemText, item.color && { color: item.color }]}>
                      {item.label}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
                {index < menuItems.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </BlurView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  userInfoContainer: {
    position: 'absolute',
    bottom: 400,
    left: 24,
    right: 24,
  },
  userName: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  userEmail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '400',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  menuContainer: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  menuInner: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 12,
  },
});
