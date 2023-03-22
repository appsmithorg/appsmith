import { ButtonVariantTypes } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { klona as clone } from "klona/full";
import { get } from "lodash";
import type { WidgetProps } from "widgets/BaseWidget";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { BlueprintOperationTypes } from "widgets/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
import type { ButtonGroupWidgetProps } from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Button Group", // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: false, // Defines if this widget adds any meta properties
  isCanvas: false, // Defines if this widget has a canvas within in which we can drop other widgets
  searchTags: ["click", "submit"],
  defaults: {
    rows: 4,
    columns: 24,
    widgetName: "ButtonGroup",
    orientation: "horizontal",
    buttonVariant: ButtonVariantTypes.PRIMARY,
    isVisible: true,
    version: 1,
    animateLoading: true,
    responsiveBehavior: ResponsiveBehavior.Fill,
    minWidth: FILL_WIDGET_MIN_WIDTH,
    groupButtons: {
      groupButton1: {
        label: "Favorite",
        iconName: "heart",
        id: "groupButton1",
        widgetId: "",
        buttonType: "SIMPLE",
        placement: "CENTER",
        isVisible: true,
        isDisabled: false,
        index: 0,
        menuItems: {},
      },
      groupButton2: {
        label: "Add",
        iconName: "add",
        id: "groupButton2",
        buttonType: "SIMPLE",
        placement: "CENTER",
        widgetId: "",
        isVisible: true,
        isDisabled: false,
        index: 1,
        menuItems: {},
      },
      groupButton3: {
        label: "More",
        iconName: "more",
        id: "groupButton3",
        buttonType: "MENU",
        placement: "CENTER",
        widgetId: "",
        isVisible: true,
        isDisabled: false,
        index: 2,
        menuItems: {
          menuItem1: {
            label: "First Option",
            backgroundColor: "#FFFFFF",
            id: "menuItem1",
            widgetId: "",
            onClick: "",
            isVisible: true,
            isDisabled: false,
            index: 0,
          },
          menuItem2: {
            label: "Second Option",
            backgroundColor: "#FFFFFF",
            id: "menuItem2",
            widgetId: "",
            onClick: "",
            isVisible: true,
            isDisabled: false,
            index: 1,
          },
          menuItem3: {
            label: "Delete",
            iconName: "trash",
            iconColor: "#FFFFFF",
            iconAlign: "right",
            textColor: "#FFFFFF",
            backgroundColor: "#DD4B34",
            id: "menuItem3",
            widgetId: "",
            onClick: "",
            isVisible: true,
            isDisabled: false,
            index: 2,
          },
        },
      },
    },
    blueprint: {
      operations: [
        {
          type: BlueprintOperationTypes.MODIFY_PROPS,
          fn: (widget: WidgetProps & { children?: WidgetProps[] }) => {
            const groupButtons = clone(widget.groupButtons);
            const dynamicBindingPathList: any[] = get(
              widget,
              "dynamicBindingPathList",
              [],
            );

            Object.keys(groupButtons).map((groupButtonKey) => {
              groupButtons[groupButtonKey].buttonColor = get(
                widget,
                "childStylesheet.button.buttonColor",
                "{{appsmith.theme.colors.primaryColor}}",
              );

              dynamicBindingPathList.push({
                key: `groupButtons.${groupButtonKey}.buttonColor`,
              });
            });

            const updatePropertyMap = [
              {
                widgetId: widget.widgetId,
                propertyName: "dynamicBindingPathList",
                propertyValue: dynamicBindingPathList,
              },
              {
                widgetId: widget.widgetId,
                propertyName: "groupButtons",
                propertyValue: groupButtons,
              },
            ];

            return updatePropertyMap;
          },
        },
      ],
    },
  },
  autoLayout: {
    autoDimension: {
      height: true,
    },
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: (props: ButtonGroupWidgetProps) => {
          let minWidth = 120;
          const buttonLength = Object.keys(props.groupButtons).length;
          if (props.orientation === "horizontal") {
            // 120 is the width of the button, 8 is widget padding, 1 is the gap between buttons
            minWidth = 120 * buttonLength + 8 + (buttonLength - 1) * 1;
          }
          return {
            minWidth: `${minWidth}px`,
          };
        },
      },
    ],
    disableResizeHandles: {
      vertical: true,
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
