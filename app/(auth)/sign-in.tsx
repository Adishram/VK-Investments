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
  ActivityIndicator,
} from 'react-native';
import { useSignIn, useAuth, useClerk } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';
import { useOwner } from '../../context/OwnerContext';
import api from '../../utils/api';

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn, signOut } = useAuth();
  const router = useRouter();
  const { login: ownerLogin } = useOwner();

  const [loginType, setLoginType] = useState<'user' | 'owner'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
  
  // Verification state
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  
  // Error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Auto-redirect if already signed in (only for users)
  useEffect(() => {
    if (isSignedIn && loginType === 'user') {
      router.replace('/(home)/home-feed');
    }
  }, [isSignedIn, loginType]);

  // Clear errors when switching login type
  useEffect(() => {
    setGeneralError('');
    setEmailError('');
    setPasswordError('');
  }, [loginType]);

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

  // Handle PG Owner Login
  const handleOwnerLogin = async () => {
    if (!validateFields()) return;

    setLoading(true);
    setGeneralError('');

    try {
      const result = await api.ownerLogin(email, password);
      
      if (result.success && result.owner) {
        await ownerLogin(result.owner);
        router.replace('/(owner)');
      } else {
        setGeneralError('Invalid credentials');
      }
    } catch (error: any) {
      setGeneralError(error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Handle User login - Two-step: Password first, then Email code
  const handleUserLogin = async () => {
    if (!signIn || !isLoaded) return;
    
    if (!validateFields()) {
      return;
    }

    setLoading(true);
    setGeneralError('');

    try {
      // Step 1: Create sign-in and validate password
      const signInAttempt = await signIn.create({
        identifier: email,
      });

      // Step 2: Attempt password verification
      const passwordResult = await signIn.attemptFirstFactor({
        strategy: 'password',
        password: password,
      });

      // Step 3: Password is correct - now send email verification code
      if (passwordResult.status === 'complete' || passwordResult.status === 'needs_second_factor') {
        // Password verified! Sign out to clear the session before email verification
        await signOut();
        
        // Create a fresh sign-in for email code
        const emailSignIn = await signIn.create({
          identifier: email,
        });

        // Find email_code factor
        const emailCodeFactor = emailSignIn.supportedFirstFactors?.find(
          (factor: any) => factor.strategy === 'email_code'
        );

        if (emailCodeFactor && 'emailAddressId' in emailCodeFactor) {
          // Send email verification code
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailCodeFactor.emailAddressId,
          });
          
          // Show verification screen
          setPendingVerification(true);
        } else {
          setGeneralError('Email verification not available for this account.');
        }
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      const errorMessage = err.errors?.[0]?.message || 'Invalid email or password. Please try again.';
      setGeneralError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Main login handler - routes to user or owner login
  const handleLogin = () => {
    if (loginType === 'owner') {
      handleOwnerLogin();
    } else {
      handleUserLogin();
    }
  };

  // Handle verification code submission
  const handleVerifyEmail = async () => {
    if (!signIn || !isLoaded) return;
    setLoading(true);
    setGeneralError('');

    try {
      const completeSignIn = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: verificationCode,
      });

      if (completeSignIn.status === 'complete') {
        await setActive({ session: completeSignIn.createdSessionId });
        router.replace('/(home)/home-feed');
      } else {
        setGeneralError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      const errorMessage = err.errors?.[0]?.message || 'Invalid verification code. Please try again.';
      setGeneralError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (!signIn) return;
    try {
      const emailFactor = signIn.supportedFirstFactors?.find(
        (factor: any) => factor.strategy === 'email_code'
      );
      
      if (emailFactor && 'emailAddressId' in emailFactor) {
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailFactor.emailAddressId,
        });
        setGeneralError('');
        Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
      }
    } catch (err: any) {
      setGeneralError('Failed to resend code. Please try again.');
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

  // Verification Code Screen
  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.welcome}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification code to{'\n'}
            <Text style={{ fontWeight: '600', color: '#000' }}>{email}</Text>
          </Text>

          {generalError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {generalError}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={styles.input}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="Enter 6-digit code"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleVerifyEmail}
            disabled={loading || verificationCode.length < 6}
          >
            <Text style={styles.loginButtonText}>{loading ? 'Verifying...' : 'Verify Email'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendButton} onPress={handleResendCode}>
            <Text style={styles.resendButtonText}>Didn't receive the code? Resend</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              setPendingVerification(false);
              setVerificationCode('');
              setGeneralError('');
            }}
          >
            <Text style={styles.backButtonText}>← Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
          <TouchableOpacity 
            style={[styles.tab, loginType === 'user' && styles.activeTab]}
            onPress={() => setLoginType('user')}
          >
            <Text style={[styles.tabText, loginType === 'user' && styles.activeTabText]}>User Login</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, loginType === 'owner' && styles.activeTab]}
            onPress={() => setLoginType('owner')}
          >
            <Text style={[styles.tabText, loginType === 'owner' && styles.activeTabText]}>PG Owner</Text>
          </TouchableOpacity>
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

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>{loginType === 'owner' ? 'Login as Owner' : 'Login'}</Text>
          )}
        </TouchableOpacity>

        {/* Google Sign-In - Only for User login */}
        {loginType === 'user' && (
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
            <View style={styles.googleButtonContent}>
              <Image 
                source={{ uri: 'https://www.google.com/favicon.ico' }} 
                style={styles.googleIcon} 
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Sign Up Link - Only for User login */}
        {loginType === 'user' && (
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity style={styles.signupLink}>
              <Text style={styles.signupLinkText}>New user? Sign up here</Text>
            </TouchableOpacity>
          </Link>
        )}
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
    backgroundColor: '#10B981',
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
  // Verification screen styles
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  },
});

