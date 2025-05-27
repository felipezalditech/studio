
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

type SetValue<T> = Dispatch<SetStateAction<T>>;

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLocalStorageChecked, setIsLocalStorageChecked] = useState(false);

  // Effect to read from localStorage on mount (client-side only)
  // or initialize localStorage with initialValue if key is not found.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        } else {
          // Key not found in localStorage, so persist initialValue
          window.localStorage.setItem(key, JSON.stringify(initialValue));
          // Ensure state reflects this initialValue if it wasn't already
          setStoredValue(initialValue);
        }
      } catch (error) {
        console.error(`Error reading or initializing localStorage key "${key}":`, error);
        // Fallback to initialValue in case of any error during read/init
        setStoredValue(initialValue);
        // Attempt to set initialValue in localStorage even on error, just in case
        try {
            window.localStorage.setItem(key, JSON.stringify(initialValue));
        } catch (e) {
            console.error(`Error writing initialValue to localStorage key "${key}" after read error:`, e);
        }
      } finally {
        setIsLocalStorageChecked(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, initialValue]); // initialValue added to ensure re-initialization if it could change, though unlikely for mocks.

  // Effect to update localStorage when storedValue changes,
  // but only after we've checked/initialized localStorage.
  useEffect(() => {
    if (typeof window !== 'undefined' && isLocalStorageChecked) {
      // Avoid writing if storedValue is still the initialValue and localStorage was just seeded
      // This prevents an unnecessary write if the first effect just wrote initialValue.
      // However, if storedValue changes for any other reason, it should be persisted.
      const currentLocalItem = window.localStorage.getItem(key);
      if (JSON.stringify(storedValue) !== currentLocalItem) {
        try {
          window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
          console.error(`Error writing localStorage key "${key}":`, error);
        }
      }
    }
  }, [key, storedValue, isLocalStorageChecked]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
