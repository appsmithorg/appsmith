import React from "react";
import { WidgetState } from "widgets/BaseWidget";
import { RenderModes, WidgetType } from "constants/WidgetConstants";
import PhoneInputComponent, { PhoneInputComponentProps } from "../component";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  ValidationTypes,
  ValidationResponse,
} from "constants/WidgetValidation";
import { createMessage, FIELD_REQUIRED_ERROR } from "constants/messages";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import {
  getCountryCode,
  ISDCodeDropdownOptions,
} from "../component/ISDCodeDropdown";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import _ from "lodash";
import BaseInputWidget from "widgets/BaseInputWidget";
import derivedProperties from "./parsedDerivedProperties";
import { BaseInputWidgetProps } from "widgets/BaseInputWidget/widget";
import { mergeWidgetConfig } from "utils/helpers";
import { AsYouType, CountryCode } from "libphonenumber-js";
import * as Sentry from "@sentry/react";
import log from "loglevel";

export function defaultValueValidation(
  value: any,
  props: PhoneInputWidgetProps,
  _?: any,
): ValidationResponse {
  const STRING_ERROR_MESSAGE = "This value must be string";
  const EMPTY_ERROR_MESSAGE = "";
  if (_.isObject(value)) {
    return {
      isValid: false,
      parsed: JSON.stringify(value, null, 2),
      messages: [STRING_ERROR_MESSAGE],
    };
  }
  let parsed = value;
  if (!_.isString(value)) {
    try {
      parsed = _.toString(value);
    } catch (e) {
      return {
        isValid: false,
        parsed: "",
        messages: [STRING_ERROR_MESSAGE],
      };
    }
  }
  return {
    isValid: _.isString(parsed),
    parsed: parsed,
    messages: [EMPTY_ERROR_MESSAGE],
  };
}

class PhoneInputWidget extends BaseInputWidget<
  PhoneInputWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return mergeWidgetConfig(
      [
        {
          sectionName: "General",
          children: [
            {
              propertyName: "allowDialCodeChange",
              label: "Allow country code change",
              helpText: "Search by country",
              controlType: "SWITCH",
              isJSConvertible: false,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: { type: ValidationTypes.BOOLEAN },
            },
            {
              helpText: "Changes the country code",
              propertyName: "dialCode",
              label: "Default Country Code",
              enableSearch: true,
              dropdownHeight: "195px",
              controlType: "DROP_DOWN",
              placeholderText: "Search by code or country name",
              options: ISDCodeDropdownOptions,
              isJSConvertible: true,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.TEXT,
              },
            },
            {
              helpText:
                "Sets the default text of the widget. The text is updated if the default text changes",
              propertyName: "defaultText",
              label: "Default Text",
              controlType: "INPUT_TEXT",
              placeholderText: "John Doe",
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.FUNCTION,
                params: {
                  fn: defaultValueValidation,
                  expected: {
                    type: "string",
                    example: `000 0000`,
                    autocompleteDataType: AutocompleteDataType.STRING,
                  },
                },
              },
            },
          ],
        },
      ],
      super.getPropertyPaneConfig(),
    );
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return _.merge(super.getDerivedPropertiesMap(), {
      isValid: `{{(() => {${derivedProperties.isValid}})()}}`,
    });
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return _.merge(super.getMetaPropertiesMap());
  }

  componentDidMount() {
    //format the defaultText and store it in text
    if (!!this.props.text) {
      try {
        const dialCode = this.props.dialCode || "+1";
        const countryCode = getCountryCode(dialCode);
        const value = this.props.text;
        const parsedValue: string = new AsYouType(
          countryCode as CountryCode,
        ).input(value);
        this.props.updateWidgetMetaProperty("text", parsedValue);
      } catch (e) {
        log.error(e);
        Sentry.captureException(e);
      }
    }
  }

  componentDidUpdate(prevProps: PhoneInputWidgetProps) {
    if (
      this.props.renderMode === RenderModes.CANVAS &&
      prevProps.dialCode !== this.props.dialCode
    ) {
      this.onISDCodeChange(this.props.dialCode);
    }
  }

  onISDCodeChange = (dialCode?: string) => {
    const countryCode = getCountryCode(dialCode);

    if (this.props.renderMode === RenderModes.CANVAS) {
      super.updateWidgetProperty("dialCode", dialCode);
      super.updateWidgetProperty("countryCode", countryCode);
    } else {
      this.props.updateWidgetMetaProperty("dialCode", dialCode);
      this.props.updateWidgetMetaProperty("countryCode", countryCode);
    }

    if (this.props.text) {
      const parsedValue: string = new AsYouType(
        countryCode as CountryCode,
      ).input(this.props.text);
      this.props.updateWidgetMetaProperty("text", parsedValue);
    }
  };

  onValueChange = (value: string) => {
    const countryCode = this.props.countryCode || "US";
    let parsedValue: string;

    // Don't format as value is typed when user is deleting
    if (value.length > this.props.text.length) {
      parsedValue = new AsYouType(countryCode).input(value);
    } else {
      parsedValue = value;
    }

    this.props.updateWidgetMetaProperty("text", parsedValue, {
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

  handleFocusChange = (focusState: boolean) => {
    super.handleFocusChange(focusState);
  };

  handleKeyDown = (
    e:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    super.handleKeyDown(e);
  };

  getPageView() {
    const value = this.props.text ?? "";
    const isInvalid =
      "isValid" in this.props && !this.props.isValid && !!this.props.isDirty;
    const countryCode = this.props.countryCode;
    const conditionalProps: Partial<PhoneInputComponentProps> = {};
    conditionalProps.errorMessage = this.props.errorMessage;
    if (this.props.isRequired && value.length === 0) {
      conditionalProps.errorMessage = createMessage(FIELD_REQUIRED_ERROR);
    }

    return (
      <PhoneInputComponent
        allowDialCodeChange={this.props.allowDialCodeChange}
        autoFocus={this.props.autoFocus}
        compactMode
        countryCode={countryCode}
        defaultValue={this.props.defaultText}
        dialCode={this.props.dialCode}
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
        onFocusChange={this.handleFocusChange}
        onISDCodeChange={this.onISDCodeChange}
        onKeyDown={this.handleKeyDown}
        onValueChange={this.onValueChange}
        placeholder={this.props.placeholderText}
        showError={!!this.props.isFocused}
        tooltip={this.props.tooltip}
        value={value}
        widgetId={this.props.widgetId}
        {...conditionalProps}
      />
    );
  }

  static getWidgetType(): WidgetType {
    return "PHONE_INPUT_WIDGET";
  }
}

export interface PhoneInputWidgetProps extends BaseInputWidgetProps {
  dialCode?: string;
  countryCode?: CountryCode;
  defaultText?: string;
  allowDialCodeChange: boolean;
}

export default PhoneInputWidget;
