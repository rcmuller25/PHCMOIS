
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  Pressable,
  ViewStyle,
  TextStyle
} from 'react-native';
import { Stack } from 'expo-router';
import { BackButton } from '../components/BackButton';
import { colors } from '../constants/theme';

// Define spacing constants since they're not exported from theme.ts
const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

type ChangeCategory = 'Added' | 'Fixed' | 'Updated' | 'Removed';

interface ChangeItem {
  category: ChangeCategory;
  items: string[];
}

interface ChangelogEntry {
  version: string;
  date: string;
  changes: ChangeItem[];
}

// Define all styles in a single StyleSheet
const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  content: {
    padding: spacing.md,
  },
  
  // Text styles
  header: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.light.textPrimary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.primary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.light.textSecondary,
  },
  body: {
    fontSize: 14,
    color: colors.light.textPrimary,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    color: colors.light.textSecondary,
  },
  button: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: colors.light.background,
  },

  // Layout styles
  versionContainer: {
    marginBottom: spacing.lg,
    backgroundColor: colors.light.surface,
    borderRadius: 8,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  versionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  changeCategory: {
    marginBottom: spacing.md,
  },
  changeItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  bulletPoint: {
    marginRight: spacing.sm,
  },
  changeText: {
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  versionText: {
    fontWeight: '700',
    color: colors.light.primary,
  },
  dateText: {
    color: colors.light.textSecondary,
  },
  // Additional layout styles
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changesContainer: {
    marginTop: spacing.sm,
  },
  entryContainer: {
    marginBottom: spacing.lg,
  },
  changeContainer: {
    marginBottom: spacing.md,
  },
  changesList: {
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
});

const changelogData: ChangelogEntry[] = [
  {
    version: '1.6.0',
    date: '2025-07-01',
    changes: [
      {
        category: 'Added',
        items: [
          'Enhanced secure storage implementation with encryption for sensitive data',
          'Cross-platform secure storage support (native and web)',
          'Security service with configurable security levels',
          'Comprehensive Material 3 elevation system with proper shadows',
          'State layer system for interactive elements following Material 3 specs',
          'Platform-specific typography adjustments for iOS and Android',
          'Detailed documentation for all components and services'
        ]
      },
      {
        category: 'Updated',
        items: [
          'Improved Material 3 implementation across all components',
          'Enhanced theme provider with extended Material 3 properties',
          'Optimized performance with memoized theme calculations',
          'Refined color system with healthcare-focused palette',
          'Better accessibility with proper contrast ratios',
          'Consistent elevation and state layer usage across components'
        ]
      },
      {
        category: 'Fixed',
        items: [
          'Security vulnerabilities in data storage',
          'Inconsistent Material 3 implementation in some components',
          'Theme inheritance issues in nested components',
          'Platform-specific styling inconsistencies',
          'Performance issues with theme recalculations'
        ]
      }
    ]
  },
  {
    version: '1.5.0',
    date: '2025-06-01',
    changes: [
      {
        category: 'Updated',
        items: [
          'Redesigned home screen with Material 3 design system',
          'Improved visual hierarchy and spacing',
          'Added proper TypeScript types for all components',
          'Enhanced accessibility with better contrast ratios'
        ]
      },
      {
        category: 'Fixed',
        items: [
          'TypeScript errors in home screen components',
          'Inconsistent styling across different screen sizes',
          'Missing type definitions for component props'
        ]
      },
      {
        category: 'Added',
        items: [
          'New StatCard and ActionButton reusable components',
          'Proper state management for interactive elements',
          'Responsive layout for different screen sizes',
          'Touch feedback with ripple effects'
        ]
      }
    ]
  },
  {
    version: '1.4.0',
    date: '2025-06-01',
    changes: [
      {
        category: 'Updated',
        items: [
          'Complete overhaul of the theming system with MD3 support',
          'Improved type safety across all theme-related components',
          'Enhanced dark mode with better color contrast and accessibility',
          'Consistent typography and spacing system'
        ]
      },
      {
        category: 'Fixed',
        items: [
          'TypeScript errors in theme provider and related components',
          'Inconsistent color usage across light and dark modes',
          'Navigation theming issues with React Navigation',
          'Missing theme properties in various components'
        ]
      },
      {
        category: 'Added',
        items: [
          'New theme utilities for consistent styling',
          'Support for dynamic theme switching',
          'Improved accessibility with better contrast ratios',
          'Custom elevation and shadow system'
        ]
      }
    ]
  },
  {
    version: '1.3.0',
    date: '2025-05-31',
    changes: [
      {
        category: 'Fixed',
        items: [
          'TypeScript errors in schedule screen',
          'Duplicate style keys in schedule screen',
          'Handling of potentially undefined farm.patients',
          'Inconsistent style property types'
        ]
      },
      {
        category: 'Updated',
        items: [
          'Improved type safety in schedule screen',
          'Consolidated style definitions',
          'Renamed addButton style to newButton for consistency'
        ]
      },
      {
        category: 'Added',
        items: [
          'Missing style definitions for schedule screen components',
          'Type assertions for flexbox properties',
          'Better error handling for data processing'
        ]
      }
    ]
  },
  {
    version: '1.2.0',
    date: '2025-05-30',
    changes: [
      {
        category: 'Added',
        items: [
          'Complete profile section with Administrator Settings, Schedule, and Notes',
          'Profile stack navigation for better organization of profile-related screens',
          'Consistent theming across all profile components'
        ]
      },
      {
        category: 'Fixed',
        items: [
          'Navigation structure for profile section',
          'Duplicate screen registration issues',
          'Incorrect import paths in profile components'
        ]
      },
      {
        category: 'Updated',
        items: [
          'Renamed My Profile to Administrator Settings for clarity',
          'Improved navigation between profile sections',
          'Code organization for better maintainability'
        ]
      },
      {
        category: 'Removed',
        items: [
          'Unused Notifications and Data Management screens',
          'Redundant profile screen files',
          'Unused icon imports'
        ]
      }
    ]
  },
  {
    version: '1.1.0',
    date: '2024-05-31',
    changes: [
      {
        category: 'Added',
        items: [
          'Reusable BackButton component for consistent navigation',
          'Offline-first service implementation with local storage and sync queue',
          'TypeScript type safety improvements across components'
        ]
      },
      {
        category: 'Fixed',
        items: [
          'Back navigation in patient detail screen',
          'TypeScript errors in navigation and routing',
          'Inconsistent header styling across screens'
        ]
      },
      {
        category: 'Updated',
        items: [
          'Navigation structure for better back button support',
          'Error handling in async operations',
          'Component organization and file structure'
        ]
      }
    ]
  },
  {
    version: '1.0.0',
    date: '2024-01-15',
    changes: [
      {
        category: 'Added',
        items: [
          'Complete authentication system with secure login/logout',
          'Comprehensive patient management with detailed profiles',
          'Advanced appointment scheduling with calendar integration',
          'Offline mode support for remote areas without internet',
          'Data synchronization with configurable frequency',
          'Custom splash screen with PHMOS branding',
          'Responsive navigation with tab-based interface',
          'Settings panel with theme and notification controls',
          'Patient search functionality with real-time filtering',
          'Appointment status tracking (pending, confirmed, completed)',
          'Profile management with user notes and data export',
          'Professional medical form layouts',
          'Consistent theming system across all components',
          'Error handling and user feedback systems',
          'File-based data persistence for offline functionality'
        ]
      },
      {
        category: 'Fixed',
        items: [
          'Import.meta module compatibility issues',
          'Metro bundler configuration for Expo compatibility',
          'Navigation stack routing for nested screens',
          'Theme consistency across light and dark modes',
          'Form validation and error message display',
          'Date picker functionality in appointment forms',
          'Component prop type definitions',
          'Screen transition animations',
          'Splash screen timing and navigation flow'
        ]
      },
      {
        category: 'Updated',
        items: [
          'App configuration for proper Expo deployment',
          'Component architecture for better maintainability',
          'State management with Zustand stores',
          'Form components with improved accessibility',
          'Button components with consistent styling',
          'Calendar integration with appointment markers',
          'Settings interface with organized sections',
          'Profile screen with data management features',
          'Navigation layout with proper tab structure'
        ]
      }
    ]
  }
];

function ChangelogScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Changelog',
          headerLeft: () => <BackButton />,
          headerTitleStyle: styles.header,
          headerStyle: {
            backgroundColor: colors.light.surface,
          },
          headerShadowVisible: true,
        }}
      />
      <ScrollView style={styles.scrollView}>
        {changelogData.map((entry, index) => (
          <View key={`${entry.version}-${index}`} style={styles.versionContainer}>
            <View style={styles.versionHeader}>
              <Text style={styles.title}>v{entry.version}</Text>
              <Text style={styles.caption}>
                {new Date(entry.date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.changesContainer}>
              {entry.changes.map((change, changeIndex) => (
                <View key={`${change.category}-${changeIndex}`} style={styles.changeCategory}>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(change.category) }]}>
                    <Text style={[styles.categoryText, { color: colors.light.background }]}>
                      {change.category}
                    </Text>
                  </View>
                  <View style={styles.changesList}>
                    {change.items.map((item, itemIndex) => (
                      <View key={itemIndex} style={styles.changeItem}>
                        <Text style={[styles.bulletPoint, { color: colors.light.primary }]}>•</Text>
                        <Text style={styles.changeText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const getCategoryColor = (category: ChangeCategory): string => {
  switch (category) {
    case 'Added':
      return colors.light.success; // Green for added items
    case 'Fixed':
      return colors.light.info;    // Blue for fixed items (using info color as secondary)
    case 'Updated':
      return colors.light.warning; // Yellow for updated items
    case 'Removed':
      return colors.light.error;   // Red for removed items
    default:
      return colors.light.primary; // Primary blue for any other case
  }
};

// Make sure we export the component as default
export default ChangelogScreen;
