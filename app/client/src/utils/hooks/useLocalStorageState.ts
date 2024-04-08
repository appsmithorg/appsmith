import { useCallback, useState } from "react";
import { LocalStorage } from "utils/localStorage";

const localStorage = new LocalStorage();

export default function useLocalStorageState<Tvalue>(
  key: string,
  initialValue: Tvalue,
): [Tvalue, (newValue: Tvalue) => void] {
  const [storedValue, setStoredValue] = useState(() => {
    const value = localStorage.getItem(key);

    return value ? (JSON.parse(value) as Tvalue) : initialValue;
  });

  const setValue = useCallback((newValue: Tvalue) => {
    setStoredValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  }, []);

  return [storedValue, setValue];
}
