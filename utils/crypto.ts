import * as Crypto from 'expo-crypto';

/**
 * Hashes a password using SHA-256
 * @param password The password to hash
 * @param salt Optional salt to use for hashing
 * @returns The hashed password
 */
export async function hashPassword(password: string, salt?: string): Promise<string> {
  // If no salt is provided, generate a random one
  const effectiveSalt = salt || await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Math.random().toString(36).substring(2, 15)
  );
  
  // Combine password and salt, then hash
  const combined = `${password}:${effectiveSalt}`;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  );
  
  // Return the hash and salt together, separated by a colon
  return `${hash}:${effectiveSalt}`;
}

/**
 * Verifies a password against a hash
 * @param password The password to verify
 * @param storedHash The stored hash to verify against
 * @returns Whether the password matches the hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Extract the salt from the stored hash
  const [, salt] = storedHash.split(':');
  
  // Hash the password with the extracted salt
  const hashedPassword = await hashPassword(password, salt);
  
  // Compare the hashed password with the stored hash
  return hashedPassword === storedHash;
}
