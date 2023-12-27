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
  elevatedBackground: true,
  children: [],
  columns: 0,
  detachFromLayout: false,
  flexVerticalAlignment: FlexVerticalAlignment.Stretch,
  responsiveBehavior: ResponsiveBehavior.Fill,
  rows: 0,
  version: 1,
  widgetName: "Zone",
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
