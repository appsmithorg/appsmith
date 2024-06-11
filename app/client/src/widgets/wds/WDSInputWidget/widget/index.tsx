import React from "react";
import { isNumber, merge, toString } from "lodash";
import * as config from "../config";
import InputComponent from "../component";
import { INPUT_TYPES } from "../constants";
import type { InputWidgetProps } from "./types";
import { mergeWidgetConfig } from "utils/helpers";
import { parseText, validateInput } from "./helper";
import type { WidgetState } from "widgets/BaseWidget";
import type { SetterConfig } from "entities/AppTheming";
import derivedProperties from "./parsedDerivedProperties";
import { WDSBaseInputWidget } from "../../WDSBaseInputWidget";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { KeyDownEvent } from "widgets/wds/WDSBaseInputWidget/component/types";

class WDSInputWidget extends WDSBaseInputWidget<InputWidgetProps, WidgetState> {
  static getConfig() {
    return config.metaConfig;
  }

  static getDefaults() {
    return config.defaultsConfig;
  }

  static getMethods() {
    return config.methodsConfig;
  }

  static getAnvilConfig() {
    return config.anvilConfig;
  }

  static getAutocompleteDefinitions() {
    return config.autocompleteConfig;
  }

  static getPropertyPaneContentConfig() {
    const parentConfig = super.getPropertyPaneContentConfig();

    return mergeWidgetConfig(config.propertyPaneContentConfig, parentConfig);
  }

  static getPropertyPaneStyleConfig() {
    return mergeWidgetConfig(
      config.propertyPaneStyleConfig,
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
      rawText: "",
      parsedText: "",
    });
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      rawText: "defaultText",
      parsedText: "defaultText",
    };
  }

  static getSetterConfig(): SetterConfig {
    return config.settersConfig;
  }

  static getStylesheetConfig() {
    return {};
  }

  static getDependencyMap(): Record<string, string[]> {
    return {
      defaultText: ["inputType"],
    };
  }

  onFocusChange = (focusState: boolean) => {
    if (this.props.isReadOnly) return;

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
    if (this.props.inputType === INPUT_TYPES.NUMBER) {
      // don't allow entering anything other than numbers. but allow backspace, arrows delete, tab, enter
      if (
        !(
          (e.key >= "0" && e.key <= "9") ||
          (e.key >= "0" && e.key <= "9" && e.code.includes("Numpad")) ||
          e.key === "Backspace" ||
          e.key === "Tab" ||
          e.key === "Enter" ||
          e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight" ||
          e.key === "Delete" ||
          e.ctrlKey ||
          e.metaKey ||
          e.altKey
        )
      ) {
        e.preventDefault();
      }

      // increment or decrement the value by 1 on arrow up/down
      // Note: we are doing this manually because we are using input="text" for inputType = NUMBER
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const currentValue = Number(this.props.rawText);
        const newValue =
          e.key === "ArrowDown" ? currentValue - 1 : currentValue + 1;

        if (isNumber(newValue) && !isNaN(newValue)) {
          this.onValueChange(newValue.toString());
        }
      }
    }

    super.onKeyDown(e, this.props.inputType === INPUT_TYPES.MULTI_LINE_TEXT);
  };

  componentDidUpdate = (prevProps: InputWidgetProps) => {
    if (
      prevProps.rawText !== this.props.rawText &&
      this.props.rawText !== toString(this.props.parsedText)
    ) {
      this.props.updateWidgetMetaProperty(
        "parsedText",
        parseText(this.props.rawText, this.props.inputType),
      );
    }

    if (prevProps.inputType !== this.props.inputType) {
      this.props.updateWidgetMetaProperty(
        "parsedText",
        parseText(this.props.rawText, this.props.inputType),
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
      "parsedText",
      parseText(value, this.props.inputType),
    );

    this.props.updateWidgetMetaProperty("rawText", value, {
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
    this.props.updateWidgetMetaProperty("rawText", "");
    this.props.updateWidgetMetaProperty(
      "parsedText",
      parseText("", this.props.inputType),
    );
  };

  onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (this.props.inputType === INPUT_TYPES.NUMBER) {
      const pastedValue = e.clipboardData.getData("text");

      if (isNaN(Number(pastedValue))) {
        e.preventDefault();
      }
    }
  };

  getWidgetView() {
    const { inputType, rawText } = this.props;

    const value = rawText ?? "";
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
        isReadOnly={this.props.isReadOnly}
        isRequired={this.props.isRequired}
        label={this.props.label}
        maxChars={this.props.maxChars}
        maxNum={this.props.maxNum}
        minNum={this.props.minNum}
        onFocusChange={this.onFocusChange}
        onKeyDown={this.onKeyDown}
        onPaste={this.onPaste}
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

  static type = "WDS_INPUT_WIDGET";
}

export { WDSInputWidget };
