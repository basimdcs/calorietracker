import React, { createContext, useContext, ReactNode } from 'react';
import useRevenueCat, { RevenueCatState, RevenueCatActions } from '../hooks/useRevenueCat';

interface RevenueCatContextType {
  state: RevenueCatState;
  actions: RevenueCatActions;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

interface RevenueCatProviderProps {
  children: ReactNode;
}

export const RevenueCatProvider: React.FC<RevenueCatProviderProps> = ({ children }) => {
  const { state, actions } = useRevenueCat();

  return (
    <RevenueCatContext.Provider value={{ state, actions }}>
      {children}
    </RevenueCatContext.Provider>
  );
};

export const useRevenueCatContext = (): RevenueCatContextType => {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error('useRevenueCatContext must be used within a RevenueCatProvider');
  }
  return context;
};