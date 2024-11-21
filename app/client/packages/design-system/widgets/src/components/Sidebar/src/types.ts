import type { ReactNode } from "react";

export interface SidebarContextType {
  state: SidebarState;
  setState: (state: SidebarState) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}

export interface SidebarProviderProps {
  defaultState?: SidebarState;
  state?: SidebarState;
  onStateChange?: (state: SidebarState) => void;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export type SidebarState = "collapsed" | "expanded" | "full-width";

export interface SidebarProps {
  side?: "start" | "end";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  onEnter?: () => void;
  onExit?: () => void;
  onEntered?: () => void;
  onExited?: () => void;
  children:
    | React.ReactNode
    | ((props: {
        isAnimating: boolean;
        state: SidebarState;
      }) => React.ReactNode);
  className?: string;
  title?: string;
}
