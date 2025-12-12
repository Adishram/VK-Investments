import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PGFormProvider, usePGForm } from '../../../context/PGFormContext';

// Stepper Component
function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: 'Basic Details' },
    { num: 2, label: 'Amenities' },
    { num: 3, label: 'Rules' },
    { num: 4, label: 'Rooms' },
    { num: 5, label: 'Images' },
  ];

  return (
    <View style={styles.stepperContainer}>
      {steps.map((step, index) => (
        <React.Fragment key={step.num}>
          <View style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              currentStep >= step.num && styles.stepCircleActive,
              currentStep > step.num && styles.stepCircleCompleted,
            ]}>
              {currentStep > step.num ? (
                <Ionicons name="checkmark" size={16} color="#fff" />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  currentStep >= step.num && styles.stepNumberActive,
                ]}>{step.num}</Text>
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              currentStep >= step.num && styles.stepLabelActive,
            ]}>{step.label}</Text>
          </View>
          {index < steps.length - 1 && (
            <View style={[
              styles.stepLine,
              currentStep > step.num && styles.stepLineActive,
            ]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

function AddPGContent() {
  const router = useRouter();
  const { currentStep } = usePGForm();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Property - Step {currentStep} of 5</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepperWrapper}>
        <StepIndicator currentStep={currentStep} />
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / 5) * 100}%` }]} />
        </View>
      </View>

      {/* Content - Navigate to Step 1 */}
      <View style={styles.content}>
        <View style={styles.welcomeCard}>
          <Ionicons name="business" size={64} color="#10B981" />
          <Text style={styles.welcomeTitle}>Add Your PG Property</Text>
          <Text style={styles.welcomeText}>
            Complete the 5-step form to list your PG on Book My PG. 
            You can save and continue later.
          </Text>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => router.push('/(owner)/add-pg/step1-basic' as any)}
          >
            <Text style={styles.startButtonText}>Start Adding Details</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function AddPGIndex() {
  return (
    <PGFormProvider>
      <AddPGContent />
    </PGFormProvider>
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
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepperWrapper: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#10B981',
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  stepLine: {
    height: 2,
    flex: 0.5,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 20,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
