import {
  BlueprintOperationTypes,
  type FlattenedWidgetProps,
} from "WidgetProvider/constants";
import { zonePreset } from "layoutSystems/anvil/layoutComponents/presets/zonePreset";
import type { LayoutProps } from "layoutSystems/anvil/utils/anvilTypes";
import { LayoutSystemTypes } from "layoutSystems/types";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { getWidgetBluePrintUpdates } from "utils/WidgetBlueprintUtils";

export const defaultsConfig = {
  detachFromLayout: true,
  children: [],
  widgetName: "Modal",
  version: 1,
  rows: 0,
  columns: 0,
  isVisible: true,
  showFooter: true,
  showHeader: true,
  size: "medium",
  showSubmitButton: true,
  submitButtonText: "Submit",
  showCancelButton: true,
  cancelButtonText: "Cancel",
  blueprint: {
    operations: [
      {
        type: BlueprintOperationTypes.MODIFY_PROPS,
        fn: (
          widget: FlattenedWidgetProps,
          widgets: CanvasWidgetsReduxState,
          parent: FlattenedWidgetProps,
          layoutSystemType: LayoutSystemTypes,
        ) => {
          if (layoutSystemType !== LayoutSystemTypes.ANVIL) return [];

          const layout: LayoutProps[] = zonePreset();
          return getWidgetBluePrintUpdates({
            [widget.widgetId]: {
              layout,
            },
          });
        },
      },
    ],
  },
};
