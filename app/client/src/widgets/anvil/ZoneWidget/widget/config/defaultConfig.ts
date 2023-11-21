import { get } from "lodash";
import {
  BlueprintOperationTypes,
  type FlattenedWidgetProps,
  type WidgetDefaultProps,
} from "WidgetProvider/constants";
import { zonePreset } from "layoutSystems/anvil/layoutComponents/presets/zonePreset";
import type { LayoutProps } from "layoutSystems/anvil/utils/anvilTypes";
import {
  FlexVerticalAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import { LayoutSystemTypes } from "layoutSystems/types";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { getWidgetBluePrintUpdates } from "utils/WidgetBlueprintUtils";

export const defaultConfig: WidgetDefaultProps = {
  children: [],
  columns: 0,
  detachFromLayout: false,
  flexVerticalAlignment: FlexVerticalAlignment.Stretch,
  responsiveBehavior: ResponsiveBehavior.Fill,
  rows: 0,
  version: 1,
  widgetName: "Zone",
  blueprint: {
    view: [
      {
        type: "CANVAS_WIDGET",
        position: { left: 0, top: 0 },
        props: {
          canExtend: false,
          children: [],
          containerStyle: "none",
          detachFromLayout: true,
          version: 1,
        },
      },
    ],
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

          //get Canvas Widget
          const canvasWidget: FlattenedWidgetProps = get(widget, "children.0");

          const layout: LayoutProps[] = zonePreset();

          return getWidgetBluePrintUpdates({
            [canvasWidget.widgetId]: {
              layout,
            },
          });
        },
      },
    ],
  },
};
