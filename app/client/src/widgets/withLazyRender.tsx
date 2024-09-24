import { useEffect, useRef, useState } from "react";
import React from "react";
import type { WidgetProps } from "./BaseWidget";
import type BaseWidget from "./BaseWidget";
import { REQUEST_IDLE_CALLBACK_TIMEOUT } from "constants/AppConstants";

export function withLazyRender(Widget: typeof BaseWidget) {
  return function WrappedComponent(props: WidgetProps) {
    const [deferRender, setDeferRender] = useState(true);
    const wrapperRef = useRef<HTMLDivElement>(null);
    let idleCallbackId: number;
    let observer: IntersectionObserver;

    useEffect(() => {
      if (wrapperRef.current && deferRender) {
        /*
         * For the hidden widgets, we are observing till it,
         *  1. Scrolls into view, or
         *  2. idleCallback is called (browser is either idle or timed out)
         * which ever happens first
         */

        observer = new IntersectionObserver(
          (entries: IntersectionObserverEntry[]) => {
            if (!!entries.find((entry) => entry.isIntersecting)) {
              setDeferRender(false);
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (window as any).cancelIdleCallback(idleCallbackId);
              observer.disconnect();
            } else if (!idleCallbackId) {
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              idleCallbackId = (window as any).requestIdleCallback(
                () => {
                  setDeferRender(false);
                  observer.disconnect();
                },
                {
                  timeout: REQUEST_IDLE_CALLBACK_TIMEOUT.lowPriority,
                },
              );
            }
          },
          {
            root: null,
            threshold: 0,
          },
        );

        observer.observe(wrapperRef.current);
      } else {
        setDeferRender(false);
      }

      return () => {
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).cancelIdleCallback(idleCallbackId);
        observer && observer.disconnect();
      };
    }, []);

    return (
      <Widget {...props} deferRender={deferRender} wrapperRef={wrapperRef} />
    );
  };
}
