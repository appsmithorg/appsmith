import { InputTypes } from "components/constants";
import { ValidationTypes } from "constants/WidgetValidation";
import { checkInputTypeTextByProps } from "widgets/BaseInputWidget/utils";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";

import * as validations from "./validations";
import { inputTypeUpdateHook } from "../helper";
import type { InputWidgetProps } from "../types";

export const propertyPaneContentConfig = [
  {
    sectionName: "Data",
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
        ],
        isBindProperty: false,
        isTriggerProperty: false,
        updateHook: inputTypeUpdateHook,
        dependencies: ["dynamicHeight"],
      },
      {
        helpText:
          "Sets the default text of the widget. The text is updated if the default text changes",
        propertyName: "defaultText",
        label: "Default value",
        controlType: "INPUT_TEXT",
        placeholderText: "John Doe",
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
          return !checkInputTypeTextByProps(props);
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
    ],
  },
];
