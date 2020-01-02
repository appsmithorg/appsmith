import { Context, createContext } from "react";

export const FocusContext: Context<{
  isFocused?: string;
  setFocus?: Function;
  propertyPaneWidgetId?: string;
  showPropertyPane?: (widgetId?: string, toggle?: boolean) => void;
}> = createContext({});

export const ResizingContext: Context<{
  isResizing?: boolean;
  setIsResizing?: Function;
}> = createContext({});
