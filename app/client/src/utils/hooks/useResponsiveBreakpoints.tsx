import React from "react";

// Find the matching breakpoint knowing the width
function findBreakPoint(breakpoints: Record<string, number>[], width: number) {
  const breakpointIndex = breakpoints
    .map((x) => Object.values(x)[0])
    .findIndex((x) => width < x);

  // element is larger than every breakpoint return empty
  if (breakpointIndex === -1) {
    return "";
  }

  return Object.keys(breakpoints[breakpointIndex])[0];
}

export default function useResponsiveBreakpoints(
  elRef: React.RefObject<Element>,
  breakpoints: Record<string, number>[],
) {
  const firstQuery = Object.keys(breakpoints[0])[0];
  const [breakSize, setBreakSize] = React.useState(firstQuery);

  const observer = React.useRef(
    new ResizeObserver((entries) => {
      // Only care about the first element, we expect one element to be watched
      const { width } = entries[0].contentRect;
      const newBreakSize = findBreakPoint(breakpoints, width);

      setBreakSize(newBreakSize);
    }),
  );

  React.useEffect(() => {
    if (elRef && elRef.current) {
      observer.current.observe(elRef.current);
    }

    return () => {
      elRef.current && observer.current.unobserve(elRef.current);
    };
  }, [elRef, observer]);

  return breakSize;
}
