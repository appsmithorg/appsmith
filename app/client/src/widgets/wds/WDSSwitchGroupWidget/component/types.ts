import type { SwitchGroupWidgetProps, OptionProps } from "../widget/types";

export interface SwitchGroupComponentProps
  extends Pick<
    SwitchGroupWidgetProps,
    | "defaultSelectedValues"
    | "isDisabled"
    | "isRequired"
    | "isValid"
    | "labelPosition"
    | "labelText"
    | "onSelectionChange"
    | "options"
    | "orientation"
    | "widgetId"
  > {
  onChange: (value: string[]) => void;
  selectedValues: OptionProps["value"][];
}
