import type { SelectProps as RCSelectProps } from "rc-select";
import type { Sizes } from "../__config__/types";
import type { OptionProps } from "rc-select/lib/Option";
import type { OptGroupProps } from "rc-select/lib/OptGroup";

export type SelectSizes = Extract<Sizes, "sm" | "md">;

export type SelectProps = RCSelectProps & {
  size?: SelectSizes;
  isMultiSelect?: boolean;
  isDisabled?: boolean;
  isValid?: boolean;
  isLoading?: boolean;
  /** Whether the select field is required (for accessibility) */
  isRequired?: boolean;
  dropdownMatchSelectWidth?: boolean | number;
};

export type SelectOptionProps = OptionProps & {
  // used for grouping the options
  optionGroupType?: string;
};
export type SelectOptionGroupProps = OptGroupProps;
