import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import { BackButton } from '../components/BackButton';

export default function Terms() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Terms and Conditions',
          headerLeft: () => <BackButton />,
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
          },
          headerShadowVisible: false,
        }} 
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Terms and Conditions</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. POPIA Compliance</Text>
          <Text style={styles.text}>• All personal information is processed in accordance with the Protection of Personal Information Act (POPIA) of South Africa</Text>
          <Text style={styles.text}>• We collect only the minimum necessary personal information required for healthcare services</Text>
          <Text style={styles.text}>• Personal information is processed lawfully, reasonably, and in a manner that does not infringe on the privacy of the data subject</Text>
          <Text style={styles.text}>• Data subjects have the right to access, correct, and request deletion of their personal information</Text>
          <Text style={styles.text}>• We implement appropriate technical and organizational measures to secure personal information</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. PAIA Compliance</Text>
          <Text style={styles.text}>• In accordance with the Promotion of Access to Information Act (PAIA), patients have the right to access their health records</Text>
          <Text style={styles.text}>• Requests for access to information must follow the procedures outlined in our PAIA manual</Text>
          <Text style={styles.text}>• Certain information may be protected from disclosure as permitted by PAIA</Text>
          <Text style={styles.text}>• Our Information Officer is available to assist with PAIA requests</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. National Health Act Compliance</Text>
          <Text style={styles.text}>• All patient information is handled in accordance with the National Health Act of South Africa</Text>
          <Text style={styles.text}>• Patient confidentiality is maintained as required by Section 14 of the National Health Act</Text>
          <Text style={styles.text}>• Access to health records is restricted to authorized healthcare providers and the patient</Text>
          <Text style={styles.text}>• Health records are maintained for the period required by the National Health Act</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Security and Management</Text>
          <Text style={styles.text}>• All patient data is encrypted during transmission and storage</Text>
          <Text style={styles.text}>• Access to patient data is restricted to authorized healthcare personnel only</Text>
          <Text style={styles.text}>• Regular security audits are conducted to ensure data protection</Text>
          <Text style={styles.text}>• Data breach notification procedures are in place as required by POPIA</Text>
          <Text style={styles.text}>• Regular backups are performed to prevent data loss</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. User Responsibilities</Text>
          <Text style={styles.text}>• Maintain accurate and up-to-date patient information</Text>
          <Text style={styles.text}>• Ensure secure access to the application and protect login credentials</Text>
          <Text style={styles.text}>• Report any security concerns or data breaches immediately</Text>
          <Text style={styles.text}>• Use the system only for authorized healthcare purposes</Text>
          <Text style={styles.text}>• Comply with all applicable South African healthcare laws and regulations</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Consent Management</Text>
          <Text style={styles.text}>• Patient consent is obtained before collecting and processing personal information</Text>
          <Text style={styles.text}>• Patients have the right to withdraw consent at any time</Text>
          <Text style={styles.text}>• Special personal information (such as health information) is processed in accordance with POPIA Section 32</Text>
          <Text style={styles.text}>• Children's personal information is protected in accordance with POPIA Section 35</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Cross-Border Data Transfers</Text>
          <Text style={styles.text}>• Personal information is only transferred across borders in compliance with POPIA Section 72</Text>
          <Text style={styles.text}>• We ensure adequate levels of protection for personal information transferred internationally</Text>
          <Text style={styles.text}>• Data subjects are informed of any cross-border transfers of their personal information</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 4,
    lineHeight: 24,
  },
}); 