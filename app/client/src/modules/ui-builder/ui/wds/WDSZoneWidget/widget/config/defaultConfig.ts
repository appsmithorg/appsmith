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
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import { getWidgetBluePrintUpdates } from "utils/WidgetBlueprintUtils";

export const defaultConfig: WidgetDefaultProps = {
  elevatedBackground: true,
  children: [],
  columns: 0,
  responsiveBehavior: ResponsiveBehavior.Fill,
  flexVerticalAlignment: FlexVerticalAlignment.Stretch,
  rows: 0,
  version: 1,
  widgetName: "Zone",
  isVisible: true,
  useAsForm: false,
  blueprint: {
    operations: [
      {
        type: BlueprintOperationTypes.MODIFY_PROPS,
        fn: (
          widget: FlattenedWidgetProps,
          widgets: CanvasWidgetsReduxState,
          parent: FlattenedWidgetProps, // Why does this exist, when we have all the widgets?
          layoutSystemType: LayoutSystemTypes, // All widgets are new in Anvil, however, it may be needed for Auto Layout
        ) => {
          if (layoutSystemType !== LayoutSystemTypes.ANVIL) return [];

          const layout: LayoutProps[] = zonePreset();

          const updates = getWidgetBluePrintUpdates({
            [widget.widgetId]: {
              layout,
            },
          });

          // In a modal widget, the zones don't have borders and elevation
          // by default. We go up the hierarchy to find any Modal Widget
          // If it exists, we remove the elevated background for the zone
          let parentId = widget.parentId;

          while (parentId) {
            if (widgets[parentId].type === "WDS_MODAL_WIDGET") {
              updates.push({
                widgetId: widget.widgetId,
                propertyName: "elevatedBackground",
                propertyValue: false,
              });
              break;
            }

            parentId = widgets[parentId].parentId;
          }

          return updates;
        },
      },
    ],
  },
};
