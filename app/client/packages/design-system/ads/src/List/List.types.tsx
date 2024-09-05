import type { Sizes } from "../__config__/types";
import type { ReactNode } from "react";

export type ListSizes = Extract<Sizes, "md" | "lg">;

export interface ListItemProps {
  /** The icon to display before the list item title. */
  startIcon?: ReactNode;
  /** The icon to display at the end. Pass name of the icon from remix-icon library(eg: home-2-line) or an svg icon. */
  endIcon?: string;
  /** callback for when the endIcon is clicked */
  onEndIconClick?: () => void;
  /** callback for when the list item is clicked */
  onClick: () => void;
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
  description: string;
  /** `inline` type will show the description beside the title. `block` type will show the description
   * below the title.
   */
  descriptionType: "inline" | "block";
  /** class names for the list item */
  className?: string;
  /** class names for the wrapper */
  wrapperClassName?: string;
  /** id for the list item */
  id?: string;
}

export interface ListProps {
  items: ListItemProps[];
  className?: string;
  id?: string;
}
