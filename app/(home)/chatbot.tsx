import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, 
  TextInput, Dimensions, KeyboardAvoidingView, Platform, FlatList,
  ActivityIndicator, ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { api, PGListing } from '../../utils/api';

const { width } = Dimensions.get('window');

// Message interface
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pgCards?: PGListing[];
  isLoading?: boolean;
}

// Get dynamic greeting based on time
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning,';
  if (hour >= 12 && hour < 17) return 'Good afternoon,';
  if (hour >= 17 && hour < 21) return 'Good evening,';
  return 'Good night,';
};

// PG Card Component for recommendations
const PGCard = ({ pg }: { pg: PGListing }) => (
  <Link href={`/(home)/pg-details?id=${pg.id}`} asChild>
    <TouchableOpacity style={styles.pgCard}>
      <ImageBackground
        source={{ uri: pg.image_url || pg.images?.[0] || 'https://via.placeholder.com/200x150' }}
        style={styles.pgCardImage}
        imageStyle={{ borderRadius: 16 }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.pgCardGradient}
        >
          <Text style={styles.pgCardTitle} numberOfLines={1}>{pg.title}</Text>
          <Text style={styles.pgCardLocation} numberOfLines={1}>{pg.location}, {pg.city}</Text>
          <Text style={styles.pgCardPrice}>₹{pg.price}/mo</Text>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  </Link>
);

// Message Bubble Component
const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === 'user';
  
  return (
    <View style={[styles.messageBubbleContainer, isUser && styles.userMessageContainer]}>
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {message.isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.messageText}>{message.content}</Text>
        )}
      </View>
      
      {/* PG Cards if present */}
      {message.pgCards && message.pgCards.length > 0 && (
        <FlatList
          horizontal
          data={message.pgCards}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <PGCard pg={item} />}
          showsHorizontalScrollIndicator={false}
          style={styles.pgCardsScroll}
          contentContainerStyle={{ paddingRight: 20 }}
        />
      )}
    </View>
  );
};

export default function ChatbotPage() {
  const router = useRouter();
  const { user } = useUser();
  const flatListRef = useRef<FlatList>(null);
  
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [allPGs, setAllPGs] = useState<PGListing[]>([]);
  const [showInitialCards, setShowInitialCards] = useState(true);
  
  // Dynamic greeting
  const greeting = useMemo(() => getGreeting(), []);
  const userName = user?.firstName || 'there';
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  // Load PGs on mount
  useEffect(() => {
    const loadPGs = async () => {
      try {
        const pgs = await api.getPGs();
        setAllPGs(pgs);
      } catch (error) {
        console.error('Failed to load PGs:', error);
      }
    };
    loadPGs();
  }, []);

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Send message to API
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    setShowInitialCards(false);
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim()
    };
    
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      isLoading: true
    };
    
    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      const response = await api.sendChatMessage(
        text.trim(),
        messages.map(m => ({ role: m.role, content: m.content })),
        userEmail || undefined,
        'Chennai' // Default city, could be dynamic
      );
      
      // Parse PG IDs from response
      let pgCards: PGListing[] = [];
      let cleanedContent = response.text;
      
      // Check for PG_IDs pattern: [PG_IDs: 1, 2, 3]
      const pgIdMatch = response.text.match(/\[PG_IDs?:\s*([\d,\s]+)\]/i);
      if (pgIdMatch) {
        const ids = pgIdMatch[1].split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        pgCards = allPGs.filter(pg => ids.includes(pg.id));
        cleanedContent = response.text.replace(/\[PG_IDs?:\s*[\d,\s]+\]/gi, '').trim();
      }
      
      // Also check if response mentions specific PG names and match them
      if (pgCards.length === 0 && response.pgIds && response.pgIds.length > 0) {
        pgCards = allPGs.filter(pg => response.pgIds!.includes(pg.id));
      }
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: cleanedContent || "I'm here to help you find the perfect PG!",
        pgCards: pgCards.length > 0 ? pgCards : undefined
      };
      
      setMessages(prev => prev.slice(0, -1).concat(assistantMessage));
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again."
      };
      setMessages(prev => prev.slice(0, -1).concat(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle send button press
  const handleSend = () => {
    sendMessage(inputText);
  };

  // Handle quick action cards
  const handleFindPGs = () => {
    sendMessage("Help me find PGs nearby");
  };

  const handleMyBookings = () => {
    sendMessage("Show me my bookings");
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#004e92', '#000428']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity>
              <View style={styles.profileImagePlaceholder}>
                <Image 
                  source={{ uri: user?.imageUrl || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
                  style={styles.profileImage} 
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Greeting */}
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.nameText}>{userName}</Text>
          </View>

          {/* Messages or Initial State */}
          <View style={styles.chatContainer}>
            {messages.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>
                  Ask me anything about PGs, bookings, or recommendations!
                </Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <MessageBubble message={item} />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.messagesContent}
              />
            )}
          </View>

          {/* Action Cards - Show only initially */}
          {showInitialCards && (
            <View style={styles.cardsContainer}>
              <TouchableOpacity style={styles.card} onPress={handleFindPGs}>
                <View style={styles.cardIconContainer}>
                  <Ionicons name="search" size={24} color="#fff" />
                </View>
                <Text style={styles.cardTitle}>Find PGs</Text>
                <Text style={styles.cardSubtitle}>Search nearby</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.card} onPress={handleMyBookings}>
                <View style={styles.cardIconContainer}>
                  <Ionicons name="list" size={24} color="#fff" />
                </View>
                <Text style={styles.cardTitle}>My Bookings</Text>
                <Text style={styles.cardSubtitle}>Check status</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            <View style={styles.blurInputWrapper}>
              <TextInput 
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                editable={!isLoading}
              />
            </View>
            <TouchableOpacity 
              style={[styles.sendButton, isLoading && styles.sendButtonDisabled]} 
              onPress={handleSend}
              disabled={isLoading || !inputText.trim()}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="arrow-up" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  greetingContainer: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 28,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '400',
  },
  nameText: {
    fontSize: 34,
    color: '#fff',
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
    marginBottom: 15,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  messagesContent: {
    paddingTop: 10,
  },
  messageBubbleContainer: {
    marginBottom: 12,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#2b5aed',
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  pgCardsScroll: {
    marginTop: 12,
  },
  pgCard: {
    width: 180,
    height: 140,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  pgCardImage: {
    width: '100%',
    height: '100%',
  },
  pgCardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  pgCardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pgCardLocation: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  pgCardPrice: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    borderRadius: 25,
    justifyContent: 'center',
    height: 140,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  blurInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 50, 60, 0.6)',
    borderRadius: 30,
    paddingHorizontal: 20,
    height: 55,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  sendButton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#2b5aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});
