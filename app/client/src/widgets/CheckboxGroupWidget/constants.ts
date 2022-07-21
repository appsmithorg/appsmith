export interface OptionProps {
  /** Label text for this option. If omitted, `value` is used as the label. */
  label?: string;

  /** Value of this option. */
  value: string;
}

export enum SelectAllStates {
  CHECKED = "CHECKED",
  UNCHECKED = "UNCHECKED",
  INDETERMINATE = "INDETERMINATE",
}

export type SelectAllState = keyof typeof SelectAllStates;
