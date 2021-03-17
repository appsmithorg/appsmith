import React, { useRef, useCallback } from "react";

/**
 * Use requestAnimationFrame + setInterval with Hooks in a declarative way.
 * @see https://gist.github.com/Danziger/336e75b6675223ad805a88c2dfdcfd4a
 */
const useThrottledRAF = (
  callback: React.EffectCallback,
  delay: number | null,
): [
  React.MutableRefObject<number | null>,
  React.MutableRefObject<number | null>,
  React.EffectCallback,
] => {
  const intervalRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const run = useCallback(() => {
    if (typeof delay === "number") {
      intervalRef.current = window.setInterval(() => {
        rafRef.current = window.requestAnimationFrame(() => {
          callback();
        });
      }, delay);

      // Clear interval and RAF if the components is unmounted or the delay changes:
      return () => {
        window.clearInterval(intervalRef.current || 0);
        window.cancelAnimationFrame(rafRef.current || 0);
      };
    }
  }, [delay, callback]);

  // In case you want to manually clear the interval or RAF from the consuming component...:
  return [intervalRef, rafRef, run];
};

export default useThrottledRAF;
