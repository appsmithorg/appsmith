import { useEffect, useState } from "react";

import { SIDEBAR_CONSTANTS } from "./constants";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const root = document.body.querySelector(
      "[data-theme-provider]",
    ) as HTMLButtonElement;

    if (!Boolean(root)) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setIsMobile(
        entry.contentRect.width < SIDEBAR_CONSTANTS.MOBILE_BREAKPOINT,
      );
    });

    resizeObserver.observe(root);

    return () => resizeObserver.disconnect();
  }, [isMobile]);

  return Boolean(isMobile);
}
