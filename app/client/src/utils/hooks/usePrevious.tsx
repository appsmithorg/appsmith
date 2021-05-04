import { useRef, useEffect } from "react";

export default function usePrevious(value: any) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
