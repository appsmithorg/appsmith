import { createContext, useContext } from "react";
import type { InheritedButtonProps } from "./types";

export const ButtonGroupContext = createContext<InheritedButtonProps>({});

export const useButtonGroupContext = () => {
  return useContext(ButtonGroupContext);
};
