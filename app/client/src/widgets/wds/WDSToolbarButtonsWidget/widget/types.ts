import type { WidgetProps } from "widgets/BaseWidget";

import type { ToolbarButtonsItem, ToolbarButtonsProps } from "@appsmith/wds";

import type { ToolbarButtonsItemComponentProps } from "../component/types";

export type ButtonsList = Record<string, ToolbarButtonsItemComponentProps>;

export interface ToolbarButtonsWidgetProps
  extends WidgetProps,
    ToolbarButtonsProps<ToolbarButtonsItem> {
  isVisible: boolean;
  buttonsList: ButtonsList;
}
