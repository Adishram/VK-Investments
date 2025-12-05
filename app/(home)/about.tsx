import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Linking,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export default function AboutUsPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleEmail = () => {
    Linking.openURL('mailto:info@bookmypg.co.in');
  };

  const handlePhone = () => {
    Linking.openURL('tel:+918939654691');
  };

  const handleWebsite = () => {
    Linking.openURL('https://bookmypg.co.in');
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
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <BlurView intensity={40} tint="dark" style={styles.section}>
          <View style={styles.sectionInner}>
            <View style={styles.logoContainer}>
              <Ionicons name="home" size={40} color="#007AFF" />
            </View>
            <Text style={styles.brandName}>Book My PG</Text>
            <Text style={styles.tagline}>India's Largest Growing PG Rental Network</Text>
          </View>
        </BlurView>

        {/* Who We Are */}
        <BlurView intensity={40} tint="dark" style={styles.section}>
          <View style={styles.sectionInner}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={24} color="#34C759" />
              <Text style={styles.sectionTitle}>Who We Are</Text>
            </View>
            <Text style={styles.sectionText}>
              We are a set of well-selected and chosen Paying Guest services. This is a platform where those, who are willing to open their homes to guests, meet the people looking for wonderful homes to stay in and not have to look for hotels or favors in any city for their long stays.
            </Text>
            <Text style={styles.sectionText}>
              We ensure the places listed and the people looking for a stay are selected based on careful filtering criteria so that both parties benefit and the safety of all involved persons is ensured. We know how important a safe home is to you at both ends of the deal and that is a promise we make.
            </Text>
          </View>
        </BlurView>

        {/* What We Do */}
        <BlurView intensity={40} tint="dark" style={styles.section}>
          <View style={styles.sectionInner}>
            <View style={styles.sectionHeader}>
              <Ionicons name="construct" size={24} color="#FF9500" />
              <Text style={styles.sectionTitle}>What We Do</Text>
            </View>
            <Text style={styles.sectionText}>
              We put together a list of places where our guests can stay as a PG. This is done based on listings on our site by homeowners. We ensure that not only are they a safe home for the guest but the guest too is safe for them.
            </Text>
            <Text style={styles.sectionText}>
              These places can be searched based on locality, budget, need, and multiple other filters. Find the perfect PG stay or guest with us.
            </Text>
            <Text style={styles.sectionText}>
              To meet our aim, we eliminate the two major problems a guest or host may face. The first of these is a lack of information for anyone new in a city. Our site will list all the information you can seek not just about the house and homeowners but also the locality and other aspects.
            </Text>
          </View>
        </BlurView>

        {/* Our Mission */}
        <BlurView intensity={40} tint="dark" style={styles.section}>
          <View style={styles.sectionInner}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flag" size={24} color="#AF52DE" />
              <Text style={styles.sectionTitle}>Our Mission</Text>
            </View>
            <Text style={styles.sectionText}>
              Our aim and motto are simple and singular. To provide the guests with a PG that feels like home best fitting their needs and the homeowners a guest who fits right in.
            </Text>
            <Text style={styles.sectionText}>
              To attain this we work with homeowners and guests to give everyone involved the best possible experience. Our method involves detailed verification of all parties, a good database of homes and guests and being updated in real-time.
            </Text>
            <Text style={styles.highlightText}>
              We hope to make the PG community a secure one where all people get the best out of the system.
            </Text>
          </View>
        </BlurView>

        {/* Contact Info */}
        <BlurView intensity={40} tint="dark" style={styles.section}>
          <View style={styles.sectionInner}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call" size={24} color="#007AFF" />
              <Text style={styles.sectionTitle}>Contact Us</Text>
            </View>

            <TouchableOpacity style={styles.contactItem} onPress={handlePhone}>
              <View style={styles.contactIcon}>
                <Ionicons name="call-outline" size={20} color="#34C759" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>+91-8939654691</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
              <View style={styles.contactIcon}>
                <Ionicons name="mail-outline" size={20} color="#007AFF" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>info@bookmypg.co.in</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.contactItem} onPress={handleWebsite}>
              <View style={styles.contactIcon}>
                <Ionicons name="globe-outline" size={20} color="#FF9500" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactLabel}>Website</Text>
                <Text style={styles.contactValue}>bookmypg.co.in</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Ionicons name="location-outline" size={20} color="#AF52DE" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactLabel}>Address</Text>
                <Text style={styles.contactValue}>
                  9-20, Bethel Nagar St, Industrial Estate, Perungudi, Chennai, Tamil Nadu 600096, India
                </Text>
              </View>
            </View>
          </View>
        </BlurView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Book My PG Pvt Ltd</Text>
          <Text style={styles.copyright}>© 2019-2024 All Rights Reserved</Text>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  sectionInner: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  brandName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  tagline: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  sectionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  highlightText: {
    color: '#007AFF',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginBottom: 2,
  },
  contactValue: {
    color: '#fff',
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  copyright: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 4,
  },
});
