import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { DerivedPropertiesMap } from "utils/WidgetFactory";

import SpacingComponent from "../component";
import { ValidationTypes } from "constants/WidgetValidation";

class SpacingWidget extends BaseWidget<
  WidgetProps /*SpacingWidgetProps*/,
  WidgetState
> {
  static getPropertyPaneContentConfig() {
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
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  getPageView() {
    return <SpacingComponent />;
  }

  getCanvasView() {
    if (this.props.isPreviewMode) return this.getPageView();
    return (
      <SpacingComponent
        fill
        value={
          this.props.orientation === "vertical"
            ? this.props.bottomRow - this.props.topRow
            : this.props.rightColumn - this.props.leftColumn
        }
      />
    );
  }

  static getWidgetType(): string {
    return "SPACING_WIDGET";
  }
}

//export interface SpacingWidgetProps extends WidgetProps {}

export default SpacingWidget;
