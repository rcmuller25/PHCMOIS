import { StorageService } from './storageService';
import { PatientService } from './patientService';

export interface MedicalRecord {
  id: string;
  patientId: string;
  date: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  prescribedMedications?: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
  // For UI purposes
  patient?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
}

const MEDICAL_RECORDS_KEY = 'MEDICAL_RECORDS';

export class MedicalRecordService {
  private static async getAllMedicalRecords(): Promise<MedicalRecord[]> {
    return (await StorageService.getItem<MedicalRecord[]>(MEDICAL_RECORDS_KEY)) || [];
  }

  static async getMedicalRecords(patientId?: string): Promise<MedicalRecord[]> {
    let records = await this.getAllMedicalRecords();
    
    if (patientId) {
      records = records.filter(record => record.patientId === patientId);
    }

    // Enrich records with patient data
    return Promise.all(
      records.map(async (record) => {
        if (record.patient) return record; // Already enriched
        
        const patient = await PatientService.getPatientById(record.patientId);
        return {
          ...record,
          patient: patient ? {
            firstName: patient.firstName,
            lastName: patient.lastName,
            dateOfBirth: patient.dateOfBirth,
          } : undefined
        };
      })
    );
  }

  static async getMedicalRecordById(id: string): Promise<MedicalRecord | null> {
    const records = await this.getAllMedicalRecords();
    const record = records.find(record => record.id === id);
    
    if (!record) return null;
    
    // Enrich with patient data
    const patient = await PatientService.getPatientById(record.patientId);
    return {
      ...record,
      patient: patient ? {
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
      } : undefined
    };
  }

  static async createMedicalRecord(recordData: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'patient'>): Promise<MedicalRecord> {
    const records = await this.getAllMedicalRecords();
    const newRecord: MedicalRecord = {
      ...recordData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    records.push(newRecord);
    await StorageService.setItem(MEDICAL_RECORDS_KEY, records);
    return this.getMedicalRecordById(newRecord.id) as Promise<MedicalRecord>;
  }

  static async updateMedicalRecord(id: string, updateData: Partial<Omit<MedicalRecord, 'id' | 'createdAt' | 'patient'>>): Promise<MedicalRecord | null> {
    const records = await this.getAllMedicalRecords();
    const recordIndex = records.findIndex(r => r.id === id);
    
    if (recordIndex === -1) return null;
    
    const updatedRecord = {
      ...records[recordIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    
    records[recordIndex] = updatedRecord;
    await StorageService.setItem(MEDICAL_RECORDS_KEY, records);
    return this.getMedicalRecordById(id);
  }

  static async deleteMedicalRecord(id: string): Promise<boolean> {
    const records = await this.getAllMedicalRecords();
    const filteredRecords = records.filter(record => record.id !== id);
    
    if (records.length === filteredRecords.length) return false;
    
    await StorageService.setItem(MEDICAL_RECORDS_KEY, filteredRecords);
    return true;
  }

  static async searchMedicalRecords(query: string): Promise<MedicalRecord[]> {
    const records = await this.getMedicalRecords();
    const queryLower = query.toLowerCase();
    
    return records.filter(record => 
      record.diagnosis.toLowerCase().includes(queryLower) ||
      record.treatment.toLowerCase().includes(queryLower) ||
      record.notes?.toLowerCase().includes(queryLower) ||
      (record.patient && (
        record.patient.firstName.toLowerCase().includes(queryLower) ||
        record.patient.lastName.toLowerCase().includes(queryLower)
      ))
    );
  }
}
