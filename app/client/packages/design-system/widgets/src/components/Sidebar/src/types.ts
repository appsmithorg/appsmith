import type { ReactNode } from "react";

export type SidebarState = "collapsed" | "expanded" | "full-width";

export type SidebarSide = "start" | "end";
export interface SidebarContextType {
  state: SidebarState;
  setState: (state: SidebarState) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  side: SidebarSide;
}

export interface SidebarProviderProps {
  defaultState?: SidebarState;
  state?: SidebarState;
  onStateChange?: (state: SidebarState) => void;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  side?: SidebarSide;
}

export interface SidebarProps {
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  extraTitleButton?: ReactNode;
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
