import type { ActionGroupProps } from "@design-system/widgets";
import type { WidgetProps } from "widgets/BaseWidget";
import type { ToolbarButtonsItemComponentProps } from "../component/types";

export type ButtonsList = Record<string, ToolbarButtonsItemComponentProps>;

export interface ToolbarButtonsWidgetProps
  extends WidgetProps,
    ActionGroupProps<object> {
  isVisible: boolean;
  buttonsList: ButtonsList;
}
