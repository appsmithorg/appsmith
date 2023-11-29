import { get } from "lodash";
import {
  BlueprintOperationTypes,
  type FlattenedWidgetProps,
  type WidgetDefaultProps,
} from "WidgetProvider/constants";
import type { LayoutProps } from "layoutSystems/anvil/utils/anvilTypes";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { LayoutSystemTypes } from "layoutSystems/types";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { getWidgetBluePrintUpdates } from "utils/WidgetBlueprintUtils";
import { sectionPreset } from "layoutSystems/anvil/layoutComponents/presets/sectionPreset";

export const defaultConfig: WidgetDefaultProps = {
  backgroundColor: "ghostwhite",
  children: [],
  columns: 0,
  detachFromLayout: false,
  responsiveBehavior: ResponsiveBehavior.Fill,
  rows: 0,
  version: 1,
  widgetName: "Section",
  zoneCount: 1,
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

          const layout: LayoutProps[] = sectionPreset();

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
