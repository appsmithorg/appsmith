import React from "react";
import { WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import PhoneInputComponent, { PhoneInputComponentProps } from "../component";
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
  getCountryCode,
  ISDCodeDropdownOptions,
} from "../component/ISDCodeDropdown";
import { AutocompleteDataType } from "utils/autocomplete/CodemirrorTernService";
import _ from "lodash";
import BaseInputWidget from "widgets/BaseInputWidget";
import derivedProperties from "./parsedDerivedProperties";
import { BaseInputWidgetProps } from "widgets/BaseInputWidget/widget";
import { mergeWidgetConfig } from "utils/helpers";
import {
  AsYouType,
  CountryCode,
  parseIncompletePhoneNumber,
} from "libphonenumber-js";
import * as Sentry from "@sentry/react";
import log from "loglevel";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { Stylesheet } from "entities/AppTheming";
import { isAutoHeightEnabledForWidget } from "widgets/WidgetUtils";

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
  static getPropertyPaneContentConfig() {
    return mergeWidgetConfig(
      [
        {
          sectionName: "Data",
          children: [
            {
              helpText:
                "Sets the default text of the widget. The text is updated if the default text changes",
              propertyName: "defaultText",
              label: "Default Value",
              controlType: "INPUT_TEXT",
              placeholderText: "(000) 000-0000",
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.FUNCTION,
                params: {
                  fn: defaultValueValidation,
                  expected: {
                    type: "string",
                    example: `(000) 000-0000`,
                    autocompleteDataType: AutocompleteDataType.STRING,
                  },
                },
              },
            },
            {
              helpText: "Changes the country code",
              propertyName: "defaultDialCode",
              label: "Default Country Code",
              enableSearch: true,
              dropdownHeight: "156px",
              controlType: "DROP_DOWN",
              searchPlaceholderText: "Search by code or country name",
              options: ISDCodeDropdownOptions,
              isJSConvertible: true,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.TEXT,
              },
            },
            {
              propertyName: "allowDialCodeChange",
              label: "Change Country Code",
              helpText: "Search by country",
              controlType: "SWITCH",
              isJSConvertible: true,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: { type: ValidationTypes.BOOLEAN },
            },
          ],
        },
        {
          sectionName: "Label",
          children: [],
        },
        {
          sectionName: "Validation",
          children: [
            {
              propertyName: "isRequired",
              label: "Required",
              helpText: "Makes input to the widget mandatory",
              controlType: "SWITCH",
              isJSConvertible: true,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: { type: ValidationTypes.BOOLEAN },
            },
          ],
        },
        // {
        //   sectionName: "General",
        //   children: [
        //     {
        //       propertyName: "allowFormatting",
        //       label: "Enable Formatting",
        //       helpText: "Formats the phone number as per the country selected",
        //       controlType: "SWITCH",
        //       isJSConvertible: true,
        //       isBindProperty: true,
        //       isTriggerProperty: false,
        //       validation: { type: ValidationTypes.BOOLEAN },
        //     },
        //   ],
        // },
      ],
      super.getPropertyPaneContentConfig(),
    );
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
    return _.merge(super.getMetaPropertiesMap(), {
      value: "",
      dialCode: undefined,
    });
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return _.merge(super.getDefaultPropertiesMap(), {
      dialCode: "defaultDialCode",
    });
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      accentColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
    };
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

      this.props.updateWidgetMetaProperty(
        "value",
        parseIncompletePhoneNumber(formattedValue),
      );
      this.props.updateWidgetMetaProperty("text", formattedValue);
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
    if (value && value.length > this.props.text.length) {
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

  handleFocusChange = (focusState: boolean) => {
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
    super.handleFocusChange(focusState);
  };

  handleKeyDown = (
    e:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    super.handleKeyDown(e);
  };

  resetWidgetText = () => {
    super.resetWidgetText();
    this.props.updateWidgetMetaProperty("value", undefined);
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
        accentColor={this.props.accentColor}
        allowDialCodeChange={this.props.allowDialCodeChange}
        autoFocus={this.props.autoFocus}
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        compactMode={
          !(
            (this.props.bottomRow - this.props.topRow) /
              GRID_DENSITY_MIGRATION_V1 >
            1
          )
        }
        countryCode={countryCode}
        defaultValue={this.props.defaultText}
        dialCode={this.props.dialCode}
        disableNewLineOnPressEnterKey={!!this.props.onSubmit}
        disabled={this.props.isDisabled}
        iconAlign={this.props.iconAlign}
        iconName={this.props.iconName}
        inputType={this.props.inputType}
        isDynamicHeightEnabled={isAutoHeightEnabledForWidget(this.props)}
        isInvalid={isInvalid}
        isLoading={this.props.isLoading}
        label={this.props.label}
        labelAlignment={this.props.labelAlignment}
        labelPosition={this.props.labelPosition}
        labelStyle={this.props.labelStyle}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        labelWidth={this.getLabelWidth()}
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
