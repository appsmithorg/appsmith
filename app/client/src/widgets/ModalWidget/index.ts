import { IconNames } from "@blueprintjs/icons";
import { Colors } from "constants/Colors";
import {
  ButtonBorderRadiusTypes,
  ButtonVariantTypes,
} from "components/constants";
import { GridDefaults } from "constants/WidgetConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import type { FlattenedWidgetProps } from "widgets/constants";
import { BlueprintOperationTypes } from "widgets/constants";

import IconSVG from "./icon.svg";
import Widget from "./widget";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { get } from "lodash";
import type { FlexLayer } from "utils/autoLayout/autoLayoutTypes";
import {
  FlexLayerAlignment,
  Positioning,
  ResponsiveBehavior,
} from "utils/autoLayout/constants";
import { getWidgetBluePrintUpdates } from "utils/WidgetBlueprintUtils";
import { DynamicHeight } from "utils/WidgetFeatures";
import WidgetFactory from "utils/WidgetFactory";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Modal",
  iconSVG: IconSVG,
  needsMeta: true,
  isCanvas: true,
  features: {
    dynamicHeight: {
      sectionIndex: 0,
      active: true,
    },
  },
  searchTags: ["dialog", "popup", "notification"],
  defaults: {
    rows: 24,
    columns: 24,
    width: 456,
    height: GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 24,
    minDynamicHeight: 24,
    canEscapeKeyClose: true,
    animateLoading: true,
    // detachFromLayout is set true for widgets that are not bound to the widgets within the layout.
    // setting it to true will only render the widgets(from sidebar) on the main container without any collision check.
    detachFromLayout: true,
    canOutsideClickClose: true,
    shouldScrollContents: true,
    widgetName: "Modal",
    children: [],
    version: 2,
    blueprint: {
      view: [
        {
          type: "CANVAS_WIDGET",
          position: { left: 0, top: 0 },
          props: {
            detachFromLayout: true,
            canExtend: true,
            isVisible: true,
            isDisabled: false,
            shouldScrollContents: false,
            children: [],
            version: 1,
            blueprint: {
              view: [
                {
                  type: "ICON_BUTTON_WIDGET",
                  position: { left: 58, top: 0 },
                  size: {
                    rows: 4,
                    cols: 6,
                  },
                  props: {
                    buttonColor: Colors.GREY_7,
                    buttonVariant: ButtonVariantTypes.TERTIARY,
                    borderRadius: ButtonBorderRadiusTypes.SHARP,
                    iconName: IconNames.CROSS,
                    iconSize: 24,
                    version: 1,
                  },
                },
                {
                  type: "TEXT_WIDGET",
                  position: { left: 1, top: 1 },
                  size: {
                    rows: 4,
                    cols: 40,
                  },
                  props: {
                    text: "Modal Title",
                    fontSize: "1.25rem",
                    version: 1,
                  },
                },
                {
                  type: "BUTTON_WIDGET",
                  position: {
                    left: 31,
                    top: 18,
                  },
                  size: {
                    rows: 4,
                    cols: 16,
                  },
                  props: {
                    text: "Close",
                    buttonStyle: "PRIMARY",
                    buttonVariant: ButtonVariantTypes.SECONDARY,
                    version: 1,
                  },
                },
                {
                  type: "BUTTON_WIDGET",
                  position: {
                    left: 47,
                    top: 18,
                  },
                  size: {
                    rows: 4,
                    cols: 16,
                  },
                  props: {
                    text: "Confirm",
                    buttonStyle: "PRIMARY_BUTTON",
                    version: 1,
                  },
                },
              ],
              operations: [
                {
                  type: BlueprintOperationTypes.MODIFY_PROPS,
                  fn: (
                    widget: WidgetProps & { children?: WidgetProps[] },
                    widgets: { [widgetId: string]: FlattenedWidgetProps },
                    parent?: WidgetProps & { children?: WidgetProps[] },
                  ) => {
                    const iconChild =
                      widget.children &&
                      widget.children.find(
                        (child) => child.type === "ICON_BUTTON_WIDGET",
                      );

                    if (iconChild && parent) {
                      return [
                        {
                          widgetId: iconChild.widgetId,
                          propertyName: "onClick",
                          propertyValue: `{{closeModal('${parent.widgetName}')}}`,
                        },
                      ];
                    }
                  },
                },
                {
                  type: BlueprintOperationTypes.MODIFY_PROPS,
                  fn: (
                    widget: WidgetProps & { children?: WidgetProps[] },
                    widgets: { [widgetId: string]: FlattenedWidgetProps },
                    parent?: WidgetProps & { children?: WidgetProps[] },
                  ) => {
                    const cancelBtnChild =
                      widget.children &&
                      widget.children.find(
                        (child) =>
                          child.type === "BUTTON_WIDGET" &&
                          child.text === "Close",
                      );

                    if (cancelBtnChild && parent) {
                      return [
                        {
                          widgetId: cancelBtnChild.widgetId,
                          propertyName: "onClick",
                          propertyValue: `{{closeModal('${parent.widgetName}')}}`,
                        },
                      ];
                    }
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

            //get all the Icon button Widgets
            const iconWidget = children.filter(
              (child) => child.type === "ICON_BUTTON_WIDGET",
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
                  {
                    id: iconWidget.widgetId,
                    align: FlexLayerAlignment.End,
                  },
                ],
              },
              {
                children: [
                  {
                    id: buttonWidget1.widgetId,
                    align: FlexLayerAlignment.End,
                  },
                  {
                    id: buttonWidget2.widgetId,
                    align: FlexLayerAlignment.End,
                  },
                ],
              },
            ];

            //Add widget specific property Defaults, for autoLayout widget
            const { disabledPropsDefaults } =
              WidgetFactory.getWidgetAutoLayoutConfig("MODAL_WIDGET") || {};

            //create properties to be updated
            return getWidgetBluePrintUpdates({
              [widget.widgetId]: {
                dynamicHeight: DynamicHeight.AUTO_HEIGHT,
                height: 100,
                ...disabledPropsDefaults,
              },
              [canvasWidget.widgetId]: {
                flexLayers,
                useAutoLayout: true,
                positioning: Positioning.Vertical,
                bottomRow: 100,
              },
              [textWidget.widgetId]: {
                responsiveBehavior: ResponsiveBehavior.Fill,
                alignment: FlexLayerAlignment.Start,
                topRow: 0,
                bottomRow: 4,
                leftColumn: 0,
                rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS - 4,
              },
              [iconWidget.widgetId]: {
                responsiveBehavior: ResponsiveBehavior.Hug,
                alignment: FlexLayerAlignment.End,
                topRow: 0,
                bottomRow: 4,
                leftColumn: GridDefaults.DEFAULT_GRID_COLUMNS - 4,
                rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS,
              },
              [buttonWidget1.widgetId]: {
                responsiveBehavior: ResponsiveBehavior.Hug,
                alignment: FlexLayerAlignment.End,
                topRow: 4,
                bottomRow: 8,
                leftColumn: GridDefaults.DEFAULT_GRID_COLUMNS - 2 * 16,
                rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS - 16,
              },
              [buttonWidget2.widgetId]: {
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
  autoLayout: {
    disabledPropsDefaults: {
      minDynamicHeight: 8,
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
};

export default Widget;
