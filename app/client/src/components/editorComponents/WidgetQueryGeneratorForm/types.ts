import type { DefaultOptionType } from "rc-select/lib/Select";

export interface DropdownOptionType {
  id?: string;
  label?: string;
  value?: string;
  icon?: JSX.Element;
  onSelect?: (value: string, option: DropdownOptionType) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  message?: string;
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isVisible?: (config: any) => boolean;
  onSelect?: (value: string, option: DefaultOptionType) => void;
  getDefaultValue?: (options?: Record<string, unknown>) => string;
  defaultValue?: string;
  allowClear?: boolean;
  isDataIdentifier?: boolean;
}

type SuccessMessageAction = "create" | "update" | "delete";

export interface AlertMessage {
  success: Record<SuccessMessageAction, string>;
  error: string;
}
