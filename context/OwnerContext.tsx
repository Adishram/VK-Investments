import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Owner {
  id: number;
  name: string;
  email: string;
  city?: string;
  state?: string;
  mobile?: string;
}

interface OwnerContextType {
  owner: Owner | null;
  isLoading: boolean;
  setOwner: (owner: Owner | null) => void;
  login: (owner: Owner) => Promise<void>;
  logout: () => Promise<void>;
}

const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

const OWNER_STORAGE_KEY = '@owner_session';

export function OwnerProvider({ children }: { children: ReactNode }) {
  const [owner, setOwnerState] = useState<Owner | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load owner from AsyncStorage on mount
  useEffect(() => {
    loadOwner();
  }, []);

  const loadOwner = async () => {
    try {
      const stored = await AsyncStorage.getItem(OWNER_STORAGE_KEY);
      if (stored) {
        setOwnerState(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load owner session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setOwner = (newOwner: Owner | null) => {
    setOwnerState(newOwner);
  };

  const login = async (ownerData: Owner) => {
    try {
      await AsyncStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(ownerData));
      setOwnerState(ownerData);
    } catch (error) {
      console.error('Failed to save owner session:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(OWNER_STORAGE_KEY);
      setOwnerState(null);
    } catch (error) {
      console.error('Failed to clear owner session:', error);
      throw error;
    }
  };

  return (
    <OwnerContext.Provider value={{ owner, isLoading, setOwner, login, logout }}>
      {children}
    </OwnerContext.Provider>
  );
}

export function useOwner() {
  const context = useContext(OwnerContext);
  if (context === undefined) {
    throw new Error('useOwner must be used within an OwnerProvider');
  }
  return context;
}

export default OwnerContext;
