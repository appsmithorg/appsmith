import type { DefaultOptionType } from "rc-select/lib/Select";

export interface DropdownOptionType {
  id?: string;
  label?: string;
  value?: string;
  icon?: JSX.Element;
  onSelect?: (value: string, option: DropdownOptionType) => void;
  data?: any;
}

export interface Alias {
  name: string;
  isSearcheable?: boolean;
  isRequired?: boolean;
}

export interface OtherField {
  name: string;
  label: string;
  fieldType: string;
  optionType: string;
  isRequired: boolean;
  options?: DropdownOptionType[];
  isVisible?: (config: any) => boolean;
  onSelect?: (value: string, option: DefaultOptionType) => void;
  defaultValue?: string;
  allowClear?: boolean;
  isDataIdentifier?: boolean;
}

export interface AlertMessage {
  success: string;
  error: string;
}
