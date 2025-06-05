import { StorageService } from './storageService';
import { PatientService } from './patientService';

export interface Appointment {
  id: string;
  patientId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // For UI purposes, we'll include the patient details directly
  patient?: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  };
}

const APPOINTMENTS_KEY = 'APPOINTMENTS';

export class AppointmentService {
  private static async getAllAppointments(): Promise<Appointment[]> {
    return (await StorageService.getItem<Appointment[]>(APPOINTMENTS_KEY)) || [];
  }

  static async getAppointments(): Promise<Appointment[]> {
    const appointments = await this.getAllAppointments();
    // Enrich appointments with patient data
    return Promise.all(
      appointments.map(async (appt) => {
        if (appt.patient) return appt; // Already enriched
        
        const patient = await PatientService.getPatientById(appt.patientId);
        return {
          ...appt,
          patient: patient ? {
            firstName: patient.firstName,
            lastName: patient.lastName,
            phoneNumber: patient.phoneNumber,
          } : undefined
        };
      })
    );
  }

  static async getAppointmentById(id: string): Promise<Appointment | null> {
    const appointments = await this.getAppointments();
    return appointments.find(appt => appt.id === id) || null;
  }

  static async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    const appointments = await this.getAppointments();
    return appointments.filter(appt => appt.startTime.startsWith(date));
  }

  static async createAppointment(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'patient'>): Promise<Appointment> {
    const appointments = await this.getAllAppointments();
    const newAppointment: Appointment = {
      ...appointmentData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    appointments.push(newAppointment);
    await StorageService.setItem(APPOINTMENTS_KEY, appointments);
    return this.getAppointmentById(newAppointment.id) as Promise<Appointment>;
  }

  static async updateAppointment(id: string, updateData: Partial<Omit<Appointment, 'id' | 'createdAt' | 'patient'>>): Promise<Appointment | null> {
    const appointments = await this.getAllAppointments();
    const appointmentIndex = appointments.findIndex(a => a.id === id);
    
    if (appointmentIndex === -1) return null;
    
    const updatedAppointment = {
      ...appointments[appointmentIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    
    appointments[appointmentIndex] = updatedAppointment;
    await StorageService.setItem(APPOINTMENTS_KEY, appointments);
    return this.getAppointmentById(id);
  }

  static async deleteAppointment(id: string): Promise<boolean> {
    const appointments = await this.getAllAppointments();
    const filteredAppointments = appointments.filter(appt => appt.id !== id);
    
    if (appointments.length === filteredAppointments.length) return false;
    
    await StorageService.setItem(APPOINTMENTS_KEY, filteredAppointments);
    return true;
  }

  static async getUpcomingAppointments(limit: number = 10): Promise<Appointment[]> {
    const now = new Date().toISOString();
    const appointments = await this.getAppointments();
    
    return appointments
      .filter(appt => appt.startTime >= now && appt.status === 'scheduled')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, limit);
  }
}
