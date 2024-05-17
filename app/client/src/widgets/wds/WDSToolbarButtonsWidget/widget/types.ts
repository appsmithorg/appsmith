import type { ActionGroupProps } from "@design-system/widgets";
import type { WidgetProps } from "widgets/BaseWidget";
import type { ToolbarButtonsItemComponentProps } from "../component/types";

export type ButtonsList = Record<string, ToolbarButtonsItemComponentProps>;

export interface ButtonGroupWidgetProps extends WidgetProps {
  buttonColor: ActionGroupProps<object>["color"];
  buttonVariant: ActionGroupProps<object>["variant"];
  isVisible: boolean;
  buttonsList: ButtonsList;
  alignment: ActionGroupProps<object>["alignment"];
}
