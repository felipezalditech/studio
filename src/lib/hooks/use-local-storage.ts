
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

type SetValue<T> = Dispatch<SetStateAction<T>>;

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLocalStorageChecked, setIsLocalStorageChecked] = useState(false);

  // Effect to read from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
        // If item doesn't exist, storedValue remains initialValue.
        // The next effect will persist initialValue to localStorage if it wasn't there.
      } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error);
        // Keep initialValue if error.
      } finally {
        setIsLocalStorageChecked(true); 
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // Only run on mount based on the key

  // Effect to update localStorage when storedValue changes,
  // but only after we've checked localStorage initially.
  useEffect(() => {
    if (typeof window !== 'undefined' && isLocalStorageChecked) {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.error(`Error writing localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue, isLocalStorageChecked]);

  // During SSR and first client render (before isLocalStorageChecked is true),
  // storedValue will be initialValue. This ensures consistency.
  return [storedValue, setStoredValue];
}

export default useLocalStorage;
