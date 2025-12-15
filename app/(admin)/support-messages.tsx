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
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface SupportConversation {
  conversation_id: string;
  user_email: string;
  user_name: string;
  last_message: string;
  last_updated: string;
  is_resolved: boolean;
}

interface SupportMessage {
  id: number;
  conversation_id: string;
  user_email: string;
  user_name: string;
  message: string;
  sender_type: 'user' | 'admin';
  created_at: string;
}

export default function SupportMessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://vk-investment-backend.onrender.com/api/support/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const response = await fetch(`https://vk-investment-backend.onrender.com/api/support/conversation/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectConversation = (conversation: SupportConversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.conversation_id);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const response = await fetch('https://vk-investment-backend.onrender.com/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.conversation_id,
          userEmail: selectedConversation.user_email,
          userName: 'Admin',
          message: replyText.trim(),
          senderType: 'admin'
        })
      });

      if (response.ok) {
        setReplyText('');
        loadMessages(selectedConversation.conversation_id);
        Alert.alert('Success', 'Reply sent!');
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async (conversationId: string) => {
    try {
      const response = await fetch(`https://vk-investment-backend.onrender.com/api/support/conversation/${conversationId}/resolve`, {
        method: 'PUT',
      });

      if (response.ok) {
        Alert.alert('Success', 'Conversation marked as resolved');
        setSelectedConversation(null);
        loadConversations();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resolve conversation');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const renderConversation = (conversation: SupportConversation) => (
    <TouchableOpacity
      key={conversation.conversation_id}
      style={[
        styles.conversationCard,
        conversation.is_resolved && styles.conversationResolved
      ]}
      onPress={() => handleSelectConversation(conversation)}
    >
      <View style={styles.conversationHeader}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {conversation.user_name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.conversationInfo}>
          <Text style={styles.userName}>{conversation.user_name || 'Anonymous'}</Text>
          <Text style={styles.userEmail}>{conversation.user_email}</Text>
        </View>
        {conversation.is_resolved && (
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
        )}
      </View>
      <Text style={styles.lastMessage} numberOfLines={2}>
        {conversation.last_message}
      </Text>
      <Text style={styles.timestamp}>{formatDate(conversation.last_updated)}</Text>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: SupportMessage }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender_type === 'admin' ? styles.adminMessage : styles.userMessage
      ]}
    >
      <Text style={styles.messageSender}>
        {item.sender_type === 'admin' ? 'You (Admin)' : item.user_name}
      </Text>
      <Text style={styles.messageText}>{item.message}</Text>
      <Text style={styles.messageTime}>{formatDate(item.created_at)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4B5563" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Messages</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No support requests yet</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
          }
        >
          {conversations.map(renderConversation)}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}

      <Modal
        visible={!!selectedConversation}
        animationType="slide"
        onRequestClose={() => setSelectedConversation(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedConversation(null)}>
              <Ionicons name="close" size={28} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedConversation?.user_name || 'Conversation'}
            </Text>
            <TouchableOpacity
              onPress={() => selectedConversation && handleResolve(selectedConversation.conversation_id)}
            >
              <Ionicons name="checkmark-done" size={28} color="#10B981" />
            </TouchableOpacity>
          </View>

          {loadingMessages ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesContainer}
            />
          )}

          <View style={styles.replyContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Type your reply..."
              placeholderTextColor="#9CA3AF"
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={handleSendReply}
              disabled={sending || !replyText.trim()}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
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
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4B5563',
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  conversationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  conversationResolved: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF620',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  conversationInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  bottomSpacing: {
    height: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  messagesContainer: {
    padding: 16,
  },
  messageBubble: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  adminMessage: {
    backgroundColor: '#8B5CF6',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#fff',
    opacity: 0.8,
  },
  messageText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.7,
    marginTop: 6,
  },
  replyContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#C4B5FD',
  },
});
