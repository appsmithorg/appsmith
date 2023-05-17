import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import type { AuditLogType } from "../types";

export default function useIntersectionObserver(
  logs: AuditLogType[],
  hasMoreLogs: boolean,
) {
  const [ratio, setRatio] = useState(-1);
  const [y, setY] = useState(-1);
  const [page, setPage] = useState(0);
  /**
   * The DOM element that slides in the viewport/container and
   * signals that next page should be loaded now.
   */
  const endMarkerRef = useRef() as MutableRefObject<HTMLDivElement>;
  /**
   * The container element that is used to calculate intersection.
   */
  const containerRef = useRef() as MutableRefObject<HTMLDivElement>;

  const callback = (entries: IntersectionObserverEntry[]) =>
    entries.forEach((value) => {
      const {
        isIntersecting,
        intersectionRatio,
        boundingClientRect = { y: 0 },
      } = value;
      const currentY = boundingClientRect?.y;
      const intersecting =
        isIntersecting && intersectionRatio >= ratio && (!y || currentY < y);

      if (intersecting) {
        setPage(page + 1);
      }
      setY(currentY);
      setRatio(intersectionRatio);
    });

  useEffect(() => {
    if (!containerRef.current || !endMarkerRef.current || !hasMoreLogs) {
      return;
    }

    const observer = new IntersectionObserver(callback);

    observer.observe(endMarkerRef.current);

    return () => {
      observer.disconnect();
    };
  });
  return { endMarkerRef, containerRef, page };
}
