export interface ToggleGroupOption {
  icon: string;
  value: string;
}

export interface ToggleGroupProps {
  options: ToggleGroupOption[];
  values: Array<string>;
  onClick: (value: string, isUpdatedViaKeyboard?: boolean) => void;
  className?: string;
}
