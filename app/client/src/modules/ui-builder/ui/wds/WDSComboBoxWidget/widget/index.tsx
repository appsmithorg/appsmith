import { ComboBox } from "@appsmith/wds";
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
import type { WDSComboBoxWidgetProps } from "./types";
import type { ComboBoxItem } from "@appsmith/wds/src/components/ComboBox/src/types";

const isTrueObject = (item: unknown): item is Record<string, unknown> => {
  return Object.prototype.toString.call(item) === "[object Object]";
};

class WDSComboBoxWidget extends BaseWidget<
  WDSComboBoxWidgetProps,
  WidgetState
> {
  static type = "WDS_COMBOBOX_WIDGET";

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

  componentDidUpdate(prevProps: WDSComboBoxWidgetProps): void {
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

  static getDependencyMap(): Record<string, string[]> {
    return {
      optionLabel: ["options"],
      optionValue: ["options"],
      defaultOptionValue: ["options"],
    };
  }

  handleSelectionChange = (updatedValue: string | number | null) => {
    let newVal;

    if (updatedValue === null) {
      newVal = "";
    } else {
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

  optionsToItems = (
    options: WDSComboBoxWidgetProps["options"],
  ): ComboBoxItem[] => {
    if (Array.isArray(options)) {
      const items = options.map((option) => ({
        label: option["label"] as string,
        id: option["value"] as string,
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
      <ComboBox
        {...rest}
        contextualHelp={labelTooltip}
        errorMessage={validation.errorMessage}
        isInvalid={validation.validationStatus === "invalid"}
        items={this.optionsToItems(options)}
        onSelectionChange={this.handleSelectionChange}
        placeholder={placeholderText}
        selectedKey={selectedOptionValue}
      />
    );
  }
}

export { WDSComboBoxWidget };
