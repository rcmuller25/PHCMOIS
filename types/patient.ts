// types/patient.ts
export interface Patient {
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
  email: string;
  phone: string;
  createdAt: string;
}
