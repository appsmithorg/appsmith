import { Select } from "@appsmith/wds";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import isNumber from "lodash/isNumber";
import React from "react";
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
import type { SelectItem } from "@appsmith/wds/src/components/Select/src/types";

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
      optionLabel: ["options"],
      optionValue: ["options"],
      defaultOptionValue: ["options"],
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
    return {
      selectedOption:
        "{{_.find(this.options, { value: this.selectedOptionValue })}}",
      isValid: `{{ this.isRequired ? !!this.selectedOptionValue : true }}`,
      value: `{{this.selectedOptionValue}}`,
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

  handleChange = (updatedValue: string | number) => {
    let newVal;

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

  optionsToSelectItems = (
    options: WDSSelectWidgetProps["options"],
  ): SelectItem[] => {
    if (Array.isArray(options)) {
      const items = options.map((option) => ({
        label: option[this.props.optionLabel || "label"] as string,
        id: option[this.props.optionValue || "value"] as string,
      }));

      const isValidItems = items.every(
        (item) => item.label !== undefined && item.id !== undefined,
      );

      return isValidItems ? items : [];
    }

    return [];
  };

  getWidgetView() {
    const {
      labelTooltip,
      options,
      placeholderText,
      selectedOptionValue,
      ...rest
    } = this.props;

    const validation = validateInput(this.props);

    return (
      <Select
        {...rest}
        contextualHelp={labelTooltip}
        errorMessage={validation.errorMessage}
        isInvalid={validation.validationStatus === "invalid"}
        items={this.optionsToSelectItems(options)}
        onSelectionChange={this.handleChange}
        placeholder={placeholderText}
        selectedKey={selectedOptionValue}
      />
    );
  }
}

export { WDSSelectWidget };
