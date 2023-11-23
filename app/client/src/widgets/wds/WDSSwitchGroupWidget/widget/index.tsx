import React from "react";
import xor from "lodash/xor";
import BaseWidget from "widgets/BaseWidget";
import type { WidgetState } from "widgets/BaseWidget";
import type { SetterConfig } from "entities/AppTheming";
import type { AnvilConfig } from "WidgetProvider/constants";
import { Switch, SwitchGroup } from "@design-system/widgets";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

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
import { validateInput } from "./helpers";
import type { SwitchGroupWidgetProps, OptionProps } from "./types";

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

  onChange = (selectedValues: OptionProps["value"][]) => {
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
    const {
      labelPosition,
      labelTooltip,
      options,
      selectedOptionValue,
      widgetId,
      ...rest
    } = this.props;

    const validation = validateInput(this.props);

    return (
      <SwitchGroup
        {...rest}
        contextualHelp={labelTooltip}
        errorMessage={validation.errorMessage}
        onChange={this.onChange}
        validationState={validation.validationStatus}
        value={selectedOptionValue}
      >
        {options.map((option, index) => (
          <Switch
            key={`${widgetId}-option-${index}`}
            labelPosition={labelPosition}
            value={option.value}
          >
            {option.label}
          </Switch>
        ))}
      </SwitchGroup>
    );
  }
}

export { WDSSwitchGroupWidget };
