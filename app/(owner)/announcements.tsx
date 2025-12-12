import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOwner } from '../../context/OwnerContext';
import api from '../../utils/api';

interface PG {
  id: number;
  title: string;
  city: string;
  location: string;
}

interface Announcement {
  id: number;
  pg_id: number;
  message: string;
  created_at: string;
}

export default function AnnouncementsScreen() {
  const router = useRouter();
  const { owner } = useOwner();
  const [pgs, setPGs] = useState<PG[]>([]);
  const [selectedPG, setSelectedPG] = useState<PG | null>(null);
  const [message, setMessage] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (owner?.id) {
      loadPGs();
    }
  }, [owner?.id]);

  useEffect(() => {
    if (selectedPG) {
      loadAnnouncements(selectedPG.id);
    }
  }, [selectedPG]);

  const loadPGs = async () => {
    if (!owner?.id) return;
    try {
      setLoading(true);
      const data = await api.getOwnerPGs(owner.id);
      setPGs(data);
      if (data.length > 0) {
        setSelectedPG(data[0]);
      }
    } catch (error) {
      console.error('Error loading PGs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnnouncements = async (pgId: number) => {
    try {
      const data = await api.getAnnouncements(pgId);
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (selectedPG) {
      await loadAnnouncements(selectedPG.id);
    }
    setRefreshing(false);
  }, [selectedPG]);

  const handleSendAnnouncement = async () => {
    if (!message.trim()) {
      Alert.alert('Empty Message', 'Please enter a message');
      return;
    }
    if (!selectedPG || !owner?.id) {
      Alert.alert('Error', 'Please select a PG');
      return;
    }

    try {
      setSending(true);
      await api.createAnnouncement(selectedPG.id, owner.id, message);
      Alert.alert('Success', 'Announcement sent to all customers of this PG!');
      setMessage('');
      loadAnnouncements(selectedPG.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to send announcement');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#EF4444" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : pgs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="megaphone-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No PGs Listed</Text>
          <Text style={styles.emptySubtext}>
            Add a PG first to send announcements to your customers
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EF4444" />
          }
        >
          {/* PG Selector */}
          <Text style={styles.sectionTitle}>Select PG</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pgSelector}>
            {pgs.map((pg) => (
              <TouchableOpacity
                key={pg.id}
                style={[
                  styles.pgCard,
                  selectedPG?.id === pg.id && styles.pgCardSelected,
                ]}
                onPress={() => setSelectedPG(pg)}
              >
                <Text style={[
                  styles.pgCardTitle,
                  selectedPG?.id === pg.id && styles.pgCardTitleSelected,
                ]}>{pg.title}</Text>
                <Text style={[
                  styles.pgCardLocation,
                  selectedPG?.id === pg.id && styles.pgCardLocationSelected,
                ]}>{pg.city}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* New Announcement */}
          <View style={styles.newAnnouncementCard}>
            <Text style={styles.newAnnouncementTitle}>Send Announcement</Text>
            <Text style={styles.newAnnouncementSubtitle}>
              Send a message to all customers in {selectedPG?.title}
            </Text>
            
            <TextInput
              style={styles.messageInput}
              placeholder="Type your announcement..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
            />

            <TouchableOpacity
              style={[styles.sendButton, (sending || !message.trim()) && styles.sendButtonDisabled]}
              onPress={handleSendAnnouncement}
              disabled={sending || !message.trim()}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.sendButtonText}>Send Announcement</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Past Announcements */}
          <Text style={styles.sectionTitle}>Past Announcements</Text>
          
          {announcements.length === 0 ? (
            <View style={styles.noAnnouncementsContainer}>
              <Ionicons name="chatbubble-outline" size={40} color="#D1D5DB" />
              <Text style={styles.noAnnouncementsText}>No announcements yet</Text>
            </View>
          ) : (
            announcements.map((ann) => (
              <View key={ann.id} style={styles.announcementCard}>
                <View style={styles.announcementHeader}>
                  <Ionicons name="megaphone" size={18} color="#EF4444" />
                  <Text style={styles.announcementDate}>{formatDate(ann.created_at)}</Text>
                </View>
                <Text style={styles.announcementMessage}>{ann.message}</Text>
              </View>
            ))
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 16,
  },
  backButton: {
    padding: 8,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  pgSelector: {
    marginBottom: 20,
  },
  pgCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  pgCardSelected: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  pgCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  pgCardTitleSelected: {
    color: '#EF4444',
  },
  pgCardLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  pgCardLocationSelected: {
    color: '#F87171',
  },
  newAnnouncementCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  newAnnouncementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  newAnnouncementSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  messageInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  noAnnouncementsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  noAnnouncementsText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  announcementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  announcementDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  announcementMessage: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 40,
  },
});
