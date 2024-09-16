import { ContainerWidget } from "widgets/ContainerWidget/widget";
import { ValidationTypes } from "constants/WidgetValidation";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import {
  FlexVerticalAlignment,
  Positioning,
} from "layoutSystems/common/utils/constants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import { ButtonVariantTypes } from "components/constants";
import { Colors } from "constants/Colors";
import {
  FlexLayerAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import { GridDefaults, WIDGET_TAGS } from "constants/WidgetConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { BlueprintOperationTypes } from "WidgetProvider/constants";
import get from "lodash/get";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { DynamicHeight } from "utils/WidgetFeatures";
import { getWidgetBluePrintUpdates } from "utils/WidgetBlueprintUtils";
import type { FlexLayer } from "layoutSystems/autolayout/utils/types";
import type { LayoutProps } from "layoutSystems/anvil/utils/anvilTypes";
import { statBoxPreset } from "layoutSystems/anvil/layoutComponents/presets/StatboxPreset";
import { LayoutSystemTypes } from "layoutSystems/types";

class StatboxWidget extends ContainerWidget {
  static type = "STATBOX_WIDGET";

  static getConfig() {
    return {
      name: "Stats Box",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.DISPLAY],
      needsMeta: true,
      searchTags: ["statbox"],
      isCanvas: true,
    };
  }

  static getFeatures() {
    return {
      dynamicHeight: {
        sectionIndex: 0,
        active: true,
      },
    };
  }

  static getMethods() {
    return {
      getCanvasHeightOffset: (props: WidgetProps): number => {
        const offset =
          props.borderWidth && props.borderWidth > 1
            ? Math.ceil(
                (2 * parseInt(props.borderWidth, 10) || 0) /
                  GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
              )
            : 0;

        return offset;
      },
    };
  }

  static getDefaults() {
    return {
      rows: 14,
      columns: 22,
      animateLoading: true,
      widgetName: "Statbox",
      backgroundColor: "white",
      borderWidth: "1",
      borderColor: Colors.GREY_5,
      children: [],
      positioning: Positioning.Fixed,
      responsiveBehavior: ResponsiveBehavior.Fill,
      flexVerticalAlignment: FlexVerticalAlignment.Stretch,
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
              layoutSystemType: LayoutSystemTypes,
            ) => {
              if (layoutSystemType === LayoutSystemTypes.FIXED) {
                return [];
              }
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

              const layout: LayoutProps[] = statBoxPreset(
                textWidgets[0].widgetId,
                textWidgets[1].widgetId,
                textWidgets[2].widgetId,
                iconWidget.widgetId,
              );

              //create properties to be updated
              return getWidgetBluePrintUpdates({
                [widget.widgetId]: {
                  dynamicHeight: DynamicHeight.AUTO_HEIGHT,
                },
                [canvasWidget.widgetId]: {
                  flexLayers,
                  useAutoLayout: true,
                  positioning: Positioning.Vertical,
                  layout,
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
    };
  }

  static getAutoLayoutConfig() {
    return {
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "280px",
              minHeight: "50px",
            };
          },
        },
      ],
      disableResizeHandles: {
        vertical: true,
      },
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: { base: "50px" },
        minWidth: { base: "280px" },
      },
    };
  }

  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "isVisible",
            helpText: "Controls the visibility of the widget",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "shouldScrollContents",
            helpText: "Enables scrolling for content inside the widget",
            label: "Scroll contents",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "animateLoading",
            label: "Animate loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
    ];
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
      },
    };
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "Color",
        children: [
          {
            propertyName: "backgroundColor",
            helpText: "Use a html color name, HEX, RGB or RGBA value",
            placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
            label: "Background color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "borderColor",
            helpText: "Use a html color name, HEX, RGB or RGBA value",
            placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
            label: "Border color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Border and shadow",
        children: [
          {
            propertyName: "borderWidth",
            helpText: "Enter value for border width",
            label: "Border width",
            placeholderText: "Enter value in px",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
            postUpdateAction: ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
          },
          {
            propertyName: "borderRadius",
            label: "Border radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "boxShadow",
            label: "Box shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
    ];
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc": "Show and highlight stats from your data sources",
      "!url": "https://docs.appsmith.com/widget-reference/stat-box",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return { positioning: Positioning.Fixed };
  }
}

export interface StatboxWidgetProps {
  backgroundColor: string;
}

export default StatboxWidget;
