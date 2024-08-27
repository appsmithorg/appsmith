import React from "react";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import isNumber from "lodash/isNumber";
import BaseWidget from "widgets/BaseWidget";
import type { WidgetState } from "widgets/BaseWidget";
import { RadioGroup } from "@appsmith/wds";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import {
  anvilConfig,
  autocompleteConfig,
  defaultsConfig,
  featuresConfig,
  metaConfig,
  methodsConfig,
  propertyPaneContentConfig,
  settersConfig,
} from "../config";
import { validateInput } from "./helpers";
import type { RadioGroupWidgetProps } from "./types";

class WDSRadioGroupWidget extends BaseWidget<
  RadioGroupWidgetProps,
  WidgetState
> {
  static type = "WDS_RADIO_GROUP_WIDGET";

  static getConfig() {
    return metaConfig;
  }

  static getFeatures() {
    return featuresConfig;
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedOptionValue: undefined,
      isDirty: false,
    };
  }

  static getStylesheetConfig(): Stylesheet {
    return {};
  }

  componentDidUpdate(prevProps: RadioGroupWidgetProps): void {
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

  onRadioSelectionChange = (updatedValue: string) => {
    let newVal;
    if (isNumber(this.props.options[0].value)) {
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
    const { labelTooltip, options, selectedOptionValue, ...rest } = this.props;

    const validation = validateInput(this.props);

    return (
      <RadioGroup
        {...rest}
        contextualHelp={labelTooltip}
        errorMessage={validation.errorMessage}
        isInvalid={validation.validationStatus === "invalid"}
        items={options}
        onChange={this.onRadioSelectionChange}
        value={selectedOptionValue}
      />
    );
  }
}

export { WDSRadioGroupWidget };
