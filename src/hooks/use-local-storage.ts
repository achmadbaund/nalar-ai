"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook untuk persist state ke localStorage
 * @param key - Key untuk localStorage
 * @param initialValue - Nilai awal jika tidak ada di localStorage
 * @returns [value, setValue] - Tuple seperti useState
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // State untuk menyimpan nilai
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Function untuk update value
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Support function update seperti useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // Save ke localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

