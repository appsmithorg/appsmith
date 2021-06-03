import * as React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import LineSeparatorComponent from "components/designSystems/blueprint/LineSeparatorComponent";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import * as Sentry from "@sentry/react";

class LineSeparatorWidget extends BaseWidget<
  LineSeparatorWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
          {
            helpText: "Controls orientation of Line",
            propertyName: "orientation",
            label: "Orientation",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Horizontal",
                value: "horizontal",
              },
              {
                label: "Vertical",
                value: "vertical",
              },
            ],
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.TEXT,
          },
        ],
      },
    ];
  }

  getPageView() {
    return (
      <LineSeparatorComponent
        orientation={this.props.orientation}
        widgetId={this.props.widgetId}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "LINE_SEPARATOR_WIDGET";
  }
}

export interface LineSeparatorWidgetProps extends WidgetProps {
  orientation: "horizontal" | "vertical";
}

export default LineSeparatorWidget;
export const ProfiledLineSeparatorWidget = Sentry.withProfiler(
  LineSeparatorWidget,
);
