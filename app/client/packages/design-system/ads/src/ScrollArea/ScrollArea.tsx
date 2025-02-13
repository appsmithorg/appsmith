import React, { useEffect, useRef } from "react";
import { useOverlayScrollbars } from "overlayscrollbars-react";
import type { UseOverlayScrollbarsParams } from "overlayscrollbars-react";
import clsx from "classnames";

import "overlayscrollbars/overlayscrollbars.css";
import "./styles.css";

import type { ScrollAreaProps } from "./ScrollArea.types";

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  (props, ref) => {
    const localRef = useRef<HTMLDivElement>(null);
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

    useEffect(
      function init() {
        const currentRef =
          (typeof ref === "function" ? null : ref?.current) || localRef.current;

        if (currentRef) initialize(currentRef);
      },
      [initialize, ref],
    );

    return (
      <div
        className={clsx(
          {
            "scroll-sm": size === "sm",
          },
          className,
        )}
        ref={ref || localRef}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
