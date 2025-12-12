import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOwner } from '../../context/OwnerContext';
import api from '../../utils/api';

export default function OwnerLogin() {
  const router = useRouter();
  const { login } = useOwner();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      setLoading(true);
      const result = await api.ownerLogin(email, password);
      
      if (result.success && result.owner) {
        await login(result.owner);
        router.replace('/(owner)');
      } else {
        Alert.alert('Error', 'Invalid credentials');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        
        <Text style={styles.welcome}>PG Owner Login 🏠</Text>
        <Text style={styles.subtitle}>Access your PG management dashboard</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor="#999"
            secureTextEntry
            editable={!loading}
          />
        </View>

        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Login as Owner</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Text style={styles.backText}>Back to User Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 60 },
  logo: { width: 180, height: 180, alignSelf: 'center', marginBottom: 32 },
  welcome: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: '#000' },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#666', marginBottom: 32 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, color: '#666', marginBottom: 8 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16, fontSize: 16, color: '#000' },
  loginButton: { backgroundColor: '#10B981', borderRadius: 25, padding: 18, alignItems: 'center', marginTop: 12 },
  loginButtonDisabled: { backgroundColor: '#86EFAC' },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  backText: { textAlign: 'center', marginTop: 20, color: '#666', textDecorationLine: 'underline' },
});
