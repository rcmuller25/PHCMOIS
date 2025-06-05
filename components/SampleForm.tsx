import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, TextInput, Text, useTheme } from 'react-native-paper';
import { FormField } from './FormField';
import { Input } from './Input';
import { emailField, passwordField, matchField, phoneNumberField, dateOfBirthField } from '../utils/validators';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
}

export const SampleForm = () => {
  const theme = useTheme();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  }, [formErrors]);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    // This is a simple client-side validation
    // The actual validation is handled by the FormField components
    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (!formData.firstName) {
      errors.firstName = 'First name is required';
      isValid = false;
    }

    if (!formData.lastName) {
      errors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!formData.phoneNumber) {
      errors.phoneNumber = 'Phone number is required';
      isValid = false;
    }

    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      setIsSubmitting(true);
      // Simulate API call
      setTimeout(() => {
        console.log('Form submitted:', formData);
        setIsSubmitting(false);
        // Show success message or navigate away
      }, 1000);
    }
  }, [formData, validateForm]);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
        Create Account
      </Text>
      
      <View style={styles.form}>
        <FormField 
          label="Email Address"
          error={!!formErrors.email}
          errorMessage={formErrors.email}
          validationRules={emailField('Email')}
          onValidate={(isValid) => {
            if (!isValid && !formErrors.email) {
              setFormErrors(prev => ({
                ...prev,
                email: 'Please enter a valid email address',
              }));
            }
          }}
        >
          <Input
            mode="outlined"
            value={formData.email}
            onChangeText={(text) => handleChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            placeholder="Enter your email"
            left={<TextInput.Icon icon="email" />}
          />
        </FormField>

        <FormField 
          label="Password"
          error={!!formErrors.password}
          errorMessage={formErrors.password}
          validationRules={passwordField('Password')}
        >
          <Input
            mode="outlined"
            value={formData.password}
            onChangeText={(text) => handleChange('password', text)}
            secureTextEntry
            textContentType="newPassword"
            placeholder="Create a password"
            left={<TextInput.Icon icon="lock" />}
            right={<TextInput.Icon icon="eye" />}
          />
        </FormField>

        <FormField 
          label="Confirm Password"
          error={!!formErrors.confirmPassword}
          errorMessage={formErrors.confirmPassword}
          validationRules={matchField(
            'Passwords',
            () => formData.password,
            'password'
          )}
        >
          <Input
            mode="outlined"
            value={formData.confirmPassword}
            onChangeText={(text) => handleChange('confirmPassword', text)}
            secureTextEntry
            textContentType="password"
            placeholder="Confirm your password"
            left={<TextInput.Icon icon="lock" />}
          />
        </FormField>

        <View style={styles.row}>
          <View style={[styles.column, { flex: 1, marginRight: 8 }]}>
            <FormField 
              label="First Name"
              error={!!formErrors.firstName}
              errorMessage={formErrors.firstName}
              validationRules={{ required: { value: true, message: 'First name is required' } }}
            >
              <Input
                mode="outlined"
                value={formData.firstName}
                onChangeText={(text) => handleChange('firstName', text)}
                autoCapitalize="words"
                textContentType="givenName"
                placeholder="First name"
              />
            </FormField>
          </View>
          
          <View style={[styles.column, { flex: 1, marginLeft: 8 }]}>
            <FormField 
              label="Last Name"
              error={!!formErrors.lastName}
              errorMessage={formErrors.lastName}
              validationRules={{ required: { value: true, message: 'Last name is required' } }}
            >
              <Input
                mode="outlined"
                value={formData.lastName}
                onChangeText={(text) => handleChange('lastName', text)}
                autoCapitalize="words"
                textContentType="familyName"
                placeholder="Last name"
              />
            </FormField>
          </View>
        </View>

        <FormField 
          label="Phone Number"
          error={!!formErrors.phoneNumber}
          errorMessage={formErrors.phoneNumber}
          validationRules={phoneNumberField()}
        >
          <Input
            mode="outlined"
            value={formData.phoneNumber}
            onChangeText={(text) => handleChange('phoneNumber', text)}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            placeholder="(555) 123-4567"
            left={<TextInput.Icon icon="phone" />}
          />
        </FormField>

        <FormField 
          label="Date of Birth"
          error={!!formErrors.dateOfBirth}
          errorMessage={formErrors.dateOfBirth}
          validationRules={dateOfBirthField()}
        >
          <Input
            mode="outlined"
            value={formData.dateOfBirth}
            onChangeText={(text) => handleChange('dateOfBirth', text)}
            placeholder="MM/DD/YYYY"
            left={<TextInput.Icon icon="calendar" />}
          />
        </FormField>

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  column: {
    flex: 1,
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 6,
  },
});
