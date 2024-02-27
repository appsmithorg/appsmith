import type { ButtonGroupProps } from "@design-system/widgets";
import type { WidgetProps } from "widgets/BaseWidget";
import type { ButtonGroupItemComponentProps } from "../component/types";

export type ButtonsList = Record<string, ButtonGroupItemComponentProps>;

export interface InlineButtonGroupWidgetProps extends WidgetProps {
  buttonColor: ButtonGroupProps<object>["color"];
  buttonVariant: ButtonGroupProps<object>["variant"];
  orientation: ButtonGroupProps<object>["orientation"];
  isVisible: boolean;
  buttonsList: ButtonsList;
}
