import { WidgetType } from "constants/WidgetConstants";
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

  getWidgetType(): WidgetType {
    return "STATBOX_WIDGET";
  }
}

export interface StatboxWidgetProps extends ContainerComponentProps {
  name: string;
}

export default StatboxWidget;
export const ProfiledStatboxWidget = Sentry.withProfiler(
  withMeta(StatboxWidget),
);
