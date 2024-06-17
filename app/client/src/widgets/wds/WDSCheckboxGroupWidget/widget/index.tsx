import React from "react";
import xor from "lodash/xor";
import BaseWidget from "widgets/BaseWidget";
import type { WidgetState } from "widgets/BaseWidget";
import type { SetterConfig } from "entities/AppTheming";
import type { AnvilConfig } from "WidgetProvider/constants";
import { Checkbox, ToggleGroup } from "@design-system/widgets";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import {
  anvilConfig,
  autocompleteConfig,
  defaultsConfig,
  featuresConfig,
  metaConfig,
  propertyPaneContentConfig,
  settersConfig,
  methodsConfig,
} from "../config";
import { validateInput } from "./helpers";
import type { CheckboxGroupWidgetProps, OptionProps } from "./types";

class WDSCheckboxGroupWidget extends BaseWidget<
  CheckboxGroupWidgetProps,
  WidgetState
> {
  static type = "WDS_CHECKBOX_GROUP_WIDGET";

  static getConfig() {
    return metaConfig;
  }

  static getFeatures() {
    return featuresConfig;
  }

  static getDefaults() {
    return defaultsConfig;
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
    return [];
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

  static getMethods() {
    return methodsConfig;
  }

  componentDidUpdate(prevProps: CheckboxGroupWidgetProps) {
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
      triggerPropertyName: "onCheckChange",
      dynamicString: this.props.onCheckChange,
      event: {
        type: EventType.ON_CHECKBOX_GROUP_SELECTION_CHANGE,
      },
    });
  };

  getWidgetView() {
    const { labelTooltip, options, selectedValues, widgetId, ...rest } =
      this.props;

    const validation = validateInput(this.props);

    return (
      <ToggleGroup
        {...rest}
        contextualHelp={labelTooltip}
        errorMessage={validation.errorMessage}
        isInvalid={validation.validationStatus === "invalid"}
        items={options}
        onChange={this.onChange}
        value={selectedValues}
      >
        {({ index, label, value }) => (
          <Checkbox key={`${widgetId}-option-${index}`} value={value}>
            {label}
          </Checkbox>
        )}
      </ToggleGroup>
    );
  }
}

export { WDSCheckboxGroupWidget };
