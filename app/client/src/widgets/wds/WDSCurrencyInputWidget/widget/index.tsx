import _ from "lodash";
import React from "react";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import type { WidgetState } from "widgets/BaseWidget";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import { CurrencyInputComponent } from "../component";
import derivedProperties from "./parsedDerivedProperties";
import {
  formatCurrencyNumber,
  limitDecimalValue,
} from "../component/utilities";
import { getLocale, mergeWidgetConfig } from "utils/helpers";
import {
  getLocaleDecimalSeperator,
  getLocaleThousandSeparator,
} from "widgets/WidgetUtils";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import {
  anvilConfig,
  autocompleteConfig,
  defaultsConfig,
  featuresConfig,
  metaConfig,
  settersConfig,
  propertyPaneContentConfig,
} from "./config";
import type { CurrencyInputWidgetProps } from "./types";
import { WDSBaseInputWidget } from "widgets/wds/WDSBaseInputWidget";
import { getCountryCodeFromCurrencyCode, validateInput } from "./helpers";
import type { KeyDownEvent } from "widgets/wds/WDSBaseInputWidget/component/types";

class WDSCurrencyInputWidget extends WDSBaseInputWidget<
  CurrencyInputWidgetProps,
  WidgetState
> {
  static type = "WDS_CURRENCY_INPUT_WIDGET";

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

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return autocompleteConfig;
  }

  static getSetterConfig(): SetterConfig {
    return settersConfig;
  }

  static getPropertyPaneContentConfig() {
    return mergeWidgetConfig(
      propertyPaneContentConfig,
      super.getPropertyPaneContentConfig(),
    );
  }

  static getPropertyPaneStyleConfig() {
    return super.getPropertyPaneStyleConfig();
  }

  static getDerivedPropertiesMap() {
    return {
      isValid: `{{(()=>{${derivedProperties.isValid}})()}}`,
      value: `{{(()=>{${derivedProperties.value}})()}}`,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return _.merge(super.getMetaPropertiesMap(), {
      text: undefined,
      currencyCode: undefined,
    });
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return _.merge(super.getDefaultPropertiesMap(), {
      currencyCode: "defaultCurrencyCode",
    });
  }

  static getStylesheetConfig(): Stylesheet {
    return {};
  }

  componentDidMount() {
    this.formatText();
  }

  componentDidUpdate(prevProps: CurrencyInputWidgetProps) {
    if (
      prevProps.text !== this.props.text &&
      !this.props.isFocused &&
      this.props.text === String(this.props.defaultText)
    ) {
      this.formatText();
    }
    // If defaultText property has changed, reset isDirty to false
    if (
      this.props.defaultText !== prevProps.defaultText &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }

    if (
      this.props.currencyCode === this.props.defaultCurrencyCode &&
      prevProps.currencyCode !== this.props.currencyCode
    ) {
      this.onCurrencyChange(this.props.currencyCode);
    }
  }

  onValueChange = (value: string) => {
    let formattedValue = "";
    const decimalSeperator = getLocaleDecimalSeperator();

    try {
      if (value && value.includes(decimalSeperator)) {
        formattedValue = limitDecimalValue(this.props.decimals, value);
      } else {
        formattedValue = value;
      }
    } catch (e) {
      formattedValue = value;
      log.error(e);
      Sentry.captureException(e);
    }

    this.props.updateWidgetMetaProperty("text", String(formattedValue), {
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

  onFocusChange = (isFocused?: boolean) => {
    try {
      if (isFocused) {
        const text = this.props.text || "";
        const deFormattedValue = text.replace(
          new RegExp("\\" + getLocaleThousandSeparator(), "g"),
          "",
        );
        this.props.updateWidgetMetaProperty("text", deFormattedValue);
        this.props.updateWidgetMetaProperty("isFocused", isFocused, {
          triggerPropertyName: "onFocus",
          dynamicString: this.props.onFocus,
          event: {
            type: EventType.ON_FOCUS,
          },
        });
      } else {
        if (this.props.text) {
          const formattedValue = formatCurrencyNumber(
            this.props.decimals,
            this.props.text,
          );
          this.props.updateWidgetMetaProperty("text", formattedValue);
        }
        this.props.updateWidgetMetaProperty("isFocused", isFocused, {
          triggerPropertyName: "onBlur",
          dynamicString: this.props.onBlur,
          event: {
            type: EventType.ON_BLUR,
          },
        });
      }
    } catch (e) {
      log.error(e);
      Sentry.captureException(e);
      this.props.updateWidgetMetaProperty("text", this.props.text);
    }

    super.onFocusChange(!!isFocused);
  };

  onCurrencyChange = (
    currencyCode?: Parameters<typeof getCountryCodeFromCurrencyCode>[0],
  ) => {
    const countryCode = getCountryCodeFromCurrencyCode(currencyCode);

    this.props.updateWidgetMetaProperty("countryCode", countryCode);
    this.props.updateWidgetMetaProperty("currencyCode", currencyCode);
  };

  onKeyDown = (e: KeyDownEvent) => {
    // don't allow entering anything other than numbers. but allow backspace, arrows delete, tab, enter
    if (
      !(
        (e.key >= "0" && e.key <= "9") ||
        // allow . or comma if decimals are allowed
        (this.props.decimals &&
          (e.key === getLocaleDecimalSeperator() ||
            e.key === getLocaleThousandSeparator())) ||
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

  isTextFormatted = () => {
    return this.props.text.includes(getLocaleThousandSeparator());
  };

  formatText() {
    if (!!this.props.text && !this.isTextFormatted()) {
      try {
        const floatVal = parseFloat(this.props.text);

        const formattedValue = Intl.NumberFormat(getLocale(), {
          style: "decimal",
          minimumFractionDigits: this.props.decimals,
          maximumFractionDigits: this.props.decimals,
        }).format(floatVal);

        this.props.updateWidgetMetaProperty("text", formattedValue);
      } catch (e) {
        log.error(e);
        Sentry.captureException(e);
      }
    }
  }

  getWidgetView() {
    const value = this.props.text ?? "";

    const validation = validateInput(this.props);

    return (
      <CurrencyInputComponent
        allowCurrencyChange={this.props.allowCurrencyChange}
        autoFocus={this.props.autoFocus}
        currencyCode={this.props.currencyCode}
        defaultValue={this.props.defaultText}
        errorMessage={validation.errorMessage}
        isDisabled={this.props.isDisabled}
        isLoading={this.props.isLoading}
        isRequired={this.props.isRequired}
        label={this.props.label}
        onCurrencyChange={this.onCurrencyChange}
        onFocusChange={this.onFocusChange}
        onKeyDown={this.onKeyDown}
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

export { WDSCurrencyInputWidget };
