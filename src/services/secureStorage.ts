// services/secureStorage.ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';

// Key storage constants
const ENCRYPTION_KEY_STORAGE_KEY = 'phmos_encryption_key';

// Helper function to get or generate encryption key
async function getEncryptionKey(): Promise<string> {
  try {
    // Try to get existing key
    let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORAGE_KEY);
    
    if (!key) {
      // Generate new key using device-specific information
      const deviceType = await Device.getDeviceTypeAsync();
      const deviceName = Device.deviceName || '';
      const deviceYear = Device.deviceYearClass || '';
      const osVersion = Device.osVersion || '';
      const osInternalBuildId = Device.osInternalBuildId || '';
      
      // Combine device info with random bytes for uniqueness
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      const randomString = Buffer.from(randomBytes).toString('hex');
      
      // Create a unique key based on device info and random data
      const keyBase = `${deviceType}-${deviceName}-${deviceYear}-${osVersion}-${osInternalBuildId}-${randomString}`;
      
      // Hash the combined string to create a consistent-length key
      key = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        keyBase
      );
      
      // Store the key securely
      await SecureStore.setItemAsync(ENCRYPTION_KEY_STORAGE_KEY, key);
    }
    
    return key;
  } catch (error) {
    console.error('Error getting encryption key:', error);
    throw new Error('Failed to get encryption key');
  }
}

export const secureStorage = {
  async setItem(key: string, value: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
      return true;
    } catch (error) {
      console.error('SecureStorage setItem error:', error);
      return false;
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStorage getItem error:', error);
      return null;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
      return true;
    } catch (error) {
      console.error('SecureStorage removeItem error:', error);
      return false;
    }
  },

  async encrypt(data: string): Promise<string> {
    try {
      const key = await getEncryptionKey();
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        key
      );
      
      // Simple XOR encryption with the hash
      const encrypted = Array.from(data).map((char, index) => {
        return String.fromCharCode(
          char.charCodeAt(0) ^ hash.charCodeAt(index % hash.length)
        );
      }).join('');
      
      // Return base64 encoded string
      return Buffer.from(encrypted).toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  },

  async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await getEncryptionKey();
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        key
      );
      
      // Decode from base64
      const encrypted = Buffer.from(encryptedData, 'base64').toString();
      
      // Reverse the XOR operation
      const decrypted = Array.from(encrypted).map((char, index) => {
        return String.fromCharCode(
          char.charCodeAt(0) ^ hash.charCodeAt(index % hash.length)
        );
      }).join('');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Decryption failed');
    }
  }
};