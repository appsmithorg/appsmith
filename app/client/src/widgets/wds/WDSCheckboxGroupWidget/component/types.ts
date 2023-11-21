import type { CheckboxGroupWidgetProps, OptionProps } from "../widget/types";

export interface CheckboxGroupComponentProps
  extends Pick<
    CheckboxGroupWidgetProps,
    | "defaultSelectedValues"
    | "isDisabled"
    | "isRequired"
    | "isValid"
    | "labelPosition"
    | "labelText"
    | "onCheckChange"
    | "options"
    | "orientation"
    | "widgetId"
  > {
  onChange: (value: string[]) => void;
  selectedValues: OptionProps["value"][];
}
