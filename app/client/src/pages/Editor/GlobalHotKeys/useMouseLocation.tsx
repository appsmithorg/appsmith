import { useEffect, useRef } from "react";

export const useMouseLocation = () => {
  const mousePosition = useRef<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const setMousePosition = (e: any) => {
    if (e) {
      mousePosition.current = { top: e.clientY, left: e.clientX };
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", setMousePosition);

    () => {
      window.removeEventListener("mousemove", setMousePosition);
    };
  }, []);

  return function() {
    return mousePosition.current;
  };
};
