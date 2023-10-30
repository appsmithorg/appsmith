import type { ButtonGroupProps } from "@design-system/widgets";
import type { WidgetProps } from "widgets/BaseWidget";
import type { ButtonGroupItemComponentProps } from "../component/types";

export type ButtonsList = Record<string, ButtonGroupItemComponentProps>;

export interface ButtonGroupWidgetProps extends WidgetProps {
  buttonColor: ButtonGroupProps["color"];
  buttonVariant: ButtonGroupProps["variant"];
  orientation: ButtonGroupProps["orientation"];
  isVisible: boolean;
  buttonsList: ButtonsList;
}
