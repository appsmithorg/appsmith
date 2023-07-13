import { ValidationTypes } from "constants/WidgetValidation";
import React from "react";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import CustomComponent from "../component";

interface CustomWidgetProp extends WidgetProps {
  test?: string;
}

class CustomWidget extends BaseWidget<CustomWidgetProp, WidgetState> {
  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            propertyName: "componentLink",
            helpText: "The URL of the components",
            label: "URL",
            controlType: "INPUT_TEXT",
            placeholderText: "https://docs.appsmith.com",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.SAFE_URL,
            },
          },
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [];
  }

  getPageView() {
    return <CustomComponent widgetId={"test"} />;
  }

  static getWidgetType(): string {
    return "CUSTOM_WIDGET";
  }
}

export default CustomWidget;
