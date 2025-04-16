import React from "react";
import type { WidgetState } from "widgets/BaseWidget";
import type { PhoneInputComponentProps } from "../component";
import PhoneInputComponent from "../component";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { ValidationResponse } from "constants/WidgetValidation";
import { ValidationTypes } from "constants/WidgetValidation";
import { createMessage, FIELD_REQUIRED_ERROR } from "ee/constants/messages";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import {
  getCountryCode,
  ISDCodeDropdownOptions,
} from "../component/ISDCodeDropdown";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import _ from "lodash";
import BaseInputWidget from "widgets/BaseInputWidget";
import derivedProperties from "./parsedDerivedProperties";
import type { BaseInputWidgetProps } from "widgets/BaseInputWidget/widget";
import { mergeWidgetConfig } from "utils/helpers";
import type { CountryCode } from "libphonenumber-js";
import { AsYouType, parseIncompletePhoneNumber } from "libphonenumber-js";
import log from "loglevel";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import {
  isAutoHeightEnabledForWidget,
  DefaultAutocompleteDefinitions,
  isCompactMode,
} from "widgets/WidgetUtils";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import { LabelPosition } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { DynamicHeight } from "utils/WidgetFeatures";
import { getDefaultISDCode } from "../component/ISDCodeDropdown";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import captureException from "instrumentation/sendFaroErrors";

export function defaultValueValidation(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  props: PhoneInputWidgetProps,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _?: any,
): ValidationResponse {
  const STRING_ERROR_MESSAGE = {
    name: "TypeError",
    message: "This value must be string",
  };
  const EMPTY_ERROR_MESSAGE = { name: "", message: "" };

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
  static type = "PHONE_INPUT_WIDGET";

  static getConfig() {
    return {
      name: "Phone Input",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.INPUTS],
      needsMeta: true,
      searchTags: ["call"],
    };
  }

  static getFeatures() {
    return {
      dynamicHeight: {
        sectionIndex: 3,
        defaultValue: DynamicHeight.FIXED,
        active: true,
      },
    };
  }

  static getDefaults() {
    return {
      ...BaseInputWidget.getDefaults(),
      widgetName: "PhoneInput",
      version: 1,
      rows: 7,
      labelPosition: LabelPosition.Top,
      defaultDialCode: getDefaultISDCode().dial_code,
      allowDialCodeChange: false,
      allowFormatting: true,
      responsiveBehavior: ResponsiveBehavior.Fill,
      minWidth: FILL_WIDGET_MIN_WIDTH,
    };
  }

  static getAutoLayoutConfig() {
    return {
      disabledPropsDefaults: {
        labelPosition: LabelPosition.Top,
        labelTextSize: "0.875rem",
      },
      defaults: {
        rows: 6.6,
      },
      autoDimension: {
        height: true,
      },
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "160px",
            };
          },
        },
      ],
      disableResizeHandles: {
        vertical: true,
      },
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: {},
        minWidth: { base: "160px" },
      },
    };
  }

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
              label: "Default value",
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
              label: "Default country code",
              enableSearch: true,
              dropdownHeight: "156px",
              controlType: "DROP_DOWN",
              searchPlaceholderText: "Search by code or country name",
              options: ISDCodeDropdownOptions,
              virtual: true,
              isJSConvertible: true,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.TEXT,
              },
            },
            {
              propertyName: "allowDialCodeChange",
              label: "Change country code",
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

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "An input text field is used to capture a phone number. Inputs are used in forms and can have custom validations.",
      "!url": "https://docs.appsmith.com/widget-reference/phone-input",
      text: {
        "!type": "string",
        "!doc": "The text value of the input",
        "!url": "https://docs.appsmith.com/widget-reference/phone-input",
      },
      value: {
        "!type": "string",
        "!doc": "The unformatted text value of the input",
        "!url": "https://docs.appsmith.com/widget-reference/phone-input",
      },
      isValid: "bool",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      isDisabled: "bool",
      countryCode: {
        "!type": "string",
        "!doc": "Selected country code for Phone Number",
      },
      dialCode: {
        "!type": "string",
        "!doc": "Selected dialing code for Phone Number",
      },
    };
  }

  static getPropertyPaneStyleConfig() {
    return super.getPropertyPaneStyleConfig();
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{(() => {${derivedProperties.isValid}})()}}`,
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        captureException(e, { errorName: "PhoneInputWidget" });
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
        setText: {
          path: "defaultText",
          type: "string",
        },
      },
    };
  }

  getWidgetView() {
    const value = this.props.text ?? "";
    const isInvalid =
      "isValid" in this.props && !this.props.isValid && !!this.props.isDirty;
    const countryCode = this.props.countryCode;
    const conditionalProps: Partial<PhoneInputComponentProps> = {};

    conditionalProps.errorMessage = this.props.errorMessage;

    if (this.props.isRequired && value.length === 0) {
      conditionalProps.errorMessage = createMessage(FIELD_REQUIRED_ERROR);
    }

    const { componentHeight } = this.props;

    return (
      <PhoneInputComponent
        accentColor={this.props.accentColor}
        allowDialCodeChange={this.props.allowDialCodeChange}
        autoFocus={this.props.autoFocus}
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        compactMode={isCompactMode(componentHeight)}
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
        labelWidth={this.props.labelComponentWidth}
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
}

export interface PhoneInputWidgetProps extends BaseInputWidgetProps {
  dialCode?: string;
  countryCode?: CountryCode;
  defaultText?: string;
  allowDialCodeChange: boolean;
}

export default PhoneInputWidget;
