import React from "react";
import log from "loglevel";
import merge from "lodash/merge";
import { klona as clone } from "klona";
import * as Sentry from "@sentry/react";
import { mergeWidgetConfig } from "utils/helpers";
import type { CountryCode } from "libphonenumber-js";
import type { WidgetState } from "widgets/BaseWidget";
import derivedProperties from "./parsedDerivedProperties";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import { WDSBaseInputWidget } from "widgets/wds/WDSBaseInputWidget";
import { AsYouType, parseIncompletePhoneNumber } from "libphonenumber-js";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { KeyDownEvent } from "widgets/wds/WDSBaseInputWidget/component/types";

import * as config from "../config";
import { PhoneInputComponent } from "../component";
import type { PhoneInputWidgetProps } from "./types";
import { getCountryCode, validateInput } from "./helpers";

class WDSPhoneInputWidget extends WDSBaseInputWidget<
  PhoneInputWidgetProps,
  WidgetState
> {
  static type = "WDS_PHONE_INPUT_WIDGET";

  static getConfig() {
    return config.metaConfig;
  }

  static getFeatures() {
    return config.featuresConfig;
  }

  static getDefaults() {
    return config.defaultsConfig;
  }

  static getAnvilConfig(): AnvilConfig | null {
    return config.anvilConfig;
  }

  static getMethods() {
    return config.methodsConfig;
  }

  static getPropertyPaneContentConfig() {
    const parentConfig = clone(super.getPropertyPaneContentConfig());

    const labelSectionIndex = parentConfig.findIndex(
      (section) => section.sectionName === "Label",
    );
    const labelPropertyIndex = parentConfig[
      labelSectionIndex
    ].children.findIndex((property) => property.propertyName === "label");

    parentConfig[labelSectionIndex].children[labelPropertyIndex] = {
      ...parentConfig[labelSectionIndex].children[labelPropertyIndex],
      placeholderText: "Phone Number",
    } as any;

    const generalSectionIndex = parentConfig.findIndex(
      (section) => section.sectionName === "General",
    );
    const tooltipPropertyIndex = parentConfig[
      generalSectionIndex
    ].children.findIndex((property) => property.propertyName === "tooltip");

    parentConfig[generalSectionIndex].children[tooltipPropertyIndex] = {
      ...parentConfig[generalSectionIndex].children[tooltipPropertyIndex],
      placeholderText: "You may skip local prefixes",
    } as any;

    const placeholderPropertyIndex = parentConfig[
      generalSectionIndex
    ].children.findIndex(
      (property) => property.propertyName === "placeholderText",
    );

    parentConfig[generalSectionIndex].children[placeholderPropertyIndex] = {
      ...parentConfig[generalSectionIndex].children[placeholderPropertyIndex],
      placeholderText: "(123) 456-7890",
    } as any;

    return mergeWidgetConfig(config.propertyPaneContentConfig, parentConfig);
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return config.autocompleteConfig;
  }

  static getPropertyPaneStyleConfig() {
    return super.getPropertyPaneStyleConfig();
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{(() => {${derivedProperties.isValid}})()}}`,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return merge(super.getMetaPropertiesMap(), {
      value: "",
      dialCode: undefined,
    });
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return merge(super.getDefaultPropertiesMap(), {
      dialCode: "defaultDialCode",
    });
  }

  static getStylesheetConfig(): Stylesheet {
    return {};
  }

  static getSetterConfig(): SetterConfig {
    return config.settersConfig;
  }

  getFormattedPhoneNumber(value: string) {
    const countryCode = getCountryCode(this.props.dialCode);
    let formattedValue;

    if (!value) {
      formattedValue = value;
    } else if (this.props.allowFormatting) {
      formattedValue = new AsYouType(countryCode as CountryCode).input(value);
    } else {
      formattedValue = parseIncompletePhoneNumber(value);
    }

    return formattedValue;
  }

  componentDidMount() {
    //format the defaultText and store it in text
    if (!!this.props.text) {
      try {
        const formattedValue = this.getFormattedPhoneNumber(this.props.text);

        this.props.updateWidgetMetaProperty("value", this.props.text);
        this.props.updateWidgetMetaProperty("text", formattedValue);
      } catch (e) {
        log.error(e);
        Sentry.captureException(e);
      }
    }
  }

  componentDidUpdate(prevProps: PhoneInputWidgetProps) {
    if (prevProps.dialCode !== this.props.dialCode) {
      this.onISDCodeChange(this.props.dialCode);
    }

    if (prevProps.allowFormatting !== this.props.allowFormatting) {
      const formattedValue = this.getFormattedPhoneNumber(this.props.value);

      this.props.updateWidgetMetaProperty("text", formattedValue);
    }

    // When the default text changes
    if (
      prevProps.text !== this.props.text &&
      this.props.text === this.props.defaultText
    ) {
      const formattedValue = this.getFormattedPhoneNumber(this.props.text);

      if (formattedValue) {
        this.props.updateWidgetMetaProperty(
          "value",
          parseIncompletePhoneNumber(formattedValue),
        );
        this.props.updateWidgetMetaProperty("text", formattedValue);
      }
    }

    // If defaultText property has changed, reset isDirty to false
    if (this.props.defaultText !== prevProps.defaultText) {
      if (this.props.isDirty) {
        this.props.updateWidgetMetaProperty("isDirty", false);
      }
    }
  }

  onISDCodeChange = (dialCode?: string) => {
    const countryCode = getCountryCode(dialCode);

    this.props.updateWidgetMetaProperty("dialCode", dialCode);
    this.props.updateWidgetMetaProperty("countryCode", countryCode);

    if (this.props.value && this.props.allowFormatting) {
      const formattedValue = this.getFormattedPhoneNumber(this.props.value);

      this.props.updateWidgetMetaProperty("text", formattedValue);
    }
  };

  onValueChange = (value: string) => {
    let formattedValue;

    // Don't format, as value is typed, when user is deleting
    if (value && value.length > this.props.text?.length) {
      formattedValue = this.getFormattedPhoneNumber(value);
    } else {
      formattedValue = value;
    }

    this.props.updateWidgetMetaProperty(
      "value",
      parseIncompletePhoneNumber(formattedValue),
    );
    this.props.updateWidgetMetaProperty("text", formattedValue, {
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

    super.onKeyDown(e);
  };

  resetWidgetText = () => {
    super.resetWidgetText();
    this.props.updateWidgetMetaProperty("value", undefined);
  };

  getWidgetView() {
    const value = this.props.text ?? "";

    const validation = validateInput(this.props);

    return (
      <PhoneInputComponent
        allowDialCodeChange={this.props.allowDialCodeChange}
        autoFocus={this.props.autoFocus}
        defaultValue={this.props.defaultText}
        dialCode={this.props.dialCode}
        errorMessage={validation.errorMessage}
        isDisabled={this.props.isDisabled}
        isLoading={this.props.isLoading}
        isReadOnly={this.props.isReadOnly}
        label={this.props.label}
        onFocusChange={this.onFocusChange}
        onISDCodeChange={this.onISDCodeChange}
        onValueChange={this.onValueChange}
        placeholder={this.props.placeholderText}
        tooltip={this.props.tooltip}
        validationStatus={validation.validattionStatus}
        value={value}
        widgetId={this.props.widgetId}
      />
    );
  }
}

export { WDSPhoneInputWidget };
