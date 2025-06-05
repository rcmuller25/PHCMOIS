import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { 
  Surface, 
  Text, 
  useTheme, 
  IconButton, 
  Divider, 
  List, 
  Card, 
  Avatar,
  Chip
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define styles at the top level of the file
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  card: {
    borderRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 0,
  },
  appHeader: {
    padding: 24,
    alignItems: 'center',
  },
  logo: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  appInfo: {
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  versionChip: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 16,
    lineHeight: 24,
  },
  listItem: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  contactCard: {
    marginTop: 8,
    borderRadius: 12,
  },
  contactItem: {
    paddingVertical: 12,
  },
  divider: {
    marginVertical: 4,
    opacity: 0.5,
  },
  footer: {
    padding: 24,
    paddingTop: 0,
  },
  credit: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default function About() {
  const theme = useTheme();
  const router = useRouter();
  
  const features = [
    'Local database for secure patient record management',
    'Mobile-friendly appointment scheduling',
    'Fully functional offline with automatic sync',
    'Export data in standard formats (CSV/PDF)',
    'Seamless integration with existing healthcare systems'
  ];

  const contactInfo = [
    { icon: 'email', label: 'Email', value: 'romanocanzuis@outlook.com', selectable: true },
    { icon: 'phone', label: 'Phone', value: '+27 65 666 7826', selectable: true },
    { icon: 'clock-time-four-outline', label: 'Hours', value: 'Mon-Fri: 8:00 AM - 5:00 PM', selectable: false },
    { icon: 'headset', label: 'Support', value: 'Available during business hours', selectable: false },
  ];

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'About PHMOS',
          headerLeft: () => (
            <IconButton
              icon="arrow-left"
              onPress={() => router.back()}
              iconColor={theme.colors.onSurface}
              size={24}
            />
          ),
          headerTitleStyle: {
            ...theme.fonts.titleLarge,
          },
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.onSurface,
        }} 
      />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.appHeader}>
              <Avatar.Image 
                size={96}
                source={require('../assets/logo.png')}
                style={styles.logo}
              />
              <View style={styles.appInfo}>
                <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
                  PHMOS
                </Text>
                <Chip 
                  mode="outlined"
                  style={[styles.versionChip, { borderColor: theme.colors.outline }]}
                  textStyle={{ color: theme.colors.onSurfaceVariant }}
                >
                  v0.1.6 beta
                </Chip>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Primary Healthcare Mobile Outreach System
                </Text>
              </View>
            </View>

            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            
            <View style={styles.section}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                About the Application
              </Text>
              <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
                PHMOS was developed to address the real-world challenges faced by clinical nurses providing healthcare in rural areas. Our mission is to simplify patient management for mobile practitioners and satellite clinics, offering a reliable solution that works even in low-connectivity environments.
              </Text>
              <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
                With its offline-first design, PHMOS ensures secure access to patient records, appointments, and medical data anytime, anywhere. All information is stored locally on your device and can be easily exported for integration with existing healthcare systems.
              </Text>
            </View>

            <View style={styles.section}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Key Features
              </Text>
              {features.map((feature, index) => (
                <List.Item
                  key={index}
                  title={feature}
                  titleStyle={{ color: theme.colors.onSurfaceVariant }}
                  left={props => (
                    <List.Icon 
                      {...props} 
                      icon="check-circle" 
                      color={theme.colors.primary}
                    />
                  )}
                  style={styles.listItem}
                />
              ))}
            </View>

            <View style={styles.section}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Contact Information
              </Text>
              <Card style={[styles.contactCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Card.Content>
                  {contactInfo.map((contact, index) => (
                    <React.Fragment key={index}>
                      <List.Item
                        title={contact.value}
                        description={contact.label}
                        titleStyle={{ color: theme.colors.onSurfaceVariant }}
                        descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                        left={props => (
                          <List.Icon 
                            {...props} 
                            icon={contact.icon} 
                            color={theme.colors.primary}
                          />
                        )}
                        style={styles.contactItem}
                        onPress={contact.selectable ? () => {
                          // Handle contact action
                        } : undefined}
                      />
                      {index < contactInfo.length - 1 && (
                        <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
                      )}
                    </React.Fragment>
                  ))}
                </Card.Content>
              </Card>
            </View>

            <View style={styles.footer}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                © {new Date().getFullYear()} PHMOS. All rights reserved.
              </Text>
              <Text variant="bodySmall" style={[styles.credit, { color: theme.colors.onSurfaceVariant }]}>
                Created by Romano Muller for Caledon Clinic
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </Surface>
  );
}