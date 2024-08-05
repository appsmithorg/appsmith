import { useEffect } from "react";
import ResizeObserver from "resize-observer-polyfill";

const useResizeObserver = (
  ref: HTMLDivElement | null,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (entries: any) => void,
) => {
  useEffect(() => {
    if (ref) {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resizeObserver = new ResizeObserver((entries: any) => {
        callback(entries);
      });
      resizeObserver.observe(ref);

      return () => resizeObserver.unobserve(ref);
    }
  }, [ref, callback]);
};

export default useResizeObserver;
