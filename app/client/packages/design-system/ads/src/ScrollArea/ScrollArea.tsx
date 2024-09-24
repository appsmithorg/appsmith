import React, { useEffect, useRef } from "react";
import { useOverlayScrollbars } from "overlayscrollbars-react";
import type { UseOverlayScrollbarsParams } from "overlayscrollbars-react";
import clsx from "classnames";

import "overlayscrollbars/overlayscrollbars.css";
import "./styles.css";

import type { ScrollAreaProps } from "./ScrollArea.types";

function ScrollArea(props: ScrollAreaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const {
    children,
    className,
    defer,
    events,
    options,
    size = "md",
    ...rest
  } = props;
  const defaultOptions: UseOverlayScrollbarsParams["options"] = {
    scrollbars: {
      theme: "ads-v2-scroll-theme",
      autoHide: "scroll",
    },
    ...options,
  };
  const [initialize] = useOverlayScrollbars({
    options: defaultOptions,
    events,
    defer,
  });

  useEffect(() => {
    if (ref.current) initialize(ref.current);
  }, [initialize]);

  return (
    <div
      className={clsx(
        {
          "scroll-sm": size === "sm",
        },
        className,
      )}
      ref={ref}
      {...rest}
    >
      {children}
    </div>
  );
}

ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
