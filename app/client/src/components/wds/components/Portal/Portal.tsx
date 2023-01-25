/* eslint-disable react/no-unused-prop-types */
import React, { ReactPortal, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIsomorphicEffect } from "@mantine/hooks";

export interface PortalProps {
  /** Portal children, for example, modal or popover */
  children: React.ReactNode;

  /** Element where portal should be rendered, by default new div element is created and appended to document.body */
  target?: HTMLElement | string;

  /** Root element className */
  className?: string;
}

export function Portal(props: PortalProps): ReactPortal | null {
  const { children, className, target } = props;
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useIsomorphicEffect(() => {
    setMounted(true);
    ref.current = !target
      ? document.createElement("div")
      : typeof target === "string"
      ? document.querySelector(target)
      : target;

    if (!target) {
      document.body.appendChild(ref.current as Node);
    }

    return () => {
      !target && document.body.removeChild(ref.current as Node);
    };
  }, [target]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className={className}>{children}</div>,
    ref.current as Element,
  );
}

Portal.displayName = "@mantine/core/Portal";
