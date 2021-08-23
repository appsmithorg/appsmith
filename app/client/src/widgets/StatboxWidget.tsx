import { WidgetType } from "constants/WidgetConstants";
import { WidgetProps } from "./BaseWidget";
import ContainerWidget from "widgets/ContainerWidget";
import { ContainerComponentProps } from "components/designSystems/appsmith/ContainerComponent";
import * as Sentry from "@sentry/react";
import withMeta from "./MetaHOC";
import { ValidationTypes } from "constants/WidgetValidation";

class StatboxWidget extends ContainerWidget {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "shouldScrollContents",
            label: "Scroll Contents",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "backgroundColor",
            label: "Background Color",
            helpText: "Use a html color name, HEX, RGB or RGBA value",
            placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
            controlType: "COLOR_PICKER",
            isBindProperty: true,
            isJSConvertible: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
    ];
  }

  renderChildWidget(childWidgetData: WidgetProps): React.ReactNode {
    if (childWidgetData.children) {
      childWidgetData.children.forEach((grandChild: WidgetProps) => {
        if (grandChild.type === "ICON_BUTTON_WIDGET" && !!grandChild.onClick) {
          grandChild.boxShadow = "VARIANT1";
        }
      });
    }
    return super.renderChildWidget(childWidgetData);
  }

  getWidgetType(): WidgetType {
    return "STATBOX_WIDGET";
  }
}

export interface StatboxWidgetProps extends ContainerComponentProps {
  backgroundColor: string;
}

export default StatboxWidget;
export const ProfiledStatboxWidget = Sentry.withProfiler(
  withMeta(StatboxWidget),
);
