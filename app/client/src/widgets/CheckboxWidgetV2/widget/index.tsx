import React from "react";
import { Checkbox } from "@design-system/widgets";
import type { SetterConfig } from "entities/AppTheming";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import * as config from "./../config";
import BaseWidget from "../../BaseWidget";
import type { WidgetState } from "../../BaseWidget";
import type { CheckboxWidgetProps } from "./types";

class CheckboxWidget extends BaseWidget<CheckboxWidgetProps, WidgetState> {
  static type = "CHECKBOX_WIDGET_V2";

  static getConfig() {
    return config.metaConfig;
  }

  static getFeatures() {
    return config.featuresConfig;
  }

  static getDefaults() {
    return config.defaultsConfig;
  }

  static getMethods() {
    return config.methodsConfig;
  }

  static getAutoLayoutConfig() {
    return config.autoLayoutConfig;
  }

  static getAutocompleteDefinitions() {
    return {
      "!doc":
        "Checkbox is a simple UI widget you can use when you want users to make a binary choice",
      "!url": "https://docs.appsmith.com/widget-reference/checkbox",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      isChecked: "bool",
      isDisabled: "bool",
    };
  }

  static getPropertyPaneContentConfig() {
    return config.propertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return [];
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      isChecked: "defaultCheckedState",
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      value: `{{!!this.isChecked}}`,
      isValid: `{{ this.isRequired ? !!this.isChecked : true }}`,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      isChecked: undefined,
      isDirty: false,
    };
  }

  static getSetterConfig(): SetterConfig {
    return config.settersConfig;
  }

  componentDidUpdate(prevProps: CheckboxWidgetProps) {
    if (
      this.props.defaultCheckedState !== prevProps.defaultCheckedState &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  }

  onChange = (isChecked: boolean) => {
    if (!this.props.isDirty) {
      this.props.updateWidgetMetaProperty("isDirty", true);
    }

    this.props.updateWidgetMetaProperty("isChecked", isChecked, {
      triggerPropertyName: "onCheckChange",
      dynamicString: this.props.onCheckChange,
      event: {
        type: EventType.ON_CHECK_CHANGE,
      },
    });
  };

  getWidgetView() {
    return (
      <Checkbox
        id={this.props.widgetId}
        isDisabled={this.props.isDisabled}
        isRequired={this.props.isRequired}
        isSelected={!!this.props.isChecked}
        key={this.props.widgetId}
        labelPosition={this.props.labelPosition}
        onChange={this.onChange}
      >
        {this.props.label}
      </Checkbox>
    );
  }
}

export { CheckboxWidget };
