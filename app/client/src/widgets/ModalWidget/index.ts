import Widget from "./widget";
import IconSVG from "./icon.svg";
import { WidgetProps } from "widgets/BaseWidget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Modal",
  iconSVG: IconSVG,
  defaults: {
    rows: 6,
    columns: 6,
    size: "MODAL_SMALL",
    canEscapeKeyClose: true,
    // detachFromLayout is set true for widgets that are not bound to the widgets within the layout.
    // setting it to true will only render the widgets(from sidebar) on the main container without any collision check.
    detachFromLayout: true,
    canOutsideClickClose: true,
    shouldScrollContents: true,
    widgetName: "Modal",
    children: [],
    version: 1,
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
                  position: { left: 14, top: 0 },
                  size: { rows: 1, cols: 2 },
                  props: {
                    iconName: "cross",
                    iconSize: 24,
                    color: "#040627",
                    version: 1,
                  },
                },
                {
                  type: "TEXT_WIDGET",
                  position: { left: 0, top: 0 },
                  size: { rows: 1, cols: 10 },
                  props: {
                    text: "Modal Title",
                    textStyle: "HEADING",
                    version: 1,
                  },
                },
                {
                  type: "BUTTON_WIDGET",
                  position: { left: 9, top: 4 },
                  size: { rows: 1, cols: 3 },
                  props: {
                    text: "Cancel",
                    buttonStyle: "SECONDARY_BUTTON",
                    version: 1,
                  },
                },
                {
                  type: "BUTTON_WIDGET",
                  position: { left: 12, top: 4 },
                  size: { rows: 1, cols: 4 },
                  props: {
                    text: "Confirm",
                    buttonStyle: "PRIMARY_BUTTON",
                    version: 1,
                  },
                },
              ],
              operations: [
                {
                  type: "MODIFY_PROPS",
                  fn: (
                    widget: WidgetProps & { children?: WidgetProps[] },
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
              ],
            },
          },
        },
      ],
    },
  },
  properties: {
    validations: Widget.getPropertyValidationMap(),
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
