import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  ViewStyle, 
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { 
  TextInput, 
  Provider as PaperProvider, 
  useTheme, 
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from './stores/authStore';
import { isValidEmail } from './utils/validation';

// Theme type for better type safety
type AppTheme = typeof MD3LightTheme & {
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    error: string;
    surface: string;
    outline: string;
    onSurface: string;
    onSurfaceVariant: string;
    onErrorContainer: string;
    errorContainer: string;
    background: string;
    onPrimary: string;
  };
  roundness: number;
};

// Theme configuration for Material 3
const theme: AppTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6750A4',
    secondary: '#625B71',
    tertiary: '#7D5260',
    error: '#B3261E',
    surface: '#FFFBFE',
    outline: '#79747E',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    onErrorContainer: '#410E0B',
    errorContainer: '#F9DEDC',
    background: '#FFFBFE',
    onPrimary: '#FFFFFF',
  },
  roundness: 4,
  fonts: configureFonts({ config: { fontFamily: 'System' } }),
};

interface Styles {
  errorContainer: ViewStyle;
  forgotPasswordButton: ViewStyle;
  loginButton: ViewStyle;
  loginButtonLabel: TextStyle;
  requestAccessText: TextStyle;
  // Layout
  container: ViewStyle;
  keyboardAvoidingView: ViewStyle;
  scrollContainer: ViewStyle;
  loginContainer: ViewStyle;
  content: ViewStyle;
  form: ViewStyle;
  inputContainer: ViewStyle;
  optionsRow: ViewStyle;
  rememberMeContainer: ViewStyle;
  checkboxContainer: ViewStyle;
  requestAccessContainer: ViewStyle;
  
  // Header
  header: ViewStyle;
  appName: TextStyle;
  appVersion: TextStyle;
  title: TextStyle;
  subtitle: TextStyle;
  
  // Form Elements
  input: TextStyle;
  passwordInput: TextStyle;
  showPasswordButton: ViewStyle;
  checkbox: ViewStyle;
  checkboxChecked: ViewStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  
  // Text
  errorText: TextStyle;
  rememberMeText: TextStyle;
  forgotPassword: TextStyle;
  footerText: TextStyle;
  footerLink: TextStyle;
  versionText: TextStyle;
  
  // Toggle Buttons
  toggleButton: ViewStyle;
  toggleButtonActive: ViewStyle;
  toggleButtonText: TextStyle;
  toggleButtonTextActive: TextStyle;
  
  // Dropdown
  userDropdown: ViewStyle;
  picker: TextStyle;
  quickLoginLabel: TextStyle;
  
  // Offline
  offlineBanner: ViewStyle;
  offlineText: TextStyle;
  offlineButton: ViewStyle;
  offlineButtonText: TextStyle;
}

// Create a type-safe styles object with StyleSheet.create
const styles = StyleSheet.create<Styles>({
  // Toggle button styles
  toggleButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  toggleButtonActive: {
    borderBottomColor: theme.colors.primary,
  },
  toggleButtonText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 16,
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  userDropdown: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    flex: 1,
    color: theme.colors.onSurface,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loginContainer: {
    padding: 20,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 32,
  },
  errorContainer: {
    backgroundColor: theme.colors.errorContainer,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.onErrorContainer,
    fontSize: 14,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surface,
  },
  passwordInput: {
    paddingRight: 50,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
  },
  rememberMeText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  forgotPasswordButton: {
    padding: 8,
  },
  forgotPassword: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestAccessContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  requestAccessText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    marginRight: 4,
  },
  offlineBanner: {
    backgroundColor: theme.colors.errorContainer,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offlineText: {
    color: theme.colors.onErrorContainer,
    fontSize: 14,
    flex: 1,
  },
  offlineButton: {
    marginLeft: 12,
    padding: 4,
  },
  offlineButtonText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  versionText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
  content: {
    flex: 1,
  },
  footerText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
  footerLink: {
    color: theme.colors.primary,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonLabel: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickLoginLabel: {
    marginBottom: 8, 
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '500',
  }
});

export default function LoginScreen() {
  // Initialize router
  const router = useRouter();

  // Get auth state and actions from the store
  const authStore = useAuthStore();
  const { login, isLoading, error, isAuthenticated, clearError } = authStore;
  
  // Default users for quick login
  const defaultUsers = [
    { id: '1', username: 'admin', email: 'admin@phmos.org', role: 'admin', label: 'Admin User' },
    { id: '2', username: 'nurse1', email: 'nurse@phmos.org', role: 'nurse', label: 'Nurse User' }
  ];

  // Form state
  const [loginMethod, setLoginMethod] = useState<'email' | 'username'>('email');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('Friday@45');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [enableRealTimeValidation, setEnableRealTimeValidation] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  
  // Handle user selection from dropdown
  const handleUserSelect = useCallback((userId: string) => {
    if (!userId) {
      setSelectedUser('');
      setEmail('');
      setUsername('');
      setPassword('');
      return;
    }
    
    const user = defaultUsers.find(u => u.id === userId);
    if (user) {
      setSelectedUser(userId);
      setEmail(user.email);
      setUsername(user.username);
      setPassword('Friday@45');
      // Set login method to email for consistency
      setLoginMethod('email');
    }
  }, []);
  
  // Navigation functions
  const navigateToHome = useCallback(() => {
    router.push('/(tabs)' as any);
  }, [router]);

  const navigateToRegister = useCallback(() => {
    router.push('/register' as any);
  }, [router]);

  const navigateToForgotPassword = useCallback(() => {
    router.push('/(auth)/forgot-password' as any);
  }, [router]);
  
  // Clear error on unmount
  useEffect(() => {
    return () => {
      if (clearError) clearError();
    };
  }, [clearError]);

  // Clear errors when email or password changes
  useEffect(() => {
    setEmailError(null);
    setPasswordError(null);
  }, [email, password]);

  // Form validation
  const isFormValid = useMemo(() => loginMethod === 'email' 
    ? isValidEmail(email) && password.length >= 6
    : username.length > 0 && password.length >= 6, 
    [email, password, username, loginMethod]);

  // Handle login with proper error handling
  const handleLogin = useCallback(async () => {
    try {
      setEnableRealTimeValidation(true);
      setEmailError(null);
      setUsernameError(null);
      setPasswordError(null);

      if (!isFormValid) {
        if (loginMethod === 'email') {
          if (!isValidEmail(email)) {
            setEmailError('Please enter a valid email');
          }
        } else if (!username) {
          setUsernameError('Please enter a username');
        }
        if (password.length < 6) {
          setPasswordError('Password must be at least 6 characters long');
        }
        return;
      }

      console.log('Attempting login...');

      try {
        // Use the appropriate login method
        await login(loginMethod === 'email' ? email : username, password, rememberMe);

        console.log('Login successful, navigating to home...');

        // Clear any previous errors
        if (clearError) clearError();

        // Navigate to home screen after successful login
        router.push('/(tabs)' as any);

      } catch (err: any) {
        console.error('Login error in handleLogin:', err);
        // The error will be displayed from the auth store
      }
    } catch (err: any) {
      console.error('Login error in handleLogin:', err);
      // Make sure to show any error messages to the user
      if (err.message && authStore.setError) {
        authStore.setError(err.message);
      } else if (authStore.setError) {
        authStore.setError('An unknown error occurred during login');
      }
    }
  }, [email, username, password, rememberMe, loginMethod, login, router, clearError, isFormValid, authStore]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigateToHome();
    }
  }, [isAuthenticated, navigateToHome]);

  const paperTheme = useTheme();

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.loginContainer}>
              <View style={styles.header}>
                <Text style={styles.appName}>PHMOS</Text>
                <Text style={styles.appVersion}>v1.0.0</Text>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue to your account</Text>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* User Selection Dropdown */}
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.quickLoginLabel}>Quick Login</Text>
                <View style={styles.inputContainer}>
                  <RNPicker
                    selectedValue={selectedUser}
                    onValueChange={handleUserSelect}
                    style={styles.picker}
                    dropdownIconColor={paperTheme.colors.primary}
                  >
                    <RNPicker.Item label="Select a user..." value="" />
                    {defaultUsers.map(user => (
                      <RNPicker.Item 
                        key={user.id} 
                        label={user.label} 
                        value={user.id} 
                      />
                    ))}
                  </RNPicker>
                </View>
              </View>

              {/* Login Method Toggle */}
              <View style={{ flexDirection: 'row', marginBottom: 16, justifyContent: 'center' }}>
                <TouchableOpacity 
                  style={[
                    styles.toggleButton, 
                    loginMethod === 'email' && styles.toggleButtonActive
                  ]}
                  onPress={() => setLoginMethod('email')}
                >
                  <Text style={[
                    styles.toggleButtonText,
                    loginMethod === 'email' && styles.toggleButtonTextActive
                  ]}>
                    Email
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.toggleButton, 
                    loginMethod === 'username' && styles.toggleButtonActive
                  ]}
                  onPress={() => setLoginMethod('username')}
                >
                  <Text style={[
                    styles.toggleButtonText,
                    loginMethod === 'username' && styles.toggleButtonTextActive
                  ]}>
                    Username
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                {/* Email/Username Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={loginMethod === 'email' ? 'Email' : 'Username'}
                    placeholderTextColor={paperTheme.colors.onSurfaceVariant}
                    value={loginMethod === 'email' ? email : username}
                    onChangeText={loginMethod === 'email' ? setEmail : setUsername}
                    autoCapitalize="none"
                    keyboardType={loginMethod === 'email' ? 'email-address' : 'default'}
                    autoComplete={loginMethod === 'email' ? 'email' : 'username'}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Password"
                    placeholderTextColor={paperTheme.colors.onSurfaceVariant}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    style={styles.showPasswordButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialCommunityIcons 
                      name={showPassword ? 'eye-off' : 'eye'} 
                      size={24} 
                      color={paperTheme.colors.onSurfaceVariant} 
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.optionsRow}>
                  <View style={styles.rememberMeContainer}>
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => setRememberMe(!rememberMe)}
                    >
                      <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                        {rememberMe && (
                          <MaterialCommunityIcons 
                            name="check" 
                            size={16} 
                            color={paperTheme.colors.onPrimary} 
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                    <Text style={styles.rememberMeText}>Remember me</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.forgotPasswordButton}
                    onPress={navigateToForgotPassword}
                  >
                    <Text style={styles.rememberMeText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.button, (isLoading || !isFormValid) && { opacity: 0.7 }]}
                  onPress={handleLogin}
                  disabled={isLoading || !isFormValid}
                >
                  {isLoading ? (
                    <ActivityIndicator color={paperTheme.colors.onPrimary} />
                  ) : (
                    <Text style={styles.buttonText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.requestAccessContainer}>
                  <Text style={styles.requestAccessText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={navigateToRegister}>
                    <Text style={[styles.requestAccessText, { color: paperTheme.colors.primary }]}>
                      Request Access
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperProvider>
  );
}