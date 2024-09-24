import type { IconSizes, IconNames } from "@appsmith/ads";
import type { SubTextPosition } from "../types/common";

export type DropdownOnSelect = (
  value?: string,
  dropdownOption?: any,
  isUpdatedViaKeyboard?: boolean,
) => void;

export interface DropdownOption {
  label?: string;
  value?: string;
  id?: string;
  icon?: IconNames;
  leftElement?: string;
  searchText?: string;
  subText?: string;
  subTextPosition?: SubTextPosition;
  iconSize?: IconSizes;
  iconColor?: string;
  onSelect?: DropdownOnSelect;
  data?: any;
  isSectionHeader?: boolean;
  disabled?: boolean;
  disabledTooltipText?: string;
  hasCustomBadge?: boolean;
  link?: string;
}

export interface RenderDropdownOptionType {
  index?: number;
  option: DropdownOption | DropdownOption[];
  optionClickHandler?: (dropdownOption: DropdownOption) => void;
  isSelectedNode?: boolean;
  extraProps?: any;
  hasError?: boolean;
  optionWidth: string;
  isHighlighted?: boolean;
}
