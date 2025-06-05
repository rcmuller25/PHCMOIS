import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Patient {
  id: string;
  firstName: string;
  surname: string;
  gender: string;
  dateOfBirth: string;
  idType: string;
  idNumber: string;
  address: string;
  primaryContact: string;
  secondaryContact?: string;
  createdAt: string;
}

interface PatientsState {
  patients: Patient[];
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  removePatient: (id: string) => void;
  resetPatients: () => void;
}

export const usePatientsStore = create<PatientsState>()(
  persist(
    (set) => ({
      patients: [],
      
      addPatient: (patient) => set((state) => ({
        patients: [...state.patients, patient]
      })),
      
      updatePatient: (id, updatedPatient) => set((state) => ({
        patients: state.patients.map((patient) => 
          patient.id === id ? { ...patient, ...updatedPatient } : patient
        )
      })),
      
      removePatient: (id) => set((state) => ({
        patients: state.patients.filter((patient) => patient.id !== id)
      })),
      
      resetPatients: () => set({ patients: [] }),
    }),
    {
      name: 'patients-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);