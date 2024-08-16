import { useEffect, useRef } from "react";

export const useMouseLocation = () => {
  const mousePosition = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setMousePosition = (e: any) => {
    if (e) {
      mousePosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", setMousePosition);

    () => {
      window.removeEventListener("mousemove", setMousePosition);
    };
  }, []);

  return function () {
    return mousePosition.current;
  };
};
