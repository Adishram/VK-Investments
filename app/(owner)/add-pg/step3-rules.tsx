import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PGFormProvider, usePGForm } from '../../../context/PGFormContext';

const DEFAULT_RULES = ['No Smoking', 'No Drinking'];

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

function Step3Content() {
  const router = useRouter();
  const { formData, updateFormData, setCurrentStep } = usePGForm();
  const [newRule, setNewRule] = useState('');

  useEffect(() => {
    setCurrentStep(3);
    // Ensure default rules are always included
    if (!formData.rules || formData.rules.length === 0) {
      updateFormData({ rules: DEFAULT_RULES });
    }
  }, []);

  const addRule = () => {
    if (!newRule.trim()) return;
    if (formData.rules.includes(newRule.trim())) {
      Alert.alert('Duplicate Rule', 'This rule already exists');
      return;
    }
    updateFormData({ rules: [...formData.rules, newRule.trim()] });
    setNewRule('');
  };

  const removeRule = (rule: string) => {
    if (DEFAULT_RULES.includes(rule)) {
      Alert.alert('Cannot Remove', 'Default rules cannot be removed');
      return;
    }
    updateFormData({ rules: formData.rules.filter(r => r !== rule) });
  };

  const validateAndContinue = () => {
    router.push('/(owner)/add-pg/step4-rooms' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4B5563" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Property - Step 3 of 5</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepperWrapper}>
        <StepIndicator currentStep={3} />
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '60%' }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Set PG Rules</Text>
        <Text style={styles.sectionHint}>
          Define the rules guests must follow. Default rules are mandatory.
        </Text>

        {/* Default Rules Section */}
        <Text style={styles.subsectionTitle}>Default Rules (Mandatory)</Text>
        <View style={styles.rulesContainer}>
          {DEFAULT_RULES.map((rule) => (
            <View key={rule} style={[styles.ruleCard, styles.ruleCardDefault]}>
              <View style={styles.ruleIcon}>
                <Ionicons name="ban-outline" size={20} color="#EF4444" />
              </View>
              <Text style={styles.ruleText}>{rule}</Text>
              <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
            </View>
          ))}
        </View>

        {/* Custom Rules Section */}
        <Text style={[styles.subsectionTitle, { marginTop: 24 }]}>Custom Rules</Text>
        
        {/* Add Rule Input */}
        <View style={styles.addRuleRow}>
          <TextInput
            style={styles.addRuleInput}
            placeholder="Add a custom rule..."
            placeholderTextColor="#9CA3AF"
            value={newRule}
            onChangeText={setNewRule}
            onSubmitEditing={addRule}
          />
          <TouchableOpacity 
            style={[styles.addRuleButton, !newRule.trim() && styles.addRuleButtonDisabled]}
            onPress={addRule}
            disabled={!newRule.trim()}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Custom Rules List */}
        <View style={styles.rulesContainer}>
          {formData.rules
            .filter(rule => !DEFAULT_RULES.includes(rule))
            .map((rule, index) => (
              <View key={index} style={styles.ruleCard}>
                <View style={styles.ruleIcon}>
                  <Ionicons name="document-text-outline" size={20} color="#10B981" />
                </View>
                <Text style={styles.ruleText}>{rule}</Text>
                <TouchableOpacity 
                  style={styles.removeRuleBtn}
                  onPress={() => removeRule(rule)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
        </View>

        {formData.rules.filter(r => !DEFAULT_RULES.includes(r)).length === 0 && (
          <View style={styles.emptyCustomRules}>
            <Ionicons name="document-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>No custom rules added</Text>
          </View>
        )}

        <Text style={styles.ruleCount}>
          Total: {formData.rules.length} rules ({DEFAULT_RULES.length} default + {formData.rules.length - DEFAULT_RULES.length} custom)
        </Text>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.continueBtn}
            onPress={validateAndContinue}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

export default function Step3Rules() {
  return (
    <PGFormProvider>
      <Step3Content />
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
    backgroundColor: '#4B5563',
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
    paddingVertical: 16,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#4B5563',
  },
  stepCircleCompleted: {
    backgroundColor: '#4B5563',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 9,
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
    marginBottom: 18,
  },
  stepLineActive: {
    backgroundColor: '#4B5563',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4B5563',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  rulesContainer: {
    gap: 10,
  },
  ruleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ruleCardDefault: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  ruleIcon: {
    marginRight: 12,
  },
  ruleText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  removeRuleBtn: {
    padding: 4,
  },
  addRuleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  addRuleInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addRuleButton: {
    backgroundColor: '#4B5563',
    borderRadius: 12,
    width: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addRuleButtonDisabled: {
    backgroundColor: '#A7F3D0',
  },
  emptyCustomRules: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  ruleCount: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backBtnText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  continueBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    backgroundColor: '#4B5563',
    borderRadius: 14,
  },
  continueBtnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
