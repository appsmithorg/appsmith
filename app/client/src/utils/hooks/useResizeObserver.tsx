import { useEffect } from "react";
import ResizeObserver from "resize-observer-polyfill";

const useResizeObserver = (
  ref: HTMLDivElement | null,
  callback: (entries: any) => void,
) => {
  useEffect(() => {
    if (ref) {
      const resizeObserver = new ResizeObserver((entries: any) => {
        callback(entries);
      });
      resizeObserver.observe(ref);

      return () => resizeObserver.unobserve(ref);
    }
  }, [ref, callback]);
};

export default useResizeObserver;
