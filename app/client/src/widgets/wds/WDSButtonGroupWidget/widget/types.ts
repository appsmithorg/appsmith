import type { ActionGroupProps } from "@design-system/widgets";
import type { WidgetProps } from "widgets/BaseWidget";
import type { ButtonGroupItemComponentProps } from "../component/types";

export type ButtonsList = Record<string, ButtonGroupItemComponentProps>;

export interface ButtonGroupWidgetProps extends WidgetProps {
  buttonColor: ActionGroupProps<object>["color"];
  buttonVariant: ActionGroupProps<object>["variant"];
  orientation: ActionGroupProps<object>["orientation"];
  isVisible: boolean;
  buttonsList: ButtonsList;
}
