import React from "react";
import { WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import InputComponent, { InputComponentProps } from "../component";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  ValidationTypes,
  ValidationResponse,
} from "constants/WidgetValidation";
import {
  createMessage,
  FIELD_REQUIRED_ERROR,
  INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR,
  INPUT_DEFAULT_TEXT_MAX_NUM_ERROR,
  INPUT_DEFAULT_TEXT_MIN_NUM_ERROR,
  INPUT_TEXT_MAX_CHAR_ERROR,
} from "@appsmith/constants/messages";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { GRID_DENSITY_MIGRATION_V1, ICON_NAMES } from "widgets/constants";
import { AutocompleteDataType } from "utils/autocomplete/CodemirrorTernService";
import BaseInputWidget from "widgets/BaseInputWidget";
import { isNil, isNumber, merge, toString } from "lodash";
import derivedProperties from "./parsedDerivedProperties";
import { BaseInputWidgetProps } from "widgets/BaseInputWidget/widget";
import { mergeWidgetConfig } from "utils/helpers";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import { getParsedText } from "./Utilities";
import { Stylesheet } from "entities/AppTheming";
import { isAutoHeightEnabledForWidget } from "widgets/WidgetUtils";

export function defaultValueValidation(
  value: any,
  props: InputWidgetProps,
  _?: any,
): ValidationResponse {
  const STRING_ERROR_MESSAGE = "This value must be string";
  const NUMBER_ERROR_MESSAGE = "This value must be number";
  const EMPTY_ERROR_MESSAGE = "";
  if (_.isObject(value)) {
    return {
      isValid: false,
      parsed: JSON.stringify(value, null, 2),
      messages: [STRING_ERROR_MESSAGE],
    };
  }

  const { inputType } = props;
  let parsed;
  switch (inputType) {
    case "NUMBER":
      if (_.isNil(value)) {
        parsed = null;
      } else {
        parsed = Number(value);
      }
      let isValid, messages;

      if (_.isString(value) && value.trim() === "") {
        /*
         *  When value is emtpy string
         */
        isValid = true;
        messages = [EMPTY_ERROR_MESSAGE];
        parsed = null;
      } else if (!Number.isFinite(parsed)) {
        /*
         *  When parsed value is not a finite numer
         */
        isValid = false;
        messages = [NUMBER_ERROR_MESSAGE];
        parsed = null;
      } else {
        /*
         *  When parsed value is a Number
         */
        isValid = true;
        messages = [EMPTY_ERROR_MESSAGE];
      }

      return {
        isValid,
        parsed,
        messages,
      };
    case "TEXT":
    case "PASSWORD":
    case "EMAIL":
      parsed = value;
      if (!_.isString(parsed)) {
        try {
          parsed = _.toString(parsed);
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
    default:
      return {
        isValid: false,
        parsed: "",
        messages: [STRING_ERROR_MESSAGE],
      };
  }
}

export function minValueValidation(min: any, props: InputWidgetProps, _?: any) {
  const max = props.maxNum;
  const value = min;
  min = Number(min);

  if (_?.isNil(value) || value === "") {
    return {
      isValid: true,
      parsed: undefined,
      messages: [""],
    };
  } else if (!Number.isFinite(min)) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be number"],
    };
  } else if (max !== undefined && min >= max) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be lesser than max value"],
    };
  } else {
    return {
      isValid: true,
      parsed: Number(min),
      messages: [""],
    };
  }
}

export function maxValueValidation(max: any, props: InputWidgetProps, _?: any) {
  const min = props.minNum;
  const value = max;
  max = Number(max);

  if (_?.isNil(value) || value === "") {
    return {
      isValid: true,
      parsed: undefined,
      messages: [""],
    };
  } else if (!Number.isFinite(max)) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be number"],
    };
  } else if (min !== undefined && max <= min) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be greater than min value"],
    };
  } else {
    return {
      isValid: true,
      parsed: Number(max),
      messages: [""],
    };
  }
}
class InputWidget extends BaseInputWidget<InputWidgetProps, WidgetState> {
  static getPropertyPaneContentConfig() {
    return mergeWidgetConfig(
      [
        {
          sectionName: "Data",
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
              ],
              isBindProperty: false,
              isTriggerProperty: false,
            },
            {
              helpText:
                "Sets the default text of the widget. The text is updated if the default text changes",
              propertyName: "defaultText",
              label: "Default Value",
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
            {
              helpText: "Sets maximum allowed text length",
              propertyName: "maxChars",
              label: "Max Characters",
              controlType: "INPUT_TEXT",
              placeholderText: "255",
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.NUMBER,
                params: { min: 1, natural: true, passThroughOnZero: false },
              },
              hidden: (props: InputWidgetProps) => {
                return props.inputType !== InputTypes.TEXT;
              },
              dependencies: ["inputType"],
            },
            {
              helpText: "Sets the minimum allowed value",
              propertyName: "minNum",
              label: "Min",
              controlType: "INPUT_TEXT",
              placeholderText: "1",
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.FUNCTION,
                params: {
                  fn: minValueValidation,
                  expected: {
                    type: "number",
                    example: `1`,
                    autocompleteDataType: AutocompleteDataType.NUMBER,
                  },
                },
              },
              hidden: (props: InputWidgetProps) => {
                return props.inputType !== InputTypes.NUMBER;
              },
              dependencies: ["inputType"],
            },
            {
              helpText: "Sets the maximum allowed value",
              propertyName: "maxNum",
              label: "Max",
              controlType: "INPUT_TEXT",
              placeholderText: "100",
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.FUNCTION,
                params: {
                  fn: maxValueValidation,
                  expected: {
                    type: "number",
                    example: `100`,
                    autocompleteDataType: AutocompleteDataType.NUMBER,
                  },
                },
              },
              hidden: (props: InputWidgetProps) => {
                return props.inputType !== InputTypes.NUMBER;
              },
              dependencies: ["inputType"],
            },
          ],
        },
      ],
      super.getPropertyPaneContentConfig(),
    );
  }

  static getPropertyPaneStyleConfig() {
    return mergeWidgetConfig(
      [
        {
          sectionName: "Icon",
          children: [
            {
              propertyName: "iconName",
              label: "Icon",
              helpText: "Sets the icon to be used in input field",
              controlType: "ICON_SELECT",
              isBindProperty: true,
              isTriggerProperty: false,
              isJSConvertible: true,
              validation: {
                type: ValidationTypes.TEXT,
                params: {
                  allowedValues: ICON_NAMES,
                },
              },
            },
            {
              propertyName: "iconAlign",
              label: "Position",
              helpText: "Sets the icon alignment of input field",
              controlType: "ICON_TABS",
              fullWidth: true,
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
      ],
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

  static getStylesheetConfig(): Stylesheet {
    return {
      accentColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
    };
  }

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

  componentDidUpdate = (prevProps: InputWidgetProps) => {
    if (
      prevProps.inputText !== this.props.inputText &&
      this.props.inputText !== toString(this.props.text)
    ) {
      this.props.updateWidgetMetaProperty(
        "text",
        getParsedText(this.props.inputText, this.props.inputType),
      );
    }

    if (prevProps.inputType !== this.props.inputType) {
      this.props.updateWidgetMetaProperty(
        "text",
        getParsedText(this.props.inputText, this.props.inputType),
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
    /*
     * Ideally text property should be derived property. But widgets
     * with derived properties won't work as expected inside a List
     * widget.
     * TODO(Balaji): Once we refactor the List widget, need to conver
     * text to a derived property.
     */
    this.props.updateWidgetMetaProperty(
      "text",
      getParsedText(value, this.props.inputType),
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
      getParsedText("", this.props.inputType),
    );
  };

  getPageView() {
    const value = this.props.inputText ?? "";
    let isInvalid = false;
    if (this.props.isDirty) {
      isInvalid = "isValid" in this.props && !this.props.isValid;
    } else {
      isInvalid = false;
    }

    const conditionalProps: Partial<InputComponentProps> = {};
    conditionalProps.errorMessage = this.props.errorMessage;
    if (this.props.isRequired && value.length === 0) {
      conditionalProps.errorMessage = createMessage(FIELD_REQUIRED_ERROR);
    }

    if (!isNil(this.props.maxNum)) {
      conditionalProps.maxNum = this.props.maxNum;
    }

    if (!isNil(this.props.minNum)) {
      conditionalProps.minNum = this.props.minNum;
    }

    if (this.props.inputType === InputTypes.TEXT && this.props.maxChars) {
      // pass maxChars only for Text type inputs, undefined for other types
      conditionalProps.maxChars = this.props.maxChars;
      if (
        this.props.defaultText &&
        this.props.defaultText.toString().length > this.props.maxChars
      ) {
        isInvalid = true;
        conditionalProps.errorMessage = createMessage(
          INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR,
          this.props.maxChars,
        );
      } else if (value && value.length > this.props.maxChars) {
        isInvalid = true;
        conditionalProps.errorMessage = createMessage(
          INPUT_TEXT_MAX_CHAR_ERROR,
          this.props.maxChars,
        );
      }
    }

    if (
      this.props.inputType === InputTypes.NUMBER &&
      isNumber(this.props.defaultText)
    ) {
      // check the default text is neither greater than max nor less than min value.
      if (
        !isNil(this.props.minNum) &&
        this.props.minNum > Number(this.props.defaultText)
      ) {
        isInvalid = true;
        conditionalProps.errorMessage = createMessage(
          INPUT_DEFAULT_TEXT_MIN_NUM_ERROR,
        );
      } else if (
        !isNil(this.props.maxNum) &&
        this.props.maxNum < Number(this.props.defaultText)
      ) {
        isInvalid = true;
        conditionalProps.errorMessage = createMessage(
          INPUT_DEFAULT_TEXT_MAX_NUM_ERROR,
        );
      }
    }
    const minInputSingleLineHeight =
      this.props.label || this.props.tooltip
        ? // adjust height for label | tooltip extra div
          GRID_DENSITY_MIGRATION_V1 + 4
        : // GRID_DENSITY_MIGRATION_V1 used to adjust code as per new scaled canvas.
          GRID_DENSITY_MIGRATION_V1;

    return (
      <InputComponent
        accentColor={this.props.accentColor}
        // show label and Input side by side if true
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
        defaultValue={this.props.defaultText}
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
        multiline={
          (this.props.bottomRow - this.props.topRow) /
            minInputSingleLineHeight >
            1 && this.props.inputType === InputTypes.TEXT
        }
        onFocusChange={this.handleFocusChange}
        onKeyDown={this.handleKeyDown}
        onValueChange={this.onValueChange}
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
    return "INPUT_WIDGET_V2";
  }
}

export interface InputWidgetProps extends BaseInputWidgetProps {
  defaultText?: string | number;
  maxChars?: number;
  isSpellCheck?: boolean;
  maxNum?: number;
  minNum?: number;
  inputText: string;
}

export default InputWidget;
