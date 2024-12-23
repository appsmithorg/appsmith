import { Select, ListBoxItem } from "@appsmith/wds";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import isNumber from "lodash/isNumber";
import React, { type Key } from "react";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import type { WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import {
  anvilConfig,
  autocompleteConfig,
  defaultsConfig,
  metaConfig,
  methodsConfig,
  propertyPaneContentConfig,
  settersConfig,
} from "../config";
import { validateInput } from "./helpers";
import type { WDSSelectWidgetProps } from "./types";
import derivedPropertyFns from "./derived";
import { parseDerivedProperties } from "widgets/WidgetUtils";
import isArray from "lodash/isArray";

const isTrueObject = (item: unknown): item is Record<string, unknown> => {
  return Object.prototype.toString.call(item) === "[object Object]";
};

class WDSSelectWidget extends BaseWidget<WDSSelectWidgetProps, WidgetState> {
  static type = "WDS_SELECT_WIDGET";

  static getConfig() {
    return metaConfig;
  }

  static getDefaults() {
    return defaultsConfig;
  }

  static getMethods() {
    return methodsConfig;
  }

  static getAnvilConfig(): AnvilConfig | null {
    return anvilConfig;
  }

  static getDependencyMap(): Record<string, string[]> {
    return {
      optionLabel: ["sourceData"],
      optionValue: ["sourceData"],
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return autocompleteConfig;
  }

  static getPropertyPaneContentConfig() {
    return propertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return [];
  }

  static getDerivedPropertiesMap() {
    const parsedDerivedProperties = parseDerivedProperties(derivedPropertyFns);

    return {
      options: `{{(()=>{${parsedDerivedProperties.getOptions}})()}}`,
      isValid: `{{(()=>{${parsedDerivedProperties.getIsValid}})()}}`,
      selectedOptionValue: `{{(()=>{${parsedDerivedProperties.getSelectedOptionValue}})()}}`,
      selectedOptionLabel: `{{(()=>{${parsedDerivedProperties.getSelectedOptionLabel}})()}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedOptionValue: "defaultOptionValue",
    };
  }

  static getMetaPropertiesMap() {
    return {
      selectedOptionValue: undefined,
      isDirty: false,
    };
  }

  static getStylesheetConfig(): Stylesheet {
    return {};
  }

  // in case default value changes, we need to reset isDirty to false
  componentDidUpdate(prevProps: WDSSelectWidgetProps): void {
    if (
      this.props.defaultOptionValue !== prevProps.defaultOptionValue &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  }

  static getSetterConfig(): SetterConfig {
    return settersConfig;
  }

  handleChange = (updatedValue: Key | null) => {
    let newVal;

    if (updatedValue === null) return;

    if (isNumber(updatedValue)) {
      newVal = updatedValue;
    } else if (
      isTrueObject(this.props.options[0]) &&
      isNumber(this.props.options[0].value)
    ) {
      newVal = parseFloat(updatedValue);
    } else {
      newVal = updatedValue;
    }

    const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

    // Set isDirty to true when the selection changes
    if (!this.props.isDirty) {
      pushBatchMetaUpdates("isDirty", true);
    }

    pushBatchMetaUpdates("selectedOptionValue", newVal, {
      triggerPropertyName: "onSelectionChange",
      dynamicString: this.props.onSelectionChange,
      event: {
        type: EventType.ON_OPTION_CHANGE,
      },
    });
    commitBatchMetaUpdates();
  };

  getWidgetView() {
    const { labelTooltip, placeholderText, selectedOptionValue, ...rest } =
      this.props;
    const validation = validateInput(this.props);
    const options = (isArray(this.props.options) ? this.props.options : []) as {
      value: string;
      label: string;
    }[];
    // This is key is used to force re-render of the widget when the options change.
    // Why force re-render on   options change?
    // Sometimes when the user is changing options, the select throws an error ( related to react-aria code ) saying "cannot change id of item".
    const key = options.map((option) => option.value).join(",");

    return (
      <Select
        {...rest}
        contextualHelp={labelTooltip}
        errorMessage={validation.errorMessage}
        isInvalid={
          validation.validationStatus === "invalid" && this.props.isDirty
        }
        key={key}
        onSelectionChange={this.handleChange}
        placeholder={placeholderText}
        selectedKey={selectedOptionValue}
      >
        {options.map((option) => (
          <ListBoxItem
            id={option.value}
            key={option.value}
            textValue={option.label}
          >
            {option.label}
          </ListBoxItem>
        ))}
      </Select>
    );
  }
}

export { WDSSelectWidget };
