import type {
  ListBoxProps,
  SelectProps as SpectrumSelectProps,
  Selection,
} from "react-aria-components";
import type { SIZES } from "../../../shared";
import type { FieldProps } from "../../Field";

export interface MultiSelectProps<T>
  extends Omit<
      SpectrumSelectProps<object>,
      "slot" | "selectedKey" | "onSelectionChange"
    >,
    FieldProps {
  /** size of the select
   *
   * @default medium
   */
  size?: Exclude<keyof typeof SIZES, "xSmall" | "large">;
  /**
   * The keys of the selected items.
   */
  selectedKeys?: Selection;
  /**
   * Callback for when the selection changes.
   */
  onSelectionChange?: (keys: Selection) => void;
  /**
   * The items to display in the list box.
   */
  items: ListBoxProps<T>["items"];
  /**
   * The keys of the default selected items.
   */
  defaultSelectedKeys?: Selection;
  /**
   * Whether the select is loading.
   */
  isLoading?: boolean;
}
