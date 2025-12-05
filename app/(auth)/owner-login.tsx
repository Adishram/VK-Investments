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
} from 'react-native';
import { useRouter } from 'expo-router';

const OWNER_CREDENTIALS = {
  email: 'owner@bookmypg.com',
  password: 'Owner@123',
};

export default function OwnerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email === OWNER_CREDENTIALS.email && password === OWNER_CREDENTIALS.password) {
      router.replace('/(owner)');
    } else {
      alert('Invalid credentials');
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
            placeholder="owner@bookmypg.com"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
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
          />
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login as Owner</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
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
  loginButton: { backgroundColor: '#000', borderRadius: 25, padding: 18, alignItems: 'center', marginTop: 12 },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  backText: { textAlign: 'center', marginTop: 20, color: '#666', textDecorationLine: 'underline' },
});
