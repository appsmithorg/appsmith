import type { Key } from "@react-types/shared";
import type { IconProps } from "@appsmith/wds";

export interface FieldListPopoverProps {
  /** Item objects in the collection. */
  items: FieldListPopoverItem[];
}

export interface FieldListPopoverItem {
  id: Key;
  label: string;
  icon?: IconProps["name"];
}
