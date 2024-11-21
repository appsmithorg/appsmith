import type { ReactNode } from "react";

export interface SidebarContextType {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}

export interface SidebarProviderProps {
  defaultOpen?: boolean;
  isOpen?: boolean;
  onOpen?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export interface SidebarProps {
  side?: "start" | "end";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  onEntered?: () => void;
  onExited?: () => void;
  children: ReactNode;
  className?: string;
}
