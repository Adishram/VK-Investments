import React, { createContext, useContext, useState, ReactNode } from 'react';

// PG Form Data Interface
export interface PGFormData {
  // Step 1 - Basic Details
  pgName: string;
  gender: 'men' | 'women' | 'unisex' | '';
  pgRegNo: string;
  state: string;
  city: string;
  locality: string;
  contactPerson: string;
  mobile: string;
  email: string;
  address: string;
  landmark: string;
  foodAvailable: boolean;
  noOfRooms: string;
  gateCloseTime: string;
  description: string;
  noticePeriod: string;
  latitude: number;
  longitude: number;
  
  // Step 2 - Amenities
  amenities: string[];
  
  // Step 3 - Rules
  rules: string[];
  
  // Step 4 - Rooms
  rooms: RoomConfig[];
  
  // Step 5 - Images
  buildingImages: string[];
  amenityImages: string[];
  roomImages: { [roomType: string]: string };
}

export interface RoomConfig {
  type: string;
  count: number;
  isAC: boolean;
  price: number;
  deposit: number;
}

interface PGFormContextType {
  formData: PGFormData;
  updateFormData: (data: Partial<PGFormData>) => void;
  resetFormData: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const initialFormData: PGFormData = {
  pgName: '',
  gender: '',
  pgRegNo: '',
  state: '',
  city: '',
  locality: '',
  contactPerson: '',
  mobile: '',
  email: '',
  address: '',
  landmark: '',
  foodAvailable: false,
  noOfRooms: '',
  gateCloseTime: '10:00 PM',
  description: '',
  noticePeriod: '30',
  latitude: 0,
  longitude: 0,
  amenities: [],
  rules: ['No Smoking', 'No Drinking'],
  rooms: [],
  buildingImages: [],
  amenityImages: [],
  roomImages: {},
};

const PGFormContext = createContext<PGFormContextType | undefined>(undefined);

export function PGFormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<PGFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);

  const updateFormData = (data: Partial<PGFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const resetFormData = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
  };

  return (
    <PGFormContext.Provider value={{ formData, updateFormData, resetFormData, currentStep, setCurrentStep }}>
      {children}
    </PGFormContext.Provider>
  );
}

export function usePGForm() {
  const context = useContext(PGFormContext);
  if (context === undefined) {
    throw new Error('usePGForm must be used within a PGFormProvider');
  }
  return context;
}
