import type { CheckboxGroupProps as HeadlessToggleGroupProps } from "react-aria-components";
import type { FieldProps, ORIENTATION } from "@appsmith/wds";

export interface ToggleGroupProps
  extends Omit<HeadlessToggleGroupProps, "slot" | "children">,
    FieldProps {
  /**
   * The axis the checkboxes should align with.
   * @default 'horizontal'
   */
  orientation?: keyof typeof ORIENTATION;
  /**
   * The children of the toggle group.
   */
  children: React.ReactNode;
}
