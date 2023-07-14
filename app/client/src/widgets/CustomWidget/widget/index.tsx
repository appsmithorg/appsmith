import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import React from "react";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import CustomComponent from "../component";

interface CustomWidgetProp extends WidgetProps {
  test?: string;
}

class CustomWidget extends BaseWidget<CustomWidgetProp, WidgetState> {
  static getPropertyPaneContentConfig() {
    return [];
  }

  static getPropertyPaneStyleConfig() {
    return [];
  }

  execute = (data: any) => {
    super.executeAction({
      triggerPropertyName: data.eventName,
      dynamicString: data.eventString,
      event: {
        type: EventType.ON_SUBMIT,
      },
    });
  };

  update = (data: any) => {
    Object.entries(data).forEach(([path, value]) => {
      this.props.updateWidgetMetaProperty(path, value);
    });
  };

  getPageView() {
    return (
      <CustomComponent
        execute={this.execute}
        update={this.update}
        {...this.props}
      />
    );
  }

  static getWidgetType(): string {
    return "CUSTOM_WIDGET";
  }
}

export default CustomWidget;
