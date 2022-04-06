import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { Alignment } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
import { WidgetType, RenderModes, TextSize } from "constants/WidgetConstants";
import InputComponent, { InputComponentProps } from "../component";
import {
  EventType,
  ExecutionResult,
} from "constants/AppsmithActionConstants/ActionConstants";
import {
  ValidationTypes,
  ValidationResponse,
} from "constants/WidgetValidation";
import {
  createMessage,
  FIELD_REQUIRED_ERROR,
  INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR,
} from "@appsmith/constants/messages";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { InputType, InputTypes } from "../constants";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { ISDCodeDropdownOptions } from "../component/ISDCodeDropdown";
import { CurrencyDropdownOptions } from "../component/CurrencyCodeDropdown";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import {
  formatCurrencyNumber,
  getDecimalSeparator,
  getLocale,
} from "../component/utilities";

export function defaultValueValidation(
  value: any,
  props: InputWidgetProps,
  _?: any,
): ValidationResponse {
  const { inputType } = props;
  if (
    inputType === "INTEGER" ||
    inputType === "NUMBER" ||
    inputType === "CURRENCY" ||
    inputType === "PHONE_NUMBER"
  ) {
    let parsed: number | undefined = Number(value);

    if (typeof value === "string") {
      if (value.trim() === "") {
        return {
          isValid: true,
          parsed: undefined,
          messages: [""],
        };
      }

      if (!Number.isFinite(parsed)) {
        return {
          isValid: false,
          parsed: undefined,
          messages: ["This value must be a number"],
        };
      }
    }

    if (isNaN(parsed)) {
      parsed = undefined;
    }

    return {
      isValid: true,
      parsed,
      messages: [""],
    };
  }
  if (_.isObject(value)) {
    return {
      isValid: false,
      parsed: JSON.stringify(value, null, 2),
      messages: ["This value must be string"],
    };
  }
  let parsed = value;
  const isValid = _.isString(parsed);
  if (!isValid) {
    try {
      parsed = _.toString(parsed);
    } catch (e) {
      return {
        isValid: false,
        parsed: "",
        messages: ["This value must be string"],
      };
    }
  }
  return {
    isValid,
    parsed: parsed,
    messages: [""],
  };
}

class InputWidget extends BaseWidget<InputWidgetProps, WidgetState> {
  constructor(props: InputWidgetProps) {
    super(props);
    this.state = {
      text: props.text,
    };
  }
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Changes the type of data captured in the input",
            propertyName: "inputType",
            label: "Data Type",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Text",
                value: "TEXT",
              },
              {
                label: "Number",
                value: "NUMBER",
              },
              {
                label: "Password",
                value: "PASSWORD",
              },
              {
                label: "Email",
                value: "EMAIL",
              },
              {
                label: "Currency",
                value: "CURRENCY",
              },
              {
                label: "Phone Number",
                value: "PHONE_NUMBER",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "allowCurrencyChange",
            label: "Allow currency change",
            helpText: "Search by currency or country",
            controlType: "SWITCH",
            isJSConvertible: false,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
            hidden: (props: InputWidgetProps) => {
              return props.inputType !== InputTypes.CURRENCY;
            },
            dependencies: ["inputType"],
          },
          {
            helpText: "Changes the country code",
            propertyName: "phoneNumberCountryCode",
            label: "Default Country Code",
            enableSearch: true,
            dropdownHeight: "195px",
            controlType: "DROP_DOWN",
            placeholderText: "Search by code or country name",
            options: ISDCodeDropdownOptions,
            hidden: (props: InputWidgetProps) => {
              return props.inputType !== InputTypes.PHONE_NUMBER;
            },
            dependencies: ["inputType"],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            helpText: "Changes the type of currency",
            propertyName: "currencyCountryCode",
            label: "Currency",
            enableSearch: true,
            dropdownHeight: "195px",
            controlType: "DROP_DOWN",
            placeholderText: "Search by code or name",
            options: CurrencyDropdownOptions,
            hidden: (props: InputWidgetProps) => {
              return props.inputType !== InputTypes.CURRENCY;
            },
            dependencies: ["inputType"],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            helpText: "No. of decimals in currency input",
            propertyName: "decimalsInCurrency",
            label: "Decimals",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "1",
                value: 1,
              },
              {
                label: "2",
                value: 2,
              },
            ],
            hidden: (props: InputWidgetProps) => {
              return props.inputType !== InputTypes.CURRENCY;
            },
            dependencies: ["inputType"],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            helpText: "Sets maximum allowed text length",
            propertyName: "maxChars",
            label: "Max Chars",
            controlType: "INPUT_TEXT",
            placeholderText: "255",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
            hidden: (props: InputWidgetProps) => {
              return props.inputType !== InputTypes.TEXT;
            },
            dependencies: ["inputType"],
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
                  type: "string or number",
                  example: `John | 123`,
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
            dependencies: ["inputType"],
          },
          {
            helpText:
              "Adds a validation to the input which displays an error on failure",
            propertyName: "regex",
            label: "Regex",
            controlType: "INPUT_TEXT",
            placeholderText: "^\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}$",
            inputType: "TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.REGEX },
          },
          {
            helpText: "Sets the input validity based on a JS expression",
            propertyName: "validation",
            label: "Valid",
            controlType: "INPUT_TEXT",
            placeholderText: "{{ Input1.text.length > 0 }}",
            inputType: "TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText:
              "The error message to display if the regex or valid property check fails",
            propertyName: "errorMessage",
            label: "Error Message",
            controlType: "INPUT_TEXT",
            placeholderText: "Not a valid email!",
            inputType: "TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Sets a placeholder text for the input",
            propertyName: "placeholderText",
            label: "Placeholder",
            controlType: "INPUT_TEXT",
            placeholderText: "Placeholder",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Sets the label text of the widget",
            propertyName: "label",
            label: "Label",
            controlType: "INPUT_TEXT",
            placeholderText: "Name:",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Show help text or details about current input",
            propertyName: "tooltip",
            label: "Tooltip",
            controlType: "INPUT_TEXT",
            placeholderText: "Passwords must be atleast 6 chars",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
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
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Disables input to this widget",
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "animateLoading",
            label: "Animate Loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Clears the input value after submit",
            propertyName: "resetOnSubmit",
            label: "Reset on submit",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Focus input automatically on load",
            propertyName: "autoFocus",
            label: "Auto Focus",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isSpellCheck",
            label: "Spellcheck",
            helpText:
              "Defines whether the text input may be checked for spelling errors",
            controlType: "SWITCH",
            isJSConvertible: false,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
            hidden: (props: InputWidgetProps) => {
              return props.inputType !== InputTypes.TEXT;
            },
            dependencies: ["inputType"],
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText: "Triggers an action when the text is changed",
            propertyName: "onTextChanged",
            label: "onTextChanged",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText:
              "Triggers an action on submit (when the enter key is pressed)",
            propertyName: "onSubmit",
            label: "onSubmit",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
      {
        sectionName: "Label Styles",
        children: [
          {
            propertyName: "labelTextColor",
            label: "Text Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^(?![<|{{]).+/,
              },
            },
          },
          {
            propertyName: "labelTextSize",
            label: "Text Size",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Heading 1",
                value: "HEADING1",
                subText: "24px",
                icon: "HEADING_ONE",
              },
              {
                label: "Heading 2",
                value: "HEADING2",
                subText: "18px",
                icon: "HEADING_TWO",
              },
              {
                label: "Heading 3",
                value: "HEADING3",
                subText: "16px",
                icon: "HEADING_THREE",
              },
              {
                label: "Paragraph",
                value: "PARAGRAPH",
                subText: "14px",
                icon: "PARAGRAPH",
              },
              {
                label: "Paragraph 2",
                value: "PARAGRAPH2",
                subText: "12px",
                icon: "PARAGRAPH_TWO",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "labelStyle",
            label: "Label Font Style",
            controlType: "BUTTON_TABS",
            options: [
              {
                icon: "BOLD_FONT",
                value: "BOLD",
              },
              {
                icon: "ITALICS_FONT",
                value: "ITALIC",
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Icon Options",
        hidden: (props: InputWidgetProps) => {
          const { inputType } = props;
          return inputType === "CURRENCY" || inputType === "PHONE_NUMBER";
        },
        dependencies: ["inputType"],
        children: [
          {
            propertyName: "iconName",
            label: "Icon",
            helpText: "Sets the icon to be used in input field",
            controlType: "ICON_SELECT",
            isBindProperty: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "iconAlign",
            label: "Icon alignment",
            helpText: "Sets the icon alignment of input field",
            controlType: "ICON_TABS",
            options: [
              {
                icon: "VERTICAL_LEFT",
                value: "left",
              },
              {
                icon: "VERTICAL_RIGHT",
                value: "right",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
            hidden: (props: InputWidgetProps) => !props.iconName,
            dependencies: ["iconName"],
          },
        ],
      },
    ];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{
        (function(){
          if (!this.isRequired && !this.text) {
            return true
          }
          if(this.isRequired && !this.text){
            return false
          }
          if (typeof this.validation === "boolean" && !this.validation) {
            return false;
          }
          let parsedRegex = null;
          if (this.regex) {
            /*
            * break up the regexp pattern into 4 parts: given regex, regex prefix , regex pattern, regex flags
            * Example /test/i will be split into ["/test/gi", "/", "test", "gi"]
            */
            const regexParts = this.regex.match(/(\\/?)(.+)\\1([a-z]*)/i);

            if (!regexParts) {
              parsedRegex = new RegExp(this.regex);
            } else {
              /*
              * if we don't have a regex flags (gmisuy), convert provided string into regexp directly
              /*
              if (regexParts[3] && !/^(?!.*?(.).*?\\1)[gmisuy]+$/.test(regexParts[3])) {
                parsedRegex = RegExp(this.regex);
              }
              /*
              * if we have a regex flags, use it to form regexp
              */
              parsedRegex = new RegExp(regexParts[2], regexParts[3]);
            }
          }
          if (this.inputType === "EMAIL") {
            const emailRegex = new RegExp(/^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$/);
            return emailRegex.test(this.text);
          }
          else if (
            this.inputType === "NUMBER" ||
            this.inputType === "INTEGER" ||
            this.inputType === "CURRENCY" ||
            this.inputType === "PHONE_NUMBER"
          ) {
            let value = this.text.split(",").join("");
            if (parsedRegex) {
              return parsedRegex.test(value);
            }
            if (this.isRequired) {
              return !(value === '' || isNaN(value));
            }

            return (value === '' || !isNaN(value || ''));
          }
          else if (this.isRequired) {
            if(this.text && this.text.length) {
              if (parsedRegex) {
                return parsedRegex.test(this.text)
              } else {
                return true;
              }
            } else {
              return false;
            }
          }
          if (parsedRegex) {
            return parsedRegex.test(this.text)
          } else {
            return true;
          }
        })()
      }}`,
      value: `{{this.text}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      text: "defaultText",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      text: undefined,
      isFocused: false,
      isDirty: false,
      selectedCurrencyType: undefined,
      selectedCountryCode: undefined,
    };
  }

  onValueChange = (value: string) => {
    this.props.updateWidgetMetaProperty("text", value, {
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

  onCurrencyTypeChange = (code?: string) => {
    const currencyCountryCode = code;
    if (this.props.renderMode === RenderModes.CANVAS) {
      super.updateWidgetProperty("currencyCountryCode", currencyCountryCode);
    } else {
      this.props.updateWidgetMetaProperty(
        "selectedCurrencyCountryCode",
        currencyCountryCode,
      );
    }
  };

  onISDCodeChange = (code?: string) => {
    const countryCode = code;
    if (this.props.renderMode === RenderModes.CANVAS) {
      super.updateWidgetProperty("phoneNumberCountryCode", countryCode);
    } else {
      this.props.updateWidgetMetaProperty(
        "selectedPhoneNumberCountryCode",
        countryCode,
      );
    }
  };

  handleFocusChange = (focusState: boolean) => {
    /**
     * Reason for disabling drag on focusState: true:
     * 1. In Firefox, draggable="true" property on the parent element
     *    or <input /> itself, interferes with some <input /> element's events
     *    Bug Ref - https://bugzilla.mozilla.org/show_bug.cgi?id=800050
     *              https://bugzilla.mozilla.org/show_bug.cgi?id=1189486
     *
     *  Eg - input with draggable="true", double clicking the text; won't highlight the text
     *
     * 2. Dragging across the text (for text selection) in input won't cause the widget to drag.
     */
    this.props.updateWidgetMetaProperty("dragDisabled", focusState);
    this.props.updateWidgetMetaProperty("isFocused", focusState);
  };

  onSubmitSuccess = (result: ExecutionResult) => {
    if (result.success && this.props.resetOnSubmit) {
      this.props.updateWidgetMetaProperty("text", "", {
        triggerPropertyName: "onSubmit",
        dynamicString: this.props.onTextChanged,
        event: {
          type: EventType.ON_TEXT_CHANGE,
        },
      });
    }
  };

  handleKeyDown = (
    e:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    const { isValid, onSubmit } = this.props;
    const isEnterKey = e.key === "Enter" || e.keyCode === 13;
    if (isEnterKey && onSubmit && isValid) {
      super.executeAction({
        triggerPropertyName: "onSubmit",
        dynamicString: onSubmit,
        event: {
          type: EventType.ON_SUBMIT,
          callback: this.onSubmitSuccess,
        },
      });
    }
  };

  getFormattedText = () => {
    if (this.props.isFocused || this.props.inputType !== InputTypes.CURRENCY) {
      return this.props.text !== undefined ? this.props.text : "";
    }
    if (this.props.text === "" || this.props.text === undefined) return "";
    const valueToFormat = String(this.props.text);

    const locale = getLocale();
    const decimalSeparator = getDecimalSeparator(locale);
    return formatCurrencyNumber(
      this.props.decimalsInCurrency,
      valueToFormat,
      decimalSeparator,
    );
  };

  getPageView() {
    const value = this.getFormattedText();
    let isInvalid =
      "isValid" in this.props && !this.props.isValid && !!this.props.isDirty;
    const currencyCountryCode = this.props.selectedCurrencyCountryCode
      ? this.props.selectedCurrencyCountryCode
      : this.props.currencyCountryCode;
    const phoneNumberCountryCode = this.props.selectedPhoneNumberCountryCode
      ? this.props.selectedPhoneNumberCountryCode
      : this.props.phoneNumberCountryCode;
    const conditionalProps: Partial<InputComponentProps> = {};
    conditionalProps.errorMessage = this.props.errorMessage;
    if (this.props.isRequired && value.length === 0) {
      conditionalProps.errorMessage = createMessage(FIELD_REQUIRED_ERROR);
    }
    if (this.props.inputType === "TEXT" && this.props.maxChars) {
      // pass maxChars only for Text type inputs, undefined for other types
      conditionalProps.maxChars = this.props.maxChars;
      if (
        this.props.defaultText &&
        this.props.defaultText.toString().length > this.props.maxChars
      ) {
        isInvalid = true;
        conditionalProps.errorMessage = createMessage(
          INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR,
        );
      }
    }
    if (this.props.maxNum) conditionalProps.maxNum = this.props.maxNum;
    if (this.props.minNum) conditionalProps.minNum = this.props.minNum;
    const minInputSingleLineHeight =
      this.props.label || this.props.tooltip
        ? // adjust height for label | tooltip extra div
          GRID_DENSITY_MIGRATION_V1 + 4
        : // GRID_DENSITY_MIGRATION_V1 used to adjust code as per new scaled canvas.
          GRID_DENSITY_MIGRATION_V1;

    return (
      <InputComponent
        allowCurrencyChange={this.props.allowCurrencyChange}
        autoFocus={this.props.autoFocus}
        // show label and Input side by side if true
        compactMode={
          !(
            (this.props.bottomRow - this.props.topRow) /
              GRID_DENSITY_MIGRATION_V1 >
              1 && this.props.inputType === "TEXT"
          )
        }
        currencyCountryCode={currencyCountryCode}
        decimalsInCurrency={this.props.decimalsInCurrency}
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
        multiline={
          (this.props.bottomRow - this.props.topRow) /
            minInputSingleLineHeight >
            1 && this.props.inputType === "TEXT"
        }
        onCurrencyTypeChange={this.onCurrencyTypeChange}
        onFocusChange={this.handleFocusChange}
        onISDCodeChange={this.onISDCodeChange}
        onKeyDown={this.handleKeyDown}
        onValueChange={this.onValueChange}
        phoneNumberCountryCode={phoneNumberCountryCode}
        placeholder={this.props.placeholderText}
        showError={!!this.props.isFocused}
        spellCheck={!!this.props.isSpellCheck}
        stepSize={1}
        tooltip={this.props.tooltip}
        value={value}
        widgetId={this.props.widgetId}
        {...conditionalProps}
      />
    );
  }

  static getWidgetType(): WidgetType {
    return "INPUT_WIDGET";
  }
}

export interface InputValidator {
  validationRegex: string;
  errorMessage: string;
}
export interface InputWidgetProps extends WidgetProps {
  inputType: InputType;
  currencyCountryCode?: string;
  noOfDecimals?: number;
  allowCurrencyChange?: boolean;
  phoneNumberCountryCode?: string;
  decimalsInCurrency?: number;
  defaultText?: string | number;
  tooltip?: string;
  isDisabled?: boolean;
  validation: boolean;
  text: string;
  regex?: string;
  errorMessage?: string;
  placeholderText?: string;
  maxChars?: number;
  minNum?: number;
  maxNum?: number;
  onTextChanged?: string;
  label: string;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  inputValidators: InputValidator[];
  isValid: boolean;
  focusIndex?: number;
  isAutoFocusEnabled?: boolean;
  isRequired?: boolean;
  isFocused?: boolean;
  isDirty?: boolean;
  autoFocus?: boolean;
  iconName?: IconName;
  iconAlign?: Omit<Alignment, "center">;
  onSubmit?: string;
}

export default InputWidget;
