import { ButtonVariantTypes, RecaptchaTypes } from "components/constants";
import { Colors } from "constants/Colors";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { GridDefaults } from "constants/WidgetConstants";
import get from "lodash/get";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { FlexLayer } from "utils/autoLayout/autoLayoutTypes";
import {
  FlexLayerAlignment,
  Positioning,
  ResponsiveBehavior,
} from "utils/autoLayout/constants";
import { getWidgetBluePrintUpdates } from "utils/WidgetBlueprintUtils";
import { DynamicHeight } from "utils/WidgetFeatures";
import type { WidgetProps } from "widgets/BaseWidget";
import { BlueprintOperationTypes } from "widgets/constants";
import type { FlattenedWidgetProps } from "widgets/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Form",
  iconSVG: IconSVG,
  needsMeta: true,
  isCanvas: true,
  features: {
    dynamicHeight: {
      sectionIndex: 0,
      active: true,
    },
  },
  canvasHeightOffset: (props: WidgetProps): number => {
    const offset =
      props.borderWidth && props.borderWidth > 1
        ? Math.round(
            (2 * parseInt(props.borderWidth, 10) || 0) /
              GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
          )
        : 0;

    return offset;
  },
  searchTags: ["group"],
  defaults: {
    rows: 40,
    columns: 24,
    borderColor: Colors.GREY_5,
    borderWidth: "1",
    animateLoading: true,
    widgetName: "Form",
    backgroundColor: Colors.WHITE,
    children: [],
    positioning: Positioning.Fixed,
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
                    cols: 24,
                  },
                  position: { top: 1, left: 1.5 },
                  props: {
                    text: "Form",
                    fontSize: "1.25rem",
                    version: 1,
                  },
                },
                {
                  type: "BUTTON_WIDGET",
                  size: {
                    rows: 4,
                    cols: 16,
                  },
                  position: {
                    top: 33,
                    left: 46,
                  },
                  props: {
                    text: "Submit",
                    buttonVariant: ButtonVariantTypes.PRIMARY,
                    disabledWhenInvalid: true,
                    resetFormOnClick: true,
                    recaptchaType: RecaptchaTypes.V3,
                    version: 1,
                  },
                },
                {
                  type: "BUTTON_WIDGET",
                  size: {
                    rows: 4,
                    cols: 16,
                  },
                  position: {
                    top: 33,
                    left: 30,
                  },
                  props: {
                    text: "Reset",
                    buttonVariant: ButtonVariantTypes.SECONDARY,
                    disabledWhenInvalid: false,
                    resetFormOnClick: true,
                    recaptchaType: RecaptchaTypes.V3,
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
            const textWidget = children.filter(
              (child) => child.type === "TEXT_WIDGET",
            )?.[0];

            const [buttonWidget1, buttonWidget2] = children.filter(
              (child) => child.type === "BUTTON_WIDGET",
            );

            //Create flex layer object based on the children
            const flexLayers: FlexLayer[] = [
              {
                children: [
                  {
                    id: textWidget.widgetId,
                    align: FlexLayerAlignment.Start,
                  },
                ],
              },
              {
                children: [
                  {
                    id: buttonWidget2.widgetId,
                    align: FlexLayerAlignment.End,
                  },
                  {
                    id: buttonWidget1.widgetId,
                    align: FlexLayerAlignment.End,
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
              [textWidget.widgetId]: {
                responsiveBehavior: ResponsiveBehavior.Fill,
                alignment: FlexLayerAlignment.Start,
                topRow: 0,
                bottomRow: 4,
                leftColumn: 0,
                rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS,
              },
              [buttonWidget2.widgetId]: {
                responsiveBehavior: ResponsiveBehavior.Hug,
                alignment: FlexLayerAlignment.End,
                topRow: 4,
                bottomRow: 8,
                leftColumn: GridDefaults.DEFAULT_GRID_COLUMNS - 2 * 16,
                rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS - 16,
              },
              [buttonWidget1.widgetId]: {
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
    responsiveBehavior: ResponsiveBehavior.Fill,
    minWidth: FILL_WIDGET_MIN_WIDTH,
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
