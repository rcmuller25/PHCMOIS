import { StorageService } from './storageService';
import { PatientService } from './patientService';
import { AppointmentService } from './appointmentService';
import { MedicalRecordService } from './medicalRecordService';

interface InitialData {
  initialized: boolean;
  lastInitialized: string;
}

const INITIALIZATION_KEY = 'DATA_INITIALIZATION' as const;

export class DataInitializationService {
  static async isInitialized(): Promise<boolean> {
    const data = await StorageService.getItem<InitialData>(INITIALIZATION_KEY);
    return data?.initialized === true;
  }

  static async initializeSampleData(): Promise<void> {
    const isInitialized = await this.isInitialized();
    if (isInitialized) return;

    try {
      // Sample patients
      const patient1 = await PatientService.createPatient({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1985-05-15',
        gender: 'male',
        phoneNumber: '+1234567890',
        email: 'john.doe@example.com',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
      });

      const patient2 = await PatientService.createPatient({
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1990-08-22',
        gender: 'female',
        phoneNumber: '+1987654321',
        email: 'jane.smith@example.com',
        address: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'USA',
      });

      // Sample appointments
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      await AppointmentService.createAppointment({
        patientId: patient1.id,
        title: 'Annual Checkup',
        description: 'Routine annual health checkup',
        startTime: tomorrow.toISOString(),
        endTime: new Date(tomorrow.getTime() + 30 * 60000).toISOString(), // 30 minutes later
        status: 'scheduled',
        location: 'Exam Room 1',
      });

      await AppointmentService.createAppointment({
        patientId: patient2.id,
        title: 'Follow-up Visit',
        description: 'Follow-up on previous treatment',
        startTime: nextWeek.toISOString(),
        endTime: new Date(nextWeek.getTime() + 30 * 60000).toISOString(),
        status: 'scheduled',
        location: 'Exam Room 2',
      });

      // Sample medical records
      await MedicalRecordService.createMedicalRecord({
        patientId: patient1.id,
        date: new Date().toISOString(),
        diagnosis: 'Hypertension',
        treatment: 'Prescribed medication and lifestyle changes',
        notes: 'Patient to monitor blood pressure daily',
        prescribedMedications: [
          {
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            duration: '30 days',
          },
        ],
        followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days later
      });

      // Mark as initialized
      await StorageService.setItem<InitialData>(INITIALIZATION_KEY, {
        initialized: true,
        lastInitialized: new Date().toISOString(),
      });

      console.log('Sample data initialized successfully');
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await StorageService.clearAll();
      console.log('All data cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}
