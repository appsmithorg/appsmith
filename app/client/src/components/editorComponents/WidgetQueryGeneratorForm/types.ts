import type { DefaultOptionType } from "rc-select/lib/Select";

export interface DropdownOptionType {
  id?: string;
  label?: string;
  value?: string;
  icon?: JSX.Element;
  onSelect?: (value: string, option: DefaultOptionType) => void;
  data?: any;
}
