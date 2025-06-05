import React, { memo, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Text, 
  Card, 
  Button, 
  useTheme, 
  Avatar,
  IconButton,
  Surface,
  Appbar,
  List,
  Divider,
  FAB
} from 'react-native-paper';
import { useAuthStore } from './stores/authStore';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  LogOut, 
  Calendar, 
  FileText, 
  Settings, 
  Gift,
  User
} from 'lucide-react-native';

type MenuItem = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  screen: 'notes' | 'schedule' | 'administrator-settings' | 'donate';
};

const ProfileScreen = () => {
  const router = useRouter();
  const theme = useTheme();
  const { user, logout, isLoading } = useAuthStore();
  
  // Memoize handlers
  const handleBack = useCallback(() => router.back(), [router]);
  
  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/login');
  }, [logout, router]);

  const handleNavigate = useCallback((screen: MenuItem['screen']) => {
    const routes = {
      'notes': '/screens/profile/notes',
      'schedule': '/screens/profile/schedule',
      'administrator-settings': '/screens/profile/administrator-settings',
      'donate': () => {
        console.log('Navigate to donation page');
        // Example: Linking.openURL('https://your-donation-link.com');
      }
    } as const;

    const route = routes[screen];
    if (typeof route === 'function') {
      route();
    } else {
      router.push(route as any);
    }
  }, [router]);

  const getInitials = useCallback((email?: string) => {
    return email?.charAt(0).toUpperCase() || '?';
  }, []);

  // Memoize menu items data
  const menuItems = useMemo<MenuItem[]>(() => [
    {
      id: 'notes',
      title: 'Notes',
      description: 'Access your personal notes',
      icon: FileText,
      screen: 'notes',
    },
    {
      id: 'schedule',
      title: 'Schedule',
      description: 'View your monthly outreach schedule',
      icon: Calendar,
      screen: 'schedule',
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Manage your account settings',
      icon: Settings,
      screen: 'administrator-settings',
    },
    {
      id: 'donate',
      title: 'Donate',
      description: 'Support our healthcare initiative',
      icon: Gift,
      screen: 'donate',
    },
  ], []);

  // Memoize safe area edges
  const edges = useMemo<Edge[]>(() => ['top'], []);

  // Memoize styles that depend on theme
  const themedStyles = useMemo(() => ({
    container: {
      backgroundColor: theme.colors.background,
    } as ViewStyle,
    surface: {
      backgroundColor: theme.colors.surface,
    } as ViewStyle,
    profileCard: {
      backgroundColor: theme.colors.surfaceVariant,
    } as ViewStyle,
    email: {
      color: theme.colors.onSurfaceVariant,
    } as TextStyle,
    menuCard: {
      backgroundColor: theme.colors.surface,
    } as ViewStyle,
  }), [theme]);
  
  // Memoize the render function for menu items
  const renderMenuItem = useCallback((item: MenuItem) => {
    return (
      <View key={item.id}>
        <List.Item
          title={item.title}
          description={item.description}
          left={props => (
            <List.Icon 
              icon={({ size, color }) => (
                <item.icon 
                  size={size} 
                  color={color}
                />
              )}
              color={theme.colors.primary}
            />
          )}
          right={props => <List.Icon icon="chevron-right" />}
          onPress={() => handleNavigate(item.screen)}
          titleStyle={{
            color: theme.colors.onSurface,
            fontWeight: '500',
          }}
          descriptionStyle={{
            color: theme.colors.onSurfaceVariant,
          }}
        />
        {item.id !== 'donate' && <Divider />}
      </View>
    );
  }, [handleNavigate, theme.colors]);

  return (
    <SafeAreaView 
      style={[styles.container, themedStyles.container]} 
      edges={edges}
    >
      {/* Material 3 App Bar */}
      <Appbar.Header 
        elevated={false}
        style={{ backgroundColor: theme.colors.surface }}
      >
        <Appbar.BackAction onPress={handleBack} />
        <Appbar.Content title="Profile" titleStyle={{ fontWeight: '500' }} />
      </Appbar.Header>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card - Material 3 */}
        <Card 
          style={[styles.profileCard, themedStyles.profileCard]}
          mode="contained"
        >
          <Card.Content style={styles.profileContent}>
            <View style={styles.avatarSection}>
              <Avatar.Text 
                size={80} 
                label={getInitials(user?.email)}
                style={{
                  backgroundColor: theme.colors.primaryContainer,
                }}
                labelStyle={{
                  color: theme.colors.onPrimaryContainer,
                  fontSize: 32,
                  fontWeight: '600',
                }}
              />
              <View style={styles.userInfo}>
                <Text 
                  variant="headlineSmall" 
                  style={{
                    color: theme.colors.onSurface,
                    fontWeight: '500',
                    marginTop: 16,
                  }}
                >
                  Welcome back
                </Text>
                <Text 
                  variant="bodyLarge" 
                  style={[styles.email, themedStyles.email]}
                >
                  {user?.email}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Menu Items Card - Material 3 */}
        <Card 
          style={[styles.menuCard, themedStyles.menuCard]}
          mode="outlined"
        >
          <Card.Content style={styles.menuContent}>
            <Text 
              variant="titleMedium" 
              style={{ 
                color: theme.colors.onSurface,
                marginBottom: 8,
                fontWeight: '500',
              }}
            >
              Quick Actions
            </Text>
            <List.Section style={styles.listSection}>
              {menuItems.map(renderMenuItem)}
            </List.Section>
          </Card.Content>
        </Card>

        {/* Sign Out Section */}
        <Surface 
          style={[styles.logoutSection, themedStyles.surface]}
          elevation={0}
        >
          <Button
            mode="outlined"
            onPress={handleLogout}
            loading={isLoading}
            disabled={isLoading}
            icon={({ size }) => (
              <LogOut size={size} color={theme.colors.error} />
            )}
            textColor={theme.colors.error}
            buttonColor="transparent"
            style={[
              styles.logoutButton,
              { borderColor: theme.colors.error }
            ]}
            contentStyle={styles.logoutButtonContent}
            labelStyle={{ fontWeight: '500' }}
          >
            Sign Out
          </Button>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

// Memoize the component and wrap with authentication protection
const MemoizedProfileScreen = memo(ProfileScreen);

// Import withAuth HOC
import withAuth from '../components/withAuth';

// Export protected component
export default withAuth(MemoizedProfileScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  profileCard: {
    margin: 16,
    marginBottom: 16,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarSection: {
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
  },
  email: {
    marginTop: 4,
  },
  menuCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  menuContent: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  listSection: {
    marginTop: 0,
    paddingTop: 0,
  },
  logoutSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 20, // Material 3 button radius
  },
  logoutButtonContent: {
    height: 48,
    paddingHorizontal: 24,
  },
});

type Styles = {
  container: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  profileCard: ViewStyle;
  profileContent: ViewStyle;
  avatarSection: ViewStyle;
  userInfo: ViewStyle;
  email: TextStyle;
  menuCard: ViewStyle;
  menuContent: ViewStyle;
  listSection: ViewStyle;
  logoutSection: ViewStyle;
  logoutButton: ViewStyle;
  logoutButtonContent: ViewStyle;
};