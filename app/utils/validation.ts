/**
 * Validates if the provided string is a valid email address.
 * @param email - The email address to validate
 * @returns boolean - True if the email is valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates if the provided password meets the required criteria.
 * @param password - The password to validate
 * @returns string | null - An error message if validation fails, null if the password is valid
 */
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  
  return null;
};

// Default export to fix the warning
const validationUtils = {
  isValidEmail,
  validatePassword
};

export default validationUtils;
