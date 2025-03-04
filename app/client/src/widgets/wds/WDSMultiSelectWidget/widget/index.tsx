import { MultiSelect } from "@appsmith/wds";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import React from "react";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import BaseWidget from "widgets/BaseWidget";
import isArray from "lodash/isArray";
import type { Selection } from "@react-types/shared";
import type { WidgetState } from "widgets/BaseWidget";

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
import type { WDSMultiSelectWidgetProps } from "./types";
import derivedProperties from "./parseDerivedProperties";

class WDSMultiSelectWidget extends BaseWidget<
  WDSMultiSelectWidgetProps,
  WidgetState
> {
  static type = "WDS_MULTI_SELECT_WIDGET";

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
    return {
      options: `{{(()=>{${derivedProperties.getOptions}})()}}`,
      isValid: `{{(()=>{${derivedProperties.getIsValid}})()}}`,
      selectedOptionValues: `{{(()=>{${derivedProperties.getSelectedOptionValues}})()}}`,
      selectedOptionLabels: `{{(()=>{${derivedProperties.getSelectedOptionLabels}})()}}`,
      value: `{{this.selectedOptionValues}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedOptionValues: "defaultOptionValues",
    };
  }

  static getMetaPropertiesMap() {
    return {
      selectedOptionValues: undefined,
      isDirty: false,
    };
  }

  static getStylesheetConfig(): Stylesheet {
    return {};
  }

  // in case default value changes, we need to reset isDirty to false
  componentDidUpdate(prevProps: WDSMultiSelectWidgetProps): void {
    if (
      this.props.defaultOptionValues !== prevProps.defaultOptionValues &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  }

  static getSetterConfig(): SetterConfig {
    return settersConfig;
  }

  onSelectionChange = (updatedValues: Selection) => {
    const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

    if (!this.props.isDirty) {
      this.props.updateWidgetMetaProperty("isDirty", true);
    }

    pushBatchMetaUpdates("selectedOptionValues", [...updatedValues], {
      triggerPropertyName: "onSelectionChange",
      dynamicString: this.props.onSelectionChange,
      event: {
        type: EventType.ON_OPTION_CHANGE,
      },
    });

    commitBatchMetaUpdates();
  };

  getWidgetView() {
    const { labelTooltip, placeholderText, selectedOptionValues, ...rest } =
      this.props;
    const validation = validateInput(this.props);
    const options = (isArray(this.props.options) ? this.props.options : []) as {
      value: string;
      label: string;
    }[];
    // This is key is used to force re-render of the widget when the options change.
    // Why force re-render on options change?
    // When the user is changing options from propety pane, the select throws an error ( related to react-aria code ) saying "cannot change id of item" due
    // change in options's id.
    const key = options.map((option) => option.value).join(",");

    return (
      <MultiSelect
        {...rest}
        contextualHelp={labelTooltip}
        errorMessage={
          validation.validationStatus === "invalid" && this.props.isDirty
            ? validation.errorMessage
            : undefined
        }
        isInvalid={
          validation.validationStatus === "invalid" && this.props.isDirty
        }
        items={options}
        key={key}
        onSelectionChange={this.onSelectionChange}
        placeholder={placeholderText}
        selectedKeys={selectedOptionValues}
      />
    );
  }
}

export { WDSMultiSelectWidget };
