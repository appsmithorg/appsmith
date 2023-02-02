import * as React from "react";

import { useMenu } from "./useMenu";

type ContextType = ReturnType<typeof useMenu> | null;

export const MenuContext = React.createContext<ContextType>(null);

export const useMenuContext = () => {
  const context = React.useContext(MenuContext);

  if (context == null) {
    throw new Error("Menu components must be wrapped in <Menu />");
  }

  return context;
};
