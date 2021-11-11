import { ControllerRenderProps } from "react-hook-form";

import { SchemaItem } from "../constants";
import { TextSize } from "constants/WidgetConstants";

export type FieldComponentBaseProps = {
  defaultValue?: string | number;
  isDisabled: boolean;
  isRequired?: boolean;
  label: string;
  labelStyle?: string;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  tooltip?: string;
};

export type BaseFieldComponentProps<TProps = any> = {
  hideLabel?: boolean;
  name: ControllerRenderProps["name"];
  propertyPath: string;
  schemaItem: SchemaItem & TProps;
};
