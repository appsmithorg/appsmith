import type { Intent as BlueprintIntent } from "@blueprintjs/core";
import type { IconName } from "@blueprintjs/icons";
import type { WidgetProps } from "widgets/BaseWidget";

export interface DropdownOption {
  label?: string | number;
  value?: string | number;
  icon?: IconName;
  subText?: string;
  id?: string;
  onSelect?: (option: DropdownOption) => void;
  children?: DropdownOption[];
  intent?: BlueprintIntent;
}

export const defaultValueExpressionPrefix = `{{ ((options, serverSideFiltering) => ( `;

export const getDefaultValueExpressionSuffix = (widget: WidgetProps) =>
  `))(${widget.widgetName}.options, ${widget.widgetName}.serverSideFiltering) }}`;

export const getOptionLabelValueExpressionPrefix = (widget: WidgetProps) =>
  `{{${widget.widgetName}.sourceData.map((item) => (`;

export const optionLabelValueExpressionSuffix = `))}}`;

export const CLASSNAMES = {
  selectButton: "select-button",
};
