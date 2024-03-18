import type { ButtonGroupProps } from "@design-system/widgets";
import type { WidgetProps } from "widgets/BaseWidget";
import type { ToolbarButtonsItemComponentProps } from "../component/types";

export type ButtonsList = Record<string, ToolbarButtonsItemComponentProps>;

export interface ButtonGroupWidgetProps extends WidgetProps {
  buttonColor: ButtonGroupProps<object>["color"];
  buttonVariant: ButtonGroupProps<object>["variant"];
  orientation: ButtonGroupProps<object>["orientation"];
  isVisible: boolean;
  buttonsList: ButtonsList;
}
