import type { ActionGroupProps } from "@design-system/widgets";
import type { WidgetProps } from "widgets/types";
import type { ButtonsList } from "../component/types";

export interface ButtonGroupWidgetProps extends WidgetProps {
  buttonColor: ActionGroupProps<object>["color"];
  buttonVariant: ActionGroupProps<object>["variant"];
  orientation: ActionGroupProps<object>["orientation"];
  isVisible: boolean;
  buttonsList: ButtonsList;
}
