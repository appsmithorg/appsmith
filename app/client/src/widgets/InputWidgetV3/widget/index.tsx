import React from "react";
import { merge, toString } from "lodash";

import {
  propertyPaneContentConfig,
  propertyPaneStyleConfig,
} from "./propertyPaneConfig";
import InputComponent from "../component";
import { mergeWidgetConfig } from "utils/helpers";
import { parseText, validateInput } from "./helper";
import type { WidgetState } from "widgets/BaseWidget";
import type { SetterConfig } from "entities/AppTheming";
import BaseInputWidget from "widgets/BaseInputWidgetV2";
import derivedProperties from "./parsedDerivedProperties";
import type { InputWidgetProps, KeyDownEvent } from "./types";
import type { DerivedPropertiesMap } from "utils/WidgetFactory";
import type { AutocompletionDefinitions } from "widgets/constants";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { INPUT_TYPES } from "../constants";

class InputWidget extends BaseInputWidget<InputWidgetProps, WidgetState> {
  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    const definitions: AutocompletionDefinitions = {
      "!doc":
        "An input text field is used to capture a users textual input such as their names, numbers, emails etc. Inputs are used in forms and can have custom validations.",
      "!url": "https://docs.appsmith.com/widget-reference/input",
      text: {
        "!type": "string",
        "!doc": "The text value of the input",
        "!url": "https://docs.appsmith.com/widget-reference/input",
      },
      isValid: "bool",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      isDisabled: "bool",
    };

    return definitions;
  }

  static getPropertyPaneContentConfig() {
    return mergeWidgetConfig(
      propertyPaneContentConfig,
      super.getPropertyPaneContentConfig(),
    );
  }

  static getPropertyPaneStyleConfig() {
    return mergeWidgetConfig(
      propertyPaneStyleConfig,
      super.getPropertyPaneStyleConfig(),
    );
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return merge(super.getDerivedPropertiesMap(), {
      isValid: `{{(() => {${derivedProperties.isValid}})()}}`,
    });
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return merge(super.getMetaPropertiesMap(), {
      inputText: "",
      text: "",
    });
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      inputText: "defaultText",
      text: "defaultText",
    };
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
        setDisabled: {
          path: "isDisabled",
          type: "boolean",
        },
        setRequired: {
          path: "isRequired",
          type: "boolean",
        },
        setValue: {
          path: "defaultText",
          type: "string",
          accessor: "text",
        },
      },
    };
  }

  static getStylesheetConfig() {
    return {};
  }

  onFocusChange = (focusState: boolean) => {
    if (focusState) {
      this.props.updateWidgetMetaProperty("isFocused", focusState, {
        triggerPropertyName: "onFocus",
        dynamicString: this.props.onFocus,
        event: {
          type: EventType.ON_FOCUS,
        },
      });
    }

    if (!focusState) {
      this.props.updateWidgetMetaProperty("isFocused", focusState, {
        triggerPropertyName: "onBlur",
        dynamicString: this.props.onBlur,
        event: {
          type: EventType.ON_BLUR,
        },
      });
    }

    super.onFocusChange(focusState);
  };

  onKeyDown = (e: KeyDownEvent) => {
    super.onKeyDown(e, this.props.inputType === INPUT_TYPES.MULTI_LINE_TEXT);
  };

  componentDidUpdate = (prevProps: InputWidgetProps) => {
    if (
      prevProps.inputText !== this.props.inputText &&
      this.props.inputText !== toString(this.props.text)
    ) {
      this.props.updateWidgetMetaProperty(
        "text",
        parseText(this.props.inputText, this.props.inputType),
      );
    }

    if (prevProps.inputType !== this.props.inputType) {
      this.props.updateWidgetMetaProperty(
        "text",
        parseText(this.props.inputText, this.props.inputType),
      );
    }
    // If defaultText property has changed, reset isDirty to false
    if (
      this.props.defaultText !== prevProps.defaultText &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  };

  onValueChange = (value: string) => {
    // Ideally text property should be derived property. But widgets with
    // derived properties won't work as expected inside a List widget.
    // TODO(Balaji): Once we refactor the List widget, need to conver
    // text to a derived property.
    this.props.updateWidgetMetaProperty(
      "text",
      parseText(value, this.props.inputType),
    );

    this.props.updateWidgetMetaProperty("inputText", value, {
      triggerPropertyName: "onTextChanged",
      dynamicString: this.props.onTextChanged,
      event: {
        type: EventType.ON_TEXT_CHANGE,
      },
    });

    if (!this.props.isDirty) {
      this.props.updateWidgetMetaProperty("isDirty", true);
    }
  };

  resetWidgetText = () => {
    this.props.updateWidgetMetaProperty("inputText", "");
    this.props.updateWidgetMetaProperty(
      "text",
      parseText("", this.props.inputType),
    );
  };

  getPageView() {
    const { inputText, inputType } = this.props;

    const value = inputText ?? "";
    const { errorMessage, validationStatus } = validateInput(this.props);

    return (
      <InputComponent
        autoComplete={this.props.shouldAllowAutofill}
        autoFocus={this.props.autoFocus}
        defaultValue={this.props.defaultText}
        errorMessage={errorMessage}
        iconAlign={this.props.iconAlign}
        iconName={this.props.iconName}
        inputType={inputType}
        isDisabled={this.props.isDisabled}
        isLoading={this.props.isLoading}
        label={this.props.label}
        labelAlign={this.props.labelAlignment}
        labelPosition={this.props.labelPosition}
        labelWidth={this.getLabelWidth()}
        maxChars={this.props.maxChars}
        maxNum={this.props.maxNum}
        minNum={this.props.minNum}
        onFocusChange={this.onFocusChange}
        onKeyDown={this.onKeyDown}
        onValueChange={this.onValueChange}
        placeholder={this.props.placeholderText}
        spellCheck={this.props.isSpellCheck}
        tooltip={this.props.tooltip}
        validationStatus={validationStatus}
        value={value}
        widgetId={this.props.widgetId}
      />
    );
  }

  static getWidgetType() {
    return "INPUT_WIDGET_V3";
  }
}

export { InputWidget };
