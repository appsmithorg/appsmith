import React, { useCallback } from "react";

import BaseInputField, {
  BaseInputComponentProps,
  EMAIL_REGEX,
  parseRegex,
} from "./BaseInputField";
import { BaseFieldComponentProps, FieldType } from "../constants";
import { isNil } from "lodash";
import { isEmpty } from "../helper";
import { BASE_LABEL_TEXT_SIZE } from "../component/FieldLabel";

type InputComponentProps = BaseInputComponentProps & {
  iconName?: string;
  iconAlign?: string;
};

export type InputFieldProps = BaseFieldComponentProps<InputComponentProps>;

type IsValidOptions = {
  fieldType: FieldType;
};

const COMPONENT_DEFAULT_VALUES: InputComponentProps = {
  iconAlign: "left",
  isDisabled: false,
  isRequired: false,
  isSpellCheck: false,
  isVisible: true,
  labelTextSize: BASE_LABEL_TEXT_SIZE,
  label: "",
};

const getInputHTMLType = (fieldType: FieldType) => {
  switch (fieldType) {
    case FieldType.NUMBER_INPUT:
      return "NUMBER";
    case FieldType.EMAIL_INPUT:
      return "EMAIL";
    case FieldType.PASSWORD_INPUT:
      return "PASSWORD";
    default:
      return "TEXT";
  }
};

export const isValid = (
  schemaItem: InputFieldProps["schemaItem"],
  inputValue?: string | null,
) => {
  let hasValidValue, value;
  switch (schemaItem.fieldType) {
    case FieldType.NUMBER_INPUT:
      try {
        value = Number(inputValue);
        hasValidValue = !isEmpty(inputValue) && Number.isFinite(value);
        break;
      } catch (e) {
        return false;
      }
    default:
      value = inputValue;
      hasValidValue = !isEmpty(inputValue);
      break;
  }

  if (schemaItem.isRequired && !hasValidValue) {
    return false;
  }

  if (isEmpty(inputValue)) {
    return true;
  }

  if (typeof schemaItem.validation === "boolean" && !schemaItem.validation) {
    return false;
  }

  const parsedRegex = parseRegex(schemaItem.regex);

  switch (schemaItem.fieldType) {
    case FieldType.EMAIL_INPUT:
      if (!EMAIL_REGEX.test(inputValue)) {
        /* email should conform to generic email regex */
        return false;
      } else if (parsedRegex) {
        /* email should conform to user specified regex */
        return parsedRegex.test(inputValue);
      } else {
        return true;
      }
    case FieldType.NUMBER_INPUT:
      if (typeof value !== "number") return false;

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

function isValidType(value: string, options?: IsValidOptions) {
  if (options?.fieldType === FieldType.EMAIL_INPUT && value) {
    return EMAIL_REGEX.test(value);
  }

  return false;
}

function InputField({
  fieldClassName,
  name,
  passedDefaultValue,
  propertyPath,
  schemaItem,
}: InputFieldProps) {
  const transformValue = useCallback(
    (inputValue: string) => {
      let value;
      switch (schemaItem.fieldType) {
        case FieldType.NUMBER_INPUT:
          try {
            if (isNil(inputValue) || inputValue === "") {
              value = null;
            } else {
              value = Number(inputValue);

              if (isNaN(value)) {
                value = null;
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
    },
    [schemaItem.fieldType],
  );

  return (
    <BaseInputField
      fieldClassName={fieldClassName}
      inputHTMLType={getInputHTMLType(schemaItem.fieldType)}
      isValid={isValid}
      name={name}
      passedDefaultValue={passedDefaultValue}
      propertyPath={propertyPath}
      schemaItem={schemaItem}
      transformValue={transformValue}
    />
  );
}

InputField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;
InputField.isValidType = isValidType;

export default InputField;
