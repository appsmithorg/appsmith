import { useEffect, useRef } from "react";

// Make sure to use this hook at the start of functional component
const usePrevious = <T,>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

export default usePrevious;
