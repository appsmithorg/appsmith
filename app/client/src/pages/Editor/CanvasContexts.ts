import { Context, createContext } from "react";

export const FocusContext: Context<{
  selectedWidget?: string;
  focusedWidget?: string;
  selectWidget?: Function;
  focusWidget?: Function;
  showPropertyPane?: (widgetId?: string, toggle?: boolean) => void;
}> = createContext({});

export const ResizingContext: Context<{
  isResizing?: boolean;
  setIsResizing?: Function;
}> = createContext({});
