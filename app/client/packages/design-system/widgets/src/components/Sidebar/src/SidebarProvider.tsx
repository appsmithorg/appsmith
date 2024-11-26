import clsx from "clsx";
import React, { type Ref, useCallback, useState } from "react";

import type {
  SidebarContextType,
  SidebarProviderProps,
  SidebarState,
} from "./types";
import styles from "./styles.module.css";
import { SidebarContext } from "./context";
import { useIsMobile } from "./use-mobile";
import { SIDEBAR_CONSTANTS } from "./constants";

export const _SidebarProvider = (
  props: SidebarProviderProps,
  ref: Ref<HTMLDivElement>,
) => {
  const {
    children,
    className,
    defaultState = "expanded",
    onStateChange: setStateProp,
    side = "end",
    state: stateProp,
    style,
    ...rest
  } = props;
  const isMobile = useIsMobile();

  const [_state, _setState] = useState<SidebarState>(defaultState);
  const state = stateProp ?? _state;
  const setState = useCallback(
    (value: SidebarState | ((value: SidebarState) => SidebarState)) => {
      const computedState = typeof value === "function" ? value(state) : value;

      if (setStateProp) {
        setStateProp(computedState);
      } else {
        _setState(computedState);
      }
    },
    [setStateProp, state],
  );

  const toggleSidebar = React.useCallback(() => {
    return state === "collapsed" ? setState("expanded") : setState("collapsed");
  }, [setState, state]);

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

  const contextValue = React.useMemo<SidebarContextType>(
    () => ({
      state,
      setState,
      isMobile,
      side,
      toggleSidebar,
    }),
    [state, setState, isMobile, toggleSidebar, side],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        className={clsx(styles.sidebarWrapper, className)}
        ref={ref}
        style={
          {
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
