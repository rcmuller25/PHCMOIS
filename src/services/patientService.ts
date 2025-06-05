import { StorageService } from './storageService';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phoneNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const PATIENTS_KEY = 'PATIENTS';

export class PatientService {
  private static async getAllPatients(): Promise<Patient[]> {
    return (await StorageService.getItem<Patient[]>(PATIENTS_KEY)) || [];
  }

  static async getPatients(): Promise<Patient[]> {
    return this.getAllPatients();
  }

  static async getPatientById(id: string): Promise<Patient | null> {
    const patients = await this.getAllPatients();
    return patients.find(patient => patient.id === id) || null;
  }

  static async createPatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
    const patients = await this.getAllPatients();
    const newPatient: Patient = {
      ...patientData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    patients.push(newPatient);
    await StorageService.setItem(PATIENTS_KEY, patients);
    return newPatient;
  }

  static async updatePatient(id: string, updateData: Partial<Omit<Patient, 'id' | 'createdAt'>>): Promise<Patient | null> {
    const patients = await this.getAllPatients();
    const patientIndex = patients.findIndex(p => p.id === id);
    
    if (patientIndex === -1) return null;
    
    const updatedPatient = {
      ...patients[patientIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    
    patients[patientIndex] = updatedPatient;
    await StorageService.setItem(PATIENTS_KEY, patients);
    return updatedPatient;
  }

  static async deletePatient(id: string): Promise<boolean> {
    const patients = await this.getAllPatients();
    const filteredPatients = patients.filter(patient => patient.id !== id);
    
    if (patients.length === filteredPatients.length) return false;
    
    await StorageService.setItem(PATIENTS_KEY, filteredPatients);
    return true;
  }

  static async searchPatients(query: string): Promise<Patient[]> {
    const patients = await this.getAllPatients();
    const queryLower = query.toLowerCase();
    
    return patients.filter(patient => 
      patient.firstName.toLowerCase().includes(queryLower) ||
      patient.lastName.toLowerCase().includes(queryLower) ||
      patient.email?.toLowerCase().includes(queryLower) ||
      patient.phoneNumber?.includes(query)
    );
  }
}
