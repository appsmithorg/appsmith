import { ButtonVariantTypes } from "components/constants";
import { GridDefaults } from "constants/WidgetConstants";
import { WidgetProps } from "widgets/BaseWidget";
import {
  BlueprintOperationTypes,
  FlattenedWidgetProps,
} from "widgets/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Modal",
  iconSVG: IconSVG,
  needsMeta: true,
  isCanvas: true,
  defaults: {
    rows: 24,
    columns: 24,
    width: 456,
    height: GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 24,
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
                  type: "ICON_WIDGET",
                  position: { left: 56, top: 1 },
                  size: {
                    rows: 4,
                    cols: 8,
                  },
                  props: {
                    iconName: "cross",
                    iconSize: 24,
                    color: "#040627",
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
                    fontSize: "HEADING1",
                    version: 1,
                  },
                },
                {
                  type: "BUTTON_WIDGET",
                  position: {
                    left: 36,
                    top: 16,
                  },
                  size: {
                    rows: 4,
                    cols: 12,
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
                    left: 48,
                    top: 16,
                  },
                  size: {
                    rows: 4,
                    cols: 12,
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
                        (child) => child.type === "ICON_WIDGET",
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
    },
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
