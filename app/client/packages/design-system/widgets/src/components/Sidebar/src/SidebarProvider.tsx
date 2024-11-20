import clsx from "clsx";
import React, { type Ref, useCallback, useState } from "react";

import styles from "./styles.module.css";
import { SidebarContext } from "./context";
import { useIsMobile } from "./use-mobile";
import { SIDEBAR_CONSTANTS } from "./constants";
import type { SidebarContextType, SidebarProviderProps } from "./types";

export const _SidebarProvider = (
  props: SidebarProviderProps,
  ref: Ref<HTMLDivElement>,
) => {
  const {
    children,
    className,
    defaultOpen = true,
    isOpen: openProp,
    onOpen: setOpenProp,
    style,
    ...rest
  } = props;
  const isMobile = useIsMobile();

  const [_open, _setOpen] = useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;

      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
    },
    [setOpenProp, open],
  );

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpen((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen]);

  React.useEffect(
    function handleKeyboardShortcuts() {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_CONSTANTS.KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => window.removeEventListener("keydown", handleKeyDown);
    },
    [toggleSidebar, isMobile],
  );

  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo<SidebarContextType>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        className={clsx(styles.sidebarWrapper, className)}
        ref={ref}
        style={
          {
            "--sidebar-width": SIDEBAR_CONSTANTS.WIDTH.DESKTOP,
            "--sidebar-width-icon": SIDEBAR_CONSTANTS.WIDTH.ICON,
            ...style,
          } as React.CSSProperties
        }
        {...rest}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
};

export const SidebarProvider = React.forwardRef(_SidebarProvider);
