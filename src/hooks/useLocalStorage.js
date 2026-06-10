import { useEffect, useRef, useState } from 'react';

export const useLocalStorage = (key, initialValue) => {
  const initialValueRef = useRef(initialValue);
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : initialValueRef.current;
    } catch (error) {
      console.error(`Unable to read ${key} from localStorage`, error);
      return initialValueRef.current;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Unable to save ${key} to localStorage`, error);
    }
  }, [key, storedValue]);

  useEffect(() => {
    try {
      const value = localStorage.getItem(key);
      setStoredValue(value ? JSON.parse(value) : initialValueRef.current);
    } catch (error) {
      console.error(`Unable to reload ${key} from localStorage`, error);
      setStoredValue(initialValueRef.current);
    }
  }, [key]);

  return [storedValue, setStoredValue];
};
