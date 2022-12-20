import { useEffect, useState } from "react";

export function useGoToTop() {
  const [change, setChange] = useState(true);
  const goToTop = () => setChange(!change);
  if ("scrollRestoration" in history) {
    // Back off, browser, I got this...
    history.scrollRestoration = "manual";
  }
  useEffect(() => {
    // eslint-disable-next-line no-console
    document.querySelector("#audit-logs-feature-container")?.scrollTo(0, 0);
    return () => {
      if ("scrollRestoration" in history) {
        // Come hither, browser, you got this...
        history.scrollRestoration = "auto";
      }
    };
  }, [change]);
  return { goToTop };
}
