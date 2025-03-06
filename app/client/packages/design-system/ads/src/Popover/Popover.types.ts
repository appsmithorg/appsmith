import type { ReactNode } from "react";
import type { PopoverContentProps as RadixPopoverContentProps } from "@radix-ui/react-popover";
import type { Sizes } from "../__config__/types";

export type PopoverSize = Extract<Sizes, "sm" | "md">;

export interface PopoverHeaderProps {
  /** the words you want to display in the header */
  children: string;
  /** (try not to) pass addition classes here */
  className?: string;
  /** if the popover can be dismissed or not */
  isClosable?: boolean;
}

export type PopoverContentProps = {
  /** Contains PopoverHeader and PopoverBody */
  children: ReactNode;
  /** (try not to) pass addition classes here */
  className?: string;
  /** the minimum size of the popover */
  size?: PopoverSize;
  /** render an arrow pointing to the trigger */
  showArrow?: boolean;
} & RadixPopoverContentProps;
