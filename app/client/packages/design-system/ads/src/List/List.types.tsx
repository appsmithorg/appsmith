import type { Sizes } from "../__config__/types";
import type { MouseEvent, ReactNode } from "react";

export type ListSizes = Extract<Sizes, "md" | "lg">;

export interface ListItemProps {
  /** The icon to display before the list item title. */
  startIcon?: ReactNode;
  /** The control to display at the end. */
  rightControl?: ReactNode;
  /** Control the visibility trigger of right control */
  rightControlVisibility?: "hover" | "always";
  /** callback for when the list item is clicked */
  onClick: (e: MouseEvent) => void;
  /** callback for when the list item is double-clicked */
  onDoubleClick?: () => void;
  /** Whether the list item is disabled. */
  isDisabled?: boolean;
  /** Whether the list item is selected. */
  isSelected?: boolean;
  /** The size of the list item. */
  size?: ListSizes;
  /** Whether to show the list item in error state */
  hasError?: boolean;
  /** The title/label of the list item */
  title: string;
  /** Description text to be shown alongside the title */
  description?: string;
  /** `inline` type will show the description beside the title. `block` type will show the description
   * below the title.
   */
  descriptionType?: "inline" | "block";
  /** class names for the list item */
  className?: string;
  /** id for the list item */
  id?: string;
  /** customTitleComponent for the list item to use input component for name editing */
  customTitleComponent?: ReactNode | ReactNode[];
}

export interface ListProps {
  className?: string;
  id?: string;
  children: ReactNode | ReactNode[];
  groupTitle?: string;
}
