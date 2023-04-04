import { ButtonVariantTypes } from "components/constants";
import { Colors } from "constants/Colors";
import {
  FlexLayerAlignment,
  Positioning,
  ResponsiveBehavior,
} from "utils/autoLayout/constants";
import { GridDefaults } from "constants/WidgetConstants";
import type { WidgetProps } from "widgets/BaseWidget";

import IconSVG from "./icon.svg";
import Widget from "./widget";
import type { FlattenedWidgetProps } from "widgets/constants";
import { BlueprintOperationTypes } from "widgets/constants";
import get from "lodash/get";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { FlexLayer } from "utils/autoLayout/autoLayoutTypes";
import { DynamicHeight } from "utils/WidgetFeatures";
import { getWidgetBluePrintUpdates } from "utils/WidgetBlueprintUtils";

export const CONFIG = {
  features: {
    dynamicHeight: {
      sectionIndex: 0,
      active: true,
    },
  },
  type: Widget.getWidgetType(),
  name: "Stats Box",
  iconSVG: IconSVG,
  needsMeta: true,
  isCanvas: true,
  canvasHeightOffset: (props: WidgetProps): number => {
    const offset =
      props.borderWidth && props.borderWidth > 1
        ? Math.ceil(
            (2 * parseInt(props.borderWidth, 10) || 0) /
              GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
          )
        : 0;

    return offset;
  },
  defaults: {
    rows: 14,
    columns: 22,
    animateLoading: true,
    widgetName: "Statbox",
    backgroundColor: "white",
    borderWidth: "1",
    borderColor: Colors.GREY_5,
    minDynamicHeight: 14,
    children: [],
    positioning: Positioning.Fixed,
    responsiveBehavior: ResponsiveBehavior.Fill,
    blueprint: {
      view: [
        {
          type: "CANVAS_WIDGET",
          position: { top: 0, left: 0 },
          props: {
            containerStyle: "none",
            canExtend: false,
            detachFromLayout: true,
            children: [],
            version: 1,
            blueprint: {
              view: [
                {
                  type: "TEXT_WIDGET",
                  size: {
                    rows: 4,
                    cols: 36,
                  },
                  position: { top: 0, left: 1 },
                  props: {
                    text: "Page Views",
                    fontSize: "0.875rem",
                    textColor: "#999999",
                    version: 1,
                  },
                },
                {
                  type: "TEXT_WIDGET",
                  size: {
                    rows: 4,
                    cols: 36,
                  },
                  position: {
                    top: 4,
                    left: 1,
                  },
                  props: {
                    text: "2.6 M",
                    fontSize: "1.25rem",
                    fontStyle: "BOLD",
                    version: 1,
                  },
                },
                {
                  type: "ICON_BUTTON_WIDGET",
                  size: {
                    rows: 8,
                    cols: 16,
                  },
                  position: {
                    top: 2,
                    left: 46,
                  },
                  props: {
                    iconName: "arrow-top-right",
                    buttonStyle: "PRIMARY",
                    buttonVariant: ButtonVariantTypes.PRIMARY,
                    version: 1,
                  },
                },
                {
                  type: "TEXT_WIDGET",
                  size: {
                    rows: 4,
                    cols: 36,
                  },
                  position: {
                    top: 8,
                    left: 1,
                  },
                  props: {
                    text: "21% more than last month",
                    fontSize: "0.875rem",
                    textColor: Colors.GREEN,
                    version: 1,
                  },
                },
              ],
            },
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
            isAutoLayout: boolean,
          ) => {
            if (!isAutoLayout) return [];

            //get Canvas Widget
            const canvasWidget: FlattenedWidgetProps = get(
              widget,
              "children.0",
            );

            //get Children Ids of the StatBox
            const childrenIds: string[] = get(widget, "children.0.children");

            //get Children props of the StatBox
            const children: FlattenedWidgetProps[] = childrenIds.map(
              (childId) => widgets[childId],
            );

            //get the Text Widgets
            const textWidgets = children.filter(
              (child) => child.type === "TEXT_WIDGET",
            );

            //get all the Icon button Widgets
            const iconWidget = children.filter(
              (child) => child.type === "ICON_BUTTON_WIDGET",
            )?.[0];

            //Create flex layer object based on the children
            const flexLayers: FlexLayer[] = [
              {
                children: [
                  {
                    id: textWidgets[0].widgetId,
                    align: FlexLayerAlignment.Start,
                  },
                ],
              },
              {
                children: [
                  {
                    id: textWidgets[1].widgetId,
                    align: FlexLayerAlignment.Start,
                  },
                  {
                    id: iconWidget.widgetId,
                    align: FlexLayerAlignment.End,
                  },
                ],
              },
              {
                children: [
                  {
                    id: textWidgets[2].widgetId,
                    align: FlexLayerAlignment.Start,
                  },
                ],
              },
            ];

            //create properties to be updated
            return getWidgetBluePrintUpdates({
              [widget.widgetId]: {
                dynamicHeight: DynamicHeight.AUTO_HEIGHT,
              },
              [canvasWidget.widgetId]: {
                flexLayers,
                useAutoLayout: true,
                positioning: Positioning.Vertical,
              },
              [textWidgets[0].widgetId]: {
                responsiveBehavior: ResponsiveBehavior.Fill,
                alignment: FlexLayerAlignment.Start,
                rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS,
              },
              [textWidgets[1].widgetId]: {
                responsiveBehavior: ResponsiveBehavior.Fill,
                alignment: FlexLayerAlignment.Start,
                rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS - 16,
              },
              [textWidgets[2].widgetId]: {
                responsiveBehavior: ResponsiveBehavior.Fill,
                alignment: FlexLayerAlignment.Start,
                rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS,
              },
              [iconWidget.widgetId]: {
                responsiveBehavior: ResponsiveBehavior.Hug,
                alignment: FlexLayerAlignment.End,
                topRow: 4,
                bottomRow: 8,
                leftColumn: GridDefaults.DEFAULT_GRID_COLUMNS - 16,
                rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS,
              },
            });
          },
        },
      ],
    },
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
  },
  autoLayout: {
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: () => {
          return {
            minWidth: "280px",
            minHeight: "300px",
          };
        },
      },
    ],
    disableResizeHandles: {
      vertical: true,
    },
  },
};

export default Widget;
