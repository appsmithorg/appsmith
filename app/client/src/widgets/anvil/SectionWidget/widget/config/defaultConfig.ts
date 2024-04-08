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
import { ButtonBoxShadowTypes } from "components/constants";

export const defaultConfig: WidgetDefaultProps = {
  elevatedBackground: false,
  boxShadow: ButtonBoxShadowTypes.NONE,
  children: [],
  columns: 0,
  detachFromLayout: false,
  responsiveBehavior: ResponsiveBehavior.Fill,
  rows: 0,
  version: 1,
  widgetName: "Section",
  zoneCount: 1,
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

          const layout: LayoutProps[] = sectionPreset();

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
