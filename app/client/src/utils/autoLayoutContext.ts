import { Context, createContext } from "react";
import {
  AlignItems,
  JustifyContent,
  LayoutDirection,
  Overflow,
} from "components/constants";

export const AutoLayoutContext: Context<{
  useAutoLayout?: boolean;
  direction?: LayoutDirection;
  justifyContent?: JustifyContent;
  overflow?: Overflow;
  disabledResizeHandles?: string[];
  alignItems?: AlignItems;
}> = createContext({});
