import { MutableRefObject, MouseEvent, useEffect } from "react";

export default (
  currentRef: MutableRefObject<HTMLElement | null>,
  singleClk: (e: MouseEvent<HTMLElement>) => void,
  doubleClk?: (e: MouseEvent<HTMLElement>) => void,
) => {
  useEffect(() => {
    let clickCount = 0;
    let timeoutId = 0;

    const handleClick = (e: any) => {
      if (!doubleClk) {
        singleClk(e);
      } else {
        clickCount++;
        if (clickCount === 2 && doubleClk) {
          doubleClk(e);
          clearTimeout(timeoutId);
          clickCount = 0;
        } else {
          timeoutId = setTimeout(() => {
            singleClk(e);
            clickCount = 0;
          }, 200);
        }
      }
    };

    const el = currentRef.current;
    el?.addEventListener("click", handleClick);
    return () => {
      el?.removeEventListener("click", handleClick);
    };
  }, [currentRef, singleClk, doubleClk]);
};
