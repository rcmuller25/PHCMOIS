// services/validationService.ts
import * as Yup from 'yup';

// Base schema with common fields for all data types
const baseSchema = Yup.object().shape({
  id: Yup.string().required('ID is required'),
  createdAt: Yup.date().nullable(),
  updatedAt: Yup.date().nullable(),
});

// Enhanced patient validation schema
export const patientValidationSchema = baseSchema.concat(
  Yup.object().shape({
    firstName: Yup.string().required('First name is required').min(2, 'First name must be at least 2 characters'),
    lastName: Yup.string().required('Last name is required').min(2, 'Last name must be at least 2 characters'),
    dateOfBirth: Yup.date().required('Date of birth is required')
      .max(new Date(), 'Date of birth cannot be in the future'),
    gender: Yup.string().required('Gender is required')
      .oneOf(['male', 'female', 'other'], 'Invalid gender selection'),
    phoneNumber: Yup.string()
      .nullable()
      .test('is-valid-phone', 'Invalid phone number format', (value) => {
        if (!value) return true; // Optional field
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,4}$/;
        return phoneRegex.test(value);
      }),
    address: Yup.string().nullable(),
    city: Yup.string().nullable()
      .when('address', {
        is: (address: string) => address && address.trim().length > 0,
        then: Yup.string().required('City is required when address is provided'),
      }),
    state: Yup.string().nullable(),
    postalCode: Yup.string().nullable(),
    country: Yup.string().nullable(),
    email: Yup.string().email('Invalid email format').nullable(),
    bloodType: Yup.string()
      .nullable()
      .oneOf(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null], 'Invalid blood type'),
    allergies: Yup.array().of(Yup.string()).nullable(),
    medicalConditions: Yup.array().of(Yup.string()).nullable(),
  })
);

// Enhanced appointment validation schema
export const appointmentValidationSchema = baseSchema.concat(
  Yup.object().shape({
    patientId: Yup.string().required('Patient is required'),
    date: Yup.date().required('Date is required')
      .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Appointment date cannot be in the past'),
    timeSlot: Yup.string().required('Time slot is required')
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    duration: Yup.number().positive('Duration must be positive').nullable(),
    category: Yup.string().required('Category is required'),
    status: Yup.string()
      .oneOf(['scheduled', 'completed', 'cancelled', 'no-show'], 'Invalid status')
      .default('scheduled'),
    notes: Yup.string().nullable(),
    followUp: Yup.boolean().default(false),
  })
);

// Medical record validation schema
export const medicalRecordValidationSchema = baseSchema.concat(
  Yup.object().shape({
    patientId: Yup.string().required('Patient is required'),
    date: Yup.date().required('Date is required'),
    diagnosis: Yup.string().required('Diagnosis is required'),
    treatment: Yup.string().nullable(),
    notes: Yup.string().nullable(),
    prescriptions: Yup.array().of(
      Yup.object().shape({
        medication: Yup.string().required('Medication name is required'),
        dosage: Yup.string().required('Dosage is required'),
        frequency: Yup.string().required('Frequency is required'),
        duration: Yup.string().nullable(),
      })
    ).nullable(),
    attachments: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required('Attachment name is required'),
        type: Yup.string().required('Attachment type is required'),
        url: Yup.string().required('Attachment URL is required'),
      })
    ).nullable(),
  })
);

// Create a validation service class to handle validation
export class ValidationService {
  static async validate<T>(schema: Yup.Schema, data: T): Promise<{ isValid: boolean; errors: Record<string, string> }> {
    try {
      await schema.validate(data, { abortEarly: false });
      return { isValid: true, errors: {} };
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        const errors: Record<string, string> = {};
        error.inner.forEach((err) => {
          if (err.path) {
            errors[err.path] = err.message;
          }
        });
        return { isValid: false, errors };
      }
      return { isValid: false, errors: { general: 'Validation failed' } };
    }
  }

  static validateSync<T>(schema: Yup.Schema, data: T): { isValid: boolean; errors: Record<string, string> } {
    try {
      schema.validateSync(data, { abortEarly: false });
      return { isValid: true, errors: {} };
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        const errors: Record<string, string> = {};
        error.inner.forEach((err) => {
          if (err.path) {
            errors[err.path] = err.message;
          }
        });
        return { isValid: false, errors };
      }
      return { isValid: false, errors: { general: 'Validation failed' } };
    }
  }
}