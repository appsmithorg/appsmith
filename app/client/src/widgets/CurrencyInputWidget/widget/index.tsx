import React from "react";
import { WidgetState } from "widgets/BaseWidget";
import { RenderModes, WidgetType } from "constants/WidgetConstants";
import CurrencyInputComponent, {
  CurrencyInputComponentProps,
} from "../component";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  ValidationTypes,
  ValidationResponse,
} from "constants/WidgetValidation";
import {
  createMessage,
  FIELD_REQUIRED_ERROR,
} from "@appsmith/constants/messages";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import {
  CurrencyDropdownOptions,
  getCountryCodeFromCurrencyCode,
} from "../component/CurrencyCodeDropdown";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import _ from "lodash";
import derivedProperties from "./parsedDerivedProperties";
import BaseInputWidget from "widgets/BaseInputWidget";
import { BaseInputWidgetProps } from "widgets/BaseInputWidget/widget";
import * as Sentry from "@sentry/react";
import log from "loglevel";
import {
  formatCurrencyNumber,
  getLocaleDecimalSeperator,
  limitDecimalValue,
  parseLocaleFormattedStringToNumber,
} from "../component/utilities";
import { mergeWidgetConfig } from "utils/helpers";

export function defaultValueValidation(
  value: any,
  props: CurrencyInputWidgetProps,
  _?: any,
): ValidationResponse {
  const NUMBER_ERROR_MESSAGE = "This value must be number";
  const EMPTY_ERROR_MESSAGE = "";
  if (_.isObject(value)) {
    return {
      isValid: false,
      parsed: JSON.stringify(value, null, 2),
      messages: [NUMBER_ERROR_MESSAGE],
    };
  }

  let parsed: any = Number(value);
  let isValid, messages;

  if (_.isString(value) && value.trim() === "") {
    /*
     *  When value is emtpy string
     */
    isValid = true;
    messages = [EMPTY_ERROR_MESSAGE];
    parsed = undefined;
  } else if (!Number.isFinite(parsed)) {
    /*
     *  When parsed value is not a finite numer
     */
    isValid = false;
    messages = [NUMBER_ERROR_MESSAGE];
    parsed = undefined;
  } else {
    /*
     *  When parsed value is a Number
     */

    // Check whether value is honoring the decimals property
    if (parsed !== Number(parsed.toFixed(props.decimals))) {
      isValid = false;
      messages = [
        "No. of decimals are higher than the decimals field set. Please update the default or the decimals field",
      ];
    } else {
      isValid = true;
      messages = [EMPTY_ERROR_MESSAGE];
    }

    parsed = String(parsed);
  }

  return {
    isValid,
    parsed,
    messages,
  };
}

class CurrencyInputWidget extends BaseInputWidget<
  CurrencyInputWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return mergeWidgetConfig(
      [
        {
          sectionName: "General",
          children: [
            {
              propertyName: "allowCurrencyChange",
              label: "Allow currency change",
              helpText: "Search by currency or country",
              controlType: "SWITCH",
              isJSConvertible: false,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: { type: ValidationTypes.BOOLEAN },
            },
            {
              helpText: "Changes the type of currency",
              propertyName: "currencyCode",
              label: "Currency",
              enableSearch: true,
              dropdownHeight: "195px",
              controlType: "DROP_DOWN",
              placeholderText: "Search by code or name",
              options: CurrencyDropdownOptions,
              isJSConvertible: true,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.TEXT,
              },
            },
            {
              helpText: "No. of decimals in currency input",
              propertyName: "decimals",
              label: "Decimals",
              controlType: "DROP_DOWN",
              options: [
                {
                  label: "0",
                  value: 0,
                },
                {
                  label: "1",
                  value: 1,
                },
                {
                  label: "2",
                  value: 2,
                },
              ],
              isBindProperty: false,
              isTriggerProperty: false,
            },
            {
              helpText:
                "Sets the default text of the widget. The text is updated if the default text changes",
              propertyName: "defaultText",
              label: "Default Text",
              controlType: "INPUT_TEXT",
              placeholderText: "100",
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.FUNCTION,
                params: {
                  fn: defaultValueValidation,
                  expected: {
                    type: "number",
                    example: `100`,
                    autocompleteDataType: AutocompleteDataType.STRING,
                  },
                },
              },
              dependencies: ["decimals"],
            },
          ],
        },
      ],
      super.getPropertyPaneConfig(),
    );
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{(()=>{${derivedProperties.isValid}})()}}`,
      value: `{{(()=>{${derivedProperties.value}})()}}`,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return _.merge(super.getMetaPropertiesMap(), {
      text: undefined,
    });
  }

  componentDidMount() {
    //format the defaultText and store it in text
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
  }

  formatText() {
    if (!!this.props.text) {
      try {
        const formattedValue = formatCurrencyNumber(
          this.props.decimals,
          String(this.props.value),
        );
        this.props.updateWidgetMetaProperty("text", formattedValue);
      } catch (e) {
        log.error(e);
        Sentry.captureException(e);
      }
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

    // text is stored as what user has typed
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

  handleFocusChange = (isFocused?: boolean) => {
    try {
      if (isFocused) {
        const deFormattedValue = parseLocaleFormattedStringToNumber(
          this.props.text,
        );
        this.props.updateWidgetMetaProperty(
          "text",
          isNaN(deFormattedValue) ? "" : String(deFormattedValue),
        );
      } else {
        if (this.props.text) {
          const formattedValue = formatCurrencyNumber(
            this.props.decimals,
            String(this.props.value),
          );
          this.props.updateWidgetMetaProperty("text", formattedValue);
        }
      }
    } catch (e) {
      log.error(e);
      Sentry.captureException(e);
      this.props.updateWidgetMetaProperty("text", this.props.text);
    }

    super.handleFocusChange(!!isFocused);
  };

  onCurrencyTypeChange = (currencyCode?: string) => {
    const countryCode = getCountryCodeFromCurrencyCode(currencyCode);

    this.props.updateWidgetMetaProperty("countryCode", countryCode);

    if (this.props.renderMode === RenderModes.CANVAS) {
      super.updateWidgetProperty("currencyCode", currencyCode);
    } else {
      this.props.updateWidgetMetaProperty("currencyCode", currencyCode);
    }
  };

  handleKeyDown = (
    e:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    super.handleKeyDown(e);
  };

  onStep = (direction: number) => {
    const value = Number(this.props.value) + direction;
    const formattedValue = formatCurrencyNumber(
      this.props.decimals,
      String(value),
    );
    this.props.updateWidgetMetaProperty("text", String(formattedValue), {
      triggerPropertyName: "onTextChanged",
      dynamicString: this.props.onTextChanged,
      event: {
        type: EventType.ON_TEXT_CHANGE,
      },
    });
  };

  getPageView() {
    const value = this.props.text ?? "";
    const isInvalid =
      "isValid" in this.props && !this.props.isValid && !!this.props.isDirty;
    const currencyCode = this.props.currencyCode;
    const conditionalProps: Partial<CurrencyInputComponentProps> = {};
    conditionalProps.errorMessage = this.props.errorMessage;
    if (this.props.isRequired && value.length === 0) {
      conditionalProps.errorMessage = createMessage(FIELD_REQUIRED_ERROR);
    }

    return (
      <CurrencyInputComponent
        allowCurrencyChange={this.props.allowCurrencyChange}
        autoFocus={this.props.autoFocus}
        compactMode
        currencyCode={currencyCode}
        decimals={this.props.decimals}
        defaultValue={this.props.defaultText}
        disableNewLineOnPressEnterKey={!!this.props.onSubmit}
        disabled={this.props.isDisabled}
        iconAlign={this.props.iconAlign}
        iconName={this.props.iconName}
        inputType={this.props.inputType}
        isInvalid={isInvalid}
        isLoading={this.props.isLoading}
        label={this.props.label}
        labelStyle={this.props.labelStyle}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        onCurrencyTypeChange={this.onCurrencyTypeChange}
        onFocusChange={this.handleFocusChange}
        onKeyDown={this.handleKeyDown}
        onStep={this.onStep}
        onValueChange={this.onValueChange}
        placeholder={this.props.placeholderText}
        renderMode={this.props.renderMode}
        showError={!!this.props.isFocused}
        tooltip={this.props.tooltip}
        value={value}
        widgetId={this.props.widgetId}
        {...conditionalProps}
      />
    );
  }

  static getWidgetType(): WidgetType {
    return "CURRENCY_INPUT_WIDGET";
  }
}

export interface CurrencyInputWidgetProps extends BaseInputWidgetProps {
  countryCode?: string;
  currencyCode?: string;
  noOfDecimals?: number;
  allowCurrencyChange?: boolean;
  decimals?: number;
  defaultText?: number;
}

export default CurrencyInputWidget;
