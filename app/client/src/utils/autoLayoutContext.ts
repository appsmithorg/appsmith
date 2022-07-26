import { Context, createContext } from "react";
import {
  AlignItems,
  JustifyContent,
  LayoutDirection,
} from "components/constants";

export const AutoLayoutContext: Context<{
  useAutoLayout?: boolean;
  direction?: LayoutDirection;
  justifyContent?: JustifyContent;
  overflow?: string;
  disabledResizeHandles?: string[];
  alignItems?: AlignItems;
}> = createContext({});
