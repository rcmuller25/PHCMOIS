import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Checkbox,
  RadioButton,
  Divider,
  useTheme,
} from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { Link, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from './stores/authStore';
import { UserRole } from '../types/user';

// Define RequestAccessData interface
interface RequestAccessData {
  firstName: string;
  lastName: string;
  email: string;
  clinic: string;
  rank: UserRole;
  cellNumber: string;
  termsAccepted: boolean;
}

// Form validation utilities
const emailValidator = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || email.trim().length === 0) return 'Email is required';
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return '';
};

const nameValidator = (name: string) => {
  if (!name || name.trim().length === 0) return 'This field is required';
  if (name.trim().length < 2) return 'Must be at least 2 characters long';
  return '';
};

const phoneValidator = (phone: string) => {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  if (!phone || phone.trim().length === 0) return 'Cell number is required';
  if (!phoneRegex.test(phone)) return 'Please enter a valid cell number';
  return '';
};

const clinicValidator = (clinic: string) => {
  if (!clinic || clinic.trim().length === 0) return 'Clinic name is required';
  if (clinic.trim().length < 2) return 'Clinic name must be at least 2 characters long';
  return '';
};

const RequestAccessScreen = () => {
  const theme = useTheme();
  const { register, isLoading, error, clearError } = useAuthStore();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [clinic, setClinic] = useState('');
  const [rank, setRank] = useState<UserRole>('user');
  const [cellNumber, setCellNumber] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  // Form validation errors
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    clinic: '',
    rank: '',
    cellNumber: '',
    terms: '',
  });

  // Clear any auth store errors when component mounts or unmounts
  React.useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);

  // Validate the entire form
  const validateForm = () => {
    const newErrors = {
      firstName: nameValidator(firstName),
      lastName: nameValidator(lastName),
      email: emailValidator(email),
      clinic: clinicValidator(clinic),
      rank: '',
      cellNumber: phoneValidator(cellNumber),
      terms: !agreeToTerms ? 'You must agree to the terms and conditions' : '',
    };

    setErrors(newErrors);

    // Return true if there are no errors
    return !Object.values(newErrors).some(error => error !== '');
  };

  // Handle access request
  const handleRequestAccess = useCallback(async () => {
    // Clear any previous errors
    clearError();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      // Use the proper registration method
      await register({
        email,
        password: '', // Will be set by admin
        displayName: `${firstName} ${lastName}`,
        role: rank,
        confirmPassword: '',
        termsAccepted: agreeToTerms
      });
      
      // Show success message and redirect to login
      router.replace('/login?message=Your request for access will be processed within 3-5 business days by our system administrator. You will receive an email with your login credentials once approved.');
    } catch (error) {
      // Error is handled by the auth store
      console.error('Access request failed:', error);
    }
  }, [firstName, lastName, email, clinic, rank, cellNumber, agreeToTerms, register, clearError]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="auto" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>Request Access</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Request access to PHMOS health management system
          </Text>
        </View>

        {/* Display error from auth store if any */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          {/* First Name */}
          <View style={styles.inputContainer}>
            <TextInput
              label="First Name"
              value={firstName}
              onChangeText={text => {
                setFirstName(text);
                if (errors.firstName) {
                  setErrors({ ...errors, firstName: nameValidator(text) });
                }
              }}
              mode="outlined"
              error={!!errors.firstName}
              style={styles.input}
              autoCapitalize="words"
              disabled={isLoading}
            />
            {errors.firstName ? (
              <HelperText type="error" visible={!!errors.firstName}>
                {errors.firstName}
              </HelperText>
            ) : null}
          </View>

          {/* Last Name */}
          <View style={styles.inputContainer}>
            <TextInput
              label="Last Name"
              value={lastName}
              onChangeText={text => {
                setLastName(text);
                if (errors.lastName) {
                  setErrors({ ...errors, lastName: nameValidator(text) });
                }
              }}
              mode="outlined"
              error={!!errors.lastName}
              style={styles.input}
              autoCapitalize="words"
              disabled={isLoading}
            />
            {errors.lastName ? (
              <HelperText type="error" visible={!!errors.lastName}>
                {errors.lastName}
              </HelperText>
            ) : null}
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (errors.email) {
                  setErrors({ ...errors, email: emailValidator(text) });
                }
              }}
              mode="outlined"
              error={!!errors.email}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              disabled={isLoading}
            />
            {errors.email ? (
              <HelperText type="error" visible={!!errors.email}>
                {errors.email}
              </HelperText>
            ) : null}
          </View>

          {/* Clinic */}
          <View style={styles.inputContainer}>
            <TextInput
              label="Clinic"
              value={clinic}
              onChangeText={text => {
                setClinic(text);
                if (errors.clinic) {
                  setErrors({ ...errors, clinic: clinicValidator(text) });
                }
              }}
              mode="outlined"
              error={!!errors.clinic}
              style={styles.input}
              autoCapitalize="words"
              disabled={isLoading}
            />
            {errors.clinic ? (
              <HelperText type="error" visible={!!errors.clinic}>
                {errors.clinic}
              </HelperText>
            ) : null}
          </View>

          {/* Cell Number */}
          <View style={styles.inputContainer}>
            <TextInput
              label="Cell Number"
              value={cellNumber}
              onChangeText={text => {
                setCellNumber(text);
                if (errors.cellNumber) {
                  setErrors({ ...errors, cellNumber: phoneValidator(text) });
                }
              }}
              mode="outlined"
              error={!!errors.cellNumber}
              style={styles.input}
              keyboardType="phone-pad"
              disabled={isLoading}
            />
            {errors.cellNumber ? (
              <HelperText type="error" visible={!!errors.cellNumber}>
                {errors.cellNumber}
              </HelperText>
            ) : null}
          </View>

          {/* Rank Selection */}
          <View style={styles.roleContainer}>
            <Text variant="titleMedium" style={styles.roleTitle}>Select Rank</Text>
            <RadioButton.Group onValueChange={value => setRank(value as UserRole)} value={rank}>
              <View style={styles.roleOption}>
                <RadioButton value="user" />
                <Text>User</Text>
              </View>
              <View style={styles.roleOption}>
                <RadioButton value="clinician" />
                <Text>Clinician</Text>
              </View>
              <View style={styles.roleOption}>
                <RadioButton value="support" />
                <Text>Support Staff</Text>
              </View>
            </RadioButton.Group>
          </View>

          <Divider style={styles.divider} />

          {/* Terms and Conditions */}
          <View style={styles.termsContainer}>
            <Checkbox
              status={agreeToTerms ? 'checked' : 'unchecked'}
              onPress={() => {
                setAgreeToTerms(!agreeToTerms);
                if (errors.terms) {
                  setErrors({ ...errors, terms: !agreeToTerms ? '' : errors.terms });
                }
              }}
              disabled={isLoading}
            />
            <Text variant="bodyMedium" style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink}>Terms and Conditions</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
          {errors.terms ? (
            <HelperText type="error" visible={!!errors.terms}>
              {errors.terms}
            </HelperText>
          ) : null}

          {/* Request Access Button */}
          <Button
            mode="contained"
            onPress={handleRequestAccess}
            style={styles.button}
            loading={isLoading}
            disabled={isLoading}
          >
            Request Access
          </Button>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text variant="bodyMedium">Already have access? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 8,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
  },
  roleContainer: {
    marginVertical: 16,
  },
  roleTitle: {
    marginBottom: 8,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  divider: {
    marginVertical: 16,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  termsText: {
    marginLeft: 8,
    flex: 1,
  },
  termsLink: {
    color: '#1976D2',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginLink: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
});

export default RequestAccessScreen;
