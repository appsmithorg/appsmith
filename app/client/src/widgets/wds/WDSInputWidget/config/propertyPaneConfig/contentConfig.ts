import { InputTypes } from "components/constants";
import { ValidationTypes } from "constants/WidgetValidation";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";

import * as validations from "./validations";
import {
  inputTypeUpdateHook,
  isInputTypeEmailOrPassword,
  isInputTypeSingleLineOrMultiLine,
} from "../../widget/helper";
import type { InputWidgetProps } from "../../widget/types";

export const propertyPaneContentConfig = [
  {
    sectionName: "Type",
    children: [
      {
        helpText: "Changes the type of data captured in the input",
        propertyName: "inputType",
        label: "Data type",
        controlType: "DROP_DOWN",
        options: [
          {
            label: "Single-line text",
            value: "TEXT",
          },
          {
            label: "Multi-line text",
            value: "MULTI_LINE_TEXT",
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
            label: "Phone number",
            value: "PHONE_NUMBER",
          },
          {
            label: "Currency",
            value: "CURRENCY",
          },
          {
            label: "Date",
            value: "DATE",
          },
        ],
        isBindProperty: false,
        isTriggerProperty: false,
        updateHook: inputTypeUpdateHook,
        dependencies: ["defaultText"],
      },
    ],
  },
  {
    sectionName: "Data",
    children: [
      {
        helpText:
          "Sets the default text of the widget. The text is updated if the default text changes",
        propertyName: "defaultText",
        label: "Value",
        controlType: "INPUT_TEXT",
        placeholderText: "Value",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: validations.defaultValueValidation,
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
    hidden: (props: InputWidgetProps) => {
      return Boolean(props.isReadOnly);
    },
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
        label: "Max characters",
        controlType: "INPUT_TEXT",
        placeholderText: "255",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.NUMBER,
          params: { min: 1, natural: true, passThroughOnZero: false },
        },
        hidden: (props: InputWidgetProps) => {
          return !isInputTypeSingleLineOrMultiLine(props.inputType);
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
            fn: validations.minValueValidation,
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
            fn: validations.maxValueValidation,
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
          return !isInputTypeSingleLineOrMultiLine(props.inputType);
        },
        dependencies: ["inputType"],
      },
    ],
  },
  {
    sectionName: "General",
    children: [
      {
        propertyName: "shouldAllowAutofill",
        label: "Allow autofill",
        helpText: "Allow users to autofill values from browser",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
        hidden: (props: InputWidgetProps) => {
          //should be shown for only inputWidgetV3 and for email or password input types
          return !(
            isInputTypeEmailOrPassword(props?.inputType) &&
            props.type === "INPUT_WIDGET_V3"
          );
        },
        dependencies: ["inputType"],
      },
    ],
  },
];
