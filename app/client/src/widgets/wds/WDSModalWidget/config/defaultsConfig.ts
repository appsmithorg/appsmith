import type { WidgetDefaultProps } from "WidgetProvider/constants";
import {
  BlueprintOperationTypes,
  type FlattenedWidgetProps,
} from "WidgetProvider/constants";
import { modalPreset } from "layoutSystems/anvil/layoutComponents/presets/ModalPreset";
import type { LayoutProps } from "layoutSystems/anvil/utils/anvilTypes";
import { LayoutSystemTypes } from "layoutSystems/types";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { getWidgetBluePrintUpdates } from "utils/WidgetBlueprintUtils";

export const defaultsConfig = {
  detachFromLayout: true,
  children: [],
  widgetName: "Modal",
  version: 1,
  isVisible: false,
  showFooter: true,
  showHeader: true,
  size: "medium",
  title: "Modal Title",
  showSubmitButton: true,
  closeOnSubmit: true,
  submitButtonText: "Save Changes",
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

          const layout: LayoutProps[] = modalPreset();

          return getWidgetBluePrintUpdates({
            [widget.widgetId]: {
              layout,
            },
          });
        },
      },
    ],
  },
} as unknown as WidgetDefaultProps;
