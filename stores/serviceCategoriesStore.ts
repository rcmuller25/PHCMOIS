// stores/serviceCategoriesStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ServiceCategory = {
  id: string;
  label: string;
  icon: string;
  timeSlot: string;
};

type ServiceCategoriesState = {
  categories: ServiceCategory[];
  addCategory: (category: ServiceCategory) => void;
  updateCategory: (id: string, category: Partial<ServiceCategory>) => void;
  removeCategory: (id: string) => void;
  resetCategories: () => void;
};

// Default service categories
const DEFAULT_CATEGORIES: ServiceCategory[] = [
  { id: 'immunisation', label: 'Immunisation', icon: 'needle', timeSlot: '09:00' },
  { id: 'family_planning', label: 'Family Planning', icon: 'account-group', timeSlot: '10:00' },
  { id: 'chronic', label: 'Chronic', icon: 'heart-pulse', timeSlot: '11:00' },
  { id: 'uncontrolled', label: 'Uncontrolled', icon: 'alert-circle', timeSlot: '12:00' },
  { id: 'tb', label: 'TB', icon: 'lungs', timeSlot: '13:00' },
  { id: 'art', label: 'Art', icon: 'medical-bag', timeSlot: '14:00' },
  { id: 'imci', label: 'IMCI', icon: 'baby-face', timeSlot: '15:00' },
  { id: 'acute', label: 'Acute', icon: 'alert', timeSlot: '16:00' },
  { id: 'anc', label: 'ANC', icon: 'human-pregnant', timeSlot: '17:00' },
  { id: 'nutrition', label: 'Nutrition', icon: 'food-apple', timeSlot: '09:30' },
  { id: 'vaccination', label: 'Vaccination', icon: 'needle', timeSlot: '10:30' },
  { id: 'screening', label: 'Screening', icon: 'magnify', timeSlot: '11:30' },
  { id: 'wound_care', label: 'Wound Care', icon: 'bandage', timeSlot: '13:30' },
  { id: 'emergency', label: 'Emergency', icon: 'ambulance', timeSlot: '14:30' },
];

const useServiceCategoriesStore = create<ServiceCategoriesState>()(
  persist(
    (set) => ({
      categories: DEFAULT_CATEGORIES,
      
      addCategory: (category) => 
        set((state) => ({
          categories: [...state.categories, category]
        })),
      
      updateCategory: (id, updatedCategory) => 
        set((state) => ({
          categories: state.categories.map((category) => 
            category.id === id 
              ? { ...category, ...updatedCategory } 
              : category
          )
        })),
      
      removeCategory: (id) => 
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id)
        })),
      
      resetCategories: () => 
        set(() => ({
          categories: DEFAULT_CATEGORIES
        })),
    }),
    {
      name: 'service-categories-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useServiceCategoriesStore;
