import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Linking,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I book a PG?',
    answer: 'Browse through our listings, select your preferred PG, and click on "Book Now". You can then proceed with the payment to confirm your booking.',
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept all major payment methods including UPI, Credit/Debit cards, Net Banking, and popular wallets like Paytm and Google Pay.',
  },
  {
    question: 'Can I visit the PG before booking?',
    answer: 'Yes! You can schedule a visit through the app by clicking on "Schedule Visit" on any PG listing. The owner will confirm the visit timing.',
  },
  {
    question: 'How do I cancel my booking?',
    answer: 'Go to your bookings, select the booking you want to cancel, and click on "Cancel Booking". Refund policies apply based on cancellation timing.',
  },
  {
    question: 'Is my personal information safe?',
    answer: 'Absolutely! We use industry-standard encryption and never share your personal data with third parties without your consent.',
  },
  {
    question: 'How do I contact the PG owner?',
    answer: 'Once you express interest or book a PG, you\'ll get access to the owner\'s contact details for direct communication.',
  },
];

export default function HelpCentrePage() {
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleBack = () => {
    router.back();
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@bookmypg.co.in?subject=Support Request');
  };

  const handleCall = () => {
    Linking.openURL('tel:+918939654691');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/918939654691?text=Hi, I need help with Book My PG app');
  };

  const handleWebsite = () => {
    Linking.openURL('https://bookmypg.co.in/faq');
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Centre</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <BlurView intensity={40} tint="dark" style={styles.welcomeSection}>
          <View style={styles.welcomeInner}>
            <View style={styles.welcomeIcon}>
              <Ionicons name="help-buoy" size={40} color="#007AFF" />
            </View>
            <Text style={styles.welcomeTitle}>How can we help you?</Text>
            <Text style={styles.welcomeSubtitle}>
              Find answers to common questions or reach out to our support team
            </Text>
          </View>
        </BlurView>

        {/* Search Bar */}
        <BlurView intensity={40} tint="dark" style={styles.searchSection}>
          <View style={styles.searchInner}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.5)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for help..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            )}
          </View>
        </BlurView>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={handleCall}>
            <BlurView intensity={40} tint="dark" style={styles.quickActionBlur}>
              <View style={styles.quickActionInner}>
                <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(52, 199, 89, 0.2)' }]}>
                  <Ionicons name="call" size={24} color="#34C759" />
                </View>
                <Text style={styles.quickActionText}>Call Us</Text>
              </View>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={handleEmail}>
            <BlurView intensity={40} tint="dark" style={styles.quickActionBlur}>
              <View style={styles.quickActionInner}>
                <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(0, 122, 255, 0.2)' }]}>
                  <Ionicons name="mail" size={24} color="#007AFF" />
                </View>
                <Text style={styles.quickActionText}>Email</Text>
              </View>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={handleWhatsApp}>
            <BlurView intensity={40} tint="dark" style={styles.quickActionBlur}>
              <View style={styles.quickActionInner}>
                <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(37, 211, 102, 0.2)' }]}>
                  <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                </View>
                <Text style={styles.quickActionText}>WhatsApp</Text>
              </View>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <BlurView intensity={40} tint="dark" style={styles.faqSection}>
          <View style={styles.faqInner}>
            <View style={styles.faqHeader}>
              <Ionicons name="chatbubbles" size={24} color="#FF9500" />
              <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
            </View>

            {filteredFAQs.map((faq, index) => (
              <View key={index}>
                <TouchableOpacity
                  style={styles.faqItem}
                  onPress={() => toggleFAQ(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons
                    name={expandedFAQ === index ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="rgba(255,255,255,0.5)"
                  />
                </TouchableOpacity>
                {expandedFAQ === index && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
                {index < filteredFAQs.length - 1 && <View style={styles.divider} />}
              </View>
            ))}

            {filteredFAQs.length === 0 && (
              <View style={styles.noResults}>
                <Ionicons name="search" size={40} color="rgba(255,255,255,0.3)" />
                <Text style={styles.noResultsText}>No results found</Text>
              </View>
            )}
          </View>
        </BlurView>

        {/* More Help */}
        <BlurView intensity={40} tint="dark" style={styles.moreHelpSection}>
          <View style={styles.moreHelpInner}>
            <Text style={styles.moreHelpTitle}>Still need help?</Text>
            <Text style={styles.moreHelpText}>
              Our support team is available 24/7 to assist you with any queries or issues.
            </Text>

            <TouchableOpacity style={styles.supportButton} onPress={handleEmail}>
              <Ionicons name="headset" size={20} color="#fff" />
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.websiteLink} onPress={handleWebsite}>
              <Text style={styles.websiteLinkText}>Visit our Help Center online</Text>
              <Ionicons name="open-outline" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </BlurView>

        {/* Contact Info */}
        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>Contact Information</Text>
          <Text style={styles.contactText}>📞 +91-8939654691</Text>
          <Text style={styles.contactText}>📧 support@bookmypg.co.in</Text>
          <Text style={styles.contactText}>🕐 Available: 24/7</Text>
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
  welcomeSection: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  welcomeInner: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    alignItems: 'center',
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  searchSection: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  searchInner: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickAction: {
    flex: 1,
  },
  quickActionBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionInner: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  faqSection: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  faqInner: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 20,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  faqTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  faqQuestion: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    paddingRight: 12,
  },
  faqAnswer: {
    paddingBottom: 16,
  },
  faqAnswerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noResultsText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginTop: 12,
  },
  moreHelpSection: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  moreHelpInner: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    alignItems: 'center',
  },
  moreHelpTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  moreHelpText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  supportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  websiteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  websiteLinkText: {
    color: '#007AFF',
    fontSize: 14,
  },
  contactInfo: {
    alignItems: 'center',
    padding: 20,
  },
  contactTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contactText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginBottom: 4,
  },
});
