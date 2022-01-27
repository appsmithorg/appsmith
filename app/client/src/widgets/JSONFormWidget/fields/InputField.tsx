import React from "react";

import BaseInputField, {
  BaseInputComponentProps,
  parseRegex,
} from "./BaseInputField";
import { BaseFieldComponentProps, FieldType } from "../constants";
import { isNil } from "lodash";

type InputComponentProps = BaseInputComponentProps & {
  iconName?: string;
  iconAlign?: string;
};

export type InputFieldProps = BaseFieldComponentProps<InputComponentProps>;

const COMPONENT_DEFAULT_VALUES: InputComponentProps = {
  iconAlign: "left",
  isDisabled: false,
  isRequired: false,
  isSpellCheck: false,
  isVisible: true,
  label: "",
};

const getInputHTMLType = (fieldType: FieldType) => {
  switch (fieldType) {
    case FieldType.NUMBER:
      return "NUMBER";
    case FieldType.EMAIL:
      return "EMAIL";
    case FieldType.PASSWORD:
      return "PASSWORD";
    default:
      return "TEXT";
  }
};

const isValid = (
  schemaItem: InputFieldProps["schemaItem"],
  inputValue: string,
) => {
  let hasValidValue, value, isEmpty;
  switch (schemaItem.fieldType) {
    case FieldType.NUMBER:
      try {
        isEmpty = isNil(inputValue);
        value = Number(inputValue);
        hasValidValue = Number.isFinite(value);
        break;
      } catch (e) {
        return false;
      }
    default:
      value = inputValue;
      isEmpty = !value;
      hasValidValue = !!value;
      break;
  }

  if (!schemaItem.isRequired && isEmpty) {
    return true;
  }
  if (schemaItem.isRequired && !hasValidValue) {
    return false;
  }

  if (typeof schemaItem.validation === "boolean" && !schemaItem.validation) {
    return false;
  }

  const parsedRegex = parseRegex(schemaItem.regex);

  switch (schemaItem.fieldType) {
    case FieldType.EMAIL:
      const emailRegex = new RegExp(
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      );
      if (!emailRegex.test(inputValue)) {
        /* email should conform to generic email regex */
        return false;
      } else if (parsedRegex) {
        /* email should conform to user specified regex */
        return parsedRegex.test(inputValue);
      } else {
        return true;
      }
    case FieldType.NUMBER:
      if (
        !isNil(schemaItem.maxNum) &&
        Number.isFinite(schemaItem.maxNum) &&
        schemaItem.maxNum < value
      ) {
        return false;
      } else if (
        !isNil(schemaItem.minNum) &&
        Number.isFinite(schemaItem.minNum) &&
        schemaItem.minNum > value
      ) {
        return false;
      } else if (parsedRegex) {
        return parsedRegex.test(inputValue);
      } else {
        return hasValidValue;
      }
    default:
      if (parsedRegex) {
        return parsedRegex.test(inputValue);
      } else {
        return hasValidValue;
      }
  }
};

function InputField(props: InputFieldProps) {
  const { schemaItem } = props;

  const transformValue = (inputValue: string) => {
    let value;
    switch (schemaItem.fieldType) {
      case FieldType.NUMBER:
        try {
          if (inputValue === "") {
            value = null;
          } else if (inputValue === "-") {
            value = "-";
          } else if (/\.$/.test(inputValue)) {
            value = inputValue;
          } else {
            value = Number(inputValue);

            if (isNaN(value)) {
              value = undefined;
            }
          }
          break;
        } catch (e) {
          value = inputValue;
        }
        break;
      default:
        value = inputValue;
        break;
    }

    return {
      text: inputValue,
      value,
    };
  };

  return (
    <BaseInputField
      {...props}
      inputHTMLType={getInputHTMLType(schemaItem.fieldType)}
      isValid={isValid}
      transformValue={transformValue}
    />
  );
}

InputField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default InputField;
