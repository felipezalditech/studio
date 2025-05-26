
"use client";
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useEffect } from 'react';
import useLocalStorage from '@/lib/hooks/use-local-storage';
import type { Location } from '@/types/location';

interface LocationContextType {
  locations: Location[];
  addLocation: (locationData: Omit<Location, 'id'>) => void;
  updateLocation: (locationData: Location) => void;
  deleteLocation: (locationId: string) => void;
  getLocationById: (locationId: string) => Location | undefined;
  setLocations: Dispatch<SetStateAction<Location[]>>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const initialMockLocations: Location[] = [
  { id: 'loc-001', name: 'Escritório Principal', address: 'Rua da Sede, 123, Centro' },
  { id: 'loc-002', name: 'Cliente Escola Crescer', address: 'Av. Educação, 456, Bairro Aprender' },
  { id: 'loc-003', name: 'Filial Leste', address: 'Rodovia Leste, km 10' },
  { id: 'loc-004', name: 'Depósito Central', address: 'Rua das Cargas, 789' },
];

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [locations, setLocations] = useLocalStorage<Location[]>('assetLocations', []);

  useEffect(() => {
    const storedLocations = window.localStorage.getItem('assetLocations');
    if (!storedLocations || JSON.parse(storedLocations).length === 0) {
      setLocations(initialMockLocations);
    }
  }, [setLocations]);

  const addLocation = (locationData: Omit<Location, 'id'>) => {
    const newLocation: Location = {
      ...locationData,
      id: `loc-${Date.now().toString()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setLocations(prevLocations => [...prevLocations, newLocation]);
  };

  const updateLocation = (locationData: Location) => {
    setLocations(prevLocations =>
      prevLocations.map(l => (l.id === locationData.id ? locationData : l))
    );
  };

  const deleteLocation = (locationId: string) => {
    setLocations(prevLocations => prevLocations.filter(l => l.id !== locationId));
  };

  const getLocationById = (locationId: string): Location | undefined => {
    return locations.find(l => l.id === locationId);
  };

  return (
    <LocationContext.Provider value={{ locations, addLocation, updateLocation, deleteLocation, getLocationById, setLocations }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocations = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocations must be used within a LocationProvider');
  }
  return context;
};
