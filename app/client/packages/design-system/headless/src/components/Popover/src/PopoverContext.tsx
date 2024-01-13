import React, { useContext } from "react";
import type { ContextType } from "./types";

export const PopoverContext = React.createContext<ContextType>(null);

export const usePopoverContext = () => {
  const context = useContext(PopoverContext);

  if (context == null) {
    throw new Error("Popover components must be wrapped in <Popover />");
  }

  return context;
};
