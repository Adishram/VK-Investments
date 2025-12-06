import React, { useState, useEffect, useMemo } from 'react';
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
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

// Password strength requirements based on Clerk defaults
interface PasswordRequirement {
  label: string;
  met: boolean;
}

const checkPasswordRequirements = (password: string): PasswordRequirement[] => {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains an uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains a special character (!@#$%^&*)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
};

const getPasswordStrength = (requirements: PasswordRequirement[]): { level: number; label: string; color: string } => {
  const metCount = requirements.filter(r => r.met).length;
  
  if (metCount <= 1) return { level: 1, label: 'Very Weak', color: '#f44336' };
  if (metCount === 2) return { level: 2, label: 'Weak', color: '#ff5722' };
  if (metCount === 3) return { level: 3, label: 'Fair', color: '#ff9800' };
  if (metCount === 4) return { level: 4, label: 'Good', color: '#8bc34a' };
  return { level: 5, label: 'Strong', color: '#4caf50' };
};

export default function SignUp() {
  const { signUp, setActive } = useSignUp();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Error states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Password requirements
  const passwordRequirements = useMemo(() => checkPasswordRequirements(password), [password]);
  const passwordStrength = useMemo(() => getPasswordStrength(passwordRequirements), [passwordRequirements]);

  // Clear errors when user types
  useEffect(() => {
    if (name) setNameError('');
  }, [name]);

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

    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    } else {
      setNameError('');
    }

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
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleSignUp = async () => {
    if (!validateFields()) {
      return;
    }

    if (!signUp) return;
    setLoading(true);
    setGeneralError('');

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      
      // For now, just complete without verification
      // In production, you'd navigate to verification screen
      const result = await signUp.attemptEmailAddressVerification({
        code: '424242', // Clerk test code
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(home)/home-feed');
      }
    } catch (err: any) {
      console.error('Error:', err);
      const errorMessage = err.errors?.[0]?.message || 'Sign up failed. Please try again.';
      setGeneralError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.welcome}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

        {/* General Error Message */}
        {generalError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {generalError}</Text>
          </View>
        ) : null}

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => router.back()}
          >
            <Text style={styles.tabText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, nameError && styles.inputError]}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#999"
          />
          {nameError ? <Text style={styles.fieldError}>{nameError}</Text> : null}
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
          <TextInput
            style={[styles.input, passwordError && styles.inputError]}
            value={password}
            onChangeText={setPassword}
            placeholder="Create a strong password"
            placeholderTextColor="#999"
            secureTextEntry
          />
          {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
          
          {/* Password Strength Meter */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              {/* Strength Bar */}
              <View style={styles.strengthBarContainer}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.strengthBarSegment,
                      {
                        backgroundColor: level <= passwordStrength.level 
                          ? passwordStrength.color 
                          : '#e0e0e0',
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                {passwordStrength.label}
              </Text>
              
              {/* Requirements List */}
              <View style={styles.requirementsList}>
                {passwordRequirements.map((req, index) => (
                  <View key={index} style={styles.requirementItem}>
                    <Text style={[styles.requirementIcon, req.met && styles.requirementMet]}>
                      {req.met ? '✓' : '○'}
                    </Text>
                    <Text style={[styles.requirementText, req.met && styles.requirementTextMet]}>
                      {req.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.signupButton, loading && styles.signupButtonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.signupButtonText}>{loading ? 'Creating...' : 'Sign Up'}</Text>
        </TouchableOpacity>
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
  logo: {
    width: 180,
    height: 180,
    alignSelf: 'center',
    marginBottom: 32,
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
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
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f8f8',
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
  strengthContainer: {
    marginTop: 12,
  },
  strengthBarContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  strengthBarSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  requirementsList: {
    gap: 6,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementIcon: {
    fontSize: 14,
    color: '#999',
    width: 18,
  },
  requirementMet: {
    color: '#4caf50',
  },
  requirementText: {
    fontSize: 13,
    color: '#666',
  },
  requirementTextMet: {
    color: '#4caf50',
  },
  signupButton: {
    backgroundColor: '#000',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
