import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing values
 * @param {string} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {string} - Debounced value
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes (also on component unmount)
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
