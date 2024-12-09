import {
  BlueprintOperationTypes,
  type FlattenedWidgetProps,
} from "WidgetProvider/constants";
import { LayoutSystemTypes } from "layoutSystems/types";
import type { UpdatePropertyArgs } from "sagas/WidgetBlueprintSagas";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

import defaultApp from "../widget/defaultApp";
import { COMPONENT_SIZE, DEFAULT_MODEL } from "../constants";

export const defaultsConfig = {
  widgetName: "Custom",
  rows: 30,
  columns: 23,
  version: 1,
  onResetClick: "{{showAlert('Successfully reset!!', '');}}",
  events: ["onResetClick"],
  elevatedBackground: false,
  size: COMPONENT_SIZE.AUTO,
  isVisible: true,
  defaultModel: DEFAULT_MODEL,
  srcDoc: defaultApp.srcDoc,
  uncompiledSrcDoc: defaultApp.uncompiledSrcDoc,
  dynamicTriggerPathList: [{ key: "onResetClick" }],
  responsiveBehavior: ResponsiveBehavior.Fill,
  blueprint: {
    operations: [
      {
        type: BlueprintOperationTypes.MODIFY_PROPS,
        fn: (
          widget: FlattenedWidgetProps,
          widgets: CanvasWidgetsReduxState,
          _parent: FlattenedWidgetProps,
          layoutSystemType: LayoutSystemTypes,
        ) => {
          if (layoutSystemType !== LayoutSystemTypes.ANVIL) return [];

          const updates: UpdatePropertyArgs[] = [];
          const parentId = widget.parentId;

          if (parentId) {
            const parentWidget = widgets[parentId];

            // we want to proceed only if the parent is a zone widget and has no children
            if (
              parentWidget.children?.length === 0 &&
              parentWidget.type === "ZONE_WIDGET"
            ) {
              updates.push({
                widgetId: parentId,
                propertyName: "elevatedBackground",
                propertyValue: false,
              });
            }
          }

          return updates;
        },
      },
    ],
  },
};
