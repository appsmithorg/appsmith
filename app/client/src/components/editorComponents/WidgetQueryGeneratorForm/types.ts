export interface DropdownOptionType {
  id?: string;
  label?: string;
  value?: string;
  icon?: JSX.Element;
  onSelect?: (value: string, option: DropdownOptionType) => void;
  data?: any;
}
