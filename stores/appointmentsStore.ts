import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Appointment {
  id: string;
  date: string;
  timeSlot: string;
  category: string;
  patientId: string;
  patientName: string;
  notes?: string;
  createdAt: string;
}

interface AppointmentsState {
  appointments: Appointment[];
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  removeAppointment: (id: string) => void;
  resetAppointments: () => void;
}

export const useAppointmentsStore = create<AppointmentsState>()(
  persist(
    (set) => ({
      appointments: [],
      
      addAppointment: (appointment) => set((state) => ({
        appointments: [...state.appointments, appointment]
      })),
      
      updateAppointment: (id, updatedAppointment) => set((state) => ({
        appointments: state.appointments.map((appointment) => 
          appointment.id === id ? { ...appointment, ...updatedAppointment } : appointment
        )
      })),
      
      removeAppointment: (id) => set((state) => ({
        appointments: state.appointments.filter((appointment) => appointment.id !== id)
      })),
      
      resetAppointments: () => set({ appointments: [] }),
    }),
    {
      name: 'appointments-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);