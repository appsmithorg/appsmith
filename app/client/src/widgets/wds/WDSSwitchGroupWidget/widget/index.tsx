import React from "react";
import type { SetterConfig } from "entities/AppTheming";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { xor } from "lodash";
import BaseWidget from "widgets/BaseWidget";
import type { SwitchGroupWidgetProps, OptionProps } from "./types";
import type { WidgetState } from "widgets/BaseWidget";
import type { AnvilConfig } from "WidgetProvider/constants";
import { SwitchGroupComponent } from "../component";
import {
  anvilConfig,
  autocompleteConfig,
  defaultsConfig,
  featuresConfig,
  metaConfig,
  propertyPaneContentConfig,
  propertyPaneStyleConfig,
  settersConfig,
} from "./../config";

class WDSSwitchGroupWidget extends BaseWidget<
  SwitchGroupWidgetProps,
  WidgetState
> {
  static type = "WDS_SWITCH_GROUP_WIDGET";

  static getConfig() {
    return metaConfig;
  }

  static getFeatures() {
    return featuresConfig;
  }

  static getDefaults() {
    return defaultsConfig;
  }

  static getAutoLayoutConfig() {
    return {};
  }

  static getAnvilConfig(): AnvilConfig | null {
    return anvilConfig;
  }

  static getAutocompleteDefinitions() {
    return autocompleteConfig;
  }

  static getSetterConfig(): SetterConfig {
    return settersConfig;
  }

  static getPropertyPaneContentConfig() {
    return propertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return propertyPaneStyleConfig;
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedValues: "defaultSelectedValues",
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      value: `{{this.selectedValues}}`,
      isValid: `{{ this.isRequired ? !!this.selectedValues.length : true }}`,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedValues: undefined,
      isDirty: false,
    };
  }

  componentDidUpdate(prevProps: SwitchGroupWidgetProps) {
    if (
      xor(this.props.defaultSelectedValues, prevProps.defaultSelectedValues)
        .length > 0 &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  }

  handleChange = (selectedValues: OptionProps["value"][]) => {
    if (!this.props.isDirty) {
      this.props.updateWidgetMetaProperty("isDirty", true);
    }

    this.props.updateWidgetMetaProperty("selectedValues", selectedValues, {
      triggerPropertyName: "onSelectionChange",
      dynamicString: this.props.onSelectionChange,
      event: {
        type: EventType.ON_SWITCH_GROUP_SELECTION_CHANGE,
      },
    });
  };

  getWidgetView() {
    return (
      <SwitchGroupComponent
        defaultSelectedValues={this.props.defaultSelectedValues}
        isDisabled={this.props.isDisabled}
        isRequired={this.props.isRequired}
        isValid={this.props.isValid}
        labelPosition={this.props.labelPosition}
        labelText={this.props.labelText}
        onChange={this.handleChange}
        options={this.props.options}
        orientation={this.props.orientation}
        selectedValues={this.props.selectedValues}
        widgetId={this.props.widgetId}
      />
    );
  }
}

export { WDSSwitchGroupWidget };
