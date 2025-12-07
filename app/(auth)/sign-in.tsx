import React, { useState, useEffect } from 'react';
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
  Alert,
  Pressable,
} from 'react-native';
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';

export default function SignIn() {
  const { signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
  
  // Error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Auto-redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.replace('/(home)/home-feed');
    }
  }, [isSignedIn]);

  // Clear errors when user types
  useEffect(() => {
    if (email) setEmailError('');
  }, [email]);

  useEffect(() => {
    if (password) setPasswordError('');
  }, [password]);

  // Validate fields
  const validateFields = (): boolean => {
    let isValid = true;
    setGeneralError('');
    
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  // Handle login
  const handleLogin = async () => {
    if (!signIn) return;
    
    if (!validateFields()) {
      return;
    }

    setLoading(true);
    setGeneralError('');

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(home)/home-feed');
      }
    } catch (err: any) {
      console.error('Error:', err);
      const errorMessage = err.errors?.[0]?.message || 'Invalid email or password. Please try again.';
      setGeneralError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    if (!signIn) return;
    
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/oauth-callback',
        redirectUrlComplete: '/(home)',
      });
    } catch (err: any) {
      setGeneralError(err.errors?.[0]?.message || 'Google sign-in failed');
    }
  };

  // Triple-tap easter egg for admin login
  const handleLogoTap = () => {
    setLogoTapCount(prev => prev + 1);
    
    if (logoTapCount + 1 === 3) {
      router.push('/(auth)/admin-login');
      setLogoTapCount(0);
    }
    
    // Reset counter after 2 seconds of inactivity
    setTimeout(() => setLogoTapCount(0), 2000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <Pressable onPress={handleLogoTap} style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Pressable>

        {/* Welcome Text */}
        <Text style={styles.welcome}>Book My PG</Text>

        {/* General Error Message */}
        {generalError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {generalError}</Text>
          </View>
        ) : null}

        {/* User Type Toggle */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>User Login</Text>
          </TouchableOpacity>
          <Link href="/(auth)/owner-login" asChild>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabText}>PG Owner</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, emailError && styles.inputError]}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={[styles.passwordContainer, passwordError && styles.inputError]}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🔒'}</Text>
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
        </View>

        {/* Forgot Password */}
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>{loading ? 'Loading...' : 'Login'}</Text>
        </TouchableOpacity>

        {/* Google Sign-In */}
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
          <View style={styles.googleButtonContent}>
            <Image 
              source={{ uri: 'https://www.google.com/favicon.ico' }} 
              style={styles.googleIcon} 
            />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </View>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <Link href="/(auth)/sign-up" asChild>
          <TouchableOpacity style={styles.signupLink}>
            <Text style={styles.signupLinkText}>New user? Sign up here</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 180,
    height: 180,
  },
  welcome: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#000',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 22,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#f44336',
    borderWidth: 1,
  },
  fieldError: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingRight: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#000',
  },
  eyeIcon: {
    fontSize: 20,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#000',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 12,
    marginBottom: 24,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  signupLink: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  signupLinkText: {
    fontSize: 14,
    color: '#666',
  },
  ownerButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  ownerButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
